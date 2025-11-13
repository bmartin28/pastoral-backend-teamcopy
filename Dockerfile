# Use Node.js LTS version as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# ===== Build React Frontend =====
WORKDIR /app/pastoral-care

# Copy frontend package files
COPY pastoral-care/package.json pastoral-care/package-lock.json* ./

# Install frontend dependencies
RUN npm install

# Copy frontend source files
COPY pastoral-care/tsconfig*.json ./
COPY pastoral-care/vite.config.ts ./
COPY pastoral-care/src/ ./src/
COPY pastoral-care/index.html ./
COPY pastoral-care/public/ ./public/

# Build React frontend
RUN npm run build

# ===== Build Backend =====
WORKDIR /app

# Copy backend package files
COPY package.json package-lock.json* ./

# Install backend dependencies
RUN npm install

# Copy backend source files
COPY tsconfig.json ./
COPY src/ ./src/

# Build TypeScript backend
RUN npm run build

# Copy built React frontend to a location the server can serve
RUN cp -r pastoral-care/dist ./public

# Expose port 3000 for backend API
EXPOSE 3000

# Start the Express server
CMD ["sh", "-c", "cd /app && node dist/server.js"]

