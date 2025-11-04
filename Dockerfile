# Use Node.js LTS version as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source files (excluding those in .dockerignore)
COPY tsconfig.json ./
COPY src/ ./src/
COPY index.html ./
COPY styles.css ./

# Build TypeScript
RUN npm run build

# Install http-server globally
RUN npm install -g http-server

# Expose port 8080
EXPOSE 8080

# Start the web server
CMD ["http-server", ".", "-p", "8080", "--cors", "-a", "0.0.0.0"]

