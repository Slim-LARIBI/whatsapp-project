# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat curl
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile=false

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

RUN apk add --no-cache curl
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY tsconfig.base.json turbo.json ./
COPY packages ./packages
COPY apps ./apps

RUN pnpm -C packages/shared build
RUN pnpm -C apps/web build

# ---------- runtime ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache curl
RUN corepack enable && corepack prepare pnpm@10.29.1 --activate

COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/package.json ./apps/web/package.json

COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=build /app/packages/shared/node_modules ./packages/shared/node_modules

EXPOSE 3001
CMD ["pnpm", "-C", "apps/web", "start"]
