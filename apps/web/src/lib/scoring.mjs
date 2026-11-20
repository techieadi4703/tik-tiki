// Frontend Journey Score Validator (Mirror of Go Engine)
export function calculateFrontendScore({ price, minPrice, durationMins, minDurationMins, status, transfers, departureHour }) {
  const normCost = minPrice > 0 ? Math.max(0, (1.0 - (price - minPrice) / (2.0 * minPrice)) * 100.0) : 50;
  const normTime = minDurationMins > 0 ? Math.max(0, (1.0 - (durationMins - minDurationMins) / (2.0 * minDurationMins)) * 100.0) : 50;
  
  let normRel = 50;
  if (status === 'AVAILABLE') normRel = 100;
  else if (status === 'RAC') normRel = 75;
  else if (status === 'WAITLIST') normRel = 35;
  else if (status === 'SOLD_OUT') normRel = 0;

  let normConv = Math.max(0, 100 - (transfers * 35));
  if (departureHour >= 23 || departureHour < 4) {
    normConv = Math.max(0, normConv - 15);
  }

  const score = (0.40 * normCost) + (0.30 * normTime) + (0.20 * normRel) + (0.10 * normConv);
  return Math.round(Math.max(0, Math.min(100, score)));
}

export function validateSearchQuery({ origin, destination, date }) {
  if (!origin || !destination) {
    return { valid: false, error: 'Origin and destination are required' };
  }
  if (origin.toUpperCase() === destination.toUpperCase()) {
    return { valid: false, error: 'Origin and destination cannot be identical' };
  }
  const travelDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (travelDate < today) {
    return { valid: false, error: 'Travel date cannot be in the past' };
  }
  return { valid: true };
}
