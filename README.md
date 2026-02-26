# ImmoShare

Real estate property sharing platform for Israeli agents — create property pages, share via WhatsApp/Email/SMS, and track interactions.

## Quick Start

### Prerequisites

- **Node.js** 20+ (via nvm)
- **pnpm** 10+ (via corepack)
- **Docker** (for PostgreSQL)
- **Git** with SSH key configured for GitHub
- **Android Studio** (for mobile emulator — optional)

### Backend Setup

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

### Run Backend

```bash
# Start the API server (dev mode)
cd packages/api && npx tsx watch src/server.ts

# Health check
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

### Test Backend

```bash
# Run all tests (376 tests, 25 suites)
pnpm --filter @immo-share/api test

# Run with coverage
pnpm --filter @immo-share/api test -- --coverage

# Run a specific module's tests
pnpm --filter @immo-share/api test -- --testPathPattern share
```

### Mobile Setup

```bash
# Install mobile dependencies
cd apps/mobile && pnpm install

# Start Metro bundler
npx expo start

# Run on Android emulator (Expo Go must be installed)
# Press 'a' in Metro terminal, or:
npx expo start --android
```

#### Android Emulator (WSL2)

When developing on WSL2, the emulator runs on Windows while the backend runs inside WSL. The mobile app must reach the backend via the WSL2 network bridge IP.

```bash
# 1. Create AVD in Android Studio → Virtual Device Manager
#    Recommended: Pixel 3a, API 33 (x86_64), Google APIs

# 2. Install Expo Go on the emulator
#    Download APK from https://expo.dev/go or install via Play Store

# 3. Get WSL2 IP address (run from WSL)
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1

# 4. Set API URL for the mobile app (use WSL IP, not localhost)
export EXPO_PUBLIC_API_URL=http://<WSL_IP>:3000

# 5. Ensure backend listens on 0.0.0.0 (default in .env: HOST=0.0.0.0)
```

#### Running Everything Together

```bash
# Terminal 1 — Database
docker compose up -d

# Terminal 2 — Backend API
cd packages/api && npx tsx watch src/server.ts

# Terminal 3 — Metro bundler + Emulator
cd apps/mobile && EXPO_PUBLIC_API_URL=http://<WSL_IP>:3000 npx expo start --android
```

### Test Mobile

```bash
cd apps/mobile

# Run all tests (224 tests, 25 suites)
npx jest

# Watch mode
npx jest --watch

# Coverage
npx jest --coverage

# Run a specific module
npx jest --testPathPattern m3-properties
```

## Project Structure

```
immo-share/
├── packages/
│   └── api/                             # Backend API (Fastify + Prisma)
│       ├── prisma/
│       │   ├── schema.prisma            # Database schema (all modules)
│       │   └── migrations/              # 9 SQL migrations
│       ├── src/
│       │   ├── common/                  # Shared middleware, types, utils
│       │   ├── modules/
│       │   │   ├── auth/                # M1 — Authentication (8 endpoints)
│       │   │   ├── agency/              # M2 — Agencies (14 endpoints)
│       │   │   ├── property/            # M3 — Properties (8 endpoints)
│       │   │   ├── page/                # M4 — Page Generator (6 endpoints)
│       │   │   ├── share/               # M5 — Sharing & Contacts (11 endpoints)
│       │   │   ├── tracking/            # M6 — Tracking & Analytics (5 endpoints)
│       │   │   ├── partner/             # M7 — Partners & Reshare (12 endpoints)
│       │   │   ├── notification/        # M8 — Notifications (9 endpoints)
│       │   │   └── branding/            # M9 — Branding (10 endpoints)
│       │   └── server.ts               # Entry point — wires all modules
│       └── tests/                       # 376 tests (unit + integration)
│
├── apps/
│   └── mobile/                          # React Native / Expo mobile app
│       ├── src/
│       │   ├── components/              # Shared UI components
│       │   │   ├── PlaceholderScreen.tsx # Generic placeholder for WIP screens
│       │   │   └── PropertyCard.tsx      # Property list item card
│       │   ├── navigation/
│       │   │   ├── RootNavigator.tsx     # Auth gate (loading → auth/main)
│       │   │   ├── AuthStack.tsx         # Login → Register → ForgotPassword
│       │   │   ├── MainTabs.tsx          # Bottom tabs (Properties, Contacts, Tracking, Profile)
│       │   │   └── types.ts             # Navigation type definitions
│       │   ├── screens/
│       │   │   ├── Auth/                # LoginScreen, RegisterScreen, ForgotPasswordScreen
│       │   │   ├── Properties/          # PropertyList, PropertyDetail, PropertyCreate
│       │   │   ├── Share/               # ContactListScreen (placeholder)
│       │   │   ├── Tracking/            # TrackingDashboardScreen (placeholder)
│       │   │   ├── Notifications/       # NotificationListScreen (placeholder)
│       │   │   ├── Branding/            # BrandingEditorScreen (placeholder)
│       │   │   └── Profile/             # ProfileHomeScreen
│       │   ├── services/                # API client layer (10 service files)
│       │   │   ├── api.ts               # Base HTTP client (fetch + JWT + envelope)
│       │   │   ├── property.service.ts  # Property CRUD + status + duplicate
│       │   │   ├── agency.service.ts    # Agency management + invites
│       │   │   ├── page.service.ts      # Page CRUD + preview
│       │   │   ├── contact.service.ts   # Contact CRUD
│       │   │   ├── share.service.ts     # Share batch + links + deactivate
│       │   │   ├── tracking.service.ts  # Analytics + dashboard
│       │   │   ├── partner.service.ts   # Partner invites + catalog + reshare
│       │   │   ├── notification.service.ts # Notifications + settings + push
│       │   │   └── branding.service.ts  # Branding CRUD + media upload
│       │   ├── stores/                  # Zustand state management (7 stores)
│       │   │   ├── auth.store.ts        # Auth state (login, register, logout, init)
│       │   │   ├── property.store.ts    # Property list + pagination + filters
│       │   │   ├── contact.store.ts     # Contact list + CRUD
│       │   │   ├── tracking.store.ts    # Dashboard + property analytics
│       │   │   ├── partner.store.ts     # Partners + catalog + reshare
│       │   │   ├── notification.store.ts # Notifications + unread + settings
│       │   │   └── branding.store.ts    # Branding profile + media
│       │   ├── theme/                   # Design tokens + theme
│       │   └── types/                   # Shared TypeScript types
│       ├── __tests__/                   # 215 tests (22 suites)
│       │   ├── infra/                   # api.test.ts, navigation.test.tsx, placeholders.test.tsx
│       │   ├── m1-auth/                 # auth.store, Login, Register, ForgotPassword, Profile
│       │   ├── m2-agencies/             # agency.test.ts (service + store)
│       │   ├── m3-properties/           # service, store, List, Card, Detail, Create
│       │   ├── m4-pages/                # page.test.ts (service)
│       │   ├── m5-sharing/              # contact.test.ts, share.test.ts (service + store)
│       │   ├── m6-tracking/             # tracking.test.ts (service + store)
│       │   ├── m7-partners/             # partner.test.ts (service + store)
│       │   ├── m8-notifications/        # notification.test.ts (service + store)
│       │   └── m9-branding/             # branding.test.ts (service + store)
│       ├── jest.setup.ts                # Test mocks (SecureStore, navigation, fetch)
│       └── TEST_PLAN.md                 # 176 test specifications with status tracking
│
├── docker-compose.yml                   # PostgreSQL 16
├── PROGRESS.md                          # Project progress tracker
└── README.md
```

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Backend** | | |
| Runtime | Node.js | 20 |
| Framework | Fastify | 4 |
| Language | TypeScript | 5 |
| ORM | Prisma | 5.22 |
| Database | PostgreSQL | 16 (alpine) |
| Validation | Zod | 3 |
| Auth | JWT | jsonwebtoken |
| Password hashing | bcrypt | salt factor 12 |
| Testing | Jest | 29 |
| **Mobile** | | |
| Framework | React Native | 0.74 |
| Platform | Expo SDK | 51 |
| State | Zustand | 4 |
| Navigation | React Navigation | 6 |
| Storage | expo-secure-store | — |
| Testing | Jest + RNTL | 13 |
| **Tooling** | | |
| Monorepo | pnpm workspaces | 10 |
| Container | Docker Compose | — |

## Architecture

### Backend — Module Pattern

Each backend module follows a strict layered architecture:

```
module/
├── *.types.ts        # Domain types + repository interfaces
├── *.errors.ts       # Module-specific error classes
├── *.schemas.ts      # Zod validation schemas
├── *.service.ts      # Business logic (pure, testable)
├── *.controller.ts   # HTTP handlers (parse → validate → call service → respond)
├── *.routes.ts       # Route registration (URL + method + middleware)
├── *.repository.ts   # Prisma data access (implements interfaces)
└── index.ts          # Barrel export
```

### Mobile — Service/Store/Screen Pattern

```
Service (API calls) → Store (Zustand state) → Screen (React components)
```

Services wrap the base HTTP client (`api.ts`) which handles JWT token persistence via `expo-secure-store`, automatic `Authorization` header injection, API response envelope unwrapping (`{ success, data }` → `data`), and 401 → token refresh flow.

### API Response Envelope

All API responses follow a standard envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "..." } }
```

## Modules

| Module | Backend | Mobile | Description |
|--------|---------|--------|-------------|
| M1 Auth | ✅ 76 tests | ✅ 34 tests | Register, login, JWT, email verify, password reset |
| M2 Agencies | ✅ 52 tests | 🟡 12 tests | Agency CRUD, members, invitations |
| M3 Properties | ✅ 38 tests | ✅ 43 tests | Property CRUD, status workflow, filters, duplicate |
| M4 Pages | ✅ 41 tests | 🟡 6 tests | Page generator, SSR HTML, sections, media |
| M5 Sharing | ✅ 50 tests | 🟡 18 tests | Contacts, share links, batch, channels |
| M6 Tracking | ✅ 33 tests | 🟡 7 tests | Events, analytics, dashboard |
| M7 Partners | ✅ 34 tests | 🟡 16 tests | Invites, catalog, reshare workflow |
| M8 Notifications | ✅ 25 tests | 🟡 16 tests | Notifications, settings, push tokens |
| M9 Branding | ✅ 27 tests | 🟡 13 tests | Agent/agency branding, logo, photo |
| **Total** | **376 tests** | **215 tests** | |

Legend: ✅ = service + store + screens, 🟡 = service + store (screens are placeholders)

## API Endpoints

### Auth (M1) — 8 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/auth/register` | No | Create account |
| POST | `/api/v1/auth/login` | No | Login → tokens |
| POST | `/api/v1/auth/refresh` | No | Refresh access token |
| POST | `/api/v1/auth/verify-email` | No | Verify email token |
| POST | `/api/v1/auth/forgot-password` | No | Request password reset |
| POST | `/api/v1/auth/reset-password` | No | Reset password |
| POST | `/api/v1/auth/logout` | Yes | Revoke refresh token |
| POST | `/api/v1/auth/change-password` | Yes | Change password |

> **Note:** `GET /api/v1/auth/me` has been implemented (returns authenticated user profile).

### Agencies (M2) — 14 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/agencies` | Yes | Create agency |
| GET | `/api/v1/agencies/:id` | Yes | Get agency |
| PATCH | `/api/v1/agencies/:id` | Yes | Update agency |
| DELETE | `/api/v1/agencies/:id` | Yes | Delete agency |
| GET | `/api/v1/agencies/:id/members` | Yes | List members |
| DELETE | `/api/v1/agencies/:id/members/:userId` | Yes | Remove member |
| POST | `/api/v1/agencies/:id/leave` | Yes | Leave agency |
| POST | `/api/v1/agencies/:id/transfer-admin` | Yes | Transfer admin role |
| POST | `/api/v1/agency-invites` | Yes | Create invite |
| GET | `/api/v1/agency-invites` | Yes | List agency invites |
| DELETE | `/api/v1/agency-invites/:id` | Yes | Revoke invite |
| POST | `/api/v1/agency-invites/:code/accept` | Yes | Accept invite |
| POST | `/api/v1/agency-invites/:code/decline` | Yes | Decline invite |
| GET | `/api/v1/my-invites` | Yes | List user's invites |

### Properties (M3) — 8 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/properties` | Yes | Create property |
| GET | `/api/v1/properties` | Yes | List (paginated, 10 filters) |
| GET | `/api/v1/properties/:id` | Yes | Get by ID |
| PATCH | `/api/v1/properties/:id` | Yes | Update property |
| DELETE | `/api/v1/properties/:id` | Yes | Delete property |
| POST | `/api/v1/properties/:id/duplicate` | Yes | Duplicate as draft |
| PATCH | `/api/v1/properties/:id/status` | Yes | Change status |
| GET | `/api/v1/agencies/:id/properties` | Yes | Agency property list |

### Pages (M4) — 6 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/properties/:id/pages` | Yes | Create page |
| GET | `/api/v1/properties/:id/pages` | Yes | List property pages |
| GET | `/api/v1/pages/:id` | Yes | Get page |
| PATCH | `/api/v1/pages/:id` | Yes | Update page |
| DELETE | `/api/v1/pages/:id` | Yes | Delete page |
| GET | `/api/v1/pages/:id/preview` | Yes | Preview (watermarked) |

### Contacts (M5) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/contacts` | Yes | Create contact |
| GET | `/api/v1/contacts` | Yes | List (paginated) |
| GET | `/api/v1/contacts/:id` | Yes | Get contact |
| PATCH | `/api/v1/contacts/:id` | Yes | Update contact |
| DELETE | `/api/v1/contacts/:id` | Yes | Delete contact |

### Sharing (M5) — 6 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/share` | Yes | Batch share (contacts × channels) |
| GET | `/api/v1/share-links` | Yes | List share links (paginated) |
| GET | `/api/v1/share-links/:id` | Yes | Get share link |
| DELETE | `/api/v1/share-links/:id` | Yes | Deactivate link |
| GET | `/api/v1/v/:token` | No | Public page (HTML) |
| POST | `/api/v1/share-links/:id/delivery` | No | Delivery webhook |

### Tracking (M6) — 5 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/track/event` | No (token) | Record tracking event |
| POST | `/api/v1/track/heartbeat` | No (token) | Record time heartbeat |
| GET | `/api/v1/share-links/:id/events` | Yes | List events for a link |
| GET | `/api/v1/properties/:id/analytics` | Yes | Property analytics |
| GET | `/api/v1/analytics/dashboard` | Yes | Global dashboard |

### Partners (M7) — 12 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/partner-invites` | Yes | Generate invite code |
| GET | `/api/v1/partner-invites` | Yes | List my invites |
| DELETE | `/api/v1/partner-invites/:id` | Yes | Revoke invite |
| POST | `/api/v1/partner-invites/accept` | Yes | Accept invite code |
| GET | `/api/v1/partners` | Yes | List partners |
| DELETE | `/api/v1/partners/:inviteId` | Yes | Remove partner |
| GET | `/api/v1/partners/:inviteId/properties` | Yes | Partner property catalog |
| GET | `/api/v1/partners/:inviteId/properties/:id` | Yes | Partner property detail |
| POST | `/api/v1/reshare-requests` | Yes | Request reshare |
| GET | `/api/v1/reshare-requests` | Yes | List received reshares |
| GET | `/api/v1/reshare-requests/sent` | Yes | List sent reshares |
| POST | `/api/v1/reshare-requests/:id/approve` | Yes | Approve reshare |
| POST | `/api/v1/reshare-requests/:id/reject` | Yes | Reject reshare |

### Notifications (M8) — 9 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/v1/notifications` | Yes | List notifications |
| GET | `/api/v1/notifications/unread-count` | Yes | Unread count |
| PATCH | `/api/v1/notifications/:id/read` | Yes | Mark as read |
| POST | `/api/v1/notifications/read-all` | Yes | Mark all as read |
| DELETE | `/api/v1/notifications/:id` | Yes | Delete notification |
| GET | `/api/v1/notification-settings` | Yes | Get settings |
| PATCH | `/api/v1/notification-settings` | Yes | Update settings |
| POST | `/api/v1/push-tokens` | Yes | Register push token |
| DELETE | `/api/v1/push-tokens/:id` | Yes | Unregister push token |

### Branding (M9) — 10 endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/v1/branding` | Yes | Get my branding |
| PUT | `/api/v1/branding` | Yes | Replace branding |
| PATCH | `/api/v1/branding` | Yes | Update branding |
| POST | `/api/v1/branding/logo` | Yes | Upload logo |
| DELETE | `/api/v1/branding/logo` | Yes | Delete logo |
| POST | `/api/v1/branding/photo` | Yes | Upload photo |
| DELETE | `/api/v1/branding/photo` | Yes | Delete photo |
| GET | `/api/v1/branding/preview` | Yes | Preview branding |
| GET | `/api/v1/agencies/:id/branding` | Yes | Get agency branding |
| PUT | `/api/v1/agencies/:id/branding` | Yes | Set agency branding |

## Database

### Tables

| Table | Module | Description |
|-------|--------|-------------|
| `users` | M1 | Agent accounts with bcrypt passwords |
| `refresh_tokens` | M1 | JWT refresh token rotation |
| `email_verifications` | M1 | Email verification tokens |
| `password_resets` | M1 | Password reset tokens (1h expiry) |
| `agencies` | M2 | Real estate agencies |
| `agency_invites` | M2 | Agency invitation codes |
| `properties` | M3 | Property listings with status workflow |
| `media` | M3 | Property media (photos, documents) |
| `pages` | M4 | Generated pages with selectedElements JSON |
| `contacts` | M5 | Agent contacts (phone, email, tags) |
| `share_links` | M5 | Unique share tokens per contact × page × channel |
| `share_batches` | M5 | Batch sharing records |
| `track_events` | M6 | Page view, section, time tracking events |
| `partner_invites` | M7 | Partner invitation codes and partnerships |
| `reshare_requests` | M7 | Property reshare approval workflow |
| `notifications` | M8 | In-app notification records |
| `notification_settings` | M8 | Per-user notification preferences |
| `push_tokens` | M8 | FCM push token registry |
| `branding_profiles` | M9 | Agent/agency branding customization |

### Migrations

| Migration | Description |
|-----------|-------------|
| `20260222200120_init` | M1 tables |
| `20260222202931_add_agencies` | M2 tables + user.agencyId FK |
| `20260222210049_add_properties` | M3 tables + 3 enums |
| `20260222211906_add_pages` | M4 pages table |
| `20260222214341_add_sharing` | M5 contacts, share_links, share_batches + ShareChannel enum |
| `20260223060008_add_tracking` | M6 track_events + TrackEventType enum |
| `20260223171110_add_partners` | M7 partner_invites, reshare_requests + 2 enums |
| `20260223181346_add_notifications` | M8 notifications, notification_settings, push_tokens + enum |
| `20260223184418_add_branding` | M9 branding_profiles table |

### Status Workflow (Properties)

```
draft → active → under_offer → sold
                             → rented → active
                                      → archived
       → archived (from any) → draft
```

### Key Business Rules

**Properties (M3):** Property belongs to one owner. Status follows strict workflow. Duplication resets to draft. Agency admin can view all agency properties.

**Pages (M4):** Page references a property with `selectedElements` JSON defining sections, media, fields. Multiple pages per property. Inactive pages return 410.

**Sharing (M5):** Each ShareLink is unique per contact × page × channel. Token is UUID v4. Links expire (default 30 days). Channel adapters are pluggable (stubs for WhatsApp/Brevo/Twilio).

**Tracking (M6):** Events per ShareLink token. IP anonymized (GDPR). Views deduplicated within 5 min. Rate limited 60/min/token.

**Partners (M7):** 8-char invite codes, 48h expiry. Max 50 partners. Cascade on revoke (reshares + links). Catalog read-only (active only).

**Notifications (M8):** Per-user preferences. Push token registry. Mark read/all. Paginated list.

**Branding (M9):** Agent-level and agency-level branding. Logo + photo upload. Preview rendering.

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
