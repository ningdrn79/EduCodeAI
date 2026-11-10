
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$tabs = @('4A', '4B', '4C', '4D', '4E', '5A', '5B', '5C', '5D', '5E', '6A', '6B', '6C', '6D', '6E', 'Sheet1', 'DATA SISWA LMS')

foreach ($t in $tabs) {
    $url = "https://docs.google.com/spreadsheets/d/$sheetId/gviz/tq?tqx=out:csv&sheet=$t"
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Headers.Add("User-Agent", "Mozilla/5.0")
        $csv = $wc.DownloadString($url)
        $lines = ($csv -split "`n").Count
        $first = ($csv -split "`n")[0]
        Write-Host "[$t] lines: $lines | first: $first"
    } catch {
        Write-Host "[$t] error: $($_.Exception.Message)"
    }
}
