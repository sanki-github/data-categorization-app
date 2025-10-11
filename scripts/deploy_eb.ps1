<#
PowerShell script to deploy the repository to AWS Elastic Beanstalk using the Docker platform.

Usage (run locally):
  # Ensure you have AWS CLI v2 and EB CLI installed and configured, and you are at the repo root
  powershell -ExecutionPolicy Bypass -File .\scripts\deploy_eb.ps1 -AppName "bdca-app" -EnvName "bdca-env" -Region "us-east-1" -S3Bucket "my-eb-bucket" -VersionLabel "v1"

This script will:
  - Create the S3 bucket if missing (note: bucket names must be globally unique)
  - Create a zip of the repository
  - Upload the zip to S3
  - Create an Elastic Beanstalk application version that points to the S3 object
  - Create or update an Elastic Beanstalk environment to use that version

Requirements:
  - AWS CLI v2 installed and `aws configure` set up with credentials that can manage EB, S3, and IAM
  - EB CLI (optional) if you prefer; this script uses the AWS CLI directly
  - PowerShell (Windows) or pwsh on other platforms

Notes:
  - The script assumes a Dockerfile is present at the repository root (it is)
  - For production you should move persistent storage (SQLite) to RDS and file uploads to S3
#>

param(
    [Parameter(Mandatory=$true)] [string]$AppName,
    [Parameter(Mandatory=$true)] [string]$EnvName,
    [Parameter(Mandatory=$true)] [string]$Region,
    [Parameter(Mandatory=$true)] [string]$S3Bucket,
    [Parameter(Mandatory=$true)] [string]$VersionLabel
)

Set-StrictMode -Version Latest

$ErrorActionPreference = 'Stop'

Write-Host "Starting EB deploy: App=$AppName Env=$EnvName Region=$Region Bucket=$S3Bucket Version=$VersionLabel"

# Ensure aws is available
try {
    aws --version | Out-Null
} catch {
    Write-Error "AWS CLI not found in PATH. Install AWS CLI v2 and configure credentials before running this script."
    exit 1
}

# Ensure we are at repository root (where this script lives)
$RepoRoot = Resolve-Path "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\.."
Set-Location $RepoRoot

# Create bucket if it doesn't exist
Write-Host "Checking S3 bucket: $S3Bucket"
$bucketExists = aws s3api head-bucket --bucket $S3Bucket --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Bucket not found, creating: $S3Bucket"
    aws s3api create-bucket --bucket $S3Bucket --region $Region --create-bucket-configuration LocationConstraint=$Region | Out-Null
}

# Create a zip of the repo contents (exclude node_modules, data.sqlite and tmp_uploads)
$timestamp = Get-Date -Format yyyyMMddHHmmss
$zipName = "eb-deploy-$($VersionLabel)-$timestamp.zip"
$tmpZip = Join-Path -Path $env:TEMP -ChildPath $zipName

Write-Host "Creating source bundle $tmpZip"

# Use Compress-Archive; exclude node_modules, data.sqlite, .git
$excludes = @('node_modules','data.sqlite','.git','tmp_uploads')
$items = Get-ChildItem -Path . -Force | Where-Object { $excludes -notcontains $_.Name }
if (Test-Path $tmpZip) { Remove-Item $tmpZip -Force }
Compress-Archive -Path $items.FullName -DestinationPath $tmpZip -Force

# Upload to S3
$s3Key = "eb-deployments/$zipName"
Write-Host "Uploading $tmpZip to s3://$S3Bucket/$s3Key"
aws s3 cp $tmpZip "s3://$S3Bucket/$s3Key" --region $Region | Out-Null

# Create application if missing
$appExists = aws elasticbeanstalk describe-applications --application-names $AppName --region $Region | ConvertFrom-Json
if (-not $appExists.Applications) {
    Write-Host "Creating Elastic Beanstalk application: $AppName"
    aws elasticbeanstalk create-application --application-name $AppName --region $Region | Out-Null
}

# Create application version
Write-Host "Creating application version: $VersionLabel"
aws elasticbeanstalk create-application-version --application-name $AppName --version-label $VersionLabel --source-bundle S3Bucket=$S3Bucket,S3Key=$s3Key --region $Region | Out-Null

# Check if environment exists
$envs = aws elasticbeanstalk describe-environments --application-name $AppName --environment-names $EnvName --region $Region | ConvertFrom-Json
if ($envs.Environments -and $envs.Environments.Count -gt 0) {
    Write-Host "Updating environment $EnvName to version $VersionLabel"
    aws elasticbeanstalk update-environment --environment-name $EnvName --version-label $VersionLabel --region $Region | Out-Null
} else {
    Write-Host "Creating environment $EnvName (this may take several minutes)"
    aws elasticbeanstalk create-environment --application-name $AppName --environment-name $EnvName --version-label $VersionLabel --solution-stack-name "64bit Amazon Linux 2 v5.9.1 running Docker" --region $Region | Out-Null
}

Write-Host "Deployment initiated. To follow progress use: aws elasticbeanstalk describe-environments --application-name $AppName --environment-names $EnvName --region $Region"

Write-Host "Cleaning up local bundle $tmpZip"
Remove-Item $tmpZip -Force

Write-Host "Done."
