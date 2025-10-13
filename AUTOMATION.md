# Automated Deployment Setup Instructions

## Setup Azure Service Principal for GitHub Actions

To enable fully automated deployments, you need to create Azure credentials for GitHub Actions.

### Step 1: Create Service Principal

Run this command in Azure Cloud Shell:

```bash
az ad sp create-for-rbac \
  --name "github-actions-datacategorization" \
  --role contributor \
  --scopes /subscriptions/$(az account show --query id --output tsv)/resourceGroups/data-categorization-rg \
  --sdk-auth
```

### Step 2: Add GitHub Secret

1. Copy the entire JSON output from the command above
2. Go to your GitHub repository: https://github.com/sanki-github/data-categorization-app
3. Go to Settings → Secrets and variables → Actions
4. Click "New repository secret"
5. Name: `AZURE_CREDENTIALS`
6. Value: Paste the entire JSON output

### Step 3: Test Automated Deployment

Once the secret is added, any push to the repository will trigger:
- **Backend changes**: Automatic Docker build + Container App deployment
- **Frontend changes**: Automatic Static Web App deployment

## Current Automation Status

✅ **Frontend**: Fully automated (Static Web Apps)
✅ **Backend**: Fully automated (Container Apps + Docker Registry)
✅ **No Manual Steps**: Everything deploys automatically on push

## Monitoring Deployments

- GitHub Actions: https://github.com/sanki-github/data-categorization-app/actions
- Backend URL: https://data-categorization-backend.whitebush-303875e0.eastus.azurecontainerapps.io
- Frontend URL: Your Azure Static Web App URL

## Deployment Triggers

- **Backend**: Changes to server.js, src/, views/, package.json, Dockerfile
- **Frontend**: Changes to frontend-react/ directory
- **Manual**: Use "Run workflow" button in GitHub Actions