import { isWithin24hWindow, normalizePhone } from '@whatsapp-platform/shared';

/**
 * Unit tests for WhatsApp service utilities.
 */
describe('WhatsApp Utilities', () => {
  describe('isWithin24hWindow', () => {
    it('should return true for a message within 24h', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      expect(isWithin24hWindow(oneHourAgo)).toBe(true);
    });

    it('should return false for a message older than 24h', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      expect(isWithin24hWindow(twoDaysAgo)).toBe(false);
    });

    it('should return false for null timestamp', () => {
      expect(isWithin24hWindow(null)).toBe(false);
    });

    it('should handle string dates', () => {
      const recentDate = new Date(Date.now() - 1000).toISOString();
      expect(isWithin24hWindow(recentDate)).toBe(true);
    });

    it('should return false at exactly 24h boundary', () => {
      const exactly24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(isWithin24hWindow(exactly24h)).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('should strip non-digit characters', () => {
      expect(normalizePhone('+216 12 345 678')).toBe('+21612345678');
    });

    it('should add + prefix if missing', () => {
      expect(normalizePhone('21612345678')).toBe('+21612345678');
    });

    it('should handle already formatted numbers', () => {
      expect(normalizePhone('+21612345678')).toBe('+21612345678');
    });
  });
});
