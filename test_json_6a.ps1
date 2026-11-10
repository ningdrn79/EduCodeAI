
$sheetId = '16fKDdyZpLqTznn6crU1yZ0c5_srXd2XiLvfRtGSztEs'
$url = "https://docs.google.com/spreadsheets/d/$sheetId/gviz/tq?tqx=out:json&sheet=6A"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
$jsonp = $wc.DownloadString($url)

# Parse Google JSONP
$jsonStr = $jsonp
if ($jsonStr -match 'google\.visualization\.Query\.setResponse\((.*)\);?') {
    $jsonStr = $matches[1]
}
$data = $jsonStr | ConvertFrom-Json
Write-Host "Cols count: $($data.table.cols.Count)"
foreach ($col in $data.table.cols) {
    Write-Host "  Col label: '$($col.label)' id: '$($col.id)'"
}
Write-Host "Rows count: $($data.table.rows.Count)"
for ($i=0; $i -lt [Math]::Min(5, $data.table.rows.Count); $i++) {
    $r = $data.table.rows[$i]
    $vals = @()
    foreach ($c in $r.c) {
        if ($c -eq $null) { $vals += "null" }
        elseif ($c.f) { $vals += "'$($c.f)'" }
        elseif ($c.v) { $vals += "'$($c.v)'" }
        else { $vals += "''" }
    }
    Write-Host "Row $i : $($vals -join ', ')"
}
