# Smoke test

Quick smoke test scripts to verify deployed frontend and backend services.

Shell (Linux/macOS/WSL/Git Bash):

```bash
./scripts/smoke_test.sh
# or pass custom URLs
./scripts/smoke_test.sh https://your-frontend.vercel.app https://your-backend.onrender.com
```

PowerShell (Windows):

```powershell
.\\scripts\\smoke_test.ps1
# or with params
.\scripts\smoke_test.ps1 -FrontendUrl 'https://your-frontend' -BackendUrl 'https://your-backend'
```

These scripts return HTTP status for each URL and print the start of the response on failure.
