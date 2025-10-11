# Create deployment package for Elastic Beanstalk
$packageName = "datacategorization-v" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".zip"

# Files to include in the deployment package
$filesToInclude = @(
    "package.json",
    "server.js", 
    "src/",
    "views/",
    "public/",
    "Dockerfile",
    "Dockerrun.aws.json"
)

# Create zip file
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = Join-Path $PWD $packageName
$compression = [System.IO.Compression.CompressionLevel]::Optimal

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')

foreach ($item in $filesToInclude) {
    if (Test-Path $item) {
        if (Test-Path $item -PathType Container) {
            # Directory
            Get-ChildItem $item -Recurse | ForEach-Object {
                if (!$_.PSIsContainer) {
                    $relativePath = $_.FullName.Substring($PWD.Path.Length + 1)
                    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $relativePath, $compression)
                }
            }
        } else {
            # File
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Resolve-Path $item), $item, $compression)
        }
    }
}

$zip.Dispose()

Write-Host "Created deployment package: $packageName"

# Upload to S3 and create EB application version
$bucketName = "elasticbeanstalk-us-west-2-070279951788"
$s3Key = "datacategorization/$packageName"

Write-Host "Uploading to S3: s3://$bucketName/$s3Key"
aws s3 cp $packageName "s3://$bucketName/$s3Key"

$versionLabel = "docker-fixed-v" + (Get-Date -Format "yyyyMMdd-HHmmss")

Write-Host "Creating EB application version: $versionLabel"
aws elasticbeanstalk create-application-version `
    --application-name "bdca-app" `
    --version-label $versionLabel `
    --source-bundle S3Bucket=$bucketName,S3Key=$s3Key `
    --description "Fixed Docker configuration with Dockerrun.aws.json v1"

Write-Host "Deploying version $versionLabel to environment..."
aws elasticbeanstalk update-environment `
    --environment-name "Bdca-app-env" `
    --version-label $versionLabel

Write-Host "Deployment initiated. Check EB console for status."