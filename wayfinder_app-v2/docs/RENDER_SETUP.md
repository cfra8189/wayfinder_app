# Render setup — quick steps

This file shows quick, safe commands you can run locally to set `DATABASE_URL` (or any env var) on an existing Render service.

1) Get these values from your Render dashboard:
- `RENDER_API_KEY` — create an API token (Account Settings → API Keys)
- `RENDER_SERVICE_ID` — from the service settings page (service URL contains it or in service details)

2) Use the helper script to print a ready-to-run curl command:

```bash
# set values in your shell (example)
export RENDER_API_KEY=ya_...your_token_here
export RENDER_SERVICE_ID=srv-0123456789abcdef
export DATABASE_URL="postgres://username:password@db.host:5432/dbname"

# print the curl command that sets DATABASE_URL on the service
node scripts/print_render_env_command.js --key DATABASE_URL
```

3) Copy and run the printed `curl` command in your terminal. The command will call Render's API to create the env var for your service.

4) Restart or deploy the service in Render so the env var is loaded.

Optional: run migrations manually from your machine (safer when the instance can't reach the DB):

```bash
# from repo root
export DATABASE_URL="postgres://..."
node scripts/push_to_postgres.cjs
```

If you'd like, I can add an automated script to create the Render service too, but that requires additional inputs and is more intrusive — tell me if you want that.
