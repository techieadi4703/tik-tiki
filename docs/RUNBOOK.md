# Tiktiki Operations Runbook v1.0

## 1. System Topology & Critical Dependencies

| Component | Responsibility | Failure Impact | Recovery Action |
| :--- | :--- | :--- | :--- |
| **API Server (`cmd/server`)** | Search, Journey Optimizer, Scorer, Alert Registration | Search degraded, UI offline | Restart via `make run` or container orchestrator |
| **Sniping Worker (`cmd/worker`)** | Adaptive polling, State diffing, Alert dispatching | Alerts paused, notifications delayed | Restart via `make run-worker`; check Redis queue |
| **PostgreSQL 16 + PostGIS** | User profiles, watches, stations, stop sequences | Search degraded, alerts paused | Supabase failover / restore from WAL-G snapshot |
| **Redis 7** | Search cache (60s), rate-limit tokens, job queue | Direct hits to external APIs | Restart container; fallback to bypass cache |
| **Transit Data Providers** | Live rail/bus/flight schedules | Stale availability alerts | Fallback to cached timetable; flag as "Estimated" |
| **Multi-Channel Dispatcher** | WhatsApp (Gupshup), Web Push, Email (Resend) | Alert delivery failures | Automatic failover across configured channels |

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: Background Worker Daemon Operations
The worker daemon monitors train inventory changes and fires notifications:
- **Build Worker**: `make build-worker` (outputs binary to `bin/worker`)
- **Run Worker**: `make run-worker`
- **Graceful Shutdown**: The worker listens for `SIGINT` and `SIGTERM` signals. Upon receipt, active poll loops complete their in-flight API requests before exiting cleanly.
- **Adaptive Cadence Verification**:
  - Departures $> 24$h: 30-minute intervals
  - Departures $4$–$24$h: 5-minute intervals
  - Departures $\le 4$h: 60-second intervals
  - Departures charted or in past: 0s (dormant)

### SOP-02: External Provider Outage Handling (IRCTC / CRIS / Airline APIs)
When external transit APIs return HTTP 429 (Rate Limited) or 503 (Downtime):
1. **Circuit Breaker Trip**: The Go adapter automatically trips open after 5 consecutive failures within a 30-second sliding window.
2. **Graceful UI Degrade**: The API serves cached historical availability with clear UI badge: `"Estimated Status (Provider Offline - Checked 4h ago)"`.
3. **Alert Queue Suspension**: Background polling intervals automatically back off exponentially ($2^n \times \text{base}$) to avoid API bans.

### SOP-03: Secret Rotation Protocol
- If a provider API key or DB credential is compromised:
  1. Revoke the token on the provider dashboard.
  2. Generate a new key and update GitHub repository secrets.
  3. Deploy updated environment variable to the production server via `flyctl secrets set` or Vercel dashboard.
  4. Perform test query to verify provider connectivity via `curl -H "Authorization: Bearer <NEW_KEY>"`.

### SOP-04: Alert Queue Backlog & Dispatcher Health
If active watches exceed polling throughput:
1. **Verify Tuple Aggregation**: Ensure watches are properly grouped by `SERVICE:DATE:FROM:TO:CLASS` so redundant calls are zero.
2. **Channel Rate Limits**:
   - **WhatsApp (Gupshup)**: Verify throughput within approved TPS (transactions per second). Check template approval status.
   - **Web Push**: Check FCM/VAPID key validity.
   - **Email (Resend)**: Verify bounce rates $< 2\%$ in Resend dashboard.
3. **Debounce Verification**: Ensure the 15-minute suppression window per alert is functioning to prevent duplicate alerts.
