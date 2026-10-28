$ErrorActionPreference = 'Stop'
Set-Location 'E:\MasterVault\Moonrise\moonrise-studio'
$logOut = Join-Path $env:TEMP 'moonrise-deploy-104.log'
function Log($m) { Add-Content -Path $logOut -Value $m; Write-Output $m }

# Load secrets (never echo values)
$envFile = 'E:\MasterVault\Moonrise\accesstokens.env'
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)$') {
    $k = $matches[1].Trim(); $v = $matches[2].Trim()
    [Environment]::SetEnvironmentVariable($k, $v, 'Process')
  }
}
if ($env:GITHUB_TOKEN -and -not $env:GH_TOKEN) { $env:GH_TOKEN = $env:GITHUB_TOKEN }

$git = { param($a) & git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" @a }

Log '=== npm run notes ==='
& npm run notes 2>&1 | ForEach-Object { Log $_ }

Log '=== git status ==='
& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" status --short 2>&1 | ForEach-Object { Log $_ }

$msg = @'
v1.0.104 Editor fullscreen fix and printable website flyer

Studio: Flyer button, blue button expand hover, editor fullscreen fix; home CTA expand hover.
'@

Log '=== git add commit ==='
& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" add -A 2>&1 | ForEach-Object { Log $_ }
& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" reset HEAD -- accesstokens.env .env worker/.env 2>$null
& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" commit -m $msg 2>&1 | ForEach-Object { Log $_ }

$sha = (& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" rev-parse HEAD).Trim()
Log "COMMIT_SHA=$sha"

Log '=== git push ==='
& git -c "safe.directory=E:/MasterVault/Moonrise/moonrise-studio" push moonrise HEAD:main 2>&1 | ForEach-Object { Log $_ }

$env:GITHUB_RELEASE_TARGET = $sha
Log '=== release github ==='
& npm run release:github 2>&1 | ForEach-Object { Log $_ }

Log '=== vercel prod ==='
& npx vercel --prod --yes 2>&1 | ForEach-Object { Log $_ }

Log '=== resend domain ==='
$headers = @{ Authorization = "Bearer $($env:RESEND_API_KEY)" }
try {
  $r = Invoke-RestMethod -Uri 'https://api.resend.com/domains/6be8fa5c-0eda-43e0-8620-c4f84f8b9189' -Headers $headers -Method Get
  Log "RESEND_STATUS=$($r.status)"
  $r.records | ForEach-Object { Log ("DNS_RECORD type=$($_.type) name=$($_.name) value=$($_.value) status=$($_.status)") }
} catch {
  Log "RESEND_ERROR=$($_.Exception.Message)"
}

Log '=== site check ==='
try {
  $html = (Invoke-WebRequest -Uri 'https://trymoonrise.com/' -UseBasicParsing).Content
  if ($html -match 'studio\.css\?v=20261028-blue3') { Log 'SITE_CSS_CACHE=20261028-blue3' } else { Log 'SITE_CSS_CACHE=not_found' }
} catch { Log "SITE_ERROR=$($_.Exception.Message)" }

Log "LOG_FILE=$logOut"
Log 'DONE'
