# ImmoShare

Real estate property sharing platform for Israeli agents — create property pages, share via WhatsApp/Email/SMS, and track interactions.

## Quick Start

### Prerequisites

- **Node.js** 20+ (via nvm)
- **pnpm** 10+ (via corepack)
- **Docker** (for PostgreSQL)
- **Git** with SSH key configured for GitHub

### Setup

```bash
# Clone
git clone git@github.com:StephaneHe/immoshare.git
cd immoshare

# Node (via nvm)
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d

# Create .env from template
cp packages/api/.env.example packages/api/.env

# Run database migrations
pnpm --filter @immo-share/api exec prisma migrate dev

# Generate Prisma client
pnpm --filter @immo-share/api exec prisma generate
```

### Run

```bash
# Start the API server (dev mode)
cd packages/api && npx tsx watch src/server.ts

# Health check
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

### Test

```bash
# Run all tests
pnpm --filter @immo-share/api test

# Run with coverage
pnpm --filter @immo-share/api test -- --coverage

# Run a specific module's tests
pnpm --filter @immo-share/api test -- --testPathPattern share
```

## Project Structure

```
immo-share/
├── packages/
│   ├── api/                            # Backend API
│   │   ├── prisma/
│   │   │   ├── schema.prisma           # Database schema (all modules)
│   │   │   └── migrations/             # SQL migration history
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── middleware/
│   │   │   │   │   ├── authenticate.ts # JWT verification middleware
│   │   │   │   │   └── errorHandler.ts # Global error → HTTP response mapping
│   │   │   │   ├── types/
│   │   │   │   │   └── request.ts      # FastifyRequest augmentation (AuthUser)
│   │   │   │   ├── utils/
│   │   │   │   │   └── apiResponse.ts  # Standard { success, data/error } envelope
│   │   │   │   └── prisma.ts           # Shared Prisma client singleton
│   │   │   ├── modules/
│   │   │   │   ├── auth/               # M1 — Authentication
│   │   │   │   ├── agency/             # M2 — Agencies
│   │   │   │   ├── property/           # M3 — Properties
│   │   │   │   ├── page/               # M4 — Page Generator
│   │   │   │   └── share/              # M5 — Sharing & Contacts
│   │   │   │       ├── share.types.ts         # Domain types + repo/adapter interfaces
│   │   │   │       ├── share.errors.ts        # 9 error classes
│   │   │   │       ├── share.schemas.ts       # Zod schemas (contact, share, params)
│   │   │   │       ├── contact.service.ts     # Contact CRUD + ownership
│   │   │   │       ├── share.service.ts       # Batch share, token resolve, webhooks
│   │   │   │       ├── contact.controller.ts  # Contact HTTP handlers
│   │   │   │       ├── share.controller.ts    # Share + public page handlers
│   │   │   │       ├── share.routes.ts        # 11 routes (5 contact + 5 share + 1 public)
│   │   │   │       ├── share.repository.ts    # Prisma repos + data provider
│   │   │   │       └── index.ts
│   │   │   └── server.ts               # Entry point — wires all modules
│   │   └── tests/
│   │       ├── helpers/
│   │       │   ├── auth.ts             # JWT token generator for tests
│   │       │   └── testApp.ts          # Fastify test app builders
│   │       ├── unit/
│   │       │   ├── auth/
│   │       │   ├── agency/
│   │       │   ├── property/
│   │       │   ├── page/
│   │       │   └── share/
│   │       │       ├── contact.service.test.ts  # 12 unit tests
│   │       │       └── share.service.test.ts    # 18 unit tests
│   │       └── integration/
│   │           ├── auth/
│   │           ├── agency/
│   │           ├── property/
│   │           ├── page/
│   │           └── share/
│   │               ├── contact.routes.test.ts   # 9 integration tests
│   │               └── share.routes.test.ts     # 11 integration tests
│   └── shared/                          # Shared between packages
├── docker-compose.yml                   # PostgreSQL 16
├── PROGRESS.md                          # Project progress tracker
└── README.md
```

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20 |
| Framework | Fastify | 4 |
| Language | TypeScript | 5 |
| ORM | Prisma | 5.22 |
| Database | PostgreSQL | 16 (alpine) |
| Validation | Zod | 3 |
| Auth | JWT | jsonwebtoken |
| Password hashing | bcrypt | salt factor 12 |
| Testing | Jest | 29 |
| Monorepo | pnpm workspaces | 10 |
| Container | Docker Compose | — |

## Architecture

### Module Pattern

Every backend module follows the same layered structure:

```
routes.ts → controller.ts → service.ts → repository.ts → Prisma
```

| Layer | Responsibility |
|-------|---------------|
| **Routes** | URL → handler mapping, middleware attachment (auth, RBAC) |
| **Controller** | Zod validation, calls service, formats HTTP response |
| **Service** | Business logic, orchestration, error throwing |
| **Repository** | Database access via Prisma, implements an interface |
| **Types** | Domain types + repository interface (dependency inversion) |
| **Errors** | Typed error classes extending `AppError` |
| **Schemas** | Zod schemas for request validation |

### API Response Envelope

All endpoints return a consistent JSON envelope:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }
```

## Modules

| # | Module | Status | Tests | Endpoints |
|---|--------|--------|-------|-----------|
| M1 | Auth (users, JWT, register/login) | ✅ Done | 76 | 8 |
| M2 | Agencies (CRUD, invites, agents) | ✅ Done | 52 | 14 |
| M3 | Properties (CRUD, status, filters, duplicate) | ✅ Done | 38 | 8 |
| M4 | Page Generator (SSR pages, renderer, preview) | ✅ Done | 41 | 6 |
| M5 | Sharing (contacts, links, multichannel) | ✅ Done | 50 | 11 |
| M6 | Tracking (events, analytics, dashboard) | ✅ Done | 33 | 5 |
| M7 | Partners (invitations, approvals, reshare) | ✅ Done | 34 | 14 |
| M8 | Notifications (push, email, reminders) | ⬜ | — | — |
| M9 | Branding (logo, colors, agent identity) | ⬜ | — | — |

## API Endpoints

### Auth (M1) — 8 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login, get tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| POST | `/api/v1/auth/logout` | Yes | Invalidate refresh token |
| POST | `/api/v1/auth/verify-email` | No | Verify email address |
| POST | `/api/v1/auth/forgot-password` | No | Request password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password with token |
| POST | `/api/v1/auth/change-password` | Yes | Change password |

### Agencies (M2) — 14 endpoints

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/api/v1/agencies` | Yes | agency_admin | Create agency |
| GET | `/api/v1/agencies/:id` | Yes | member | Get agency details |
| PATCH | `/api/v1/agencies/:id` | Yes | agency_admin | Update agency |
| DELETE | `/api/v1/agencies/:id` | Yes | agency_admin | Soft-delete agency |
| GET | `/api/v1/agencies/:id/agents` | Yes | agency_admin | List agents |
| DELETE | `/api/v1/agencies/:id/agents/:userId` | Yes | agency_admin | Remove agent |
| POST | `/api/v1/agencies/:id/agents/leave` | Yes | agent | Leave agency |
| POST | `/api/v1/agencies/:id/transfer-admin` | Yes | agency_admin | Transfer admin role |
| POST | `/api/v1/agencies/:id/invites` | Yes | agency_admin | Invite agent by email |
| GET | `/api/v1/agencies/:id/invites` | Yes | agency_admin | List invitations |
| DELETE | `/api/v1/agencies/:id/invites/:inviteId` | Yes | agency_admin | Revoke invitation |
| POST | `/api/v1/agency-invites/:token/accept` | Yes | agent | Accept invitation |
| POST | `/api/v1/agency-invites/:token/decline` | Yes | agent | Decline invitation |
| GET | `/api/v1/users/me/agency-invites` | Yes | agent | My pending invitations |

### Properties (M3) — 8 endpoints

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/api/v1/properties` | Yes | agent | Create property |
| GET | `/api/v1/properties` | Yes | agent (own) | List properties (paginated + filters) |
| GET | `/api/v1/properties/:id` | Yes | owner | Get property details |
| PUT | `/api/v1/properties/:id` | Yes | owner | Update property |
| PATCH | `/api/v1/properties/:id/status` | Yes | owner | Change status (workflow) |
| DELETE | `/api/v1/properties/:id` | Yes | owner | Soft-delete |
| POST | `/api/v1/properties/:id/duplicate` | Yes | owner | Duplicate (reset to draft) |
| GET | `/api/v1/agencies/:id/properties` | Yes | agency_admin | Agency properties |

### Pages (M4) — 6 endpoints

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/api/v1/properties/:propertyId/pages` | Yes | owner | Create page from property |
| GET | `/api/v1/properties/:propertyId/pages` | Yes | owner | List pages for property |
| GET | `/api/v1/pages/:id` | Yes | owner | Get page details |
| PATCH | `/api/v1/pages/:id` | Yes | owner | Update selected elements |
| DELETE | `/api/v1/pages/:id` | Yes | owner | Delete page |
| GET | `/api/v1/pages/:id/preview` | Yes | owner | Preview (HTML with watermark) |

### Contacts (M5) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/contacts` | Yes | Create contact |
| GET | `/api/v1/contacts` | Yes | List my contacts (paginated) |
| GET | `/api/v1/contacts/:id` | Yes | Get contact details |
| PATCH | `/api/v1/contacts/:id` | Yes | Update contact |
| DELETE | `/api/v1/contacts/:id` | Yes | Delete contact |

### Sharing (M5) — 6 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/pages/:pageId/share` | Yes | Send to contacts (batch) |
| GET | `/api/v1/share-links` | Yes | List share link history |
| GET | `/api/v1/share-links/:id` | Yes | Get share link details |
| PATCH | `/api/v1/share-links/:id/deactivate` | Yes | Deactivate a share link |
| GET | `/api/v1/v/:token` | **No** | **Public** — view shared page |

#### Sharing Features

- **Multichannel** — WhatsApp, Email, SMS via pluggable channel adapters
- **Batch sharing** — send to multiple contacts × channels in one request
- **Unique tokens** — UUID v4 per contact × page × channel
- **Configurable expiration** — 1 to 365 days (default 30)
- **Smart warnings** — skips channels when contact lacks phone/email
- **Public page route** — renders HTML via token, no auth required
- **Link deactivation** — manually disable links (HTTP 410)
- **Link expiration** — expired links return HTTP 410
- **Delivery webhooks** — handler for Brevo/Twilio/WhatsApp callbacks
- **Paginated history** — filter by property, contact, channel, status

#### Page Features

- **Server-side HTML rendering** — self-contained responsive pages
- **Configurable sections** — info, photos, plans, video, 3D, description, location, features, contact
- **Media selection** — choose which photos/media appear on each page
- **Field selection** — choose which property fields to display
- **Multiple pages per property** — different selections for different audiences
- **RTL/LTR support** — Hebrew (RTL) and English/French (LTR)
- **Preview with watermark** — owner can preview before sharing
- **Branding integration** — agent name, agency, logo, colors (defaults until M9)

## Database

### Tables

| Table | Module | Description |
|-------|--------|-------------|
| `users` | M1 | User accounts with roles, agency link |
| `refresh_tokens` | M1 | JWT refresh tokens (revocable) |
| `email_verifications` | M1 | Email verification tokens |
| `password_resets` | M1 | Password reset tokens |
| `agencies` | M2 | Real estate agencies (soft-delete) |
| `agency_invites` | M2 | Agent invitation tokens |
| `properties` | M3 | Real estate listings (25+ fields, soft-delete) |
| `media` | M3 | Property media files |
| `pages` | M4 | Generated pages with selectedElements JSON |
| `contacts` | M5 | Agent contacts (phone, email, tags) |
| `share_links` | M5 | Unique share tokens per contact × page × channel |
| `share_batches` | M5 | Batch sharing records |
| `track_events` | M6 | Page view, section, time tracking events |
| `partner_invites` | M7 | Partner invitation codes and partnerships |
| `reshare_requests` | M7 | Property reshare approval workflow |

### Migrations

| Migration | Description |
|-----------|-------------|
| `20260222200120_init` | M1 tables |
| `20260222202931_add_agencies` | M2 tables + user.agencyId FK |
| `20260222210049_add_properties` | M3 tables + 3 enums |
| `20260222211906_add_pages` | M4 pages table |
| `20260222214341_add_sharing` | M5 contacts, share_links, share_batches + ShareChannel enum |
| `20260223060008_add_tracking` | M6 track_events + TrackEventType enum |
| `20260223171110_add_partners` | M7 partner_invites, reshare_requests + PartnerInviteStatus, ReshareRequestStatus enums |

### Status Workflow (Properties)

```
draft → active → under_offer → sold
                             → rented → active
                                      → archived
       → archived (from any) → draft
```

### Key Business Rules

**Properties (M3):** Property belongs to one owner (creating agent). Status follows strict workflow. Duplication resets to draft. Agency admin can view all agency properties.

**Pages (M4):** A page references a property and contains `selectedElements` JSON defining which sections, media, and fields to display. Multiple pages per property. Media IDs are validated against property media. Inactive pages return 410. Preview adds watermark.

**Sharing (M5):** Each ShareLink is unique per contact × page × channel. Token is UUID v4. Links expire after configurable days (default 30). Channel adapters are pluggable (stubs for WhatsApp/Brevo/Twilio). Contacts must have at least phone or email. Delivery webhooks update deliveredAt.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://immo:immo@localhost:5432/immoshare?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-change-me` | Secret for signing JWTs |
| `PORT` | `3000` | API server port |
| `HOST` | `0.0.0.0` | API server host |
| `LOG_LEVEL` | `info` | Fastify log level |
| `PUBLIC_URL` | `https://app.immoshare.com` | Base URL for share links |

## Docker

```bash
docker compose up -d        # Start PostgreSQL
docker ps                   # Check health
docker compose down          # Stop (data preserved)
docker compose down -v       # Stop + delete data
```

## License

Private — All rights reserved.

### Tracking (M6) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/track/event` | **No** (token) | Record tracking event |
| POST | `/api/v1/track/heartbeat` | **No** (token) | Record time heartbeat |
| GET | `/api/v1/share-links/:id/events` | Yes | List events for a link |
| GET | `/api/v1/properties/:id/analytics` | Yes | Property analytics |
| GET | `/api/v1/analytics/dashboard` | Yes | Global dashboard |

#### Tracking Features

- **IP anonymization** — last octet masked for GDPR compliance
- **Deduplication** — page_opened within 5 min from same IP silently skipped
- **Rate limiting** — 60 events/min per token (in-memory)
- **firstVisit detection** — flag on first page_opened per link
- **Property analytics** — open rate, avg time, channel/contact/section breakdown
- **Dashboard** — period stats, recent activity, top properties by opens
- **Event types** — page_opened, section_viewed, media_viewed, time_spent, page_closed

**Tracking (M6):** Events recorded per ShareLink token. IP anonymized. Views deduplicated within 5 min. Analytics aggregated per property with open rate, time spent, channel breakdown, contact breakdown, and section ranking. Dashboard shows global activity summary.
