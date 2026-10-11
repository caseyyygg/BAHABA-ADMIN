param([ValidateSet('Facebook','Threads','Both')][string]$SignIn)
$ErrorActionPreference = 'Stop'
$serviceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $serviceDir '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'NLP Python environment is missing.' }
if (-not $SignIn) {
    Write-Host 'Keyword searches are enabled automatically: flood, baha, lubog across the five supported locations.'
    Write-Host 'Choose the platform whose dedicated collector session you want to connect.'
    $SignIn = Read-Host 'Facebook, Threads, or Both'
}
if ($SignIn -notin @('Facebook','Threads','Both')) { throw 'Choose Facebook, Threads, or Both.' }
$platforms = if ($SignIn -eq 'Both') { @('Facebook','Threads') } else { @($SignIn) }
foreach ($platform in $platforms) {
    Write-Host "Connecting $platform. Sign in in the browser, then return here and press Enter."
    & $python (Join-Path $serviceDir 'social_browser.py') --login $platform
    if ($LASTEXITCODE -ne 0) { throw 'Collector sign-in did not finish.' }
}
Write-Host 'The running collector will use the saved session on its next poll. No service restart is needed.'
