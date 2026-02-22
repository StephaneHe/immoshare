# ImmoShare — Project Progress

> Last updated: 2026-02-22

## Summary

| Metric | Value |
|--------|-------|
| Modules completed | 3 / 9 |
| Total tests | 166 |
| Total endpoints | 30 |
| Total DB tables | 8 |
| Total source files | 32 |
| Git commits | 5 |

## Module Status

| # | Module | Status | Unit Tests | Integration Tests | Total Tests | Endpoints | Tables | Commit |
|---|--------|--------|-----------|-------------------|-------------|-----------|--------|--------|
| M1 | Auth | ✅ Done | 42 | 34 | 76 | 8 | 4 | `f4056b1` |
| M2 | Agencies | ✅ Done | 34 | 18 | 52 | 14 | 2 | `5f9df19` |
| M3 | Properties | ✅ Done | 22 | 16 | 38 | 8 | 2 | `b11efc5` |
| M4 | Page Generator | ⬜ Not started | — | — | — | — | — | — |
| M5 | Sharing | ⬜ Not started | — | — | — | — | — | — |
| M6 | Tracking | ⬜ Not started | — | — | — | — | — | — |
| M7 | Partners | ⬜ Not started | — | — | — | — | — | — |
| M8 | Notifications | ⬜ Not started | — | — | — | — | — | — |
| M9 | Branding | ⬜ Not started | — | — | — | — | — | — |

## Dependency Graph (Build Order)

```
M1 Auth ✅
├── M2 Agencies ✅
│   └── M3 Properties ✅
│       └── M4 Page Generator ← NEXT
│           └── M5 Sharing
│               └── M6 Tracking
│                   └── M8 Notifications
├── M9 Branding
└── M7 Partners (depends on M1, M2, M3)
```

## Detailed Timeline

### 2026-02-22 — Day 1

#### M1 — Auth (commit `f4056b1`)

**Scope:** User registration, login, JWT (access + refresh tokens), email verification, password reset, password change.

**Files created (13):**
- `auth.types.ts` — domain types, `IAuthRepository` interface
- `auth.errors.ts` — `AppError` base class + 9 error types
- `auth.service.ts` — register, login, refresh, logout, verifyEmail, forgotPassword, resetPassword, changePassword
- `auth.repository.ts` — `PrismaAuthRepository` implementation
- `auth.controller.ts` — HTTP layer with Zod validation
- `auth.routes.ts` — 8 routes (2 authenticated)
- `shared/constants/enums.ts` — `UserRole` enum
- `shared/types/user.ts` — `UserDto`, `AuthResponseDto`
- `shared/validators/auth.ts` — `RegisterDto`, `LoginDto`, etc.
- `tests/unit/auth/auth.service.test.ts` — 42 unit tests
- `tests/integration/auth/auth.routes.test.ts` — 34 integration tests
- `tests/helpers/auth.ts` — JWT token generator
- `tests/helpers/testApp.ts` — Fastify test app builder

**Prisma schema:** `users`, `refresh_tokens`, `email_verifications`, `password_resets`

**Key decisions:**
- Password hashing with bcrypt (salt factor 12)
- JWT access tokens expire in 15 minutes, refresh tokens in 7 days
- Refresh token rotation: old token invalidated on refresh
- Email verification and password reset via UUID tokens
- All errors extend `AppError` for uniform error handling

---

#### Infrastructure (commit `37036a6`)

**Scope:** Docker Compose for local PostgreSQL.

**docker-compose.yml:**
- PostgreSQL 16 alpine, port 5432
- Healthcheck with `pg_isready`
- Persistent volume `pgdata`
- Credentials: `immo`/`immo`/`immoshare`

**Verified:** Container healthy, migration applied, register endpoint tested end-to-end with real DB.

---

#### M2 — Agencies (commit `5f9df19`)

**Scope:** Agency CRUD, agent management (list/remove/leave/transfer), invitation system (create/accept/decline/revoke).

**Files created (12):**
- `agency.types.ts` — domain types, `IAgencyRepository`, `IAgencyInviteRepository`
- `agency.errors.ts` — 13 error classes
- `agency.schemas.ts` — 7 Zod schemas
- `agency.service.ts` — create, get, update, delete, listAgents, removeAgent, leave, transferAdmin
- `agency-invite.service.ts` — createInvite, acceptInvite, declineInvite, revokeInvite, listInvites, listMyPendingInvites
- `agency.repository.ts` — `PrismaAgencyRepository` + `PrismaAgencyInviteRepository`
- `agency.controller.ts` — 14 handler methods
- `agency.routes.ts` — 14 routes (all authenticated)
- `index.ts` — barrel export
- `tests/unit/agency/agency.service.test.ts` — 19 unit tests
- `tests/unit/agency/agency-invite.service.test.ts` — 15 unit tests
- `tests/integration/agency/agency.routes.test.ts` — 18 integration tests

**Prisma migration `add_agencies`:** `agencies`, `agency_invites` tables + `AgencyInviteStatus` enum

**Key business rules implemented:**
- One agency per admin, one agency per agent
- Admin cannot leave without transferring role
- Invitation lifecycle: `pending` → `accepted`/`declined`/`expired`/`revoked`
- Soft-delete cascade: unlinks all agents, revokes pending invites
- Transfer admin: swaps roles between old and new admin

---

#### Documentation (commit `bf7dba7`)

- Full README with architecture docs, module pattern, test strategy, API envelope, error handling, dev workflow
- PROGRESS.md created with module status, timeline, dependency graph

---

#### M3 — Properties (commit `b11efc5`)

**Scope:** Property CRUD, status workflow, pagination with filters, duplication, agency-level listing.

**Files created (10):**
- `property.types.ts` — domain types (`PropertyRecord`, `MediaRecord`), interfaces (`IPropertyRepository`, `IMediaRepository`), status transition map, pagination types
- `property.errors.ts` — 7 error classes (PropertyNotFound, NotPropertyOwner, InvalidStatusTransition, MediaNotFound, MediaLimitExceeded, MediaSizeLimit, InvalidMediaType)
- `property.schemas.ts` — 6 Zod schemas (create, update, changeStatus, propertyId, listQuery, agencyId)
- `property.service.ts` — create (auto-fill agencyId), getById, update, changeStatus (workflow validation), delete (soft), list (paginated + filters), listByAgency, duplicate
- `property.repository.ts` — `PrismaPropertyRepository` with Prisma enum mapping, pagination helper, filter builder (status, type, price range, area range, rooms range, city, full-text search)
- `property.controller.ts` — 8 handler methods
- `property.routes.ts` — 8 routes (all authenticated)
- `index.ts` — barrel export
- `tests/unit/property/property.service.test.ts` — 22 unit tests
- `tests/integration/property/property.routes.test.ts` — 16 integration tests

**Prisma migration `add_properties`:** `properties` (25+ columns), `media` tables + enums `PropertyType` (12 values), `PropertyStatus` (6 values), `MediaType` (5 values)

**Key features implemented:**
- Status workflow: `draft → active → under_offer → sold/rented`, `archived` from any, `archived → draft`
- Pagination with `page`/`limit` and total count
- Multi-criteria filtering: status, propertyType, price range, area range, rooms range, city, full-text search
- Duplication: copies all data except media, resets status to `draft`, appends "(copy)" to title
- Agency listing for `agency_admin`
- Auto-fill `agencyId` from user's current agency membership
- Decimal precision for price (12,2) and area (8,2)

**Also done:**
- `testApp.ts` updated with `buildPropertyTestApp()`
- `server.ts` wired with `PrismaPropertyRepository`, `PropertyService`, `PropertyController`, `propertyRoutes`

---

## Infrastructure Status

| Component | Status | Details |
|-----------|--------|---------|
| PostgreSQL | ✅ Running | Docker, port 5432, `immoshare` DB |
| Prisma | ✅ Synced | 3 migrations applied, client v5.22 |
| Git | ✅ Pushed | 5 commits on `main` |
| CI/CD | ⬜ | Not configured yet |
| Deployment | ⬜ | Planned: OVH VPS |

## Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| `tsc --noEmit` fails with 3 rootDir errors | Low | Monorepo path resolution. `tsx` runtime unaffected. |
| Email sending not implemented | Medium | M1 forgot-password and M2 invites create tokens but don't send emails. Placeholder for M8. |
| Rate limiting not implemented | Low | Defined in security spec but not yet enforced. |
| Media upload not yet implemented | Medium | M3 schema and types ready (Media table, IMediaRepository), but file upload/S3 integration deferred. |

## What's Next

**M3 — Media upload** (optional enhancement):
- File upload via multipart/form-data
- S3/local storage integration
- Thumbnail generation for photos
- Media limits enforcement (50 photos, 10 plans, 5 videos, 500 MB total)

**M4 — Page Generator** — Generate shareable web pages from property data:
- Template engine for property pages
- Public URLs with property details + media gallery
- SEO-friendly HTML output
- Mobile-responsive design
