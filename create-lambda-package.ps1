# Create deployment directory
$deployDir = "lambda-deploy"
if (Test-Path $deployDir) { Remove-Item $deployDir -Recurse -Force }
New-Item -ItemType Directory -Path $deployDir | Out-Null
Set-Location $deployDir

# Copy application files
Copy-Item "../lambda-handler.js" .
Copy-Item "../lambda-package.json" "package.json"
Copy-Item "../src" -Recurse .
Copy-Item "../views" -Recurse .
Copy-Item "../public" -Recurse .

# Install production dependencies
Write-Host "Installing dependencies..."
npm install --production

# Create deployment package
Write-Host "Creating deployment package..."
$packagePath = "../lambda-deployment.zip"
if (Test-Path $packagePath) { Remove-Item $packagePath }
Compress-Archive -Path * -DestinationPath $packagePath

# Clean up
Set-Location ..
Remove-Item $deployDir -Recurse -Force

Write-Host "Lambda deployment package created: lambda-deployment.zip"
Get-Item lambda-deployment.zip | Select-Object Name,Length