
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/edit?usp=sharing"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$html = $wc.DownloadString($url)

foreach ($gid in @('0', '38227899', '1706647376', '969467014')) {
    $idx = $html.IndexOf($gid)
    if ($idx -ge 0) {
        $start = [Math]::Max(0, $idx - 80)
        $len = [Math]::Min(250, $html.Length - $start)
        Write-Host "Context for GID $gid :"
        Write-Host $html.Substring($start, $len)
        Write-Host "-------------------------"
    }
}
