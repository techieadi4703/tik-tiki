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

## 3. Product Scope & Non-Goals

### In-Scope (Phase 1 MVP)
- **FR-01 Unified Multi-Modal Search**: Instant search across Trains, Buses, and Flights.
- **FR-02 Upstream & Segment Hack Discovery**: Automatically discover hidden intermediate quotas (e.g., booking from Bhusaval with Boarding at Itarsi to reach Prayagraj).
- **FR-03 Risk-Scored Connecting Journeys**: 2-leg transfer suggestions evaluated against P95 historical junction delays.
- **FR-04 Waitlist Intelligence**: Expose movement velocity, total quota pool, HO/VIP release windows, and probabilistic confirmation ranges.
- **FR-05 Availability Sniping & WhatsApp Alerts**: Background polling worker notifying users via WhatsApp/WebPush when bookable seats open.
- **FR-06 Mathematical Journey Scoring**: Objective ranking based on $S = 0.40C + 0.30T + 0.20R + 0.10K$.
- **FR-07 Booking Redirection**: Deep-links to authorized booking partners (IRCTC, redBus, Airlines) with affiliate attribution.

### Non-Goals (Explicitly Deferred)
- Direct payment processing / wallet balance handling on Day 1 (avoids RBI escrow compliance & refunds lockup).
- Direct IRCTC ticket issuance on Day 1 (avoids ₹1 Cr bank guarantees and Section 143 licensing overhead).
- Native iOS/Android app store packages (Next.js responsive PWA provides full offline ticket passbook capability).
- Scraping unauthorized endpoints (only permitted APIs, open timetables, and partner feeds used).

---

## 4. User Personas & Beachhead
1. **The Frequent Intercity Commuter**: Travels weekly between tier-1/tier-2 hubs (e.g., Mumbai–Pune, Delhi–Kanpur). Needs sub-minute availability alerts.
2. **The Budget Student / Family**: Travelling during festival rush. Direct trains are full; needs segment hacks and connecting transfers with safe buffers.
3. **The Business Professional**: Evaluates trade-offs between flight vs 1st AC/Tejas Rajdhani door-to-door time and cost.

---

## 5. Success Metrics (First 90 Days)
- **WSTD (North Star)**: $\ge 500$ Weekly Successful Travel Decisions.
- **Registered Accounts**: $\ge 500$ users.
- **Active Watches**: $\ge 100$ concurrent seat availability alerts.
- **Notification Delivery**: $\ge 98\%$ delivered within 60s of inventory change.
- **Search-to-Partner Click-through Rate**: $\ge 5\%$.
