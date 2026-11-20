# Tiktiki: Architecture & Technical Specification (HLD & LLD)

## 1. High-Level Architecture (Modular Monolith & Daemon)

Tiktiki adopts an event-driven modular architecture written in **Go 1.24** and **Next.js 15 (React 19 / Tailwind / Lucide)**, backed by **PostgreSQL 16** with **PostGIS** and **Redis 7**.

The system is separated into two operational binaries:
1. **HTTP API Server (`cmd/server`)**: Serves search, scoring, journey optimization, location autocomplete, and alert registration endpoints with sub-50ms latency.
2. **Sniping Background Worker Daemon (`cmd/worker`)**: Asynchronously monitors train availability state transitions using adaptive polling intervals and dispatches multi-channel seat alerts.

```
[ Client: Next.js 15 PWA ]
          |
          | HTTPS / REST
          v
[ HTTP API Server: cmd/server (Go 1.24) ]
   ├── /v1/locations/search
   ├── /v1/journeys/search  ──> [ Scoring Engine: 0.40C + 0.30T + 0.20R + 0.10K ]
   ├── /v1/journeys/optimize ──> [ Journey Optimizer (3 Strategies) ]
   ├── /v1/alerts           ──> [ Watch Store (PostgreSQL / Redis) ]
   └── /v1/bookings/*       ──> [ Booking Manager: In-App IRCTC Auth & Passbook ]
                                            |
                                            v
[ Sniping Background Worker: cmd/worker (Go 1.24 Daemon) ]
   ├── Tuple Aggregator: SERVICE:DATE:FROM:TO:CLASS
   ├── Adaptive Poller (60s chart prep / 5m moderate / 30m standard)
   ├── State Transition Detector (WAITLIST -> AVAILABLE)
   ├── Debounce Guard (15m suppression window)
   └── Multi-Channel Dispatcher
         ├── WhatsApp Dispatcher (Gupshup / Deep-link)
         ├── Web Push Dispatcher (VAPID / WebPush)
         └── Email Dispatcher (Resend / SMTP)
```

---

## 2. Low-Level Algorithmic Engines

### 2.1 The Tiktiki Journey Optimizer (`internal/routes/optimizer.go`)
When a direct train is waitlisted (`WL`) or sold out, the optimizer evaluates three complementary strategies:

#### Strategy 1: Upstream Booking with Boarding Modification
- **Concept**: In Indian Railways, major originating stations often have larger General Quotas (`GN`) than intermediate halts.
- **Algorithm**:
  1. Inspect the ordered station sequence for the requested train route ($S_1, S_2, \dots, S_n$).
  2. Traverse up to `maxHopLookback` (default: 2) upstream stations prior to the requested origin.
  3. Validate quota availability from $S_{\text{upstream}} \to S_{\text{dest}}$.
  4. Estimate telescopic fare delta based on extra distance traveled:
     $$\Delta \text{Fare} = \Delta \text{Distance} \times \text{BaseRate} + \text{GST} + \text{Surcharge}$$
  5. Check budget guard ($\Delta \text{Fare} \le \text{BudgetLimit}$, default: ₹350).
  6. Return actionable booking guidance: *"Book from Bhusaval (BSL), select Boarding Point as Itarsi (ET)"*.
  7. Enforce Railway Board compliance notice: Boarding point must be updated online before charting cut-off.

#### Strategy 2: Delay-Aware Connecting Train
- **Concept**: When no direct train has confirmed berths, connect via a major interchange hub with an intelligent buffer.
- **Algorithm**:
  1. Calculate scheduled buffer between Leg 1 Arrival ($T_{1,\text{arr}}$) and Leg 2 Departure ($T_{2,\text{dep}}$):
     $$\text{Buffer} = T_{2,\text{dep}} - T_{1,\text{arr}}$$
  2. Reject connections where $\text{Buffer} < 90\text{ min}$ (too risky) or $\text{Buffer} > 360\text{ min}$ (unreasonable delay).
  3. Factor in incoming train's P95 average historical delay ($D_{\text{avg}}$) plus station platform transfer time ($P_{\text{transfer}} = 20\text{ min}$):
     $$\text{Effective Slack} = \text{Buffer} - (D_{\text{avg}} + P_{\text{transfer}})$$
  4. Require $\text{Effective Slack} \ge 45\text{ min}$ for safety approval.
  5. Assign risk grade:
     - $\text{Effective Slack} \ge 90\text{ min} \implies \textbf{SAFE}$
     - $45\text{ min} \le \text{Effective Slack} < 90\text{ min} \implies \textbf{MODERATE}$
     - $\text{Effective Slack} < 45\text{ min} \implies \textbf{HIGH RISK (Rejected)}$

#### Strategy 3: Same-Train Consecutive Split Segment (Experimental)
- **Concept**: A single direct train may have confirmed berths on consecutive portions of the journey (e.g., Leg 1: Itarsi $\to$ Jabalpur, Leg 2: Jabalpur $\to$ Prayagraj).
- **Algorithm**:
  1. Verify both legs are on the exact same train number and date.
  2. Enforce strict station sequence: $\text{Origin} < \text{Intermediate} < \text{Destination}$.
  3. Emit coach-swap warning highlighting physical transfer between berths during the intermediate halt.

---

### 2.2 Mathematical Journey Scoring Engine (`internal/scoring/engine.go`)
Every candidate journey is ranked using an objective multi-attribute utility function ($0 \le S \le 100$):
$$S = 0.40C + 0.30T + 0.20R + 0.10K$$
- **$C$ (Cost Utility)**: Relative price index against median corridor fare.
- **$T$ (Time Efficiency)**: Duration efficiency vs fastest feasible mode.
- **$R$ (Reliability & Seat Availability)**:
  - Confirmed available berth: 100
  - RAC (Reservation Against Cancellation): 65
  - Low Waitlist ($WL \le 20$): 40
  - High Waitlist ($WL > 20$): 15
- **$K$ (Comfort & Convenience)**: Penalizes transfers and overnight seating without berths.

---

### 2.3 Sniping Background Worker Daemon (`internal/worker/`)
The worker daemon operates independently to catch cancellations and quota releases:

1. **Adaptive Interval Scheduling**:
   - Time-to-departure $t_{\text{dep}} \le 4\text{ hours}$ (Chart Preparation Window): **Every 60 seconds**
   - $4\text{ hours} < t_{\text{dep}} \le 24\text{ hours}$: **Every 5 minutes**
   - $t_{\text{dep}} > 24\text{ hours}$: **Every 30 minutes**
   - Chart prepared or train departed: Polling suspended ($0\text{s}$)
2. **Tuple Aggregation & Zero-Waste Polling**:
   - Thousands of user alerts are grouped into unique query tuples: `SERVICE:DATE:FROM:TO:CLASS`.
   - Makes exactly 1 upstream API query per unique tuple, then fans out notifications to all subscribed users.
3. **State Transition Diffing**:
   - Detects transitions: `WAITLIST` / `REGRET` $\to$ `AVAILABLE` / `CURR_AVBL`.
4. **Debounce Guard**:
   - 15-minute suppression window per alert to prevent spamming users during rapid berth movements.
5. **Multi-Channel Dispatcher**:
   - Formats pre-filled booking deep-links (`https://tiktiki.com/b/{train}?date=...&from=...&to=...&ref=alert`).
   - Dispatches across WhatsApp, Web Push, and Email drivers.

---

## 3. Data Retention & Compliance Rules

1. **Zero Credential Storage**: Tiktiki never collects, transmits, or stores IRCTC passwords or payment cards.
2. **Dynamic TTLs**: Flight quotes expire in 15 minutes. Train availability expires in 60 seconds. Stale data is never served without an `"Estimated"` badge.
3. **DPDP & GDPR Compliance**: User contact details (phones, emails) are stored strictly for alert delivery and can be purged via 1-click unsubscribe.
