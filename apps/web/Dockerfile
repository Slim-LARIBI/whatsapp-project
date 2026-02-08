FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspace=@whatsapp-platform/web --workspace=@whatsapp-platform/shared

COPY packages/shared packages/shared
COPY apps/web apps/web
COPY tsconfig.base.json ./

RUN npm run build --workspace=@whatsapp-platform/shared
RUN npm run build --workspace=@whatsapp-platform/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
