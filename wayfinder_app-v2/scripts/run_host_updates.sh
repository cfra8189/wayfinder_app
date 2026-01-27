#!/usr/bin/env bash
set -euo pipefail

# Run hosting env updates using values in the repository .env (not printed)
ENV_PATH="./.env"
if [ ! -f "$ENV_PATH" ]; then
  echo ".env not found at $ENV_PATH" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ENV_PATH"
set +a

: "${VERCEL_TOKEN:?VERCEL_TOKEN not set in .env}"
: "${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID not set in .env}"
: "${RENDER_API_KEY:?RENDER_API_KEY not set in .env}"
: "${RENDER_SERVICE_ID:?RENDER_SERVICE_ID not set in .env}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY not set in .env}"
: "${DATABASE_URL:?DATABASE_URL not set in .env}"

echo "Updating Vercel environment variables (VITE_API_BASE_URL, OPENAI_API_KEY)..."

get_vercel_env_id() {
  KEY="$1"
  curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID/env" \
    | node -e 'const fs=require("fs");try{const d=JSON.parse(fs.readFileSync(0,"utf8"));const e=(d.envs||[]).find(x=>x.key==process.argv[1]);console.log(e?e.id:"")}catch(e){console.log("");}' "$KEY"
}

upsert_vercel_env() {
  KEY="$1"
  VALUE="$2"
  ID=$(get_vercel_env_id "$KEY")
  if [ -n "$ID" ]; then
    echo " - updating $KEY (id=$ID)"
    curl -s -X PATCH "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID/env/$ID" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"key":"'"$KEY"'","value":"'"$VALUE"'","target":["production"],"type":"encrypted"}' \
      | sed -n '1,2p'
  else
    echo " - creating $KEY"
    curl -s -X POST "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID/env" \
      -H "Authorization: Bearer $VERCEL_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"key":"'"$KEY"'","value":"'"$VALUE"'","target":["production"],"type":"encrypted"}' \
      | sed -n '1,2p'
  fi
}

upsert_vercel_env "VITE_API_BASE_URL" "https://wayfinder-app.onrender.com"
upsert_vercel_env "OPENAI_API_KEY" "$OPENAI_API_KEY"

echo "Vercel env update finished."

echo "Updating Render DATABASE_URL..."
ENV_LIST=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars")
EXIST_ID=$(printf "%s" "$ENV_LIST" | node -e 'const fs=require("fs");try{const a=JSON.parse(fs.readFileSync(0,"utf8")||"[]");const it=a.find(x=>x.key=="DATABASE_URL");console.log(it?it.id:"")}catch(e){console.log("");}')

if [ -n "$EXIST_ID" ]; then
  echo " - deleting existing DATABASE_URL (id=$EXIST_ID)"
  curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X DELETE "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars/$EXIST_ID" \
    -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" | sed -n '1,2p'
else
  echo " - no existing DATABASE_URL to delete"
fi

echo " - creating new DATABASE_URL (value hidden)"
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"DATABASE_URL\",\"value\":\"$DATABASE_URL\",\"scope\":\"env\"}" | sed -n '1,4p'

echo "Restarting Render service..."
curl -s -w "\nHTTP_STATUS:%{http_code}\n" -X POST "https://api.render.com/v1/services/$RENDER_SERVICE_ID/restart" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" -d '{}' | sed -n '1,6p'

echo "Waiting 6s before smoke test..."
sleep 6

echo "Running smoke test..."
bash "./scripts/smoke_test.sh"
