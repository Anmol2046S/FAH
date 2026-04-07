# ════════════════════════════════════════════════════════════════
#  FAH AI — Production Dockerfile
#  Optimized for Google Cloud Run
#  Strategy: Multi-stage build for minimal final image size
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Dependency Builder ─────────────────────────────────
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies for native modules (if any)
RUN apk add --no-cache python3 make g++

# Copy only package files first (leverages Docker layer caching)
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for any build steps)
RUN npm ci --only=production && \
    npm cache clean --force

# ── Stage 2: Production Runtime ──────────────────────────────────
FROM node:18-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -S fahuser -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling (PID 1 problem)
RUN apk add --no-cache dumb-init

# Copy only production node_modules from builder stage
COPY --from=builder --chown=fahuser:nodejs /app/node_modules ./node_modules

# Copy application source code
COPY --chown=fahuser:nodejs index.js   ./index.js
COPY --chown=fahuser:nodejs package.json ./package.json

# ── Environment Configuration ────────────────────────────────────
# Cloud Run injects PORT automatically (default 8080)
ENV NODE_ENV=production \
    PORT=8080 \
    # Optimize Node.js for container environment
    NODE_OPTIONS="--max-old-space-size=512" \
    # Disable npm update notifications
    NPM_CONFIG_UPDATE_NOTIFIER=false

# Expose the port Cloud Run expects
EXPOSE 8080

# Switch to non-root user
USER fahuser

# Health check — Cloud Run will use /health endpoint
# Checks every 30s, 3s timeout, 3 retries before marking unhealthy
HEALTHCHECK --interval=30s \
            --timeout=3s \
            --start-period=10s \
            --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Use dumb-init as entrypoint to handle signals correctly
# This ensures graceful shutdown when Cloud Run sends SIGTERM
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "index.js"]

# ════════════════════════════════════════════════════════════════
#  Build & Deploy Commands:
#
#  Local build & test:
#    docker build -t fah-ai-backend .
#    docker run -p 8080:8080 --env-file .env fah-ai-backend
#
#  Google Cloud Run deployment:
#    gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/fah-ai-backend
#    gcloud run deploy fah-ai \
#      --image gcr.io/YOUR_PROJECT_ID/fah-ai-backend \
#      --platform managed \
#      --region us-central1 \
#      --allow-unauthenticated \
#      --memory 512Mi \
#      --cpu 1 \
#      --min-instances 0 \
#      --max-instances 10 \
#      --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=your-project
# ════════════════════════════════════════════════════════════════
