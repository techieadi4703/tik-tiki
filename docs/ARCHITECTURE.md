# Tiktiki: Architecture & Technical Specification (HLD & LLD)

## 1. High-Level Architecture (Modular Monolith)

Tiktiki adopts an event-driven modular monolith architecture written in **Go (Gin/Fiber)** and **Next.js 15 (React/Tailwind/Shadcn)**, backed by **PostgreSQL 16** with **PostGIS** and **Redis 7**.

```
[ Client: Next.js PWA ]
          |
          | HTTPS / TLS 1.3
          v
[ Envoy / Gin Router (Rate Limiting, Auth, Routing) ]
          |
  +-------+-------------------------+------------------------+
  |                                 |                        |
  v                                 v                        v
[ Search & Graph Engine ]   [ Sniping Queue ]        [ Scoring Engine ]
  |                                 |                        |
  | Token-Bucket Polling            | Redis Pub/Sub          | S = 0.4C + 0.3T + 0.2R + 0.1K
  v                                 v                        v
[ Provider Adapters ]       [ Notification Worker ]  [ Canonical Store ]
  - Rail Adapter              - Gupshup (WhatsApp)     - PostgreSQL 16
  - Bus Adapter               - Resend (Email)         - PostGIS Spatial Index
  - Flight Adapter (Duffel)   - FCM (WebPush)          - Redis Cache (60s TTL)
```

---

## 2. Low-Level Algorithmic Engines

### Engine A: The Intermediate Segment Hack Algorithm
When an intermediate route $S_{\text{origin}} \to S_{\text{dest}}$ is waitlisted:
1. Traverse up to 3 major stations upstream ($S_{\text{upstream}}$) where origin boarding is permitted.
2. Check quota availability for $S_{\text{upstream}} \to S_{\text{dest}}$ with Boarding Point set to $S_{\text{origin}}$.
3. If confirmed seats exist and $\text{Fare}_{\text{diff}} \le \text{Threshold}$ (default ₹250), yield an **Upstream Boarding Hack**.
4. Check intermediate junction $S_{\text{junction}}$ where $S_{\text{origin}} \to S_{\text{junction}}$ and $S_{\text{junction}} \to S_{\text{dest}}$ have confirmed berths on the identical train (allowing internal berth swap).

### Engine B: Time-Expanded Connecting Route Pathfinder
1. Identifies 12 national interchange hubs (Vadodara, Itarsi, Bhopal, Kanpur, Pt. Deen Dayal Upadhyaya, Nagpur, etc.).
2. Finds feasible transfers where:
   $$\text{Buffer Time} \ge 90\text{ mins} \quad \text{and} \quad \text{Buffer Time} \le 360\text{ mins}$$
3. Computes connection risk using the incoming train's 90-day P95 arrival delay:
   $$\text{Slack} = \text{Buffer Time} - \text{P95 Delay}$$
   - $\text{Slack} \ge 60\text{ min} \implies \textbf{Safe (Risk } < 5\%)$
   - $30\text{ min} \le \text{Slack} < 60\text{ min} \implies \textbf{Moderate (Risk } 10\text{--}20\%)$
   - $\text{Slack} < 30\text{ min} \implies \textbf{High Risk (Discarded)}$

### Engine C: Adaptive Availability Poller
To prevent API cost blowouts and IP throttling:
- Group all user subscriptions by unique tuple `(train_no, date, source, dest, class)`.
- Enforce Redis token-bucket limits: maximum 1 external call per tuple every 60 seconds.
- Scale frequency by time-to-departure:
  - $t_{\text{dep}} \le 4\text{ hours} \implies \text{Every 60 seconds (Chart preparation window)}$
  - $4\text{ hours} < t_{\text{dep}} \le 24\text{ hours} \implies \text{Every 5 minutes}$
  - $t_{\text{dep}} > 24\text{ hours} \implies \text{Every 30 minutes}$

---

## 3. Data Retention & Compliance Rules
1. **Zero Password Storage**: Tiktiki never collects, transmits, or stores IRCTC passwords.
2. **Dynamic TTLs**: Flight quotes (Duffel) expire in 15 minutes. Train availability expires in 60 seconds. Never present stale cache as live data without a clear timestamp.
3. **DPDP & GDPR Compliance**: User search history can be anonymized or deleted with 1-click via `/v1/users/account`.
