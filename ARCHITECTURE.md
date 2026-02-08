# WhatsApp Platform — Architecture Document

## 1. Assumptions

| Parameter | Value |
|-----------|-------|
| Mode | SaaS multi-tenant (row-level isolation via `tenant_id`) |
| Volume | ~2k msgs/day, 20 agents, 5k contacts per tenant |
| AI Provider | Abstracted — Claude API (default), OpenAI (fallback) |
| n8n | Self-hosted, communicates via REST webhooks |
| WhatsApp | One WABA per tenant; each tenant provides `phone_number_id` + access token |
| Monorepo | Turborepo (apps/web, apps/api, packages/shared) |

## 2. Architecture Diagram (Text)

```
                         ┌─────────────────────────┐
                         │      Nginx Reverse       │
                         │        Proxy :443         │
                         └──────┬──────────┬────────┘
                                │          │
                    ┌───────────┘          └───────────┐
                    ▼                                  ▼
          ┌─────────────────┐                ┌─────────────────┐
          │  Next.js Front  │                │   NestJS API    │
          │   :3000 (SSR)   │                │     :4000       │
          │                 │                │                 │
          │ - Inbox         │  REST / WS     │ - Auth Module   │
          │ - Contacts      │◄──────────────►│ - Tenant Module │
          │ - Templates     │                │ - Contact Module│
          │ - Settings      │                │ - Conversation  │
          │ - Dashboard     │                │ - WhatsApp      │
          └─────────────────┘                │ - Template      │
                                             │ - AI Module     │
                                             │ - Webhook       │
                                             └──────┬──────────┘
                                                    │
                         ┌──────────────────────────┼──────────────────┐
                         │                          │                  │
                         ▼                          ▼                  ▼
               ┌──────────────┐          ┌──────────────┐    ┌──────────────┐
               │  PostgreSQL  │          │    Redis      │    │ S3 / Minio   │
               │   :5432      │          │   :6379       │    │   :9000      │
               │              │          │               │    │              │
               │ - All tables │          │ - BullMQ jobs │    │ - Media      │
               │ - pgvector   │          │ - Cache       │    │ - Exports    │
               │              │          │ - Sessions    │    │              │
               └──────────────┘          └──────────────┘    └──────────────┘
                                                │
                                                ▼
                                       ┌──────────────┐
                                       │   BullMQ      │
                                       │   Workers     │
                                       │               │
                                       │ - msg.send    │
                                       │ - msg.process │
                                       │ - ai.classify │
                                       │ - webhook.out │
                                       └──────────────┘

    ┌──────────────────┐         ┌──────────────────┐
    │  Meta WhatsApp   │         │    n8n           │
    │  Cloud API       │◄───────►│  (self-hosted)   │
    │                  │         │   :5678          │
    │ - Send messages  │         │                  │
    │ - Webhooks       │         │ - Automations    │
    │ - Templates      │         │ - Triggers       │
    └──────────────────┘         └──────────────────┘

    ┌──────────────────┐
    │  AI Provider     │
    │                  │
    │ - Claude API     │
    │ - OpenAI API     │
    │                  │
    │ - Intent classify│
    │ - Auto-reply     │
    │ - Summarize      │
    └──────────────────┘
```

## 3. Core Flows

### Flow 1: Inbound Message
```
Meta Webhook POST /api/webhooks/whatsapp
  → Verify signature (X-Hub-Signature-256)
  → Idempotency check (message_id in Redis)
  → Parse message payload
  → Upsert contact (phone → contact record)
  → Create/find conversation (24h window tracking)
  → Store message in DB
  → Emit WebSocket event to frontend (real-time)
  → Enqueue BullMQ job: ai.classify (intent detection)
  → Enqueue BullMQ job: n8n.trigger (automation webhook)
  → AI worker: classify intent → store → suggest reply
  → Agent sees message + suggestion in Inbox
```

### Flow 2: Outbound Message (Agent Reply)
```
Agent types reply in Inbox
  → POST /api/conversations/:id/messages
  → Check 24h window (last inbound timestamp)
    → If within 24h: send free-form message via WA Cloud API
    → If outside 24h: require template selection
  → Enqueue BullMQ job: msg.send
  → Worker calls WA Cloud API POST /messages
  → Store message in DB (status: sent)
  → Webhook callback: status updates (delivered, read, failed)
  → Update message status in DB
  → Emit WebSocket event
```

### Flow 3: Template Lifecycle
```
Admin creates template in UI
  → POST /api/templates
  → Store in DB (status: draft)
  → Submit to Meta: POST /{phone_number_id}/message_templates
  → Status changes via webhook: APPROVED / REJECTED
  → Update DB status
  → Template available for sending
  → Track: sent, delivered, read, failed per template
```

### Flow 4: n8n Automation
```
Trigger: API calls n8n webhook URL on events
  → n8n workflow processes (e.g., abandoned cart)
  → n8n calls back API: POST /api/messages/send-template
  → Message sent via WhatsApp
  → Status tracked
```

## 4. Security

- JWT auth with refresh tokens (httpOnly cookies)
- RBAC: admin > manager > agent > viewer
- Tenant isolation enforced at service layer (all queries scoped by tenant_id)
- WhatsApp webhook signature verification (HMAC SHA-256)
- Rate limiting: 100 req/min per user, 1000 req/min per tenant
- Input validation via class-validator (NestJS pipes)
- Audit log for all mutations
- Secrets in env vars, never in code

## 5. Observability

- Structured JSON logging (pino)
- Request correlation IDs
- BullMQ job monitoring (Bull Board UI)
- Health check endpoint: GET /api/health
- Error tracking: Sentry integration
- Metrics: message volume, response time, AI latency
