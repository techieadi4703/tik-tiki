# Changelog

All notable changes to the **Tiktiki (JourneyOS)** platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-11-23

### Added
- **Live Indian Railways Trains Between Stations (`QueryExternalTrainsBetweenStations`)**:
  - Wired RapidAPI IRCTC endpoint `GET /api/v3/trainBetweenStations` returning full live rosters of trains between any two Indian stations for any travel date (e.g. 69 authentic trains between New Delhi and Kanpur Central; 8–16 authentic trains between Mumbai and New Delhi).
  - Added smart station code resolver `NormalizeStationCode` automatically mapping city and metropolitan names (e.g. `DELHI` / `DEL` $\rightarrow$ `NDLS`, `MUMBAI` / `BOM` $\rightarrow$ `MMCT`, `BANGALORE` $\rightarrow$ `SBC`, `KOLKATA` $\rightarrow$ `HWH`).
  - Added in-memory and persistent embedded live route caching to prevent redundant API queries and seamlessly serve complete rosters if the external provider's monthly rate quota is reached.
- **Dynamic Telescopic CRIS Distance Fares**:
  - Replaced flat static fares (e.g. fixed ₹1,580) with authentic Indian Railways telescopic distance-based fare calculations (`CalculateIndianRailwaysFare`) across all classes (`1A`, `2A`, `3A`, `3E`, `CC`, `EC`, `SL`).
  - Fares now realistically reflect true track mileage and train category (e.g. NDLS $\rightarrow$ CNB 441 km is ₹580 for `CC` and ₹1,275 for `EC`; MMCT $\rightarrow$ NDLS 1,384 km is ₹1,615 for `3A`, ₹2,250 for `2A`, and ₹3,700 for `1A`).
- **Flexible JSON Type Parsing**:
  - Added `FlexibleDistance` and `FlexibleBool` to parse floating-point distances (e.g. `423.17`), string numbers, or mixed booleans returned by external PRS APIs without unmarshal errors.

---

## [1.2.0] - 2026-11-21

### Added
- **Live External Railway API Gateway (`LiveClient`)**:
  - Integrated RapidAPI IRCTC client ([live_client.go](services/api/internal/providers/railway/live_client.go)) querying real-time CRIS PRS and NTES servers.
  - Automatic zero-dependency `.env` configuration loader on server boot.
  - Dual-mode architecture: seamless automatic fallback to high-fidelity national timetable store if external API key is absent or rate-limited.
- **Dynamic Real-Time Coach Schematic Visualizer ([CoachSeatMapModal.tsx](apps/web/src/components/CoachSeatMapModal.tsx))**:
  - Real-time search bar accepting **any 5-digit Train Number** or **10-digit PNR**.
  - Authentic **Vande Bharat & Shatabdi Chair Car layout**: 78 seats in 3+2 configuration (Window, Middle, Aisle) for CC, and 52 seats in 2+2 configuration for EC. Zero sleeper berths.
  - Authentic **Rajdhani LHB layout**: AC 3 Tier (`3A`), AC 2 Tier (`2A`), First AC (`1A`). Excludes Sleeper (`SL`) class.
  - Automatic PNR passenger seat jumping with pulsing emerald highlight.
- **Electronic Reservation Slip (ERS) Printable Modal ([ElectronicReservationSlipModal.tsx](apps/web/src/components/ElectronicReservationSlipModal.tsx))**:
  - Official CRIS/IRCTC formatted e-ticket slip with printable A4 layout, dynamic QR barcode, passenger manifest table, and statutory fare breakdown.
- **Live PNR Status Tracking & Coach Mapping ([PNRStatusModal.tsx](apps/web/src/components/PNRStatusModal.tsx))**:
  - Full CRIS PRS manifest inquiry with charting status, confirmation probability meter, and "View on Coach Map" button.

### Fixed
- **Railway Archetype Class Enforcement**:
  - Eliminated bogus Sleeper (`SL`) class from Rajdhani searches; enforced authentic class options for Rajdhani (`3A`, `2A`, `1A`) and Vande Bharat (`CC`, `EC`).
  - Corrected train running duration calculations for DDU $\rightarrow$ NDLS corridor (fixed from erroneous 33h to accurate 9h 10m).
- **Strict 5-Digit Train Number Validation**:
  - Rejected bogus numeric inputs (e.g., `432112433`) with clear validation prompts and HTTP 404 responses; eliminated dummy synthetic `ORIG -> DEST` routes.
- **Vande Bharat Coach Allocation**:
  - Fixed PNR coach assignment for Vande Bharat trains to allocate `Coach C2, Seat 23 (Window)` instead of `Coach B2, Berth 23 (Lower)`.
- **Booking Request JSON Unmarshaling**:
  - Resolved `Invalid request body` error on passenger age input by adding custom flexible `UnmarshalJSON` in Go and casting inputs to numbers on the frontend.
  - Auto-reset senior citizen priority checkbox when age is below 60.
- **UI Collision Fixes**:
  - Separated `FROM` / `TO` prefix labels with vertical border dividers to eliminate text collision (`FROMOrigin`).
  - Vertically centered the `Direct` badge on the duration timeline with increased padding to eliminate overlap with the travel duration text (`17h 30m`).

---

## [1.1.0] - 2026-11-20

### Added
- **In-App Railway Booking Gateway & Ticket Passbook**:
  - Implemented `/v1/bookings/initiate` and `/v1/bookings/confirm` with multi-passenger manifest state.
  - Created [PassengerBookingModal.tsx](apps/web/src/components/PassengerBookingModal.tsx) with live quota selector (`GN`, `SS`, `LD`, `TQ`).
  - Created [TicketPassbook.tsx](apps/web/src/components/TicketPassbook.tsx) for tracking upcoming and past confirmed e-tickets.
- **Decoupled National Timetable Store ([store.go](services/api/internal/timetable/store.go))**:
  - Externalized national timetable to [national_trains.json](services/api/data/national_trains.json) indexing 16 national trains across 100+ stations.
- **Multi-Attribute Filter & Sort Engine ([FilterSortBar.tsx](apps/web/src/components/FilterSortBar.tsx))**:
  - Departure time window filtering (`EARLY`, `MORNING`, `AFTERNOON`, `NIGHT`).
  - Service type filtering (`ALL`, `RAJDHANI`, `SUPERFAST`, `EXPRESS`).
  - Multi-criteria sorting (Journey Utility Score, Fastest Duration, Earliest Departure, Lowest Fare).
- **Session Authentication & Identity Management**:
  - JWT token and stateful session management ([auth.go](services/api/internal/auth/auth.go)) with pre-filled IRCTC User IDs.

---

## [1.0.0] - 2026-11-19

### Added
- **Multi-Modal Journey Search & Discovery**:
  - Unified multi-modal comparison across Indian Railways, Intercity Buses, and Domestic Flights.
  - Mathematical Journey Utility Scoring Engine ($S = 0.40C + 0.30T + 0.20R + 0.10K$).
- **Tiktiki Journey Optimizer (3 Unified Strategies)**:
  - Upstream booking with downstream boarding point modification.
  - Delay-aware connecting train routes with incoming P95 delay buffer.
  - Experimental same-train split ticket segments.
- **Sniping Background Worker Daemon**:
  - Asynchronous background monitoring daemon (`cmd/worker`) with adaptive interval polling and multi-channel alerts (WhatsApp, Email, WebPush).
