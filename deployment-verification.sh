#!/bin/bash

echo "🚀 GitHub Actions Deployment Verification Script"
echo "==============================================="
echo

echo "1. Check GitHub Actions Status:"
echo "   Go to: https://github.com/sanki-github/data-categorization-app/actions"
echo "   You should see workflows running for both:"
echo "   - Deploy to Azure Functions"
echo "   - Deploy to Azure Static Web Apps"
echo

echo "2. Once deployments complete, test your endpoints:"
echo

echo "Backend Health Check:"
echo "curl https://data-categorization-backend.azurewebsites.net/api/health"
echo

echo "Frontend URL:"
echo "https://data-categorization-frontend.azurestaticapps.net"
echo

echo "3. Expected Results:"
echo "   ✅ Backend should return JSON with platform: 'Azure Functions'"
echo "   ✅ Frontend should load the React app"
echo "   ✅ Health check in the app should show backend connectivity"
echo

echo "4. Troubleshooting:"
echo "   - Check GitHub Actions logs if workflows fail"
echo "   - Verify Azure resource names match the URLs above"
echo "   - Ensure secrets are properly configured in GitHub"
echo

echo "🎉 Happy deploying!"