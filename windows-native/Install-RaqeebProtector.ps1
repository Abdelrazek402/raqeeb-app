$ErrorActionPreference = 'Stop'
# Run from an elevated PowerShell session. This fallback is intentionally source-based
# because the host has no .NET SDK/MSBuild to produce a native EXE.
$hosts = Join-Path $env:WINDIR 'System32\drivers\etc\hosts'
$backup = "$hosts.raqeeb.bak"
$domains = Join-Path $PSScriptRoot 'RaqeebProtector\blocked-domains.txt'
$marker = '# Raqeeb managed blocklist'
if (-not (Test-Path $domains)) { throw "Missing blocked-domains.txt" }
Copy-Item $hosts $backup -Force
$content = if (Test-Path $hosts) { Get-Content $hosts -Raw } else { '' }
$start = $content.IndexOf($marker, [StringComparison]::Ordinal)
if ($start -ge 0) {
  $endMarker = "$marker end"
  $end = $content.IndexOf($endMarker, $start, [StringComparison]::Ordinal)
  if ($end -ge 0) { $content = ($content.Substring(0, $start) + $content.Substring($end + $endMarker.Length)).TrimEnd() }
}
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add($content.TrimEnd())
$lines.Add($marker)
foreach ($domain in Get-Content $domains) {
  $domain = $domain.Trim()
  if ($domain -and -not $domain.StartsWith('#')) {
    $lines.Add("127.0.0.1 $domain")
    $lines.Add("127.0.0.1 www.$domain")
  }
}
$lines.Add("$marker end")
Set-Content -Path $hosts -Value $lines -Encoding UTF8
ipconfig.exe /flushdns | Out-Null
Write-Host "Raqeeb hosts protection enabled. Backup: $backup"
