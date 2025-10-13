# Dockerfile for DataCategorizationApp
FROM node:18-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy app source
COPY . .

# Create uploads, tmp_uploads directories and ensure app directory is writable
RUN mkdir -p uploads tmp_uploads && \
    chown -R node:node /app && \
    chmod 755 uploads tmp_uploads

ENV NODE_ENV=production
# Use PORT environment variable or default to 3000
ENV PORT=3000
EXPOSE 3000

# Switch to non-root user
USER node

CMD ["node", "server.js"]
