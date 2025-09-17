# Frontend Dockerfile - Multi-stage build
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ cairo-dev jpeg-dev pango-dev musl-dev
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Set build-time environment variables for Next.js
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=923685198285-bcuenjqssub489v92n9m3fgmeo1qv19f.apps.googleusercontent.com
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23lib9rnCavmUN37Qf
ENV NEXT_PUBLIC_ENV=docker
ENV NEXT_PUBLIC_API_URL=http://localhost/api
ENV NEXT_PUBLIC_DOCKER_BACKEND_URL=http://localhost/api

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_PUBLIC_API_URL=http://localhost/api
ENV NEXT_PUBLIC_DOCKER_BACKEND_URL=http://localhost/api
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=923685198285-bcuenjqssub489v92n9m3fgmeo1qv19f.apps.googleusercontent.com
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23lib9rnCavmUN37Qf
ENV NEXT_PUBLIC_ENV=docker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Run the application
CMD ["node", "server.js"]
