require("dotenv").config();
const express = require("express");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const OpenAI = require("openai");

const app = express();
app.use(express.json({ limit: "5mb" }));

const PORT = process.env.PORT || 3000;

/*
  This service is intentionally kept as a single file for the MVP.
  It makes the end-to-end webhook-to-review flow easy to follow.
  The logic can be split into modules once the surface area grows.
*/

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Constants
const BOT_COMMENT_MARKER = "<!-- AI_CODE_REVIEWER_BOT -->";
const MODEL_NAME = "gpt-4.1-mini";
const MAX_DIFF_CHARS = 12000;

/*
  GitHub authentication helpers.
  GitHub Apps require short-lived JWTs to exchange for installation tokens.
*/

function generateJWT() {
  const privateKey = fs.readFileSync(
    process.env.GITHUB_PRIVATE_KEY_PATH,
    "utf8"
  );

  return jwt.sign(
    {
      iat: Math.floor(Date.now() / 1000) - 60,
      exp: Math.floor(Date.now() / 1000) + 600,
      iss: process.env.GITHUB_APP_ID,
    },
    privateKey,
    { algorithm: "RS256" }
  );
}

async function getInstallationToken() {
  const jwtToken = generateJWT();

  const response = await axios.post(
    `https://api.github.com/app/installations/${process.env.GITHUB_INSTALLATION_ID}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  return response.data.token;
}

async function fetchPullRequestFiles(owner, repo, pullNumber, token) {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
    {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );
  return response.data;
}

async function listComments(owner, repo, pullNumber, token) {
  const res = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
    {
      headers: {
        Authorization: `token ${token}`,
      },
    }
  );
  return res.data;
}

/*
  Ensures the bot posts a single evolving comment instead of spamming the PR.
*/
async function upsertBotComment(owner, repo, pullNumber, body, token) {
  const comments = await listComments(owner, repo, pullNumber, token);
  const existing = comments.find(
    c => c.body && c.body.includes(BOT_COMMENT_MARKER)
  );

  if (existing) {
    await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/issues/comments/${existing.id}`,
      { body },
      { headers: { Authorization: `token ${token}` } }
    );
    console.log("Updated existing AI review comment");
  } else {
    await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/issues/${pullNumber}/comments`,
      { body },
      { headers: { Authorization: `token ${token}` } }
    );
    console.log("Created new AI review comment");
  }
}

/*
  Generates an AI review from the PR diff.
  The diff is trimmed to avoid oversized prompts.
*/
async function generateAIReview({ owner, repo, prNumber, diffText }) {
  const trimmed =
    diffText.length > MAX_DIFF_CHARS
      ? diffText.slice(0, MAX_DIFF_CHARS)
      : diffText;

  console.log("Running AI review");

  try {
    const response = await openai.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.15,
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer leaving a quick PR review on GitHub. Write like a human reviewer who is skimming for merge readiness. Be concise, selective, and practical. Avoid onboarding advice, roadmap suggestions, or explaining how the system works unless it blocks merging.",
        },
        {
          role: "user",
          content: `
Repository: ${owner}/${repo}
Pull Request: #${prNumber}

Diff:
${trimmed}

Write a GitHub-style PR review using markdown with the following sections:

Summary
- 1–2 sentences
- High-level impression only
- Written for PR readers, not the author

Issues
- Only items that should be fixed before merging
- Skip minor documentation or stylistic preferences

Suggestions
- At most 1–2 optional, low-effort improvements
- Only include if they add clear value now

Do not repeat the diff.
Do not include generic best practices.
Do not suggest future roadmap items.`,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI error:", err.message);
    return "AI review could not be completed at this time.";
  }
}

/*
  GitHub webhook endpoint.
  Listens for a /review comment on a pull request.
*/
app.post("/webhook/github", async (req, res) => {
  console.log("Webhook received");

  const eventType = req.headers["x-github-event"];
  const action = req.body.action;

  console.log("Event:", eventType);
  console.log("Action:", action);

  if (eventType === "ping") {
    return res.status(200).send("pong");
  }

  const isIssueComment = eventType === "issue_comment";
  const isReviewComment = eventType === "pull_request_review_comment";

  if (!isIssueComment && !isReviewComment) {
    return res.status(200).send("Ignored");
  }

  const commentBody = req.body.comment?.body?.trim();

  if (commentBody !== "/review") {
    return res.status(200).send("Ignored");
  }

  const owner = req.body.repository.owner.login;
  const repo = req.body.repository.name;

  const pullNumber = isIssueComment
    ? req.body.issue.number
    : req.body.pull_request.number;

  console.log("Review triggered for", `${owner}/${repo}`, "PR", pullNumber);

  const token = await getInstallationToken();
  const files = await fetchPullRequestFiles(owner, repo, pullNumber, token);

  const diffText = files
    .map(f => `--- ${f.filename}\n${f.patch || ""}`)
    .join("\n\n");

  const review = await generateAIReview({
    owner,
    repo,
    prNumber: pullNumber,
    diffText,
  });

  const body = `${BOT_COMMENT_MARKER}
## AI Code Review

${review}

Triggered via /review`;

  await upsertBotComment(owner, repo, pullNumber, body, token);

  return res.status(200).send("Reviewed");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
