
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$gids = @('0', '1401713863', '183661933', '1756317120', '1038322138', '969467014', '1761453158', '1068836459', '2038480443', '1092935603', '38227899', '1706647376', '1170597264')
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

foreach ($g in $gids) {
    $url = "https://docs.google.com/spreadsheets/d/$sheetId/export?format=csv&gid=$g"
    try {
        $csv = $wc.DownloadString($url)
        $lines = $csv -split "`n"
        Write-Host "GID [$g] lines: $($lines.Count) | Line 0: $($lines[0])"
        if ($lines.Count -gt 1) {
            Write-Host "         Line 1: $($lines[1])"
        }
    } catch {
        Write-Host "GID [$g] error: $($_.Exception.Message)"
    }
}
