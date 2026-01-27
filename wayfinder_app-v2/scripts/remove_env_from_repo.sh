#!/usr/bin/env bash
# Remove .env from git history (tracked) and add to .gitignore locally.
# WARNING: This does not scrub secrets from the git history; use BFG or git filter-repo
# Usage: ./scripts/remove_env_from_repo.sh

set -euo pipefail

if [ ! -f .env ]; then
  echo "No .env file present in repo root; nothing to do." >&2
  exit 0
fi

echo ".env exists. Removing from git index and adding to .gitignore"
git rm --cached .env || true
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
git add .gitignore
git commit -m "chore: remove .env from repo tracking and add to .gitignore" || true

echo "Committed removal. IMPORTANT: if .env was committed previously, rewrite history using BFG or git filter-repo to remove sensitive data permanently." >&2
echo "Example (use with care): bfg --delete-files .env" >&2
