#!/usr/bin/env bash
set -euo pipefail

# Safe git-history scrub helper.
# This script creates a local mirror, removes `.env` from history,
# replaces common secret patterns if `git-filter-repo` is available,
# and stops BEFORE pushing. Review the mirror and then push if you approve.

SRC_REPO="$(pwd)"
MIRROR_DIR="$(dirname "$SRC_REPO")/repo-mirror.git"

echo "Source repo: $SRC_REPO"
echo "Mirror dir: $MIRROR_DIR"

read -p "This will create a local mirror and rewrite history there. Continue? [y/N] " yn
case "$yn" in
  [Yy]* ) ;;
  * ) echo "Aborting."; exit 1 ;;
esac

if [ -d "$MIRROR_DIR" ]; then
  echo "Removing existing mirror at $MIRROR_DIR"
  rm -rf "$MIRROR_DIR"
fi

echo "Creating bare mirror..."
git clone --mirror "$SRC_REPO" "$MIRROR_DIR"

cd "$MIRROR_DIR"

if command -v git-filter-repo >/dev/null 2>&1; then
  echo "git-filter-repo available — using it to remove .env and replace secrets."
  git filter-repo --invert-paths --path .env || true

  cat > replacements.txt <<'EOF'
/OPENAI_API_KEY=.*==>REDACTED_OPENAI_API_KEY
/DATABASE_URL=.*==>REDACTED_DATABASE_URL
/VERCEL_TOKEN=.*==>REDACTED_VERCEL_TOKEN
/RENDER_API_KEY=.*==>REDACTED_RENDER_API_KEY
/ADMIN_PASSWORD=.*==>REDACTED_ADMIN_PASSWORD
/SESSION_SECRET=.*==>REDACTED_SESSION_SECRET
EOF

  git filter-repo --replace-text replacements.txt || true
else
  echo "git-filter-repo not found; falling back to conservative filter-branch to remove .env only."
  # Conservative: remove .env from commits
  git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all || true
  echo "Note: replace-text of secret contents skipped because git-filter-repo is not installed."
fi

echo "Cleaning up mirror..."
git reflog expire --expire=now --all || true
git gc --prune=now --aggressive || true

echo "Mirror rewritten at: $(pwd)"
echo "IMPORTANT: I stopped before any push. Review the mirror before pushing."
echo "To push the cleaned history to origin (DANGEROUS - force push), run:" 
echo "  cd $MIRROR_DIR && git push --force --mirror origin"

echo "If you want me to push, reply 'push' and confirm you understand all collaborators must re-clone."
