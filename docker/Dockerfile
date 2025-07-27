# syntax=docker/dockerfile:1.5

################################################################################
# 1️⃣ Builder: Debian-slim — install native libs, JS deps & build Next.js
ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim AS builder

WORKDIR /app

# 1. Install the C libraries that canvas needs
RUN apt-get update && apt-get install -y \
      build-essential \
      libcairo2-dev \
      libjpeg-dev \
      libpango1.0-dev \
      libgif-dev \
      librsvg2-dev \
      libpng-dev \
      pkg-config \
      python3 \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy your package files
COPY package.json package-lock.json ./

# 3. Install JS deps (npm ci will use package-lock.json)
RUN npm ci

# 4. Force-rebuild canvas from source so build/Release/canvas.node is created
RUN npm rebuild canvas --build-from-source

# 5. Build-time env vars for Next.js
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_DOCKER_BACKEND_URL
ARG ENV
ARG NEXT_PUBLIC_ENV

ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_GITHUB_CLIENT_ID=$NEXT_PUBLIC_GITHUB_CLIENT_ID \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_DOCKER_BACKEND_URL=$NEXT_PUBLIC_DOCKER_BACKEND_URL \
    ENV=$ENV \
    NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV \
    NEXT_TELEMETRY_DISABLED=1

# 6. Debug: Show environment at build time
RUN echo "✅ Environment Variables in Build:" && \
    echo "NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV" && \
    echo "ENV=$ENV" && \
    echo "NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL" && \
    echo "NEXT_PUBLIC_DOCKER_BACKEND_URL=$NEXT_PUBLIC_DOCKER_BACKEND_URL"

# 7. Copy the rest of your source code & build Next.js app
COPY . .
RUN npm run build

################################################################################
# 2️⃣ Runner: Alpine — only the standalone output & glibc shim
FROM node:${NODE_VERSION}-alpine AS runner

WORKDIR /app

# Provide glibc compatibility for any native binaries
RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Drop root privileges
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs
USER nextjs

# Copy only the standalone output needed for production
COPY --from=builder /app/public            ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./ 
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
  CMD wget -qO- http://0.0.0.0:3000/ || exit 1

CMD ["node", "server.js"]
