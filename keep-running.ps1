$ErrorActionPreference = 'Stop'
$adminDir = $PSScriptRoot
$runtimeDir = Join-Path $adminDir '.runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$mutex = New-Object Threading.Mutex($false, 'Local\BAHABA-Local-Collector-Supervisor')
if (-not $mutex.WaitOne(0)) { exit }
try {
    while ($true) {
        try {
            $api = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
            $nlp = Get-NetTCPConnection -LocalPort 8002 -State Listen -ErrorAction SilentlyContinue
            if (-not $api -or -not $nlp) {
                Add-Content (Join-Path $runtimeDir 'supervisor.log') "$(Get-Date -Format o) Starting local API and X collector."
                & (Join-Path $adminDir 'start-local.ps1') *> (Join-Path $runtimeDir 'supervisor-start.log')
                # Model libraries may take a minute to initialize on Windows.
                for ($attempt=0; $attempt -lt 12; $attempt++) {
                    Start-Sleep -Seconds 10
                    try { $null = Invoke-RestMethod http://127.0.0.1:8002/health -TimeoutSec 3; break } catch {}
                }
            }
        } catch {
            Add-Content (Join-Path $runtimeDir 'supervisor.log') "$(Get-Date -Format o) Startup failed; retrying in 30 seconds. Check supervisor-start.log."
        }
        Start-Sleep -Seconds 30
    }
} finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
