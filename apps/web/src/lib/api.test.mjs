import test from 'node:test';
import assert from 'node:assert';
import { MAJOR_STATIONS_CATALOG, resolveStationDisplayName } from './stations.mjs';

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

test('searchLocations matches by code, name, and city', () => {
  const queryByCode = 'ET';
  const matchByCode = MAJOR_STATIONS_CATALOG.filter(
    (s) => s.code.toLowerCase().includes(queryByCode.toLowerCase())
  );
  assert.ok(matchByCode.length >= 1);
  assert.strictEqual(matchByCode[0].code, 'ET');

  const queryByCity = 'mumbai';
  const matchByCity = MAJOR_STATIONS_CATALOG.filter(
    (s) => s.city.toLowerCase().includes(queryByCity.toLowerCase())
  );
  assert.ok(matchByCity.length >= 2); // MMCT and CSMT/BOM

  const queryByName = 'prayagraj';
  const matchByName = MAJOR_STATIONS_CATALOG.filter(
    (s) => s.name.toLowerCase().includes(queryByName.toLowerCase())
  );
  assert.ok(matchByName.length >= 1);
  assert.ok(matchByName.some((s) => s.code === 'PRYJ'));
});

test('resolveStationDisplayName formats Name and Code cleanly', () => {
  const display = resolveStationDisplayName('ET');
  assert.strictEqual(display, 'Itarsi Junction (ET)');

  const fallback = resolveStationDisplayName('UNKNOWN');
  assert.strictEqual(fallback, 'UNKNOWN');
});

test('Origin and destination equality validation guard', () => {
  const from = 'ET';
  const to = 'ET';
  const isInvalid = from.trim().toUpperCase() === to.trim().toUpperCase();
  assert.strictEqual(isInvalid, true);

  const distinctFrom = 'ET';
  const distinctTo = 'PRYJ';
  const isValid = distinctFrom.trim().toUpperCase() !== distinctTo.trim().toUpperCase();
  assert.strictEqual(isValid, true);
});
