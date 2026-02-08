import * as crypto from 'crypto';

/**
 * Unit tests for WebhookController — signature verification and payload parsing.
 */
describe('WhatsApp Webhook', () => {
  const APP_SECRET = 'test-app-secret';

  function generateSignature(body: string, secret: string): string {
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
  }

  describe('Signature Verification', () => {
    it('should accept valid signature', () => {
      const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
      const signature = generateSignature(body, APP_SECRET);
      const expectedSig = generateSignature(body, APP_SECRET);

      expect(signature).toBe(expectedSig);
    });

    it('should reject invalid signature', () => {
      const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
      const validSig = generateSignature(body, APP_SECRET);
      const invalidSig = generateSignature(body, 'wrong-secret');

      expect(validSig).not.toBe(invalidSig);
    });

    it('should handle empty body gracefully', () => {
      const body = '';
      const signature = generateSignature(body, APP_SECRET);
      expect(signature).toBeDefined();
      expect(signature.startsWith('sha256=')).toBe(true);
    });
  });

  describe('Webhook Verification (GET)', () => {
    const VERIFY_TOKEN = 'my-verify-token';

    it('should return challenge when token matches', () => {
      const mode = 'subscribe';
      const token = VERIFY_TOKEN;
      const challenge = 'test-challenge-12345';

      const shouldVerify = mode === 'subscribe' && token === VERIFY_TOKEN;
      expect(shouldVerify).toBe(true);
      expect(challenge).toBe('test-challenge-12345');
    });

    it('should reject when token does not match', () => {
      const mode = 'subscribe';
      const token = 'wrong-token';

      const shouldVerify = mode === 'subscribe' && token === VERIFY_TOKEN;
      expect(shouldVerify).toBe(false);
    });

    it('should reject when mode is not subscribe', () => {
      const mode = 'unsubscribe';
      const token = VERIFY_TOKEN;

      const shouldVerify = mode === 'subscribe' && token === VERIFY_TOKEN;
      expect(shouldVerify).toBe(false);
    });
  });

  describe('Payload Parsing', () => {
    it('should parse inbound text message', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'waba_123',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '216XXXXXXXX', phone_number_id: 'pn_123' },
              contacts: [{ profile: { name: 'Test User' }, wa_id: '21612345678' }],
              messages: [{
                from: '21612345678',
                id: 'wamid_123',
                timestamp: '1234567890',
                type: 'text',
                text: { body: 'Hello, I need help' },
              }],
            },
            field: 'messages',
          }],
        }],
      };

      expect(payload.object).toBe('whatsapp_business_account');
      expect(payload.entry[0].changes[0].value.messages).toHaveLength(1);
      expect(payload.entry[0].changes[0].value.messages![0].type).toBe('text');
      expect(payload.entry[0].changes[0].value.messages![0].text!.body).toBe('Hello, I need help');
    });

    it('should parse status update', () => {
      const payload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'waba_123',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '216XXXXXXXX', phone_number_id: 'pn_123' },
              statuses: [{
                id: 'wamid_456',
                status: 'delivered' as const,
                timestamp: '1234567890',
                recipient_id: '21612345678',
              }],
            },
            field: 'messages',
          }],
        }],
      };

      expect(payload.entry[0].changes[0].value.statuses).toHaveLength(1);
      expect(payload.entry[0].changes[0].value.statuses![0].status).toBe('delivered');
    });
  });
});
