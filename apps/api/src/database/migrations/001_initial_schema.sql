-- ============================================================
-- WhatsApp Platform — Initial Schema
-- Multi-tenant, row-level isolation via tenant_id
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for AI embeddings

-- ── Tenants ──────────────────────────────────────────────────
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(100) UNIQUE NOT NULL,
    plan            VARCHAR(50) DEFAULT 'free',       -- free, starter, pro, enterprise
    is_active       BOOLEAN DEFAULT true,
    settings        JSONB DEFAULT '{}',                -- tenant-level config
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── WhatsApp Accounts (per tenant) ──────────────────────────
CREATE TABLE whatsapp_accounts (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone_number_id     VARCHAR(100) NOT NULL,
    display_phone       VARCHAR(20) NOT NULL,
    waba_id             VARCHAR(100),
    access_token        TEXT NOT NULL,                 -- encrypted at app level
    webhook_verify_token VARCHAR(255),
    business_name       VARCHAR(255),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone_number_id)
);

CREATE INDEX idx_wa_accounts_tenant ON whatsapp_accounts(tenant_id);

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'agent',  -- admin, manager, agent, viewer
    avatar_url      TEXT,
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- ── Contacts ─────────────────────────────────────────────────
CREATE TABLE contacts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    phone           VARCHAR(20) NOT NULL,
    name            VARCHAR(255),
    email           VARCHAR(255),
    avatar_url      TEXT,
    opt_in_status   VARCHAR(20) DEFAULT 'pending',     -- opted_in, opted_out, pending
    opt_in_at       TIMESTAMPTZ,
    tags            TEXT[] DEFAULT '{}',
    segments        TEXT[] DEFAULT '{}',
    custom_fields   JSONB DEFAULT '{}',
    notes           TEXT,
    country_code    VARCHAR(5),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX idx_contacts_phone ON contacts(tenant_id, phone);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_segments ON contacts USING GIN(segments);
CREATE INDEX idx_contacts_opt_in ON contacts(tenant_id, opt_in_status);

-- ── Conversations ────────────────────────────────────────────
CREATE TABLE conversations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    contact_id          UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    wa_account_id       UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
    assigned_to         UUID REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) DEFAULT 'open',     -- open, pending, resolved, closed
    priority            VARCHAR(10) DEFAULT 'normal',   -- low, normal, high, urgent
    subject             VARCHAR(255),
    tags                TEXT[] DEFAULT '{}',
    last_message_at     TIMESTAMPTZ,
    last_inbound_at     TIMESTAMPTZ,                    -- for 24h window tracking
    unread_count        INT DEFAULT 0,
    is_bot_active       BOOLEAN DEFAULT false,          -- AI bot handling
    ai_intent           VARCHAR(100),                   -- last classified intent
    ai_summary          TEXT,                           -- AI conversation summary
    closed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX idx_conversations_contact ON conversations(contact_id);
CREATE INDEX idx_conversations_assigned ON conversations(tenant_id, assigned_to);
CREATE INDEX idx_conversations_status ON conversations(tenant_id, status);
CREATE INDEX idx_conversations_last_msg ON conversations(tenant_id, last_message_at DESC);

-- ── Messages ─────────────────────────────────────────────────
CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    contact_id      UUID REFERENCES contacts(id) ON DELETE SET NULL,
    sender_id       UUID REFERENCES users(id) ON DELETE SET NULL,  -- null if inbound
    wa_message_id   VARCHAR(255),                      -- WhatsApp message ID
    direction       VARCHAR(10) NOT NULL,              -- inbound, outbound
    type            VARCHAR(20) NOT NULL DEFAULT 'text',
    content         JSONB NOT NULL DEFAULT '{}',       -- { body, caption, url, ... }
    status          VARCHAR(20) DEFAULT 'pending',     -- pending, sent, delivered, read, failed
    error_code      INT,
    error_message   TEXT,
    template_id     UUID REFERENCES message_templates(id),
    metadata        JSONB DEFAULT '{}',                -- extra data (reactions, context, etc.)
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_wa_id ON messages(wa_message_id);
CREATE INDEX idx_messages_tenant ON messages(tenant_id);
CREATE INDEX idx_messages_status ON messages(tenant_id, status);

-- ── Message Templates ────────────────────────────────────────
CREATE TABLE message_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    wa_account_id   UUID NOT NULL REFERENCES whatsapp_accounts(id) ON DELETE CASCADE,
    wa_template_id  VARCHAR(255),                      -- Meta template ID after submission
    name            VARCHAR(512) NOT NULL,
    language        VARCHAR(10) NOT NULL DEFAULT 'en',
    category        VARCHAR(20) NOT NULL,              -- MARKETING, UTILITY, AUTHENTICATION
    status          VARCHAR(20) DEFAULT 'draft',       -- draft, pending, approved, rejected, paused, disabled
    components      JSONB NOT NULL DEFAULT '[]',       -- header, body, footer, buttons
    example_values  JSONB DEFAULT '{}',                -- sample values for review
    rejection_reason TEXT,
    -- Tracking
    sent_count      INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    read_count      INT DEFAULT 0,
    failed_count    INT DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, wa_account_id, name, language)
);

CREATE INDEX idx_templates_tenant ON message_templates(tenant_id);
CREATE INDEX idx_templates_status ON message_templates(tenant_id, status);

-- ── Audit Log ────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(100) NOT NULL,             -- e.g., message.send, contact.create
    entity_type     VARCHAR(50),                       -- e.g., message, contact, template
    entity_id       UUID,
    old_values      JSONB,
    new_values      JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ── Conversation Notes (internal agent notes) ───────────────
CREATE TABLE conversation_notes (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_conversation ON conversation_notes(conversation_id, created_at);

-- ── Tags (global tag registry per tenant) ────────────────────
CREATE TABLE tags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    color       VARCHAR(7) DEFAULT '#6B7280',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- ── Quick Replies (canned responses) ─────────────────────────
CREATE TABLE quick_replies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    shortcut    VARCHAR(50) NOT NULL,                  -- e.g., /hello
    title       VARCHAR(255) NOT NULL,
    content     TEXT NOT NULL,
    category    VARCHAR(50),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, shortcut)
);

-- ── AI Embeddings (for semantic search, optional) ────────────
CREATE TABLE embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type     VARCHAR(50) NOT NULL,              -- message, contact, note
    source_id       UUID NOT NULL,
    content_text    TEXT NOT NULL,
    embedding       vector(1536),                      -- OpenAI ada-002 dimensions
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_embeddings_tenant ON embeddings(tenant_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── Updated_at trigger ───────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_messages_updated BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_quick_replies_updated BEFORE UPDATE ON quick_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at();
