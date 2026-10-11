$ErrorActionPreference = 'Stop'
$settingsPath = Join-Path $PSScriptRoot '.env'
Write-Host 'Sign into x.com and manually export cookies using Cookie-Editor.'
Write-Host 'Enter only auth_token and ct0 below. Input is hidden and stays in your local .env.'
$cookieValues = @{}
foreach ($setting in @(@('TWITTER_AUTH_TOKEN', 'auth_token'), @('TWITTER_CT0', 'ct0'))) {
    $secret = Read-Host $setting[1] -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try { $value = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    if ($value -notmatch '^[a-zA-Z0-9_-]{10,2048}$') { throw 'Enter the cookie value only, without its name or semicolon.' }
    $cookieValues[$setting[0]] = $value
    $value = $null
}
if ($cookieValues['TWITTER_AUTH_TOKEN'] -eq $cookieValues['TWITTER_CT0']) {
    throw 'The same value was entered twice. Copy auth_token from its row, then copy ct0 from its separate row. No settings were changed.'
}
$text = [IO.File]::ReadAllText($settingsPath)
foreach ($setting in @(@('TWITTER_AUTH_TOKEN', 'auth_token'), @('TWITTER_CT0', 'ct0'))) {
    $pattern = '(?m)^' + $setting[0] + '=.*$'
    $line = $setting[0] + '=' + $cookieValues[$setting[0]]
    if ($text -match $pattern) { $text = [regex]::Replace($text, $pattern, $line) }
    else { $text += "`n$line`n" }
}
[IO.File]::WriteAllText($settingsPath, $text, [Text.UTF8Encoding]::new($false))
$cookieValues.Clear()
Write-Host 'X session saved locally. The collector will pick it up on its next check (about 60 seconds).'
