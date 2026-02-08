// WhatsApp Cloud API
export const WA_API_BASE = 'https://graph.facebook.com/v21.0';
export const WA_24H_WINDOW_MS = 24 * 60 * 60 * 1000;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

// Rate limits
export const RATE_LIMIT_PER_USER = 100; // req/min
export const RATE_LIMIT_PER_TENANT = 1000; // req/min

// BullMQ Queue names
export const QUEUE_MESSAGE_SEND = 'message.send';
export const QUEUE_MESSAGE_PROCESS = 'message.process';
export const QUEUE_AI_CLASSIFY = 'ai.classify';
export const QUEUE_WEBHOOK_NOTIFY = 'webhook.notify';
export const QUEUE_MEDIA_DOWNLOAD = 'media.download';

// Redis key prefixes
export const REDIS_PREFIX_IDEMPOTENCY = 'idempotency:';
export const REDIS_PREFIX_SESSION = 'session:';
export const REDIS_PREFIX_RATE_LIMIT = 'ratelimit:';

// Template limits
export const MAX_TEMPLATE_NAME_LENGTH = 512;
export const MAX_TEMPLATE_BODY_LENGTH = 1024;
