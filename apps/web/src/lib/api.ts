const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

export async function searchJourneys(origin = 'BOM', destination = 'JAI', date = '2026-12-24') {
  try {
    const res = await fetch(`${API_BASE_URL}/journeys/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin_code: origin, dest_code: destination, departure_date: date }),
    });
    if (!res.ok) throw new Error(`Search failed with status ${res.status}`);
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.warn('Backend unavailable, using client-side fallback data:', err);
    return getFallbackJourneys(origin, destination);
  }
}

export async function fetchSegmentHacks(origin = 'ET', destination = 'PRYJ') {
  try {
    const res = await fetch(`${API_BASE_URL}/journeys/hacks?origin=${origin}&destination=${destination}`);
    if (!res.ok) throw new Error('Failed to fetch hacks');
    const data = await res.json();
    return data.hacks || [];
  } catch (err) {
    return [
      {
        type: 'UPSTREAM_BOOKING_WITH_BOARDING_CHANGE',
        train_number: '11059 (Godan Express)',
        book_from: 'BSL (Bhusaval)',
        board_at: 'ET (Itarsi)',
        book_to: 'PRYJ (Prayagraj)',
        class_code: '3A',
        status: 'AVAILABLE',
        available_berths: 14,
        extra_fare_inr: 195.0,
        explanation: 'Seats are open from Bhusaval under General Quota! Book from Bhusaval, change Boarding Point to Itarsi. Official Indian Railways rule allows this.',
      },
    ];
  }
}

export async function createAlert(payload: {
  service_number: string;
  origin: string;
  destination: string;
  departure_date: string;
  notification_channel: 'WHATSAPP' | 'WEB_PUSH' | 'EMAIL';
  phone_number?: string;
  email?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to create alert');
  }
  return res.json();
}

function getFallbackJourneys(origin: string, destination: string) {
  return [
    {
      provider_id: 'irctc_cris',
      mode: 'RAIL',
      operator_name: 'Indian Railways',
      service_number: '12951 (Tejas Rajdhani Express)',
      origin_code: origin,
      dest_code: destination,
      departure_at: '2026-12-24T17:00:00Z',
      arrival_at: '2026-12-25T08:30:00Z',
      duration_minutes: 930,
      price: 2850,
      currency: 'INR',
      transfers: 0,
      status: 'AVAILABLE',
      available_seats: 8,
      booking_url: 'https://www.irctc.co.in',
      score: 91,
    },
    {
      provider_id: 'redbus_affiliate',
      mode: 'BUS',
      operator_name: 'Zingbus Plus Electric AC Sleeper',
      service_number: 'ZB-9921',
      origin_code: origin,
      dest_code: destination,
      departure_at: '2026-12-24T20:30:00Z',
      arrival_at: '2026-12-25T14:00:00Z',
      duration_minutes: 1050,
      price: 1420,
      currency: 'INR',
      transfers: 0,
      status: 'AVAILABLE',
      available_seats: 14,
      booking_url: 'https://www.redbus.in?ref=tiktiki',
      score: 79,
    },
    {
      provider_id: 'irctc_cris',
      mode: 'RAIL',
      operator_name: 'Indian Railways',
      service_number: '12955 (Mumbai-Jaipur Superfast)',
      origin_code: origin,
      dest_code: destination,
      departure_at: '2026-12-24T19:05:00Z',
      arrival_at: '2026-12-25T12:45:00Z',
      duration_minutes: 1060,
      price: 1640,
      currency: 'INR',
      transfers: 0,
      status: 'WAITLIST',
      available_seats: 0,
      booking_url: 'https://www.irctc.co.in',
      score: 58,
    },
  ];
}
