// ── Roles & Auth ──
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

// ── Conversation ──
export enum ConversationStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

// ── Message ──
export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  TEMPLATE = 'template',
  INTERACTIVE = 'interactive',
  REACTION = 'reaction',
}

// ── Template ──
export enum TemplateStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAUSED = 'paused',
  DISABLED = 'disabled',
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

// ── Contact ──
export enum OptInStatus {
  OPTED_IN = 'opted_in',
  OPTED_OUT = 'opted_out',
  PENDING = 'pending',
}

// ── WhatsApp Webhook Types ──
export interface WAWebhookPayload {
  object: string;
  entry: WAWebhookEntry[];
}

export interface WAWebhookEntry {
  id: string;
  changes: WAWebhookChange[];
}

export interface WAWebhookChange {
  value: WAWebhookValue;
  field: string;
}

export interface WAWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WAWebhookContact[];
  messages?: WAWebhookMessage[];
  statuses?: WAWebhookStatus[];
}

export interface WAWebhookContact {
  profile: { name: string };
  wa_id: string;
}

export interface WAWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: WAMediaPayload;
  video?: WAMediaPayload;
  audio?: WAMediaPayload;
  document?: WAMediaPayload & { filename?: string };
  location?: { latitude: number; longitude: number; name?: string };
  contacts?: unknown[];
  interactive?: unknown;
  sticker?: WAMediaPayload;
  reaction?: { message_id: string; emoji: string };
}

export interface WAMediaPayload {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
}

export interface WAWebhookStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string }>;
}

// ── API Response ──
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ── Pagination ──
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
