import { JourneyOptimizationResult, LocationItem, NormalizedOffer, Booking, Passenger, User, AuthSession } from '../types';
import { MAJOR_STATIONS_CATALOG, resolveStationDisplayName } from './stations.mjs';

export { MAJOR_STATIONS_CATALOG, resolveStationDisplayName };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

export async function loginUser(identifier: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Authentication failed. Please verify your credentials.');
  }
  return res.json();
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  irctc_username?: string;
  phone?: string;
}): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<User> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Unauthorized');
  const data = await res.json();
  return data.user;
}

export async function logoutUser(token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

export async function listAllUsers(): Promise<User[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  } catch {
    return [];
  }
}

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

export async function searchJourneys(origin: string, destination: string, date: string): Promise<NormalizedOffer[]> {
  if (!origin || !destination) return [];
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
    return getFallbackJourneys(origin, destination, date);
  }
}

export async function fetchOptimizedJourneyStrategies(
  origin: string,
  destination: string,
  date: string,
  classCode = '3A'
): Promise<JourneyOptimizationResult> {
  if (!origin || !destination) {
    return {
      requested_origin: origin,
      requested_destination: destination,
      travel_date: date,
      class_code: classCode,
      direct_train_status: '',
      upstream_options: [],
      connecting_options: [],
      split_segment_options: [],
    };
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/journeys/optimize?origin=${origin}&destination=${destination}&date=${date}&class=${classCode}`
    );
    if (!res.ok) throw new Error('Failed to fetch optimized strategies');
    return await res.json();
  } catch (err) {
    const orig = origin.toUpperCase();
    const dest = destination.toUpperCase();
    return {
      requested_origin: orig,
      requested_destination: dest,
      travel_date: date,
      class_code: classCode,
      direct_train_status: 'WAITLIST 18',
      upstream_options: [
        {
          type: 'UPSTREAM_BOOKING',
          train_number: '12488',
          train_name: `${orig} - ${dest} Superfast`,
          book_from_station: `${orig} (City Terminal)`,
          board_at_station: `${orig} (Suburban Halt)`,
          destination_station: dest,
          class_code: classCode,
          status: 'AVAILABLE 12',
          estimated_extra_fare_inr: 125.0,
          rule_notice: 'Railway Board Rule: Boarding point can be set downstream during booking without berth forfeiture.',
          explanation: `High demand directly at origin. Open quota available from ${orig} outer terminal!`,
        },
      ],
      connecting_options: [
        {
          type: 'CONNECTING_INTERCHANGE',
          interchange_station: 'Central Junction (JNC)',
          leg1_train_number: '12488',
          leg1_train_name: `${orig} Express`,
          leg1_departure_at: `${date || '2026-12-16'}T14:00:00Z`,
          leg1_arrival_at: `${date || '2026-12-16'}T19:30:00Z`,
          leg1_avg_delay_minutes: 20,
          leg2_train_number: '12059',
          leg2_train_name: `${dest} Intercity`,
          leg2_departure_at: `${date || '2026-12-16'}T22:00:00Z`,
          leg2_arrival_at: `${date || '2026-12-17'}T04:30:00Z`,
          scheduled_buffer_minutes: 150,
          effective_slack_minutes: 110,
          risk_grade: 'SAFE',
          transfer_platform_advice: 'Transfer via central foot overbridge with escalators at Central Junction.',
          estimated_total_fare_inr: 1850.0,
          total_duration_minutes: 870,
        },
      ],
      split_segment_options: [
        {
          type: 'SPLIT_SEGMENT_EXPERIMENTAL',
          train_number: '12488',
          train_name: `${orig} - ${dest} Superfast`,
          intermediate_station: 'Central Junction (JNC)',
          leg1_berth: 'Coach B2, Berth 24 (Lower)',
          leg2_berth: 'Coach B3, Berth 11 (Side Lower)',
          estimated_fare_inr: 1680.0,
          operational_warning: 'Requires physical coach change at Central Junction during the scheduled 10-minute halt.',
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

function getFallbackJourneys(origin: string, destination: string, date: string): NormalizedOffer[] {
  const orig = origin.toUpperCase();
  const dest = destination.toUpperCase();
  return [
    {
      provider_id: 'irctc_cris',
      mode: 'RAIL',
      operator_name: 'Indian Railways',
      service_number: `12488 (${orig} - ${dest} Superfast Express)`,
      origin_code: orig,
      dest_code: dest,
      departure_at: `${date || '2026-12-16'}T16:15:00Z`,
      arrival_at: `${date || '2026-12-16'}T06:45:00Z`,
      duration_minutes: 870,
      price: 1680,
      currency: 'INR',
      transfers: 0,
      status: 'AVAILABLE',
      available_seats: 14,
      booking_url: `https://www.irctc.co.in/nget/train-search?train=12488`,
      retrieved_at: new Date().toISOString(),
      score: 91,
      days_of_run: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
      pantry_available: true,
      punctuality_rating: 93,
      departure_platform: 'Platform 1',
      arrival_platform: 'Platform 2',
      stops: [
        { station_code: orig, station_name: orig, scheduled_arrive: '', scheduled_depart: '16:15', distance_km: 0, halt_minutes: 0, platform_number: 1 },
        { station_code: 'JNC', station_name: 'Intermediate Junction', scheduled_arrive: '22:30', scheduled_depart: '22:40', distance_km: 450, halt_minutes: 10, platform_number: 2 },
        { station_code: dest, station_name: dest, scheduled_arrive: '06:45', scheduled_depart: '', distance_km: 950, halt_minutes: 0, platform_number: 2 },
      ],
    },
    {
      provider_id: 'irctc_cris',
      mode: 'RAIL',
      operator_name: 'Indian Railways',
      service_number: `15018 (${orig} - ${dest} Mail/Express)`,
      origin_code: orig,
      dest_code: dest,
      departure_at: `${date || '2026-12-16'}T20:30:00Z`,
      arrival_at: `${date || '2026-12-16'}T11:20:00Z`,
      duration_minutes: 890,
      price: 1390,
      currency: 'INR',
      transfers: 0,
      status: 'WAITLIST',
      available_seats: 0,
      booking_url: `https://www.irctc.co.in/nget/train-search?train=15018`,
      retrieved_at: new Date().toISOString(),
      score: 65,
      days_of_run: ['MON', 'WED', 'FRI', 'SUN'],
      pantry_available: false,
      punctuality_rating: 82,
      departure_platform: 'Platform 2',
      arrival_platform: 'Platform 4',
      stops: [
        { station_code: orig, station_name: orig, scheduled_arrive: '', scheduled_depart: '20:30', distance_km: 0, halt_minutes: 0, platform_number: 2 },
        { station_code: 'JNC', station_name: 'Intermediate Junction', scheduled_arrive: '03:45', scheduled_depart: '03:55', distance_km: 450, halt_minutes: 10, platform_number: 3 },
        { station_code: dest, station_name: dest, scheduled_arrive: '11:20', scheduled_depart: '', distance_km: 950, halt_minutes: 0, platform_number: 4 },
      ],
    },
    {
      provider_id: 'duffel_flight',
      mode: 'FLIGHT',
      operator_name: 'IndiGo (6E-2054 Nonstop)',
      service_number: '6E-2054',
      origin_code: orig,
      dest_code: dest,
      departure_at: `${date || '2026-12-16'}T09:30:00Z`,
      arrival_at: `${date || '2026-12-16'}T11:45:00Z`,
      duration_minutes: 135,
      price: 4890,
      currency: 'INR',
      transfers: 0,
      status: 'AVAILABLE',
      available_seats: 8,
      booking_url: 'https://www.goindigo.in',
      retrieved_at: new Date().toISOString(),
      score: 87,
    },
  ];
}

export async function initiateBooking(payload: {
  user_id?: string;
  train_number: string;
  train_name: string;
  origin_code: string;
  dest_code: string;
  departure_at: string;
  arrival_at: string;
  class_code: string;
  total_fare: number;
  irctc_username: string;
  passengers: Passenger[];
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to initiate booking');
  }
  return res.json();
}

export async function confirmBooking(payload: {
  booking_id: string;
  irctc_username: string;
  irctc_password: string;
  auth_method: string;
}): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'IRCTC Authentication failed');
  }
  return res.json();
}

export async function fetchUserTrips(userId = 'usr_demo'): Promise<Booking[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/me/trips?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch trips');
    const data = await res.json();
    return data.trips || [];
  } catch (err) {
    console.warn('Backend trips fetch failed, returning client store:', err);
    return [
      {
        id: 'bk_sample_01',
        user_id: 'usr_demo',
        pnr: '284-9182741',
        train_number: '12951',
        train_name: 'Tejas Rajdhani Express',
        origin_code: 'MMCT',
        dest_code: 'NDLS',
        departure_at: new Date(Date.now() + 86400000 * 2).toISOString(),
        arrival_at: new Date(Date.now() + 86400000 * 2 + 56000000).toISOString(),
        class_code: '3A',
        status: 'CONFIRMED',
        total_fare: 2850.0,
        irctc_username: 'aditya_srivastava',
        coach_number: 'B2',
        berth_number: 24,
        berth_type: 'LOWER',
        passengers: [
          { full_name: 'Aditya Srivastava', age: 26, gender: 'MALE', berth_preference: 'LOWER' },
        ],
        qr_code_data: 'IRCTC:PNR:284-9182741:TRN:12951:COACH:B2:BERTH:24',
        created_at: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchBookingByPNR(pnr: string): Promise<Booking> {
  const res = await fetch(`${API_BASE_URL}/bookings/pnr?pnr=${encodeURIComponent(pnr.trim())}`);
  if (!res.ok) {
    throw new Error('PNR lookup failed');
  }
  return res.json();
}
