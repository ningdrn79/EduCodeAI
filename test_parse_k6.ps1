
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

foreach ($t in @('6A', '6B', '6C', '6D', '6E', '5D')) {
    $url = "https://docs.google.com/spreadsheets/d/$sheetId/gviz/tq?tqx=out:csv&sheet=$t"
    $csv = $wc.DownloadString($url)
    $lines = $csv -split "`n"
    Write-Host "Tab [$t] total lines: $($lines.Count)"
    Write-Host "Header: $($lines[0])"
    Write-Host "Row 1: $($lines[1])"
    Write-Host "Row 2: $($lines[2])"
    Write-Host "-------------------------"
}
