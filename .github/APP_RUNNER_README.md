This repository contains a GitHub Actions workflow that builds the Docker image, pushes it to Amazon ECR, and creates/updates an AWS App Runner service.

Required repository secrets (add in Settings → Secrets):
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (e.g., us-west-2)
- Optional runtime secrets you may want to set and wire into App Runner via the workflow:
  - SESSION_SECRET
  - DATABASE_URL
  - S3_UPLOAD_BUCKET
  - NODE_ENV

How it works:
- On push to `main` the workflow will:
  1. Build the Docker image in GitHub Actions
  2. Push the image to ECR (repository: `bdca-app`)
  3. Create or update an App Runner service named `bdca-apprunner` pointing to the pushed image

Where to find the App Runner URL:
- Open the Actions run for `Build & Deploy to App Runner` and view the final step output
- Or open the AWS Console → App Runner → Services → `bdca-apprunner` and check the Service URL

Notes:
- If you prefer App Runner to use a custom domain or certificates, configure the custom domain in the App Runner console.
- For production, set `DATABASE_URL` to your RDS instance and `S3_UPLOAD_BUCKET` to the production S3 bucket.
