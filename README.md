# AI GitHub Code Reviewer

An AI-powered GitHub App that performs on-demand code reviews for pull requests and posts actionable feedback directly on the PR.

## What it does
- Listens to GitHub webhook events
- Responds to a `/review` comment on pull requests
- Securely fetches PR diffs using GitHub App authentication
- Uses an LLM to generate concise, structured code reviews
- Posts the review back as a PR comment

## Why this is useful
In real engineering teams, code reviews take time and context switching.
This tool provides:
- Fast first-pass reviews
- Consistent feedback standards
- Reduced reviewer load
- Better signal before human review

## How it works
1. A developer comments `/review` on a pull request
2. GitHub sends a webhook event to the service
3. The service fetches changed files for the PR
4. The AI analyzes the diff
5. A structured review is posted back on the PR

## Tech stack
- Node.js
- Express
- GitHub Apps & Webhooks
- OpenAI API
- Cloudflare Tunnel (for local development)

## Use case
Designed as an internal developer productivity tool that integrates directly into existing GitHub workflows.
