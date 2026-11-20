export type Mode = 'RAIL' | 'BUS' | 'FLIGHT' | 'MULTIMODAL';

export interface LocationItem {
  code: string;
  name: string;
  city: string;
  country: string;
  type: string;
  is_major_hub: boolean;
}

export interface NormalizedOffer {
  provider_id: string;
  mode: Mode;
  operator_name: string;
  service_number: string;
  origin_code: string;
  dest_code: string;
  departure_at: string;
  arrival_at: string;
  duration_minutes: number;
  price: number;
  currency: string;
  transfers: number;
  status: 'AVAILABLE' | 'RAC' | 'WAITLIST' | 'SOLD_OUT';
  available_seats?: number;
  booking_url: string;
  retrieved_at: string;
  score: number;
}

export interface SegmentHack {
  type: string;
  train_number: string;
  book_from: string;
  board_at: string;
  book_to: string;
  class_code: string;
  status: string;
  available_berths: number;
  extra_fare_inr: number;
  explanation: string;
}

export interface AlertSubscription {
  service_number: string;
  origin: string;
  destination: string;
  departure_date: string;
  class_code: string;
  notification_channel: 'WHATSAPP' | 'WEB_PUSH' | 'EMAIL';
  phone_number?: string;
  email?: string;
}
