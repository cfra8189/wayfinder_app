# Vercel frontend deployment — quick setup

This project contains a `client/` folder (Vite + React). The workflow below deploys `client/` to Vercel on pushes to `main`.

What you need
- A Vercel account and a project created for this repository (or use the Vercel dashboard "Import Project").
- A GitHub repo with this code and GitHub Actions enabled.
- Repository Secrets (add in GitHub → Settings → Secrets):
  - `VERCEL_TOKEN` — create in Vercel (Account Settings → Tokens)
  - `VERCEL_ORG_ID` — available in Vercel project settings
  - `VERCEL_PROJECT_ID` — available in Vercel project settings

How it works
- The workflow `.github/workflows/deploy-frontend.yml` builds `client/` and runs the Vercel Action to deploy the built site to the linked Vercel project.

Manual deploy (local)
If you prefer to deploy from your machine once, install the Vercel CLI and run:

```bash
# install once
npm install -g vercel

# login and link or set token
vercel login
# or set token: export VERCEL_TOKEN="ya..."

# from repo root
cd client
vercel --prod --token "$VERCEL_TOKEN"
```

Notes
- If you use Vercel Git integration you can skip the token setup: Vercel will build on push.
- The GitHub Action provided is a template — if your Vercel project is linked to the Git repo you may only need `vercel-args: '--prod'` and `VERCEL_TOKEN`.

If you want, I can also:
- Create `vercel.json` with a recommended `builds`/`routes` config for the `client`.
- Help you find `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` values in your Vercel dashboard.
