# n8n Workflow Designs

## Workflow 1: Inbound Message Processing

**Trigger:** Webhook node receives POST from API (`/api/webhooks/n8n/inbound`)

```
Webhook Trigger
  → IF: message type == "text"
    → HTTP Request: POST /api/ai/classify (intent)
    → Switch: intent
      → "product_inquiry" → HTTP: fetch product info → HTTP: POST /api/conversations/:id/messages (auto-reply)
      → "order_status" → HTTP: query order DB → HTTP: send order status
      → "complaint" → HTTP: POST /api/conversations/:id/assign (escalate to manager)
      → "faq" → HTTP: POST /api/conversations/:id/messages (canned response)
      → default → do nothing (agent handles)
  → IF: message type == "image"/"document"
    → HTTP: download media → store in S3
```

## Workflow 2: Outbound Template Campaign

**Trigger:** Webhook or CRON schedule

```
Webhook Trigger (or CRON)
  → HTTP Request: GET /api/contacts?segments=abandoned_cart&optInStatus=opted_in
  → Split In Batches (50 per batch, respect WA rate limits)
    → For Each Contact:
      → HTTP Request: POST /api/whatsapp/send-template
        Body: { waAccountId, to: contact.phone, templateName: "abandoned_cart_v1", language: "en", components: [...] }
      → Wait: 100ms (rate limit buffer)
  → HTTP Request: POST /api/audit-log (log campaign execution)
```

## Workflow 3: NPS Survey (Post-Resolution)

**Trigger:** Webhook from API when conversation status changes to "resolved"

```
Webhook Trigger (conversation.resolved event)
  → Wait: 1 hour (delay before sending survey)
  → HTTP Request: POST /api/whatsapp/send-template
    Body: { templateName: "nps_survey", to: contact.phone, components: [{ type: "body", parameters: [{ type: "text", text: contact.name }] }] }
  → Respond to Webhook
```

## Workflow 4: Order Update Notification

**Trigger:** Webhook from e-commerce system (Shopify, WooCommerce, etc.)

```
Webhook Trigger (order.updated)
  → Switch: order.status
    → "shipped" → templateName = "order_shipped"
    → "delivered" → templateName = "order_delivered"
    → "refunded" → templateName = "order_refunded"
  → HTTP Request: GET /api/contacts?phone=order.customer_phone
  → IF: contact exists AND optInStatus == "opted_in"
    → HTTP Request: POST /api/whatsapp/send-template
      Body: { templateName, to: phone, components: [{ parameters: [orderId, trackingUrl] }] }
```

## Workflow 5: Daily Summary Report

**Trigger:** CRON (every day at 9 AM)

```
CRON Trigger (0 9 * * *)
  → HTTP Request: GET /api/analytics/daily-summary
  → Format data (total messages, new contacts, resolved conversations, avg response time)
  → Email: send summary to admin@tenant.com
  → (Optional) HTTP: POST /api/whatsapp/send-template to admin phone
```

## Integration Points

The API exposes these endpoints for n8n:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/n8n/inbound` | POST | n8n receives inbound message events |
| `/api/conversations/:id/messages` | POST | Send a reply |
| `/api/conversations/:id/assign` | PATCH | Assign conversation |
| `/api/whatsapp/send-template` | POST | Send template message |
| `/api/contacts` | GET | Query contacts |
| `/api/contacts` | POST | Create contact |
| `/api/contacts/import` | POST | Bulk import |

All n8n requests must include `Authorization: Bearer <api-key>` header.
