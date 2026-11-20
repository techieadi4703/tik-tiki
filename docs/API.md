# Tiktiki REST API Specification v1.0

**Base URL**: `https://api.tiktiki.com/v1`  
**Authentication**: `Authorization: Bearer <jwt_token>` (Optional for unauthenticated public searches)  
**Content-Type**: `application/json`

---

## 1. Journey Search

### `POST /v1/journeys/search`
Searches multi-modal travel options (Rail, Bus, Flight) across origins and destinations, calculating the Journey Utility Score ($S = 0.40C + 0.30T + 0.20R + 0.10K$).

#### Query Parameters / Request Body
Also supports `GET /v1/journeys/search?origin=BOM&destination=JAI`

```json
{
  "origin": "BOM",
  "destination": "JAI",
  "departure_date": "2026-12-24",
  "passengers": 1,
  "transport_types": ["rail", "bus", "flight"],
  "currency": "INR",
  "sort_by": "score"
}
```

#### Response (200 OK)
```json
{
  "search_id": "srch_1763630248000",
  "origin": "BOM",
  "destination": "JAI",
  "currency": "INR",
  "count": 4,
  "results": [
    {
      "journey_id": "jrn_12955_DIRECT",
      "transport_mode": "rail",
      "operator": "Indian Railways",
      "service_number": "12955 (Mumbai Central - Jaipur Superfast)",
      "origin": "MMCT",
      "destination": "JP",
      "departure_at": "2026-12-24T19:05:00Z",
      "arrival_at": "2026-12-25T12:45:00Z",
      "duration_minutes": 1060,
      "price": 1640.00,
      "currency": "INR",
      "transfers": 0,
      "status": "AVAILABLE",
      "available_seats": 18,
      "journey_score": 88,
      "booking_url": "https://www.irctc.co.in/nget/booking?train=12955",
      "source_provider": "irctc_cris",
      "retrieved_at": "2026-11-20T07:10:00Z"
    }
  ]
}
```

---

## 2. Journey Optimizer (3 Unified Strategies)

### `GET /v1/journeys/optimize`
Evaluates alternative boarding points, safe delay-aware train interchanges, and consecutive split-ticket segments when direct trains are waitlisted or unavailable.

#### Query Parameters
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `origin` | string | Yes | `ET` | Origin station code (e.g. `ET`) |
| `destination` | string | Yes | `PRYJ` | Destination station code (e.g. `PRYJ`) |
| `date` | string | No | Current Date | Travel date in `YYYY-MM-DD` format |
| `class` | string | No | `3A` | Class code (`1A`, `2A`, `3A`, `SL`, etc.) |

#### Response (200 OK)
```json
{
  "requested_origin": "ET",
  "requested_destination": "PRYJ",
  "travel_date": "2026-12-24",
  "class_code": "3A",
  "direct_train_status": "WAITLIST 42",
  "upstream_options": [
    {
      "type": "UPSTREAM_BOOKING",
      "train_number": "11059",
      "train_name": "Godan Express",
      "book_from_station": "BSL (Bhusaval Junction)",
      "board_at_station": "ET (Itarsi Junction)",
      "destination_station": "PRYJ (Prayagraj Junction)",
      "class_code": "3A",
      "status": "AVAILABLE 14",
      "estimated_extra_fare_inr": 195.00,
      "rule_notice": "Boarding point must be changed online at least 4 hours before chart preparation per Railway Board rules.",
      "explanation": "Seats are available from Bhusaval under General Quota. Book from Bhusaval, change boarding point to Itarsi. Extra estimated fare: ₹195."
    }
  ],
  "connecting_options": [
    {
      "type": "CONNECTING_INTERCHANGE",
      "interchange_station": "Itarsi Junction (ET)",
      "leg1_train_number": "12155",
      "leg1_train_name": "Shaan-e-Bhopal Express",
      "leg1_departure_at": "2026-12-24T08:15:00Z",
      "leg1_arrival_at": "2026-12-24T18:00:00Z",
      "leg1_avg_delay_minutes": 45,
      "leg2_train_number": "12854",
      "leg2_train_name": "Amarkantak Express",
      "leg2_departure_at": "2026-12-24T21:00:00Z",
      "leg2_arrival_at": "2026-12-25T03:30:00Z",
      "scheduled_buffer_minutes": 180,
      "effective_slack_minutes": 115,
      "risk_grade": "SAFE",
      "transfer_platformAdvice": "Transfer between Platform 1 and 2 at Itarsi Junction. Escalators and porter services are available.",
      "estimated_total_fare_inr": 1680.00,
      "total_duration_minutes": 1155
    }
  ],
  "split_segment_options": [
    {
      "type": "SPLIT_SEGMENT_EXPERIMENTAL",
      "train_number": "11059",
      "train_name": "Godan Express",
      "intermediate_station": "Jabalpur (JBP)",
      "leg1_berth": "Coach B2, Berth 24 (Lower)",
      "leg2_berth": "Coach B3, Berth 11 (Side Lower)",
      "estimated_fare_inr": 1420.00,
      "operational_warning": "Requires physical coach change at Jabalpur. Ensure all luggage is moved during the 15-minute halt."
    }
  ]
}
```

---

## 3. Segment Hacks (Legacy Alias)

### `POST /v1/journeys/hacks`
Alias returning the unified optimization strategies for backwards compatibility.

---

## 4. Location Search & Autocomplete

### `GET /v1/locations/search?q={query}`
Searches railway stations, airports, and major transit hubs with fuzzy prefix matching.

#### Response (200 OK)
```json
{
  "query": "mumbai",
  "results": [
    {
      "code": "BOM",
      "name": "Chhatrapati Shivaji Maharaj Terminus",
      "city": "Mumbai",
      "country": "IN",
      "type": "railway_station",
      "is_major_hub": true
    },
    {
      "code": "MMCT",
      "name": "Mumbai Central",
      "city": "Mumbai",
      "country": "IN",
      "type": "railway_station",
      "is_major_hub": true
    }
  ]
}
```

---

## 5. Availability Watch / Sniping Alerts

### `POST /v1/alerts`
Registers a background watcher for availability state changes. Supports WhatsApp, Web Push, and Email notifications.

#### Request Body
```json
{
  "service_number": "11059",
  "origin": "ET",
  "destination": "PRYJ",
  "departure_date": "2026-12-24",
  "class_code": "3A",
  "desired_state": "AVAILABLE",
  "notification_channel": "WHATSAPP",
  "phone_number": "+919876543210",
  "email": "traveler@example.com"
}
```

#### Response (201 Created)
```json
{
  "alert_id": "alt_1763630248000",
  "status": "ACTIVE",
  "poll_interval_seconds": 300,
  "next_check_at": "2026-11-20T07:15:00Z"
}
```

### `GET /v1/alerts`
Lists all registered watch alerts and their current operational status.

---

## 6. In-App Booking & User Trips (Sub-PSP Integration)

Direct in-app booking architecture modeled on B2C Sub-PSP integrations (MakeMyTrip, redBus, ConfirmTkt) eliminating external redirect issues and Akamai WAF Edge errors.

### `POST /v1/bookings/initiate`
Initiates a new railway booking session and records passenger manifest.

#### Request Body
```json
{
  "train_number": "12951",
  "train_name": "Tejas Rajdhani Express",
  "origin_code": "MMCT",
  "dest_code": "NDLS",
  "departure_at": "2026-12-16T17:00:00Z",
  "arrival_at": "2026-12-17T08:32:00Z",
  "class_code": "3A",
  "total_fare": 2450.00,
  "irctc_username": "traveler47",
  "passengers": [
    {
      "full_name": "Aditya Srivastava",
      "age": 26,
      "gender": "MALE",
      "berth_preference": "LOWER"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "id": "bkg_1763630248000_12951",
  "user_id": "usr_default",
  "pnr": "PENDING",
  "train_number": "12951",
  "train_name": "Tejas Rajdhani Express",
  "origin_code": "MMCT",
  "dest_code": "NDLS",
  "class_code": "3A",
  "status": "PENDING_AUTH",
  "total_fare": 2450.00,
  "irctc_username": "traveler47",
  "passengers": [
    {
      "full_name": "Aditya Srivastava",
      "age": 26,
      "gender": "MALE",
      "berth_preference": "LOWER"
    }
  ],
  "created_at": "2026-11-20T14:30:00Z"
}
```

### `POST /v1/bookings/confirm`
Completes IRCTC sandboxed authentication / authorization and allocates official 10-digit PNR, coach number, and berth.

#### Request Body
```json
{
  "booking_id": "bkg_1763630248000_12951",
  "irctc_username": "traveler47",
  "irctc_password": "irctc_password_or_otp",
  "auth_method": "PASSWORD"
}
```

#### Response (200 OK)
```json
{
  "id": "bkg_1763630248000_12951",
  "user_id": "usr_default",
  "pnr": "8421904721",
  "train_number": "12951",
  "train_name": "Tejas Rajdhani Express",
  "origin_code": "MMCT",
  "dest_code": "NDLS",
  "class_code": "3A",
  "status": "CONFIRMED",
  "total_fare": 2450.00,
  "irctc_username": "traveler47",
  "coach_number": "B3",
  "berth_number": 28,
  "berth_type": "LOWER",
  "qr_code_data": "IRCTC-PNR:8421904721|TRN:12951|COACH:B3|BERTH:28|CLASS:3A|MMCT-NDLS",
  "passengers": [
    {
      "full_name": "Aditya Srivastava",
      "age": 26,
      "gender": "MALE",
      "berth_preference": "LOWER"
    }
  ],
  "created_at": "2026-11-20T14:30:00Z"
}
```

### `GET /v1/users/me/trips`
Retrieves all active and past bookings for the authenticated user to render in the `/trips` digital passbook.

### `GET /v1/bookings/pnr?pnr=8421904721`
Retrieves a specific booking by its 10-digit PNR.

---

## 7. System Health

### `GET /v1/health`
Checks API server liveliness and subsystem connectivity.

#### Response (200 OK)
```json
{
  "status": "OK",
  "service": "tik-tiki-api",
  "version": "1.0.0",
  "timestamp": "2026-11-20T14:30:00Z"
}
```
