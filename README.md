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
pnpm --filter @immo-share/api test -- --testPathPattern property
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
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   ├── auth.errors.ts  # AppError base class + auth errors
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.repository.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   └── auth.routes.ts
│   │   │   │   ├── agency/             # M2 — Agencies
│   │   │   │   │   ├── agency.types.ts
│   │   │   │   │   ├── agency.errors.ts
│   │   │   │   │   ├── agency.schemas.ts
│   │   │   │   │   ├── agency.service.ts
│   │   │   │   │   ├── agency-invite.service.ts
│   │   │   │   │   ├── agency.repository.ts
│   │   │   │   │   ├── agency.controller.ts
│   │   │   │   │   ├── agency.routes.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── property/           # M3 — Properties
│   │   │   │       ├── property.types.ts        # Domain types + repo interfaces
│   │   │   │       ├── property.errors.ts       # 7 error classes
│   │   │   │       ├── property.schemas.ts      # Zod schemas (create, update, filter, status)
│   │   │   │       ├── property.service.ts      # CRUD, status workflow, duplicate
│   │   │   │       ├── property.repository.ts   # Prisma with pagination & filters
│   │   │   │       ├── property.controller.ts   # HTTP layer
│   │   │   │       ├── property.routes.ts       # 8 routes (all authenticated)
│   │   │   │       └── index.ts
│   │   │   └── server.ts               # Entry point — wires all modules
│   │   └── tests/
│   │       ├── helpers/
│   │       │   ├── auth.ts             # JWT token generator for tests
│   │       │   └── testApp.ts          # Fastify test app builders (auth, agency, property)
│   │       ├── unit/
│   │       │   ├── auth/auth.service.test.ts
│   │       │   ├── agency/
│   │       │   │   ├── agency.service.test.ts
│   │       │   │   └── agency-invite.service.test.ts
│   │       │   └── property/
│   │       │       └── property.service.test.ts
│   │       └── integration/
│   │           ├── auth/auth.routes.test.ts
│   │           ├── agency/agency.routes.test.ts
│   │           └── property/property.routes.test.ts
│   └── shared/                          # Shared between packages
│       ├── constants/
│       │   ├── enums.ts                 # UserRole enum
│       │   └── index.ts
│       ├── types/
│       │   └── user.ts                  # UserDto, AuthResponseDto
│       └── validators/
│           ├── auth.ts                  # RegisterDto, LoginDto, etc.
│           └── user.ts
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

### Dependency Inversion

Services depend on **repository interfaces** (`IPropertyRepository`), not Prisma directly. This allows unit tests to mock the repository without touching the database.

### TDD Workflow

1. Write **failing tests** (RED) — define expected behavior
2. Implement the **minimum code** to pass (GREEN)
3. Refactor while tests stay green (REFACTOR)

### Test Strategy

| Type | What is mocked | What is tested | Location |
|------|---------------|----------------|----------|
| **Unit** | Repository interface | Service business logic | `tests/unit/` |
| **Integration** | Service (jest.Mocked) | Controller + routes + error handler | `tests/integration/` |

Both use Fastify's `inject()` — no real HTTP server needed.

### API Response Envelope

All endpoints return a consistent JSON envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable", "details": {} } }
```

### Error Handling

All errors extend `AppError(code, message, statusCode)`. The global `errorHandler` middleware maps:

| Error type | HTTP status | Example |
|-----------|------------|---------|
| `AppError` subclass | Defined in error | `PropertyNotFoundError` → 404 |
| `ZodError` | 400 | Missing required field |
| Fastify built-in | 4xx | Malformed JSON |
| Unhandled | 500 | Unexpected crash |

## Modules

| # | Module | Status | Tests | Endpoints |
|---|--------|--------|-------|-----------|
| M1 | Auth (users, JWT, register/login) | ✅ Done | 76 | 8 |
| M2 | Agencies (CRUD, invites, agents) | ✅ Done | 52 | 14 |
| M3 | Properties (CRUD, status, filters, duplicate) | ✅ Done | 38 | 8 |
| M4 | Page Generator (web pages from properties) | ⬜ | — | — |
| M5 | Sharing (WhatsApp, Email, SMS) | ⬜ | — | — |
| M6 | Tracking (views, clicks, analytics) | ⬜ | — | — |
| M7 | Partners (invitations, approvals) | ⬜ | — | — |
| M8 | Notifications (push, email, reminders) | ⬜ | — | — |
| M9 | Branding (logo, colors, agent identity) | ⬜ | — | — |

See [PROGRESS.md](PROGRESS.md) for detailed progress tracking.

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
| POST | `/api/v1/properties` | Yes | agent (any) | Create a property listing |
| GET | `/api/v1/properties` | Yes | agent (own) | List my properties (paginated + filters) |
| GET | `/api/v1/properties/:id` | Yes | agent (owner) | Get property details |
| PUT | `/api/v1/properties/:id` | Yes | agent (owner) | Update property |
| PATCH | `/api/v1/properties/:id/status` | Yes | agent (owner) | Change status (workflow) |
| DELETE | `/api/v1/properties/:id` | Yes | agent (owner) | Soft-delete property |
| POST | `/api/v1/properties/:id/duplicate` | Yes | agent (owner) | Duplicate property (reset to draft) |
| GET | `/api/v1/agencies/:id/properties` | Yes | agency_admin | List all agency properties |

#### Property Filters (GET /properties)

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status (draft, active, under_offer, sold, rented, archived) |
| `propertyType` | enum | Filter by type (apartment, house, penthouse, etc.) |
| `minPrice` / `maxPrice` | number | Price range |
| `city` | string | Filter by city (case-insensitive) |
| `minArea` / `maxArea` | number | Area range (sqm) |
| `minRooms` / `maxRooms` | number | Rooms range |
| `search` | string | Full-text search in title, description, address |
| `page` / `limit` | number | Pagination (default: page=1, limit=20) |

## Database

### Tables

| Table | Module | Description |
|-------|--------|-------------|
| `users` | M1 | User accounts with roles, agency link |
| `refresh_tokens` | M1 | JWT refresh tokens (revocable) |
| `email_verifications` | M1 | Email verification tokens |
| `password_resets` | M1 | Password reset tokens |
| `agencies` | M2 | Real estate agencies (soft-delete) |
| `agency_invites` | M2 | Agent invitation tokens with status lifecycle |
| `properties` | M3 | Real estate listings (25+ fields, soft-delete) |
| `media` | M3 | Property media files (photos, plans, 3D, videos) |

### Migrations

| Migration | Description |
|-----------|-------------|
| `20260222200120_init` | M1 tables: users, refresh_tokens, email_verifications, password_resets |
| `20260222202931_add_agencies` | M2 tables: agencies, agency_invites + user.agencyId FK |
| `20260222210049_add_properties` | M3 tables: properties, media + enums PropertyType, PropertyStatus, MediaType |

### Enums

| Enum | Values |
|------|--------|
| `UserRole` | super_admin, agency_admin, agent, partner |
| `AgencyInviteStatus` | pending, accepted, declined, expired, revoked |
| `PropertyType` | apartment, house, penthouse, duplex, garden_apartment, studio, villa, cottage, land, commercial, office, other |
| `PropertyStatus` | draft, active, under_offer, sold, rented, archived |
| `MediaType` | photo, floor_plan, model_3d, video, document |

### Status Workflow

```
draft → active → under_offer → sold
                             → rented → active
                                      → archived
       → archived (from any) → draft
```

### Key Business Rules

**Auth & Agencies (M1–M2):**
- A user can only belong to **one agency** at a time
- An `agency_admin` can only own **one agency**
- Agency deletion is a **soft delete** — sets `deletedAt`, unlinks all members
- Invitations expire after **7 days**

**Properties (M3):**
- A property belongs to one **owner** (the creating agent)
- If the agent belongs to an agency, `agencyId` is auto-filled
- Only the owner can update/delete/duplicate their properties
- Status follows a strict **workflow** — invalid transitions are rejected
- Duplication resets status to `draft`, does not copy media
- `agency_admin` can view all properties across the agency
- Price stored as `Decimal(12,2)` — currency defaults to ILS
- Soft-delete via `deletedAt` — excluded from all queries

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://immo:immo@localhost:5432/immoshare?schema=public` | PostgreSQL connection string |
| `JWT_SECRET` | `dev-secret-change-me` | Secret for signing JWTs |
| `PORT` | `3000` | API server port |
| `HOST` | `0.0.0.0` | API server host |
| `LOG_LEVEL` | `info` | Fastify log level |

## Docker

```bash
# Start PostgreSQL
docker compose up -d

# Check container health
docker ps
# → immoshare-db (healthy)

# Access PostgreSQL CLI
docker exec -it immoshare-db psql -U immo -d immoshare

# List tables
docker exec immoshare-db psql -U immo -d immoshare -c "\dt"

# Stop (data preserved in volume)
docker compose down

# Stop and delete ALL data
docker compose down -v
```

## Development Workflow

### Adding a new module

1. Read the module spec in `docs/M{N}_{NAME}.md`
2. Create `packages/api/src/modules/{name}/` with the standard files
3. Write RED tests in `tests/unit/{name}/` and `tests/integration/{name}/`
4. Implement service → repository → controller → routes
5. Wire module in `server.ts`
6. Update Prisma schema if needed, run `prisma migrate dev`
7. Update this README and PROGRESS.md
8. Commit with conventional message: `feat(M{N}): ...`

### Conventional Commits

```
feat(M1): complete auth module
feat(M2): complete agency module with 52 tests
feat(M3): complete property module with 38 tests
infra: add docker-compose with PostgreSQL 16
docs: comprehensive README and project progress tracker
```

## License

Private — All rights reserved.
