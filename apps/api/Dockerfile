FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install --workspace=@whatsapp-platform/api --workspace=@whatsapp-platform/shared

COPY packages/shared packages/shared
COPY apps/api apps/api
COPY tsconfig.base.json ./

RUN npm run build --workspace=@whatsapp-platform/shared
RUN npm run build --workspace=@whatsapp-platform/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/shared/dist ./node_modules/@whatsapp-platform/shared/dist

EXPOSE 4000
CMD ["node", "dist/main.js"]
