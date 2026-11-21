# Tiktiki (tik-tiki)

> **Find smarter routes. Make better travel decisions.**  
> An intelligent multi-modal journey comparison, segment hack discovery, and seat availability sniping platform.

---

## Repository Map

```
tik-tiki/
├── docs/
│   ├── PRD.md              # Unified Product Requirements Document
│   ├── ARCHITECTURE.md     # High-Level & Low-Level Design (HLD/LLD)
│   ├── API.md              # REST API Contracts & Endpoint Schemas
│   ├── RUNBOOK.md          # Operations, Daemon Management & Incident SOPs
│   └── INVESTOR_MEMO.md    # Commercial Positioning & Unit Economics
├── CHANGELOG.md            # Versioned Platform Releases & Release Notes
├── infrastructure/
│   └── migrations/
│       └── 001_initial_schema.sql  # PostgreSQL 16 + PostGIS schema
├── services/
│   └── api/
│       ├── cmd/
│       │   ├── server/     # Go HTTP API server (/v1 endpoints)
│       │   └── worker/     # Sniping Background Worker daemon
│       ├── internal/
│       │   ├── providers/  # Multi-modal provider abstraction & mock adapter
│       │   ├── routes/     # Real corridor timetable graph (corridors.go) & 3 optimization strategies
│       │   ├── scoring/    # Journey Utility Scoring Engine (0.4C + 0.3T + 0.2R + 0.1K)
│       │   └── worker/     # Adaptive poller, state diffing & multi-channel dispatcher
│       ├── Makefile        # Build, test, and run automation
│       └── go.mod
└── apps/
    └── web/                # Next.js 15 PWA Client (React 19, Tailwind, Shadcn)
        └── src/
            ├── components/
            │   ├── SearchHeader.tsx       # Origin/Destination swap, date & modes
            │   ├── StationAutocomplete.tsx# Smart fuzzy station search with code & name
            │   ├── OptimizerSection.tsx   # 3 Journey Optimization Strategy cards
            │   ├── JourneyCard.tsx        # Utility score badge & results
            │   └── SeatAlertModal.tsx     # 1-click WhatsApp seat alert opt-in
            ├── lib/
            │   ├── api.ts                 # API client & fallback handlers
            │   ├── stations.mjs           # Major Indian railway stations catalog
            │   └── scoring.mjs            # Client-side utility scorer
            └── app/                       # Next.js App Router
```

---

## Quickstart & Commands

```bash
# Run all Go and Node.js test suites
make test

# Build both API server and Sniping worker binaries
make build
make build-worker

# Run API server locally (port 8080)
make run

# Run Sniping worker daemon locally
make run-worker

# Start PostgreSQL and Redis containers
make docker-up
```

---

## The Founding Team RACI (3-Person Founding Team)

| Role | Primary Ownership | Stack / Focus Area |
| :--- | :--- | :--- |
| **P1: Founder & Architect** | Product Strategy, Scorer, Partner Feeds | Architecture, Legal/Compliance, Go Scoring Engine |
| **P2: Backend Engineer** | Go APIs, PostgreSQL, Redis BullMQ | Route Graph Pathfinder, Polling Workers, Adapters |
| **P3: Full-Stack / Product** | Next.js 15, UI/UX, Analytics, PWA | Sub-100ms Search UI, Mobile Dashboard, PostHog |

---

## Sprint Milestones

- [x] **Phase 1: Foundation & Unified Search**
  - [x] Agree on PRD scope and non-goals (Zero direct booking on Day 1; focus on Intelligence).
  - [x] Execute `001_initial_schema.sql` on PostgreSQL with PostGIS.
  - [x] Implement Mock Provider Adapter in Go and run scoring validation tests.
  - [x] Implement Next.js 15 Search interface with scoring badges.
- [x] **Phase 2: Tiktiki Journey Optimizer (3 Unified Strategies)**
  - [x] Strategy 1: Upstream Booking with Boarding Modification & telescopic fare estimation.
  - [x] Strategy 2: Delay-Aware Connecting Route with incoming train delay buffer.
  - [x] Strategy 3: Experimental Same-Train Split Segment booking with coach-change warnings.
  - [x] Implement `GET /v1/journeys/optimize` and `OptimizerSection.tsx` UI cards.
- [x] **Phase 3: Asynchronous Sniping Background Worker**
  - [x] Adaptive interval scheduling ($>24$h $\to$ 30m, $4$–$24$h $\to$ 5m, $\le 4$h $\to$ 60s).
  - [x] Tuple grouping (`SERVICE:DATE:FROM:TO:CLASS`) for zero-waste API calls.
  - [x] State transition detection (`WAITLIST` $\to$ `AVAILABLE`) with 15-minute debounce guard.
  - [x] Multi-channel dispatcher (WhatsApp with pre-filled deep-links, Web Push, Email).
  - [x] Frictionless 1-click WhatsApp Seat Alert opt-in modal (`SeatAlertModal.tsx`).
- [x] **Phase 4: Decoupled National Timetable & Corridor Engine**
  - [x] Ingest authentic national timetable data ([national_trains.json](services/api/data/national_trains.json)) with stops, sequence, and platform details.
  - [x] Thread-safe in-memory indexer with metropolitan alias normalization ([store.go](services/api/internal/timetable/store.go)).
- [x] **Phase 5: Real-Time Dynamic Coach & Berth Layout Visualizer**
  - [x] Interactive coach visualizer ([CoachSeatMapModal.tsx](apps/web/src/components/CoachSeatMapModal.tsx)) with real-time Train Number / PNR lookup.
  - [x] Authentic **Vande Bharat & Shatabdi Chair Car layout** (78 seats 3+2 layout, 52 seats 2+2 Executive, zero sleeper berths).
  - [x] Authentic **Rajdhani LHB layout** (3A, 2A, 1A, no Sleeper class).
  - [x] Authentic **Superfast/Express layout** (SL, 3A, 2A, 1A) and Garib Rath (3E).
  - [x] Automatic PNR passenger seat jumping with animated pulsing indicator.
- [x] **Phase 6: Live Railway API Gateway & In-App Booking Engine**
  - [x] Dual-layer live client ([live_client.go](services/api/internal/providers/railway/live_client.go)) integrating RapidAPI IRCTC with offline timetable fallback.
  - [x] Auto-loading `.env` configuration on server startup.
  - [x] Live PNR Status tracking with CRIS PRS manifest and coach layout highlight ([PNRStatusModal.tsx](apps/web/src/components/PNRStatusModal.tsx)).
  - [x] Live NTES GPS running status tracker with strict 5-digit validation ([LiveStatusModal.tsx](apps/web/src/components/LiveStatusModal.tsx)).
  - [x] In-app railway ticket reservation flow ([PassengerBookingModal.tsx](apps/web/src/components/PassengerBookingModal.tsx)) with quota selection.
  - [x] Printable Electronic Reservation Slip (ERS) modal ([ElectronicReservationSlipModal.tsx](apps/web/src/components/ElectronicReservationSlipModal.tsx)).
  - [x] Interactive passenger ticket passbook ([TicketPassbook.tsx](apps/web/src/components/TicketPassbook.tsx)).
