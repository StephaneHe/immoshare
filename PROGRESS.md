# ImmoShare — Project Progress

> Last updated: 2026-02-22

## Summary

| Metric | Value |
|--------|-------|
| Modules completed | 6 / 9 |
| Total tests | 290 |
| Total endpoints | 52 |
| Total DB tables | 13 |
| Git commits | 9 |

## Module Status

| # | Module | Status | Unit Tests | Integration Tests | Total Tests | Endpoints | Tables | Commit |
|---|--------|--------|-----------|-------------------|-------------|-----------|--------|--------|
| M1 | Auth | ✅ Done | 42 | 34 | 76 | 8 | 4 | `f4056b1` |
| M2 | Agencies | ✅ Done | 34 | 18 | 52 | 14 | 2 | `5f9df19` |
| M3 | Properties | ✅ Done | 22 | 16 | 38 | 8 | 2 | `8543fca` |
| M4 | Pages | ✅ Done | 29 | 12 | 41 | 6 | 1 | `e7b9e9a` |
| M5 | Sharing | ✅ Done | 30 | 20 | 50 | 11 | 3 | `fba6f06` |
| M6 | Tracking | ✅ Done | 22 | 11 | 33 | 5 | 1 | `1315b60` |
| M7 | Partners | ⬜ Not started | — | — | — | — | — | — |
| M8 | Notifications | ⬜ Not started | — | — | — | — | — | — |
| M9 | Branding | ⬜ Not started | — | — | — | — | — | — |

## Dependency Graph (Build Order)

```
M1 Auth ✅
├── M2 Agencies ✅
│   └── M3 Properties ✅
│       └── M4 Pages ✅
│           └── M5 Sharing ✅
│               └── M6 Tracking ✅
│                   └── M8 Notifications ← NEXT
├── M9 Branding
└── M7 Partners (depends on M1, M2, M3)
```

## Detailed Timeline

### 2026-02-22 — Day 1

#### M1 — Auth (commit `f4056b1`)
User registration, login, JWT (access + refresh tokens), email verification, password reset, password change.
76 tests. Tables: users, refresh_tokens, email_verifications, password_resets.

#### Infrastructure (commit `37036a6`)
Docker Compose for PostgreSQL 16 alpine.

#### M2 — Agencies (commit `5f9df19`)
Agency CRUD, agent management, invitation system.
52 tests. Tables: agencies, agency_invites.

#### Documentation (commit `bf7dba7`)
README + PROGRESS.md.

#### M3 — Properties (commit `8543fca`)
Property CRUD, status workflow, pagination + 10 filters, duplication, agency listing.
38 tests. Tables: properties, media + 3 enums.

#### M4 — Pages (commit `e7b9e9a`)
Page generator — SSR HTML engine for shareable property pages with 9 section types, media/field selection, RTL/LTR, branding, preview watermark.
41 tests. Table: pages.

#### M5 — Sharing (commit `fba6f06`)

**Scope:** Multichannel sharing (WhatsApp, Email, SMS) with contacts management, unique share links per contact×channel, batch sharing, public page rendering, link deactivation/expiration.

**Files created (10 source + 4 test):**
- `share.types.ts` — 15+ types: ContactRecord, ShareLinkRecord, ShareBatchRecord, ShareRequest/Result, IContactRepository, IShareLinkRepository, IShareBatchRepository, IChannelAdapter, IShareDataProvider
- `share.errors.ts` — 9 error classes (contact + sharelink)
- `share.schemas.ts` — Zod: createContact, updateContact, shareRequest, contactListQuery, shareLinkListQuery, param schemas
- `contact.service.ts` — CRUD with ownership, phone-or-email validation
- `share.service.ts` — batch share (token generation, adapter dispatch, warnings), resolveToken, deactivate, handleDeliveryWebhook
- `contact.controller.ts` — 5 handlers
- `share.controller.ts` — 5 handlers + public page route
- `share.routes.ts` — 11 routes (5 contact + 5 share + 1 public)
- `share.repository.ts` — PrismaContactRepository, PrismaShareLinkRepository, PrismaShareBatchRepository, PrismaShareDataProvider
- `index.ts` — barrel export

**Tests (50):**
- `tests/unit/share/contact.service.test.ts` — 12 unit tests
- `tests/unit/share/share.service.test.ts` — 18 unit tests (batch share, token resolve, deactivate, webhook, adapter integration)
- `tests/integration/share/contact.routes.test.ts` — 9 integration tests
- `tests/integration/share/share.routes.test.ts` — 11 integration tests (share batch, link list, deactivate, public page HTML rendering, expired/deactivated links)

**Prisma migration `add_sharing`:** contacts, share_links, share_batches tables + ShareChannel enum.

**Key features:**
- Contact CRUD with ownership + phone-or-email constraint
- Batch sharing: one request → multiple contacts × channels
- Unique token per ShareLink (UUID v4)
- Configurable expiration (1-365 days, default 30)
- Channel adapters: pluggable interface (WhatsApp, Email, SMS stubs)
- Warnings for skipped channels (missing phone/email)
- Public page route `GET /api/v1/v/:token` — renders HTML via PageService+PageRenderer
- Link deactivation (HTTP 410)
- Link expiration (HTTP 410)
- Delivery webhook handler (deliveredAt update)
- Paginated share link history with filters (page, property, contact, channel, status)

---

## Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | ✅ Running | Docker, port 5432, `immoshare` DB |
| Prisma | ✅ Synced | 5 migrations applied, client v5.22 |
| Git | ✅ Pushed | 9 commits on `main` |
| CI/CD | ⬜ | Not configured yet |
| Deployment | ⬜ | Planned: OVH VPS |

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| `tsc --noEmit` fails with rootDir errors | Low | Monorepo path resolution. `tsx` runtime unaffected. |
| Email sending not implemented | Medium | Channel adapter stubs ready. |
| WhatsApp Cloud API not connected | Medium | Channel adapter stubs ready. |
| Twilio SMS not connected | Medium | Channel adapter stubs ready. |
| Media upload not yet implemented | Medium | Tables ready, S3 integration deferred. |
| Delivery webhooks endpoints not created | Low | Handler logic ready, webhook routes deferred. |

## What's Next

**M6 — Tracking** — Track page views, clicks, and analytics:
- TrackEvent model
- Page opened/viewed events
- Analytics endpoints
- Integration with ShareLink (view counting)

#### M6 — Tracking & Analytics (commit `1315b60`)

**Scope:** Track page views, time spent, section engagement. Analytics per property and global dashboard.

**Files created (9 source + 3 test):**
- `tracking.types.ts` — TrackEventRecord, PropertyAnalytics, Dashboard, ITrackEventRepository, ITrackingDataProvider
- `tracking.errors.ts` — 6 error classes (link not found, expired, deactivated, rate limited, property not found, not owner)
- `tracking.schemas.ts` — Zod: trackEvent, heartbeat, linkIdParam, propertyIdParam, dashboardQuery
- `tracking.service.ts` — Event recording with IP anonymization, dedup within 5min, rate limiting (60/min/token), firstVisit detection
- `analytics.service.ts` — PropertyAnalytics (open rate, by channel, by contact, top sections, avg time) + Dashboard (recent activity, top properties)
- `tracking.controller.ts` — 5 handlers (2 public + 3 authenticated)
- `tracking.routes.ts` — 5 routes
- `tracking.repository.ts` — PrismaTrackEventRepository + PrismaTrackingDataProvider
- `index.ts` — barrel export

**Tests (33):**
- `tests/unit/tracking/tracking.service.test.ts` — 12 unit tests (event recording, dedup, rate limit, IP anonymization, link validation)
- `tests/unit/tracking/analytics.service.test.ts` — 10 unit tests (open rate, by channel, by contact, top sections, avg time, dashboard)
- `tests/integration/tracking/tracking.routes.test.ts` — 11 integration tests (track event, heartbeat, analytics, dashboard, auth)

**Prisma migration `add_tracking`:** track_events table + TrackEventType enum.

**Key features:**
- IP anonymization (mask last octet for GDPR compliance)
- Deduplication of page_opened within 5 minutes (same IP + token)
- In-memory rate limiting (60 events/min per token)
- firstVisit flag on page_opened events
- Property analytics: open rate, time spent, channel breakdown, contact breakdown, section ranking
- Global dashboard: period stats, recent activity (last 20), top properties by opens
- Public collection routes (no auth, token-based)
- Authenticated consultation routes (ownership enforced)
