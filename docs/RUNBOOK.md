# Tiktiki Operations Runbook v1.0

## 1. System Topology & Critical Dependencies

| Component | Responsibility | Failure Impact | Recovery Action |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | User profiles, watches, audit ledgers | Search degraded, alerts paused | Supabase failover / restore from WAL-G snapshot |
| **Redis 7** | Search cache (60s), rate-limit tokens, job queue | Direct hits to external APIs | Restart container; fallback to bypass cache |
| **Transit Data Providers** | Live rail/bus/flight schedules | Stale availability alerts | Fallback to cached timetable; flag as "Estimated" |
| **Gupshup / WhatsApp API** | Instant sniping alert delivery | Delayed user notification | Fallback to WebPush (FCM) & Email (Resend) |

---

## 2. Standard Operating Procedures (SOPs)

### SOP-01: External Provider Outage Handling (IRCTC / CRIS / Airline APIs)
When external transit APIs return HTTP 429 (Rate Limited) or 503 (Downtime):
1. **Circuit Breaker Trip**: The Go adapter automatically trips open after 5 consecutive failures within a 30-second sliding window.
2. **Graceful UI Degrade**: The API serves cached historical availability with clear UI badge: `"Estimated Status (Provider Offline - Checked 4h ago)"`.
3. **Alert Queue Suspension**: Background polling intervals automatically back off exponentially ($2^n \times \text{base}$) to avoid API bans.

### SOP-02: Secret Rotation Protocol
- If a provider API key or DB credential is compromised:
  1. Revoke the token on the provider dashboard.
  2. Generate a new key and update GitHub repository secrets.
  3. Deploy updated environment variable to the production server via `flyctl secrets set` or Vercel dashboard.
  4. Perform test query to verify provider connectivity via `curl -H "Authorization: Bearer <NEW_KEY>"`.

### SOP-03: WhatsApp Sniping Alert Queue Backlog
If the alert queue depth in Redis exceeds 5,000 items:
1. Check `gupshup_error_rate` metrics in PostHog.
2. Scale BullMQ worker processes horizontally by deploying another worker container.
3. Deduplicate alert jobs by `(train_no, date, class)` to avoid redundant outgoing calls.
