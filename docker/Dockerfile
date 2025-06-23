# syntax=docker/dockerfile:1.5      # enables BuildKit mount syntax

# ---------- 1️⃣ Base image ----------
ARG NODE_VERSION=20                # bump easily in one place
FROM node:${NODE_VERSION}-alpine AS base

# glibc compatibility for some native addons
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---------- 2️⃣ Dependencies ----------
FROM base AS deps
WORKDIR /app

# copy lock-file(s) only, keeping Docker layer cache effective
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# use BuildKit cache to speed up installs
RUN --mount=type=cache,target=/root/.cache \
    if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --no-frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else echo "Lockfile not found." && exit 1; fi

# ---------- 3️⃣ Build ----------
FROM base AS builder
WORKDIR /app

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_GITHUB_CLIENT_ID
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_DOCKER_BACKEND_URL
ARG ENV

# Set environment variables for the build
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GITHUB_CLIENT_ID=$NEXT_PUBLIC_GITHUB_CLIENT_ID
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_DOCKER_BACKEND_URL=$NEXT_PUBLIC_DOCKER_BACKEND_URL
ENV ENV=$ENV

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN \
    if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    else echo "Lockfile not found." && exit 1; fi

# ---------- 4️⃣ Runtime ----------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# non-root user for safety
RUN addgroup --system --gid 1001 nodejs \
    && adduser  --system --uid 1001 nextjs

# copy public assets + standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# simple health-check for Docker/K8s
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD wget -qO- http://0.0.0.0:3000/ || exit 1

CMD ["node", "server.js"]
