#!/usr/bin/env bash
# Simple smoke test for frontend and backend deploys.
# Usage: ./scripts/smoke_test.sh [FRONTEND_URL] [BACKEND_URL]

FRONTEND_URL=${1:-https://wayfinder-app-phi.vercel.app}
BACKEND_URL=${2:-https://wayfinder-app.onrender.com}

echo "Running smoke test against:"
echo "  FRONTEND: $FRONTEND_URL"
echo "  BACKEND:  $BACKEND_URL"

check() {
  url=$1
  name=$2
  echo -n "$name: ";
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  if [ "$http_code" = "200" ]; then
    echo "OK (200)"
  else
    echo "FAIL (HTTP $http_code)"
    echo "Full response:"
    curl -is "$url" | sed -n '1,40p'
  fi
}

check "$FRONTEND_URL" "Frontend"
check "$BACKEND_URL" "Backend"
