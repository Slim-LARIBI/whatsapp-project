# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

# manifests (cache)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

# install (workspace)
RUN pnpm install --frozen-lockfile=false

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache curl
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

# deps (pnpm workspace layout)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# sources
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps ./apps

# build
RUN pnpm -C packages/shared build
RUN pnpm -C apps/api build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl

# api dist
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

# IMPORTANT: on embarque le workspace @whatsapp-platform/shared (cible du symlink pnpm)
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

# runtime deps
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules

EXPOSE 4000
CMD ["node", "apps/api/dist/main"]
