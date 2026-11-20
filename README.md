# Tiktiki (tik-tiki)

> **Find smarter routes. Make better travel decisions.**  
> An intelligent multi-modal journey comparison, segment hack discovery, and availability monitoring platform.

---

## Repository Map

```
tik-tiki/
├── docs/
│   ├── PRD.md              # Unified Product Requirements Document
│   ├── ARCHITECTURE.md     # High-Level & Low-Level Design (HLD/LLD)
│   └── API.md              # REST API Contracts & Endpoint Schemas
├── infrastructure/
│   └── migrations/
│       └── 001_initial_schema.sql  # PostgreSQL + PostGIS schema
├── services/
│   └── api/
│       ├── cmd/server/     # Go HTTP server
│       └── internal/
│           ├── providers/  # Polymorphic provider abstraction interface
│           ├── routes/     # Graph connecting route & segment hack engine
│           └── scoring/    # Journey Utility Scoring Engine (0.4C + 0.3T + 0.2R + 0.1K)
└── apps/
    └── web/                # Next.js 15 PWA Client (Tailwind + Shadcn)
```

---

## The Founding Team RACI (3-Person Founding Team)

| Role | Primary Ownership | Stack / Focus Area |
| :--- | :--- | :--- |
| **P1: Founder & Architect** | Product Strategy, Scorer, Partner Feeds | Architecture, Legal/Compliance, Go Scoring Engine |
| **P2: Backend Engineer** | Go APIs, PostgreSQL, Redis BullMQ | Route Graph Pathfinder, Polling Workers, Adapters |
| **P3: Full-Stack / Product** | Next.js 15, UI/UX, Analytics, PWA | Sub-100ms Search UI, Mobile Dashboard, PostHog |

---

## 7-Day Sprint 0 Kickoff

- [x] **Day 1**: Agree on PRD scope and non-goals (Zero direct booking on Day 1; focus on Intelligence).
- [ ] **Day 2**: Customer interviews with 10 frequent intercity rail/bus travelers.
- [ ] **Day 3**: Finalize Figma wireframes for Search, Segment Hack Cards, and WhatsApp Alert Opt-in.
- [ ] **Day 4**: Execute `001_initial_schema.sql` on Supabase / Neon PostgreSQL.
- [ ] **Day 5**: Implement Mock Provider Adapter in Go and run scoring validation tests.
- [ ] **Day 6**: Wire Next.js frontend autocomplete with client-side station Trie.
- [ ] **Day 7**: Demo **Tiktiki Alpha 0.1** (Search Mumbai $\to$ Jaipur, render direct vs connecting options with journey scores).
