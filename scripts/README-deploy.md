This folder contains helper deployment artifacts for deploying the app to AWS Elastic Beanstalk.

Files:
- `deploy_eb.ps1` - PowerShell script you can run locally to create a source bundle, upload to S3, create an application version, and create/update an Elastic Beanstalk environment.

How to run (local):

1. Install and configure AWS CLI v2: `aws configure` (provide AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, default region)
2. From the repository root run (example):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\deploy_eb.ps1 -AppName "bdca-app" -EnvName "bdca-env" -Region "us-east-1" -S3Bucket "my-unique-eb-bucket-12345" -VersionLabel "v1"
```

Required IAM permissions for the credentials you run with:
- s3:CreateBucket, s3:PutObject, s3:PutObjectAcl, s3:HeadBucket
- elasticbeanstalk:CreateApplication, elasticbeanstalk:CreateApplicationVersion, elasticbeanstalk:CreateEnvironment, elasticbeanstalk:UpdateEnvironment, elasticbeanstalk:DescribeEnvironments
- iam:PassRole (if you set up service roles for EB environments) - optional depending on your EB setup

For GitHub Actions workflow (optional):
- Set the following repository secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, EB_S3_BUCKET, EB_APP_NAME, EB_ENV_NAME

Notes:
- Elastic Beanstalk will build the Docker image from the `Dockerfile` present in the repository. The deployment may take several minutes.
- This script and workflow deploy the source bundle directly; in production you should push built images to ECR and reference them from EB or use a managed service.
