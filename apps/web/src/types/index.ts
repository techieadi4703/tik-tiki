export type Mode = 'RAIL' | 'BUS' | 'FLIGHT' | 'MULTIMODAL';

export interface LocationItem {
  code: string;
  name: string;
  city: string;
  country: string;
  type: string;
  is_major_hub: boolean;
}

export interface RouteStopInfo {
  station_code: string;
  station_name: string;
  scheduled_arrive: string;
  scheduled_depart: string;
  distance_km: number;
  halt_minutes: number;
  platform_number: number;
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
  days_of_run?: string[];
  pantry_available?: boolean;
  punctuality_rating?: number;
  departure_platform?: string;
  arrival_platform?: string;
  stops?: RouteStopInfo[];
}

export interface UpstreamBookingOption {
  type: string;
  train_number: string;
  train_name: string;
  book_from_station: string;
  board_at_station: string;
  destination_station: string;
  class_code: string;
  status: string;
  estimated_extra_fare_inr: number;
  rule_notice: string;
  explanation: string;
}

export interface DelayAwareConnectingOption {
  type: string;
  interchange_station: string;
  leg1_train_number: string;
  leg1_train_name: string;
  leg1_departure_at: string;
  leg1_arrival_at: string;
  leg1_avg_delay_minutes: number;
  leg2_train_number: string;
  leg2_train_name: string;
  leg2_departure_at: string;
  leg2_arrival_at: string;
  scheduled_buffer_minutes: number;
  effective_slack_minutes: number;
  risk_grade: 'SAFE' | 'MODERATE' | 'HIGH_RISK';
  transfer_platform_advice: string;
  estimated_total_fare_inr: number;
  total_duration_minutes: number;
}

export interface SplitSegmentOption {
  type: string;
  train_number: string;
  train_name: string;
  intermediate_station: string;
  leg1_berth: string;
  leg2_berth: string;
  estimated_fare_inr: number;
  operational_warning: string;
}

export interface JourneyOptimizationResult {
  requested_origin: string;
  requested_destination: string;
  travel_date: string;
  class_code: string;
  direct_train_status: string;
  upstream_options: UpstreamBookingOption[];
  connecting_options: DelayAwareConnectingOption[];
  split_segment_options: SplitSegmentOption[];
}

export interface Passenger {
  full_name: string;
  age: number;
  gender: string; // 'MALE' | 'FEMALE' | 'TRANSGENDER'
  berth_preference: string; // 'LOWER' | 'MIDDLE' | 'UPPER' | 'SIDE_LOWER' | 'SIDE_UPPER'
}

export interface SegmentHack {
  train_number: string;
  class_code: string;
  book_from: string;
  board_at: string;
  destination: string;
  extra_fare_inr: number;
  explanation: string;
}

export interface Booking {
  id: string;
  user_id: string;
  pnr: string;
  train_number: string;
  train_name: string;
  origin_code: string;
  dest_code: string;
  departure_at: string;
  arrival_at: string;
  class_code: string;
  status: 'PENDING_AUTH' | 'CONFIRMED' | 'CANCELLED';
  total_fare: number;
  irctc_username: string;
  coach_number?: string;
  berth_number?: number;
  berth_type?: string;
  passengers: Passenger[];
  qr_code_data?: string;
  created_at: string;
}
