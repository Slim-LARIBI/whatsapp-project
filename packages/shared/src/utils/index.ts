import { WA_24H_WINDOW_MS } from '../constants';

/**
 * Check if a conversation is within the 24h free-form messaging window.
 */
export function isWithin24hWindow(lastInboundAt: Date | string | null): boolean {
  if (!lastInboundAt) return false;
  const lastInbound = typeof lastInboundAt === 'string' ? new Date(lastInboundAt) : lastInboundAt;
  return Date.now() - lastInbound.getTime() < WA_24H_WINDOW_MS;
}

/**
 * Normalize a phone number to E.164 format (basic).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
