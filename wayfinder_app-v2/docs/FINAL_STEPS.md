# Final steps to finish production readiness

This file collects high-priority manual steps and scripts to run locally so you can rotate secrets, update hosting envs, and complete deployment.

1) Rotate Secrets (HIGH PRIORITY)
- Rotate Supabase/Postgres password in the Supabase dashboard.
- Rotate OpenAI key in https://platform.openai.com/account/api-keys (create new key, revoke old key).
- Rotate Render service environment variables / tokens in the Render dashboard.

2) Remove local `.env` from repo tracking
- Run locally:
  ```bash
  ./scripts/remove_env_from_repo.sh
  ```

3) Update Render environment variables
- You already have `scripts/print_render_env_command.js` which prints curl commands for Render. Run it locally and follow instructions. Example (no secrets in repo):
  ```bash
  node scripts/print_render_env_command.js DATABASE_URL "postgresql://..."
  ```

4) Update Vercel environment variables (API base url, keys)
- Use the helper script added at `./scripts/update_vercel_env.sh`.
- Export the following in your shell and run the script to set `VITE_API_BASE_URL`:
  ```bash
  export VERCEL_TOKEN="ya_..."
  export VERCEL_PROJECT_ID="prj_..."
  ./scripts/update_vercel_env.sh VITE_API_BASE_URL https://wayfinder-app.onrender.com production
  ./scripts/update_vercel_env.sh OPENAI_API_KEY "sk_..." production
  ```

5) Redeploy frontend
- After updating `VITE_API_BASE_URL`, trigger a redeploy from the Vercel dashboard or push a trivial commit to the `client/` folder.

6) Verify
- Run the smoke test scripts locally:
  ```bash
  ./scripts/smoke_test.sh
  ```

7) Optional: Automated updates by me
- If you want me to run the `update_vercel_env.sh` and the Render env helper from the repo, export the needed tokens in your terminal and reply: "run hosting updates". I'll then execute the scripts.

8) Clean up & merge
- Review branches: `chore/typed-inserts`, `chore/health-smoke`, `chore/docs-security` and merge them once you're satisfied.
