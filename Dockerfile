# ---------- Base image ----------
  FROM node:22-alpine AS base

# ---------- Dependencies ----------
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ cairo-dev jpeg-dev pango-dev musl-dev
# Install pnpm globally
RUN npm install -g pnpm
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --no-frozen-lockfile

# ---------- Builder ----------
FROM base AS builder
# Install pnpm in builder stage too
RUN npm install -g pnpm
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
  
  # Accept build-time variables from docker-compose
  ARG NEXT_PUBLIC_ENV
  ARG NEXT_PUBLIC_API_BASE_URL
  ARG NEXT_PUBLIC_DEV_API_URL
  ARG NEXT_PUBLIC_DOCKER_BACKEND_URL
  
  # Expose them so Next.js sees them at build time
  ENV NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV
  ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
  ENV NEXT_PUBLIC_DEV_API_URL=$NEXT_PUBLIC_DEV_API_URL
  ENV NEXT_PUBLIC_DOCKER_BACKEND_URL=$NEXT_PUBLIC_DOCKER_BACKEND_URL
  
  # Fixed client IDs (safe to bake in)
  ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=923685198285-bcuenjqssub489v92n9m3fgmeo1qv19f.apps.googleusercontent.com
  ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23lib9rnCavmUN37Qf
  
  # Disable telemetry
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # Build Next.js app
  RUN pnpm run build
  
  # ---------- Runner ----------
  FROM base AS runner
  WORKDIR /app
  
  # ---- Metadata labels for cleanup & observability ----
  LABEL service="frontend" \
        maintainer="ScholarAI <dev@scholarai.local>" \
        version="0.0.1-SNAPSHOT" \
        description="Next.js Frontend for ScholarAI"
  
  # Install curl for health checks
  RUN apk add --no-cache curl
  
  ENV NODE_ENV=production
  ENV NEXT_TELEMETRY_DISABLED=1
  
  # Create a non-root user
  RUN addgroup --system --gid 1001 nodejs \
   && adduser --system --uid 1001 nextjs
  
  # Copy static + build artifacts
  COPY --from=builder /app/public ./public
  
  # Ensure .next directory exists with proper ownership
  RUN mkdir .next && chown nextjs:nodejs .next
  
  # Copy standalone build output
  COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
  COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
  
  USER nextjs
  
  # Expose app port
  EXPOSE 3000
  
  # Runtime environment (does not affect build-time baked vars)
  ENV PORT=3000
  ENV HOSTNAME=0.0.0.0
  ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=923685198285-bcuenjqssub489v92n9m3fgmeo1qv19f.apps.googleusercontent.com
  ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23lib9rnCavmUN37Qf
  ENV NEXT_PUBLIC_API_BASE_URL=https://api.scholarai.me
  ENV NEXT_PUBLIC_DEV_API_URL=http://localhost:8989
  ENV NEXT_PUBLIC_DOCKER_BACKEND_URL=http://scholar-api-gateway:8989
  
  # Health check
  HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1
  
  # Run the app
  CMD ["node", "server.js"]
