# Security & Secret Rotation

If any secrets (API keys, DB URLs, tokens) were committed or exposed, rotate them immediately and remove them from the repository.

Steps to secure the project:

1. Rotate exposed credentials
   - Supabase / Postgres: regenerate the DB password in the Supabase dashboard and update `DATABASE_URL` in Render and in any local `.env` files.
   - OpenAI API key: revoke the key in your OpenAI account and create a new one. Update any services that use it.
   - Render & Vercel tokens: delete the old tokens and create new ones in the dashboard.

2. Remove local `.env` from the repository
   - Ensure `.env` is listed in `.gitignore`.
   - Remove the file from the repo history if it was committed (BE CAREFUL):
     - Quick stop-gap: `git rm --cached .env && git commit -m "chore: remove .env"` then push.
     - For full history removal, use `git filter-repo` or the BFG repo cleaner (this rewrites history):
       - BFG example: `bfg --delete-files .env` followed by `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.
       - Only do history rewrite after coordinating with any collaborators.

3. Update secrets in hosting platforms
   - Render: add new `DATABASE_URL` in Service → Environment and redeploy.
   - Vercel: add `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_ORG_ID` as GitHub secrets if using CI; add `VITE_API_BASE_URL` under Project Settings → Environment Variables.

4. Verify services
   - Run the smoke test scripts in `scripts/smoke_test.sh` / `.ps1` locally.
   - Check Render and Vercel logs after restarting/redeploying.

5. Rotate keys in third-party services
   - Email/SMS providers, payment processors, storage buckets — rotate credentials and update environment variables in the same way.

If you want, I can generate exact curl/CLI commands for each platform (Render, Vercel, Supabase), but you should run them locally so secrets remain private.
