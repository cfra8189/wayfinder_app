#!/usr/bin/env bash
# Prints a safe, parameterized curl command to set an env var on Render
# This template uses environment variables and does NOT include secrets inline.

cat <<'TEMPLATE'
# Example usage (run these in your shell, do NOT paste secrets into chat):
# export RENDER_API_KEY="ya_..."
# export RENDER_SERVICE_ID="srv-..."
# export DATABASE_URL="postgres://user:pass@host:5432/dbname"
#
# Run the template command below (it reads values from your env):

RENDER_API_KEY="$RENDER_API_KEY" \
curl -X POST \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -d '{"key":"DATABASE_URL","value":"'"$DATABASE_URL"'","scope":"env"}'

TEMPLATE

echo "\nNotes:"
echo "- This prints a command that reads your API key and DB URL from your shell environment." 
echo "- Run the printed command locally; it will set DATABASE_URL for the service and not expose values in this repo." 
echo "- After running, restart or deploy the service in Render to pick up the new env var."
