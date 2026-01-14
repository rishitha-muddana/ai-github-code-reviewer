# AI GitHub Code Reviewer

A GitHub App + webhook service that generates pull request review feedback using an LLM and posts it back to the PR when triggered with `/review`.

The goal is to automate repetitive review feedback while keeping human reviewers fully in control of when analysis runs.

## What it does

- Listens for a `/review` comment on a pull request
- Fetches the PR file diffs from GitHub
- Sends the diff to an LLM using a structured review prompt
- Posts a single evolving review comment (updates instead of spamming the PR)

## How it works (end to end)

1. A developer opens a Pull Request
2. A reviewer comments `/review` on the PR
3. GitHub sends a webhook event to `POST /webhook/github`
4. The service:
   - authenticates as a GitHub App
   - exchanges a short-lived JWT for an installation access token
   - fetches PR file patches via the GitHub API
   - trims the diff to a safe size for prompt limits
   - requests a structured AI review
5. The service posts the review as a PR comment and updates it on subsequent runs

## Architecture

- Node.js + Express webhook server
- GitHub App authentication (JWT → installation access token)
- GitHub REST API for fetching PR files and posting comments
- OpenAI Chat Completions for structured review generation

The service is stateless and event-driven, making it easy to run locally or deploy as a lightweight backend service.

## Local setup

### Prerequisites

- Node.js
- A GitHub App created and installed on your repository
- An OpenAI API key

### Environment variables

Create a `.env` file in the backend directory:

```bash
backend/.env

<!-- demo change to trigger PR review -->

