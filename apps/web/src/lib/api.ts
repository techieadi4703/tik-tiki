import { JourneyOptimizationResult, LocationItem } from '../types';
import { MAJOR_STATIONS_CATALOG, resolveStationDisplayName } from './stations.mjs';

export { MAJOR_STATIONS_CATALOG, resolveStationDisplayName };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

export async function searchLocations(query: string): Promise<LocationItem[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return (MAJOR_STATIONS_CATALOG as LocationItem[]).filter((s) => s.is_major_hub).slice(0, 8);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/locations/search?q=${encodeURIComponent(cleanQuery)}`);
    if (!res.ok) throw new Error('Search locations failed');
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      return data.results;
    }
  } catch (err) {
    console.warn('Backend locations lookup fallback to local catalog:', err);
  }

  // Resilient client-side filtering matching code, name, or city
  return (MAJOR_STATIONS_CATALOG as LocationItem[]).filter(
    (loc) =>
      loc.code.toLowerCase().includes(cleanQuery) ||
      loc.name.toLowerCase().includes(cleanQuery) ||
      loc.city.toLowerCase().includes(cleanQuery)
  );
}

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

export async function fetchOptimizedJourneyStrategies(
  origin = 'ET',
  destination = 'PRYJ',
  date = '2026-12-24',
  classCode = '3A'
): Promise<JourneyOptimizationResult> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/journeys/optimize?origin=${origin}&destination=${destination}&date=${date}&class=${classCode}`
    );
    if (!res.ok) throw new Error('Failed to fetch optimized strategies');
    return await res.json();
  } catch (err) {
    return {
      requested_origin: origin,
      requested_destination: destination,
      travel_date: date,
      class_code: classCode,
      direct_train_status: 'WAITLIST 42',
      upstream_options: [
        {
          type: 'UPSTREAM_BOOKING',
          train_number: '11059',
          train_name: 'Godan Express (11059)',
          book_from_station: 'Bhusaval Junction (BSL)',
          board_at_station: 'Itarsi Junction (ET)',
          destination_station: 'Prayagraj Junction (PRYJ)',
          class_code: '3A',
          status: 'AVAILABLE 14',
          estimated_extra_fare_inr: 190.0,
          rule_notice: 'Indian Railways Boarding Point Rule: Boarding point can be set downstream without berth forfeiture.',
          explanation: 'Confirmed berths open from BSL! Book from BSL and set Boarding Point to ET. Estimated extra cost: ~₹190.',
        },
      ],
      connecting_options: [
        {
          type: 'CONNECTING_INTERCHANGE',
          interchange_station: 'Itarsi Junction (ET)',
          leg1_train_number: '12155',
          leg1_train_name: 'Shaan-e-Bhopal Express',
          leg1_departure_at: '2026-12-24T08:15:00Z',
          leg1_arrival_at: '2026-12-24T18:00:00Z',
          leg1_avg_delay_minutes: 45,
          leg2_train_number: '12854',
          leg2_train_name: 'Amarkantak Express',
          leg2_departure_at: '2026-12-24T21:00:00Z',
          leg2_arrival_at: '2026-12-25T03:30:00Z',
          scheduled_buffer_minutes: 180,
          effective_slack_minutes: 110,
          risk_grade: 'SAFE',
          transfer_platform_advice: 'Transfer from Platform 2 to Platform 4 at ET via Central Foot Overbridge.',
          estimated_total_fare_inr: 1680.0,
          total_duration_minutes: 1155,
        },
      ],
      split_segment_options: [
        {
          type: 'SPLIT_SEGMENT_EXPERIMENTAL',
          train_number: '11059',
          train_name: 'Godan Express',
          intermediate_station: 'Jabalpur (JBP)',
          leg1_berth: 'Coach B2, Berth 24 (Lower)',
          leg2_berth: 'Coach B3, Berth 11 (Side Lower)',
          estimated_fare_inr: 1420.0,
          operational_warning: 'Requires physical coach change at Jabalpur. Move luggage during the 15-minute halt.',
        },
      ],
    };
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
