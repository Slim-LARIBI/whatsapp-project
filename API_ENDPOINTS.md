# API Endpoints Reference

Base URL: `http://localhost:4000/api`
Auth: Bearer JWT token (except public endpoints)

## Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/auth/register` | No | `{ email, password, name, tenantId, role? }` | Register user |
| POST | `/auth/login` | No | `{ email, password }` | Login, returns JWT |
| GET | `/auth/me` | Yes | - | Get current user profile |

## Tenants

| Method | Endpoint | Auth | Roles | Body | Description |
|--------|----------|------|-------|------|-------------|
| POST | `/tenants` | Yes | admin | `{ name, slug, plan? }` | Create tenant |
| GET | `/tenants/current` | Yes | all | - | Get current tenant |
| PATCH | `/tenants/current` | Yes | admin | `{ name?, settings? }` | Update tenant |

## Contacts

| Method | Endpoint | Auth | Roles | Body/Params | Description |
|--------|----------|------|-------|-------------|-------------|
| GET | `/contacts` | Yes | all | `?page&limit&search&optInStatus` | List contacts |
| GET | `/contacts/:id` | Yes | all | - | Get contact |
| POST | `/contacts` | Yes | all | `{ phone, name?, email?, tags? }` | Create contact |
| PATCH | `/contacts/:id` | Yes | all | `{ name?, email?, tags?, ...}` | Update contact |
| DELETE | `/contacts/:id` | Yes | admin,manager | - | Delete contact |
| POST | `/contacts/import` | Yes | admin,manager | `{ rows: [{ phone, name?, email?, tags? }] }` | CSV import |

## Conversations

| Method | Endpoint | Auth | Body/Params | Description |
|--------|----------|------|-------------|-------------|
| GET | `/conversations` | Yes | `?page&limit&status&assignedTo` | List conversations |
| GET | `/conversations/:id` | Yes | - | Get conversation + contact |
| GET | `/conversations/:id/messages` | Yes | `?page&limit` | Get messages |
| POST | `/conversations/:id/messages` | Yes | `{ body }` | Send reply (checks 24h) |
| PATCH | `/conversations/:id/assign` | Yes | `{ userId }` | Assign to agent |
| PATCH | `/conversations/:id/status` | Yes | `{ status }` | Update status |

## WhatsApp

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/whatsapp/send-template` | Yes | `{ waAccountId, to, templateName, language, components? }` | Send template msg |

## Templates

| Method | Endpoint | Auth | Roles | Body | Description |
|--------|----------|------|-------|------|-------------|
| GET | `/templates` | Yes | all | `?status&category` | List templates |
| GET | `/templates/:id` | Yes | all | - | Get template |
| POST | `/templates` | Yes | admin,manager | `{ waAccountId, name, language, category, components, exampleValues? }` | Create template |
| POST | `/templates/:id/submit` | Yes | admin,manager | - | Submit to Meta |

## Webhooks

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/webhooks/whatsapp` | No | Meta verification (challenge-response) |
| POST | `/webhooks/whatsapp` | Signature | Inbound messages + status updates |

## Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | No | Health check |

## Conventions

- **Pagination**: `?page=1&limit=25` → Response: `{ data: [...], meta: { page, limit, total } }`
- **Errors**: `{ success: false, error: "message", statusCode: 400 }`
- **Dates**: ISO 8601 (UTC)
- **IDs**: UUIDv4
- **Tenant isolation**: All endpoints scoped to JWT tenant_id automatically
