# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application code
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application code from builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/db ./db
COPY --from=builder /app/public ./public

# Install su-exec for stepping down from root
RUN apk add --no-cache su-exec

# Create data directory for SQLite database
RUN mkdir -p /app/data && \
    chown -R node:node /app

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port (configurable via environment variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Use entrypoint to handle permissions
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
