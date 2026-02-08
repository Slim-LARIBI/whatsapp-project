# Roadmap

## MVP — 2 Weeks

### Week 1: Core Infrastructure
- [ ] Initialize monorepo, install all deps (`npm install`)
- [ ] Start Docker services (`docker compose -f infra/docker-compose.dev.yml up -d`)
- [ ] Run DB migrations (create all tables)
- [ ] Implement Auth module (register, login, JWT, RBAC guard)
- [ ] Implement Tenant module (create, read, update)
- [ ] Implement Contact module (CRUD, upsert by phone)
- [ ] Implement WhatsApp Account module (store tokens, phone_number_id)
- [ ] Implement Webhook controller (GET verification + POST handler)
- [ ] Implement Webhook service (signature verification, idempotency, message routing)
- [ ] Test webhook with ngrok + Meta test phone number
- [ ] Store inbound messages in DB
- [ ] Implement Conversation service (find/create, store message, 24h window check)

### Week 2: Inbox + Send + Frontend
- [ ] Implement outbound message sending (BullMQ worker → WA Cloud API)
- [ ] Implement WebSocket gateway (real-time message delivery to frontend)
- [ ] Build Next.js login page
- [ ] Build Inbox page: conversation list + chat view + detail panel
- [ ] Build Contacts page: list, search, pagination
- [ ] Connect frontend to API (api client, zustand store)
- [ ] Connect WebSocket for real-time updates
- [ ] Test end-to-end: receive message → see in inbox → reply → delivered
- [ ] Basic error handling and loading states
- [ ] Deploy to VPS with Docker Compose + Nginx

## V1 — 6 Weeks (after MVP)

### Weeks 3-4: Templates + Automation
- [ ] Template CRUD + submission to Meta
- [ ] Template status webhook handler (approved/rejected)
- [ ] Template gallery UI in frontend
- [ ] Template sending from conversation view (when outside 24h window)
- [ ] Template analytics (sent/delivered/read/failed counts)
- [ ] n8n integration: inbound message webhook → n8n
- [ ] n8n workflow: auto-classify + suggest reply
- [ ] n8n workflow: outbound template campaign
- [ ] CSV contact import (frontend upload + backend parser)
- [ ] Contact segments and advanced filtering

### Weeks 5-6: AI + Polish
- [ ] AI intent classification (BullMQ worker)
- [ ] AI suggested replies (show in conversation view)
- [ ] AI conversation summary
- [ ] Quick replies / canned responses
- [ ] Conversation notes (internal agent notes)
- [ ] Agent assignment UI (dropdown in conversation detail)
- [ ] Conversation tags (add/remove from UI)
- [ ] Audit log viewer (admin panel)
- [ ] Dashboard: message volume chart, response time, agent activity
- [ ] Media message support (image, video, audio, document)
- [ ] Media download + S3 upload
- [ ] RGPD compliance: opt-in/opt-out tracking, data export, data deletion
- [ ] Rate limiting middleware
- [ ] Sentry error tracking integration
- [ ] Structured logging (pino)
- [ ] Performance tuning (DB indexes, query optimization)
- [ ] Load testing with expected volume (2k msgs/day)

## V2 — Future
- [ ] Multi-language support (ar, fr, en)
- [ ] Advanced RBAC (custom roles, permissions)
- [ ] WhatsApp Flows integration
- [ ] WhatsApp Catalog integration
- [ ] Chatbot builder (visual flow editor)
- [ ] Scheduled messages
- [ ] Broadcast lists (bulk messaging with opt-in enforcement)
- [ ] Webhook for external systems (Shopify, WooCommerce events)
- [ ] API keys for tenant-level programmatic access
- [ ] Tenant billing integration (Stripe)
- [ ] Mobile responsive inbox (PWA)
- [ ] pgvector semantic search across conversations
