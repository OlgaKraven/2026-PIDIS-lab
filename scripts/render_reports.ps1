param(
  [string]$ReportsPath = (Join-Path $PSScriptRoot '..\public\reports'),
  [string]$OutputPath = (Join-Path $PSScriptRoot '..\.qa\reports-all')
)

$ErrorActionPreference = 'Stop'
$reportsRoot = (Resolve-Path -LiteralPath $ReportsPath).Path
$outputRoot = [System.IO.Path]::GetFullPath($OutputPath)
if (-not $outputRoot.StartsWith((Split-Path -Parent $PSScriptRoot) + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "QA output must stay inside the project workspace: $outputRoot"
}
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$pdftoppm = 'C:\Users\gvadoskr\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe'
if (-not (Test-Path -LiteralPath $pdftoppm)) { throw "pdftoppm not found: $pdftoppm" }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$summary = @()
try {
  foreach ($file in Get-ChildItem -LiteralPath $reportsRoot -Filter '*.docx' | Sort-Object Name) {
    $id = $file.BaseName
    $labOut = Join-Path $outputRoot $id
    New-Item -ItemType Directory -Path $labOut -Force | Out-Null
    $pdf = Join-Path $labOut 'report.pdf'
    $doc = $word.Documents.Open($file.FullName, $false, $true)
    try {
      $doc.Repaginate()
      $doc.ExportAsFixedFormat($pdf, 17)
      $pages = $doc.ComputeStatistics(2)
    } finally {
      $doc.Close(0)
      [Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
    }
    & $pdftoppm -png -r 110 $pdf (Join-Path $labOut 'page') 2>$null
    if ($LASTEXITCODE -ne 0) { throw "Rasterization failed for $($file.Name)" }
    $pngCount = (Get-ChildItem -LiteralPath $labOut -Filter 'page-*.png').Count
    # ComputeStatistics may return cached counts for expanded tables. The exported PDF is authoritative.
    $pdfInfo = & (Join-Path (Split-Path $pdftoppm) 'pdfinfo.exe') $pdf
    $pageMatch = [regex]::Match(($pdfInfo -join "`n"), 'Pages:\s+(\d+)')
    if (-not $pageMatch.Success) { throw 'Cannot read exported PDF page count' }
    $pages = [int]$pageMatch.Groups[1].Value
    if ($pngCount -ne $pages) { throw "Page mismatch for $($file.Name): PDF=$pages PNG=$pngCount" }
    $summary += [pscustomobject]@{ id = $id; file = $file.Name; pages = $pages; pngs = $pngCount }
  }
} finally {
  $word.Quit()
  [Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}

$summary | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $outputRoot 'summary.json') -Encoding utf8
$summary | Format-Table -AutoSize
