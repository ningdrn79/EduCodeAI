
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/edit?usp=sharing"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString($url)

# In Google Sheets HTML, sheets are defined in bootstrap_data: [gid, sheetName, ...]
$matches = [regex]::Matches($html, '\[(\d+),0,"([^"]+)"')
foreach ($m in $matches) {
    Write-Host "GID: $($m.Groups[1].Value) -> Name: $($m.Groups[2].Value)"
}

# Also test another pattern
$matches2 = [regex]::Matches($html, '"([^"]+)",0,(\d+)')
foreach ($m in $matches2) {
    Write-Host "P2: $($m.Groups[1].Value) -> GID: $($m.Groups[2].Value)"
}
