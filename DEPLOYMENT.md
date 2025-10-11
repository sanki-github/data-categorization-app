# AWS Deployment Status

## ✅ Frontend Deployed Successfully

**URL**: http://data-categorization-frontend-sitebucket-syud6yzxdn7w.s3-website-us-west-2.amazonaws.com

**Status**: Live and working
**Hosting**: AWS S3 Static Website
**Technology**: React + Vite SPA

## 🚀 Backend Deployment Options

The backend can be deployed using several methods:

### Option 1: GitHub Actions (Recommended)
1. **Add GitHub Secrets** to your repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY` 
   - `AWS_REGION` (set to `us-west-2`)

2. **Trigger Deployment**:
   - Push any change to `server.js`, `src/`, `package.json`, or `Dockerfile`
   - Or manually trigger via GitHub Actions tab → "Deploy Backend to App Runner" → "Run workflow"

3. **Expected Outcome**:
   - Creates ECR repository (already done)
   - Builds Docker image and pushes to ECR
   - Creates/updates App Runner service
   - Provides public HTTPS URL

### Option 2: Manual CLI Deployment

Since Docker isn't available locally, use GitHub Codespaces or AWS CloudShell:

```bash
# In GitHub Codespaces or AWS CloudShell
git clone <your-repo>
cd data-categorization-app

# Login to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 070279951788.dkr.ecr.us-west-2.amazonaws.com

# Build and push
docker build -t data-categorization-backend .
docker tag data-categorization-backend:latest 070279951788.dkr.ecr.us-west-2.amazonaws.com/data-categorization-backend:latest
docker push 070279951788.dkr.ecr.us-west-2.amazonaws.com/data-categorization-backend:latest

# Create App Runner service
aws apprunner create-service \
  --service-name data-categorization-backend \
  --source-configuration '{
    "ImageRepository": {
      "ImageIdentifier": "070279951788.dkr.ecr.us-west-2.amazonaws.com/data-categorization-backend:latest",
      "ImageConfiguration": {
        "Port": "3000",
        "RuntimeEnvironmentVariables": {
          "NODE_ENV": "production"
        }
      },
      "ImageRepositoryType": "ECR"
    },
    "AutoDeploymentsEnabled": false
  }' \
  --instance-configuration '{
    "Cpu": "0.25 vCPU",
    "Memory": "0.5 GB"
  }' \
  --region us-west-2
```

### Option 3: Elastic Beanstalk (Alternative)
The repository includes an existing EB deployment script at `scripts/deploy_eb.ps1`.

## 🔗 Connecting Frontend to Backend

Once the backend is deployed, update the frontend to connect:

1. **Get the App Runner URL** from the AWS Console or CLI:
   ```bash
   aws apprunner list-services --region us-west-2
   aws apprunner describe-service --service-arn <service-arn> --region us-west-2
   ```

2. **Update Frontend Environment**:
   - Set `VITE_API_BASE` in GitHub Secrets to the App Runner URL
   - Redeploy frontend via GitHub Actions

3. **Configure CORS** in the backend to allow the S3 website origin

## 📊 Current Infrastructure

```
Frontend (S3 Static Website)
├── React SPA built with Vite
├── Hosted on S3: data-categorization-frontend-sitebucket-syud6yzxdn7w
└── URL: http://...s3-website-us-west-2.amazonaws.com

Backend (App Runner - Pending)
├── Node.js + Express API
├── Docker image in ECR: data-categorization-backend
├── Service: data-categorization-backend (to be created)
└── URL: TBD (will be https://*.us-west-2.awsapprunner.com)

Database
├── Currently: SQLite (ephemeral in container)
└── Recommended: Migrate to RDS for persistence
```

## ⚡ Quick Deploy Commands

To deploy the backend immediately using GitHub Actions:

1. Add the AWS secrets to your GitHub repository
2. Go to Actions tab → "Deploy Backend to App Runner" → "Run workflow"
3. Wait ~5-10 minutes for completion
4. Get the URL from the workflow logs

## 🎯 Next Steps

1. **Deploy Backend**: Use GitHub Actions or manual CLI
2. **Connect Frontend**: Update `VITE_API_BASE` and redeploy
3. **Database Migration**: Move from SQLite to RDS
4. **Domain & HTTPS**: Set up CloudFront + custom domain
5. **Monitoring**: Add CloudWatch logs and alarms

---

**Total Cost Estimate**: ~$10-15/month for App Runner + S3 (within AWS free tier limits for the first year)