
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/edit?usp=sharing"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString($url)

# In Google Sheets client bootstrap, sheet metadata is stored in chunks like:
# [gid, "sheetName", ...]
$regex = New-Object System.Text.RegularExpressions.Regex '(?<gid>\d{1,10}),0,"(?<name>[^"]+)"'
$matches = $regex.Matches($html)
Write-Host "Total matches found: $($matches.Count)"
foreach ($m in $matches) {
    Write-Host "GID: $($m.Groups['gid'].Value) -> TAB NAME: $($m.Groups['name'].Value)"
}

# If none found with that pattern, search for tab names near "sheetId"
$regex2 = New-Object System.Text.RegularExpressions.Regex '\{\\"name\\":\\"([^\\"]+)\\"[^\}]*\\"sheetId\\":(\d+)'
$matches2 = $regex2.Matches($html)
Write-Host "Pattern 2 matches: $($matches2.Count)"
foreach ($m in $matches2) {
    Write-Host "P2: $($m.Groups[2].Value) -> $($m.Groups[1].Value)"
}
