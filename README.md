# ImmoShare

Real estate property sharing platform for Israeli agents — create property pages, share via WhatsApp/Email/SMS, and track interactions.

## Quick Start

### Prerequisites

- **Node.js** 20+ (via nvm)
- **pnpm** 10+ (via corepack)
- **Docker** (for PostgreSQL)

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

# Create .env
cp packages/api/.env.example packages/api/.env

# Run database migrations
pnpm --filter @immo-share/api exec prisma migrate dev

# Generate Prisma client
pnpm --filter @immo-share/api exec prisma generate
```

### Run

```bash
# Start the API server (dev mode with hot reload)
cd packages/api && npx tsx watch src/server.ts

# Health check
curl http://localhost:3000/health
```

### Test

```bash
# Run all tests
pnpm --filter @immo-share/api test

# Run with coverage
pnpm --filter @immo-share/api test -- --coverage

# Run a specific module
pnpm --filter @immo-share/api test -- --testPathPattern=auth
pnpm --filter @immo-share/api test -- --testPathPattern=agency
```

## Project Structure

```
immo-share/
├── packages/
│   ├── api/                    # Backend (Fastify + Prisma)
│   │   ├── prisma/             # Schema & migrations
│   │   ├── src/
│   │   │   ├── common/         # Middleware, utils, types
│   │   │   ├── modules/        # Feature modules
│   │   │   │   ├── auth/       # M1 — Authentication
│   │   │   │   └── agency/     # M2 — Agencies
│   │   │   └── server.ts       # Entry point
│   │   └── tests/
│   │       ├── unit/           # Service tests (mocked repos)
│   │       ├── integration/    # HTTP route tests (Fastify inject)
│   │       └── helpers/        # Test utilities
│   └── shared/                 # Types, validators, constants
├── docker-compose.yml          # PostgreSQL 16
└── docs/                       # Specs (in Windows docs folder)
```

## Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 |
| Framework | Fastify 4 |
| Language | TypeScript 5 |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Auth | JWT (access + refresh tokens) |
| Testing | Jest |
| Monorepo | pnpm workspaces |

## Architecture

Each backend module follows the same pattern:

```
routes → controller → service → repository → Prisma
```

- **Unit tests** mock the repository interface
- **Integration tests** use Fastify's `inject()` with a mocked service
- TDD: write failing tests first, then implement

## Modules

| # | Module | Status | Tests |
|---|--------|--------|-------|
| M1 | Auth (users, JWT, register/login) | ✅ Done | 76 |
| M2 | Agencies (CRUD, invites, agents) | ✅ Done | 52 |
| M3 | Properties (listings, media) | ⬜ | — |
| M4 | Page Generator (web pages from properties) | ⬜ | — |
| M5 | Sharing (WhatsApp, Email, SMS) | ⬜ | — |
| M6 | Tracking (views, clicks, analytics) | ⬜ | — |
| M7 | Partners (invitations, approvals) | ⬜ | — |
| M8 | Notifications (push, email, reminders) | ⬜ | — |
| M9 | Branding (logo, colors, agent identity) | ⬜ | — |

## API Endpoints

### Auth (M1)

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

### Agencies (M2)

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/v1/agencies` | Yes | Create agency (agency_admin only) |
| GET | `/api/v1/agencies/:id` | Yes | Get agency details |
| PATCH | `/api/v1/agencies/:id` | Yes | Update agency (admin only) |
| DELETE | `/api/v1/agencies/:id` | Yes | Soft-delete agency (admin only) |
| GET | `/api/v1/agencies/:id/agents` | Yes | List agency agents |
| DELETE | `/api/v1/agencies/:id/agents/:userId` | Yes | Remove agent (admin only) |
| POST | `/api/v1/agencies/:id/agents/leave` | Yes | Leave agency |
| POST | `/api/v1/agencies/:id/transfer-admin` | Yes | Transfer admin role |
| POST | `/api/v1/agencies/:id/invites` | Yes | Invite agent by email |
| GET | `/api/v1/agencies/:id/invites` | Yes | List invitations |
| DELETE | `/api/v1/agencies/:id/invites/:inviteId` | Yes | Revoke invitation |
| POST | `/api/v1/agency-invites/:token/accept` | Yes | Accept invitation |
| POST | `/api/v1/agency-invites/:token/decline` | Yes | Decline invitation |
| GET | `/api/v1/users/me/agency-invites` | Yes | My pending invitations |

## Database

### Tables

| Table | Module | Description |
|-------|--------|-------------|
| `users` | M1 | User accounts with roles |
| `refresh_tokens` | M1 | JWT refresh tokens |
| `email_verifications` | M1 | Email verification tokens |
| `password_resets` | M1 | Password reset tokens |
| `agencies` | M2 | Real estate agencies |
| `agency_invites` | M2 | Agent invitation tokens |

### Roles

| Role | Description |
|------|-------------|
| `super_admin` | Platform administrator |
| `agency_admin` | Agency owner, manages agents |
| `agent` | Independent or agency-bound agent |
| `partner` | Read-only access via invitation |

## Environment Variables

See `packages/api/.env.example` for all variables.

Key settings:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for signing JWTs
- `PORT` — API server port (default: 3000)

## Docker

```bash
# Start PostgreSQL
docker compose up -d

# Check status
docker ps

# Access PostgreSQL CLI
docker exec -it immoshare-db psql -U immo -d immoshare

# Stop
docker compose down

# Stop and delete data
docker compose down -v
```

## License

Private — All rights reserved.
