# AI GitHub Code Reviewer

A GitHub App and webhook service that generates structured, actionable pull request reviews using an LLM.  
Reviews are triggered explicitly via a `/review` comment and posted back to the pull request as a single evolving comment.

---

## Overview

This project implements an on-demand AI-powered code reviewer for GitHub pull requests.

Instead of automatically running on every pull request or commit, reviews are generated only when explicitly requested by a reviewer. The service fetches the pull request diff, generates a concise and structured review, and posts it back to the PR.

The goal is to automate repetitive review feedback while keeping human reviewers fully in control of when and how AI feedback is applied.

---

## How it works (end to end)

1. A developer opens a Pull Request
2. A reviewer comments `/review` on the PR
3. GitHub sends a webhook event to the service
4. The service:
   - authenticates as a GitHub App
   - exchanges a short-lived JWT for an installation access token
   - fetches pull request file diffs
   - trims the diff to stay within prompt limits
   - generates a structured AI review
5. The service posts the review as a pull request comment  
   If a review already exists, it updates the existing comment instead of posting a new one

---

## Key design decisions

- **Explicit trigger (`/review`)**  
  Reviews are generated only when explicitly requested. This avoids noisy automated comments, reduces unnecessary API usage, and gives reviewers full control over when AI feedback is applied.

- **Single evolving review comment**  
  The bot updates its previous comment instead of posting multiple reviews, keeping the pull request discussion clean and readable.

- **Webhook-based architecture**  
  GitHub webhooks are used instead of polling to ensure efficient, event-driven processing.

- **Single-file MVP**  
  The backend is intentionally kept in one file to make the full request-to-review flow easy to follow.  
  The logic can be modularized as the project grows.

---

## Architecture

- Node.js + Express webhook server
- GitHub App authentication (JWT → installation access token)
- GitHub REST API for fetching pull request files and posting comments
- OpenAI API for generating structured code reviews

---

## Project structure

```text
ai-github-code-reviewer/
├── backend/
│   ├── index.js          # Webhook server and review logic
│   ├── package.json
│   └── package-lock.json
├── screenshots/          # Demo and verification screenshots
├── .gitignore
└── README.md

```