-- Tiktiki Database Schema v1.0
-- Dialect: PostgreSQL 16+ with UUID and PostGIS extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20) UNIQUE,
    password_hash TEXT,
    full_name VARCHAR(150),
    preferred_currency CHAR(3) DEFAULT 'INR',
    preferred_locale VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(60) DEFAULT 'Asia/Kolkata',
    tier VARCHAR(20) DEFAULT 'FREE', -- FREE, PRO, FREQUENT_TRAVELER
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Locations (Hierarchical: City, Airport, Rail Station, Bus Terminal)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    normalized_name VARCHAR(200) NOT NULL,
    country_code CHAR(2) NOT NULL, -- ISO-3166-1 alpha-2 (e.g. IN, US, DE)
    location_type VARCHAR(30) NOT NULL, -- 'city', 'airport', 'railway_station', 'bus_terminal'
    iata_code VARCHAR(3),               -- Nullable for non-airports
    rail_code VARCHAR(10),              -- e.g. 'NDLS', 'BCT'
    coordinates GEOMETRY(Point, 4326),  -- Spatial coordinates for distance/geo-routing
    is_major_hub BOOLEAN DEFAULT FALSE,
    parent_city_id UUID REFERENCES locations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_locations_lookup ON locations(normalized_name varchar_pattern_ops);
CREATE INDEX idx_locations_rail_code ON locations(rail_code) WHERE rail_code IS NOT NULL;
CREATE INDEX idx_locations_iata_code ON locations(iata_code) WHERE iata_code IS NOT NULL;
CREATE INDEX idx_locations_spatial ON locations USING GIST(coordinates);

-- 3. Providers (Isolated Adapter Registry)
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'duffel', 'amadeus', 'irctc_cris', 'redbus_partner'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,    -- 'flight', 'rail', 'bus', 'map'
    base_url TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    rate_limit_per_minute INT DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Canonical Journeys (Search Output Cache)
CREATE TABLE journeys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_location_id UUID NOT NULL REFERENCES locations(id),
    destination_location_id UUID NOT NULL REFERENCES locations(id),
    departure_at TIMESTAMPTZ NOT NULL,
    arrival_at TIMESTAMPTZ NOT NULL,
    transport_mode VARCHAR(30) NOT NULL, -- 'rail', 'bus', 'flight', 'multimodal'
    total_duration_minutes INT NOT NULL,
    total_price NUMERIC(12,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    transfer_count INT NOT NULL DEFAULT 0,
    source_provider_id UUID REFERENCES providers(id),
    booking_url TEXT,
    external_reference TEXT,
    availability_status VARCHAR(30) NOT NULL, -- 'available', 'rac', 'waitlist', 'stale'
    journey_score INT, -- Computed 0-100 score
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journeys_search ON journeys(origin_location_id, destination_location_id, departure_at);

-- 5. Journey Legs (For Connecting & Multi-modal Journeys)
CREATE TABLE journey_legs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
    sequence_number INT NOT NULL,
    origin_location_id UUID NOT NULL REFERENCES locations(id),
    destination_location_id UUID NOT NULL REFERENCES locations(id),
    departure_at TIMESTAMPTZ NOT NULL,
    arrival_at TIMESTAMPTZ NOT NULL,
    transport_mode VARCHAR(30) NOT NULL,
    operator_name VARCHAR(100),
    service_number VARCHAR(50), -- Flight number / Train number / Bus code
    class_or_cabin VARCHAR(20),  -- '3A', '2A', 'Economy', 'Sleeper'
    leg_duration_minutes INT NOT NULL,
    transfer_buffer_minutes INT DEFAULT 0, -- Wait time before next leg
    miss_risk_percentage NUMERIC(5,2) DEFAULT 0.00
);

-- 6. User Monitoring Alerts (The Sniping Queue)
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    origin_location_id UUID NOT NULL REFERENCES locations(id),
    destination_location_id UUID NOT NULL REFERENCES locations(id),
    departure_date DATE NOT NULL,
    transport_modes JSONB NOT NULL DEFAULT '["rail"]',
    class_preferences JSONB, -- e.g. ["3A", "2A", "CC"]
    max_price NUMERIC(12,2),
    currency CHAR(3) DEFAULT 'INR',
    desired_availability VARCHAR(30) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RAC_OR_BETTER'
    check_interval_minutes INT DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_polling ON alerts(next_check_at) WHERE is_active = TRUE;

-- 7. Time-Series Availability Snapshots (For Movement & ML Intelligence)
CREATE TABLE availability_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_number VARCHAR(50) NOT NULL, -- Train No (e.g. '12952')
    departure_date DATE NOT NULL,
    source_code VARCHAR(10) NOT NULL,
    dest_code VARCHAR(10) NOT NULL,
    class_code VARCHAR(10) NOT NULL,
    quota VARCHAR(10) DEFAULT 'GN',
    status_raw VARCHAR(50) NOT NULL,      -- e.g. 'AVAILABLE-12', 'GNWL 45 / WL 12'
    booking_position INT,
    current_position INT,
    is_charted BOOLEAN DEFAULT FALSE,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avail_timeseries ON availability_snapshots(service_number, departure_date, class_code, observed_at DESC);

-- 8. Notifications (Delivery & Idempotency)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL, -- 'WHATSAPP', 'EMAIL', 'PUSH'
    payload JSONB NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- 'DELIVERED', 'FAILED'
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Affiliate Conversions & Commercial Attribution
CREATE TABLE affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    journey_id UUID REFERENCES journeys(id),
    provider_id UUID REFERENCES providers(id),
    sub_tracking_id VARCHAR(100) UNIQUE NOT NULL,
    transaction_amount NUMERIC(12,2),
    commission_earned NUMERIC(10,2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'CLICKED', -- 'CLICKED', 'CONFIRMED', 'SETTLED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
