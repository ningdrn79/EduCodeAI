
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/edit?usp=sharing"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
$html = $wc.DownloadString($url)

# Cari nama-nama sheet di dalam bootstrap data
$matches = [regex]::Matches($html, '"name":"([^"]+)"')
Write-Host "Found $($matches.Count) name matches:"
$sheetNames = @()
foreach ($m in $matches) {
    $n = $m.Groups[1].Value
    if ($n -notmatch "Arial|Roboto|Calibri|Consolas|comic|theme" -and $sheetNames -notcontains $n) {
        $sheetNames += $n
        Write-Host "Sheet Name: $n"
    }
}
