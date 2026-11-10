
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/edit?usp=sharing"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString($url)

$regex = New-Object System.Text.RegularExpressions.Regex '\[\d+,0,\\"(?<gid>\d+)\\",\[\{\\"1\\":\[\[0,0,\\"(?<name>[^\\"]+)\\"'
$matches = $regex.Matches($html)

Write-Host "FOUND $($matches.Count) TABS IN THIS SPREADSHEET:"
foreach ($m in $matches) {
    Write-Host "GID: $($m.Groups['gid'].Value)  ===>  Tab Name: $($m.Groups['name'].Value)"
}
