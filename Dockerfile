FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files
COPY dist/ ./dist/

# The private key will be mounted at runtime
# Environment variables will be passed at runtime

ENTRYPOINT ["node", "dist/index.js"]
