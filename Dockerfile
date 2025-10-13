# Dockerfile for DataCategorizationApp
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy app source
COPY . .

# Create uploads and tmp_uploads directories with proper permissions
RUN mkdir -p uploads tmp_uploads && chown -R node:node uploads tmp_uploads

ENV NODE_ENV=production
# Use PORT environment variable or default to 3000
ENV PORT=3000
EXPOSE 3000

# Switch to non-root user
USER node

CMD ["node", "server.js"]
