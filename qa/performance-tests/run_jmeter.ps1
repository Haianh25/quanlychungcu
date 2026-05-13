$ErrorActionPreference = "Stop"

$jmeterDir = Get-ChildItem -Path . -Filter "apache-jmeter-*" -Directory | Select-Object -First 1
if (-not $jmeterDir) {
    Write-Error "Apache JMeter directory not found. Please ensure it is extracted in the performance-tests directory."
    exit 1
}

$jmeterBin = Join-Path $jmeterDir.FullName "bin\jmeter.bat"
$jmxFile = "QuanLyChungCu_LoadTest.jmx"
$resultsFile = "results.csv"
$reportDir = "html-report"

# Remove old results
if (Test-Path $resultsFile) { Remove-Item $resultsFile -Force }
if (Test-Path $reportDir) { Remove-Item -Recurse -Force $reportDir }

Write-Host "Starting JMeter Load Test..."
& $jmeterBin -n -t $jmxFile -l $resultsFile -e -o $reportDir

Write-Host "Test completed. Report generated at $(Join-Path $PWD.Path $reportDir\index.html)"
