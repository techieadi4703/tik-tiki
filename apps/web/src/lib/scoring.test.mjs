import test from 'node:test';
import assert from 'node:assert';
import { calculateFrontendScore, validateSearchQuery } from './scoring.mjs';

test('validateSearchQuery rejects identical origin and destination', () => {
  const result = validateSearchQuery({ origin: 'BOM', destination: 'BOM', date: '2026-12-24' });
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.error, 'Origin and destination cannot be identical');
});

test('validateSearchQuery approves valid distinct route', () => {
  const result = validateSearchQuery({ origin: 'BOM', destination: 'JAI', date: '2026-12-24' });
  assert.strictEqual(result.valid, true);
});

test('calculateFrontendScore scores available, cheap, fast option high', () => {
  const score = calculateFrontendScore({
    price: 1500,
    minPrice: 1500,
    durationMins: 600,
    minDurationMins: 600,
    status: 'AVAILABLE',
    transfers: 0,
    departureHour: 10,
  });

  assert.ok(score >= 85, `Expected score >= 85, got ${score}`);
});

test('calculateFrontendScore penalizes waitlisted option with transfers', () => {
  const score = calculateFrontendScore({
    price: 3000,
    minPrice: 1500,
    durationMins: 1200,
    minDurationMins: 600,
    status: 'WAITLIST',
    transfers: 2,
    departureHour: 23, // Red-eye
  });

  assert.ok(score < 50, `Expected low score (<50) for poor option, got ${score}`);
});
