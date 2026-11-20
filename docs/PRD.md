# Tiktiki: Product Requirements Document (PRD) v1.0

## 1. Product Summary
- **Product Name**: Tiktiki (JourneyOS)
- **Tagline**: Find smarter routes. Make better travel decisions.
- **Stage**: Phase 1 MVP (Travel Intelligence & Sniping Wedge)
- **Target Budget**: ₹50,000 hard spending cap
- **Team Size**: 3 Engineers (Lead, Backend/Data, Full-Stack/Product)
- **Beachhead Market**: India Intercity Corridors (Rail + Bus + Air) $\to$ Global Multi-modal

---

## 2. The Problem Statement
Travel planning in India and globally is deeply fragmented:
1. Direct train seats frequently display `REGRET` or high waitlists (`WL 80+`) despite available quota upstream or downstream.
2. Passengers manually search multiple apps (IRCTC, redBus, MakeMyTrip, Skyscanner) to assemble a viable journey.
3. Incumbent booking platforms spam users with advertisements, zero-convenience fee upsells, and slow 3–7 day refund reconciliations.
4. Passengers lack real-time visibility into **why** their ticket is waitlisted, when charting happens, and how to safely execute connecting journeys.

---

## 3. Product Scope & Functional Requirements

### In-Scope Functional Requirements
- **FR-01 Unified Multi-Modal Search**: Instant search across Trains, Buses, and Flights with unified comparison cards.
- **FR-02 Tiktiki Journey Optimizer (3 Unified Strategies)**:
  - **Strategy 1 (Upstream Booking with Boarding Modification)**: Automatically discovers upstream stations with open General Quotas and calculates extra fare deltas under budget caps (< ₹350).
  - **Strategy 2 (Delay-Aware Connecting Route)**: Recommends 2-leg transfer journeys with scheduled buffers (90–360 min) evaluated against P95 incoming train delays + 20 min platform transfer, ensuring effective slack $\ge 45$ min.
  - **Strategy 3 (Same-Train Split Booking - Experimental)**: Detects consecutive confirmed berths on the identical train with luggage transfer warnings.
- **FR-03 Mathematical Journey Scoring**: Objective ranking based on $S = 0.40C + 0.30T + 0.20R + 0.10K$, returning scores from 0 to 100.
- **FR-04 Waitlist Intelligence**: Displays real-time quota status, waitlist numbers, and charting preparation timelines.
- **FR-05 Availability Sniping & Multi-Channel Alerts**:
  - Background worker polling on adaptive intervals ($>24$h $\to$ 30m, $4$–$24$h $\to$ 5m, $\le 4$h $\to$ 60s).
  - Grouped tuple deduplication (`SERVICE:DATE:FROM:TO:CLASS`) to prevent API waste.
  - State transition detection (`WAITLIST` $\to$ `AVAILABLE`) with 15-minute debounce guard.
  - Multi-channel delivery: WhatsApp with 1-click booking deep-links, Web Push, and Email.
- **FR-06 Booking Redirection**: Deep-links to authorized booking partners (IRCTC, redBus, Airlines) with clean parameter passing.

### Non-Goals (Explicitly Deferred)
- Direct payment processing / wallet balance handling on Day 1 (avoids RBI escrow compliance & refunds lockup).
- Direct IRCTC ticket issuance on Day 1 (avoids ₹1 Cr bank guarantees and Section 143 licensing overhead).
- Native iOS/Android app store packages (Next.js responsive PWA provides full offline ticket passbook capability).
- Scraping unauthorized endpoints (only permitted APIs, open timetables, and partner feeds used).

---

## 4. Roadmap & Milestone Status

| Phase | Milestone | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & Unified Search | Multi-modal search API, scoring engine, responsive Next.js frontend, Docker setup | **Completed** |
| **Phase 2** | Tiktiki Journey Optimizer | 3 unified strategies (upstream, connecting route, split segment), optimizer API, UI cards | **Completed** |
| **Phase 3** | Asynchronous Sniping Worker | Adaptive polling daemon, state transition diffing, debounce guard, multi-channel dispatcher | **Completed** |
| **Phase 4** | Open Timetable Data Ingestion | Ingest all-India station and stop sequence data (~8,500 stations, ~12,000 trains) into PostGIS | **Up Next** |
| **Phase 5** | Coach & Berth Physical Layout | Interactive SVG coach seat visualizer (LHB/ICF coaches, side lower, coupe/cabin) | **Planned** |

---

## 5. Success Metrics (First 90 Days)
- **WSTD (North Star)**: $\ge 500$ Weekly Successful Travel Decisions.
- **Registered Accounts**: $\ge 500$ users.
- **Active Watches**: $\ge 100$ concurrent seat availability alerts.
- **Notification Delivery**: $\ge 98\%$ delivered within 60s of inventory change.
- **Search-to-Partner Click-through Rate**: $\ge 5\%$.
