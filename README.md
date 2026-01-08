# AI GitHub Code Reviewer

An AI-powered GitHub bot that automatically reviews pull requests and provides structured, actionable feedback to developers.

This tool acts as a first-pass reviewer by analyzing code diffs, identifying potential issues, and suggesting improvements directly inside GitHub pull requests.

---

## What this tool does

- Listens for pull request events
- Fetches code diffs from GitHub
- Sends the changes to an AI reviewer
- Posts a clear, human-readable review as a PR comment

The goal is to reduce review time and improve code quality before human review.

---

## Why this exists

Code reviews are time-consuming and often repetitive. This tool helps teams by:

- Catching obvious issues early
- Providing consistent feedback
- Allowing engineers to focus on higher-level design decisions

It is designed to assist developers, not replace human reviewers.

---

## Tech Stack

- Node.js
- Express
- GitHub Webhooks
- GitHub REST API
- OpenAI API

---

## Project Structure


---

## How it works (high level)

1. A pull request is opened or updated
2. GitHub sends a webhook event to the server
3. The server extracts the code diff
4. The AI analyzes the changes
5. A review comment is posted back to the PR

---

## Status

This project currently implements the backend logic for automated PR reviews and is structured to be extended with additional rules, models, or integrations.

---

## Author

Built by Rishitha Muddana
