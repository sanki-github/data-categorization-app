#!/bin/bash

# Create deployment directory
mkdir -p lambda-deploy
cd lambda-deploy

# Copy application files
cp ../lambda-handler.js .
cp ../lambda-package.json package.json
cp -r ../src .
cp -r ../views .
cp -r ../public .

# Install production dependencies
npm install --production

# Create deployment package
zip -r ../lambda-deployment.zip .

# Clean up
cd ..
rm -rf lambda-deploy

echo "Lambda deployment package created: lambda-deployment.zip"