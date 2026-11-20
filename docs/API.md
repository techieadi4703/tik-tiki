# Tiktiki REST API Specification v1.0

**Base URL**: `https://api.tiktiki.com/v1`  
**Authentication**: `Authorization: Bearer <jwt_token>` (Optional for unauthenticated searches)  
**Content-Type**: `application/json`

---

## 1. Journey Search
### `POST /v1/journeys/search`
Searches multi-modal travel options (Rail, Bus, Flight) and calculates the Journey Utility Score.

#### Request Body
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
  "search_id": "srch_01JDJ5K4",
  "results_count": 3,
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

## 2. Segment Hack Discovery
### `POST /v1/journeys/hacks`
Identifies upstream origin bookings with boarding station modifications to bypass waitlists.

#### Request Body
```json
{
  "train_number": "11059",
  "origin_station": "ET",
  "dest_station": "PRYJ",
  "travel_date": "2026-12-24",
  "class_code": "3A"
}
```

#### Response (200 OK)
```json
{
  "direct_status": "WAITLIST 78",
  "hacks_found": [
    {
      "type": "UPSTREAM_BOOKING_WITH_BOARDING_CHANGE",
      "train_number": "11059 (Godan Express)",
      "book_from": "BSL (Bhusaval)",
      "board_at": "ET (Itarsi)",
      "book_to": "PRYJ (Prayagraj)",
      "class_code": "3A",
      "status": "AVAILABLE",
      "available_berths": 14,
      "extra_fare_inr": 195.00,
      "explanation": "Seats are available from Bhusaval under General Quota. Book from Bhusaval and set Boarding Point to Itarsi. Total extra cost is ₹195 for a confirmed berth."
    }
  ]
}
```

---

## 3. Availability Watch / Sniping Alert
### `POST /v1/alerts`
Registers a background watcher for availability state changes.

#### Request Body
```json
{
  "service_number": "11059",
  "origin": "ET",
  "destination": "PRYJ",
  "departure_date": "2026-12-24",
  "class_code": "3A",
  "desired_state": "AVAILABLE",
  "notification_channel": "WHATSAPP"
}
```

#### Response (201 Created)
```json
{
  "alert_id": "alt_982341",
  "status": "ACTIVE",
  "poll_interval_seconds": 300,
  "next_check_at": "2026-11-20T07:15:00Z"
}
```
