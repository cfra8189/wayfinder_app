Param(
  [string]$FrontendUrl = 'https://wayfinder-app-phi.vercel.app',
  [string]$BackendUrl = 'https://wayfinder-app.onrender.com'
)

Write-Host "Running smoke test against:`n  FRONTEND: $FrontendUrl`n  BACKEND:  $BackendUrl"

function Test-Url($url, $name) {
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15
    if ($resp.StatusCode -eq 200) { Write-Host "$name: OK (200)" }
    else { Write-Host "$name: FAIL (HTTP $($resp.StatusCode))" }
  } catch {
    Write-Host "$name: ERROR - $($_.Exception.Message)"
  }
}

Test-Url $FrontendUrl "Frontend"
Test-Url $BackendUrl "Backend"
