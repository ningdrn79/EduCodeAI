
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

foreach ($t in @('5A', '5B', '5C', '5D', '5E', '6A', '6B')) {
    $url = "https://docs.google.com/spreadsheets/d/$sheetId/gviz/tq?tqx=out:csv&sheet=$t"
    $csv = $wc.DownloadString($url)
    Write-Host "=== TAB $t ==="
    $lines = $csv -split "`n"
    for ($i=0; $i -lt [Math]::Min(10, $lines.Count); $i++) {
        Write-Host $lines[$i]
    }
}
