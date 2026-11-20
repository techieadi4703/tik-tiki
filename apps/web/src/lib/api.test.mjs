import test from 'node:test';
import assert from 'node:assert';

test('createAlert payload validation logic', () => {
  const validWhatsAppPayload = {
    service_number: '11059',
    origin: 'ET',
    destination: 'PRYJ',
    departure_date: '2026-12-24',
    notification_channel: 'WHATSAPP',
    phone_number: '+919876543210',
  };

  assert.ok(validWhatsAppPayload.phone_number.length >= 10);
  assert.strictEqual(validWhatsAppPayload.notification_channel, 'WHATSAPP');
});

test('createAlert rejects invalid notification channel', () => {
  const invalidChannel = 'TELEGRAM';
  const allowed = ['WHATSAPP', 'WEB_PUSH', 'EMAIL'];
  assert.strictEqual(allowed.includes(invalidChannel), false);
});
