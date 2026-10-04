$ErrorActionPreference = 'Stop'
$adminDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceDir = Join-Path $adminDir 'nlp-service'
$runtimeDir = Join-Path $adminDir '.runtime'
$python = Join-Path $serviceDir '.venv\Scripts\python.exe'
$phpCommand = Get-Command php -ErrorAction SilentlyContinue

if (-not (Test-Path $python)) {
    throw "NLP Python environment is missing. Follow nlp-service setup in README.md first."
}
if (-not $phpCommand) {
    throw 'PHP was not found on PATH.'
}
$localEnv = Join-Path $serviceDir '.env'
if (Test-Path $localEnv) {
    foreach ($line in Get-Content $localEnv) {
        if ($line -match '^\s*#' -or $line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') { continue }
        $name = $Matches[1]
        $value = $Matches[2].Trim()
        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        Set-Item -Path "Env:$name" -Value $value
    }
}
foreach ($archiveName in @('drive-download-20260928T025654Z-1-001.zip', 'drive-download-20260928T025742Z-1-001.zip', 'drive-download-20260928T025751Z-1-001.zip', 'checkpoint-286-20260928T025733Z-1-001.zip')) {
    $archivePath = Join-Path (Split-Path -Parent $adminDir) $archiveName
    if (-not (Test-Path $archivePath)) { throw "Missing supplied model archive: $archivePath" }
}
if (-not (Test-Path (Join-Path $serviceDir '.env'))) {
    throw "NLP local settings are missing. Copy nlp-service/.env.example to nlp-service/.env and set your Meta Page/App values there. Do not paste access tokens or App Secrets into chat."
}

New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null

function Stop-PreviousService([string]$PidFile, [string]$ExpectedPattern) {
    if (Test-Path $PidFile) {
        $oldPid = 0
        [void][int]::TryParse((Get-Content $PidFile -Raw), [ref]$oldPid)
        if ($oldPid -gt 0) {
            $oldProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $oldPid" -ErrorAction SilentlyContinue
            if ($oldProcess -and $oldProcess.CommandLine -match $ExpectedPattern) {
                Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

Stop-PreviousService (Join-Path $runtimeDir 'php-api.pid') 'php.*-S\s+127\.0\.0\.1:8001'
Stop-PreviousService (Join-Path $runtimeDir 'nlp.pid') 'uvicorn.*app:app.*8002'

foreach ($port in @(8001, 8002)) {
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) { throw "Port $port is already occupied by PID $($listener.OwningProcess). Stop that process before running this script." }
}

$randomBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($randomBytes)
$ingestToken = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$rng.GetBytes($randomBytes)
$collectorToken = [Convert]::ToBase64String($randomBytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
$rng.Dispose()

$env:BAHABA_INGEST_TOKEN = $ingestToken
$env:NLP_SERVICE_TOKEN = $collectorToken
$env:BAHABA_INGEST_URL = 'http://127.0.0.1:8001/api.php?action=nlp-ingest'
$env:MODEL_CACHE_DIR = Join-Path $serviceDir 'model-cache'
$env:FLOOD_MODEL_ZIP = Join-Path (Split-Path -Parent $adminDir) 'drive-download-20260928T025654Z-1-001.zip'
$env:SEVERITY_MODEL_ZIP = Join-Path (Split-Path -Parent $adminDir) 'drive-download-20260928T025742Z-1-001.zip'
$env:URGENCY_MODEL_ZIP = Join-Path (Split-Path -Parent $adminDir) 'drive-download-20260928T025751Z-1-001.zip'
$env:LOCATION_MODEL_ZIP = Join-Path (Split-Path -Parent $adminDir) 'checkpoint-286-20260928T025733Z-1-001.zip'

$phpLog = Join-Path $runtimeDir 'php-api.log'
$phpErrorLog = Join-Path $runtimeDir 'php-api-error.log'
$nlpLog = Join-Path $runtimeDir 'nlp-service.log'
$nlpErrorLog = Join-Path $runtimeDir 'nlp-service-error.log'
$phpProcess = Start-Process -FilePath $phpCommand.Source -ArgumentList @('-S', '127.0.0.1:8001', '-t', $adminDir) -WorkingDirectory $adminDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $phpLog -RedirectStandardError $phpErrorLog
$phpProcess.Id | Set-Content (Join-Path $runtimeDir 'php-api.pid')

$nlpProcess = Start-Process -FilePath $python -ArgumentList @('-m', 'uvicorn', 'app:app', '--host', '127.0.0.1', '--port', '8002') -WorkingDirectory $serviceDir -WindowStyle Hidden -PassThru -RedirectStandardOutput $nlpLog -RedirectStandardError $nlpErrorLog
$nlpProcess.Id | Set-Content (Join-Path $runtimeDir 'nlp.pid')

Write-Output 'BAHABA API: http://localhost:8001'
Write-Output 'NLP inference API: http://127.0.0.1:8002'
Write-Output 'Admin ingestion token: configured (generated securely in memory; value not printed)'
Write-Output 'NLP collector token: configured (generated securely in memory; value not printed)'
Write-Output 'The four supplied model archives are configured; weights load on first detection request.'
if ($env:APIFY_SOCIAL_ENABLED -eq 'true' -and $env:APIFY_API_TOKEN) {
    Write-Output 'Apify social collector is enabled for Facebook, X, and Threads; check NLP health for run status.'
} else {
    Write-Output 'Apify social collector is paused. Add APIFY_API_TOKEN and set APIFY_SOCIAL_ENABLED=true in nlp-service/.env to enable it.'
}
