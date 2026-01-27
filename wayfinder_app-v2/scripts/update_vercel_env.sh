#!/usr/bin/env bash
# Update a Vercel project environment variable via the Vercel API.
# Usage:
# export VERCEL_TOKEN="ya_..."
# export VERCEL_PROJECT_ID="prj_..."
# ./scripts/update_vercel_env.sh VITE_API_BASE_URL https://wayfinder-app.onrender.com production

set -euo pipefail

KEY=${1:?Key required}
VALUE=${2:?Value required}
ENV=${3:-production}

if [ -z "${VERCEL_TOKEN:-}" ] || [ -z "${VERCEL_PROJECT_ID:-}" ]; then
  echo "Please export VERCEL_TOKEN and VERCEL_PROJECT_ID in your shell before running." >&2
  exit 1
fi

API="https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/env"

echo "Checking for existing var $KEY..."
exists=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API" | jq -r ".envs[] | select(.key==\"$KEY\") | .id" ) || true

if [ -n "$exists" ] && [ "$exists" != "null" ]; then
  echo "Updating existing env var (id=$exists)"
  curl -s -X PATCH "$API/$exists" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$KEY\", \"value\": \"$VALUE\", \"target\": [\"$ENV\"]}" \
    | jq .
else
  echo "Creating env var $KEY"
  curl -s -X POST "$API" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"$KEY\", \"value\": \"$VALUE\", \"target\": [\"$ENV\"]}" \
    | jq .
fi

echo "Done. Remember to redeploy the project in Vercel if needed."
