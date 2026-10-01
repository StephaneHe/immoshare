# ImmoShare

Real estate property sharing platform for Israeli agents — create property pages, share them via WhatsApp / Email / SMS, and track how prospects interact with them.

![version](https://img.shields.io/badge/version-0.2.2-blue)
![license](https://img.shields.io/badge/license-proprietary-lightgrey)
![platform](https://img.shields.io/badge/platform-Android%20%7C%20Node.js%2020-green)

## Overview

Agents juggle listings across WhatsApp chats, emails and spreadsheets, with no idea whether a prospect actually opened what they sent. ImmoShare gives them a mobile app backed by an API to:

- manage their property portfolio (alone or within an agency),
- generate shareable property pages with selected sections and media,
- send a unique tracked link per contact and channel,
- see who opened what, for how long, and get notified.

### Main features

| Module | What it does |
|--------|--------------|
| M1 Auth | Register, login, JWT access + refresh tokens, email verification, password reset |
| M2 Agencies | Agency CRUD, members, invitations, admin transfer |
| M3 Properties | Property CRUD, status workflow (draft → active → under offer → sold/rented → archived), filters, search, duplicate |
| M4 Pages | Page generator per property (selected sections/media), server-rendered public HTML, watermarked preview |
| M5 Sharing | Contacts, batch share (contacts × channels), unique share links with expiry, pluggable channel adapters |
| M6 Tracking | View / section / time events per link, IP anonymization, dedup + rate limiting, analytics dashboard |
| M7 Partners | Partner invite codes, read-only partner catalog, reshare request/approval workflow |
| M8 Notifications | In-app notifications, per-user settings, push token registry |
| M9 Branding | Agent / agency branding (logo, photo, colors) with preview |
| Media | Uploads to S3-compatible storage (MinIO in dev) |

Channel delivery: email goes through Brevo (logged to console when no API key is set); **WhatsApp and SMS are stubs** (adapters exist, no real provider wired yet).

### Project status

**Active development / pre-production** — current version **0.2.2** (see [CHANGELOG.md](CHANGELOG.md)).
Backend modules M1–M9 are implemented and tested; the Android app covers all modules with real screens (23 screens). Not deployed to production; runs locally (Docker + dev server + Android device/emulator).

## Prerequisites

- **Node.js** ≥ 20 and **pnpm** ≥ 9 (`corepack enable`)
- **Docker** + Docker Compose (PostgreSQL 16 + MinIO)
- For the mobile app: **Android SDK** / Android Studio, an emulator or a device with USB debugging; **JDK 17** for native release builds
- Optional: [Maestro](https://maestro.mobile.dev) for E2E flows

## Installation

```bash
git clone <repository-url> immo-share
cd immo-share
pnpm install

# PostgreSQL (host port 5433) + MinIO (9000 API, 9001 console) + bucket init
docker compose up -d

# API configuration
cp packages/api/.env.example packages/api/.env
# → edit packages/api/.env (see Configuration below)

# Database schema + Prisma client
pnpm --filter @immo-share/api exec prisma migrate dev
pnpm --filter @immo-share/api exec prisma generate
```

## Configuration

API settings live in `packages/api/.env` (template: [`packages/api/.env.example`](packages/api/.env.example)). Never commit the real `.env`.

| Variable | Role |
|----------|------|
| `DATABASE_URL` | PostgreSQL connection string (docker-compose exposes Postgres on host port **5433**) |
| `JWT_SECRET` | Secret used to sign JWTs — must be changed outside local dev |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (listed in the template) |
| `PORT`, `HOST`, `LOG_LEVEL` | API listen port / interface / Fastify log level |
| `PUBLIC_URL` | Base URL used to build public share links |
| `STORAGE_ENDPOINT`, `STORAGE_PUBLIC_URL`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` | S3-compatible media storage (MinIO in dev) |
| `BREVO_API_KEY`, `BREVO_FROM_EMAIL`, `BREVO_FROM_NAME` | Transactional email (optional — stub/console mode without a key) |

Mobile app: `EXPO_PUBLIC_API_URL` — API base URL reachable from the device/emulator (not `localhost`; use the host's LAN/WSL IP).

## Usage

```bash
# API (dev, watch mode)
pnpm --filter @immo-share/api dev

curl http://localhost:3000/health        # {"status":"ok","timestamp":"..."}
curl http://localhost:3000/api/version   # {"version":"0.2.2","service":"immo-share-api"}

# Mobile (Metro + Android)
cd apps/mobile
EXPO_PUBLIC_API_URL=http://<api-host-ip>:3000 npx expo start --android
```

When the API runs in WSL2 and the emulator on Windows, see [EMULATOR_SETUP.md](EMULATOR_SETUP.md). Demo walkthroughs: [DEMO_SCENARIOS.md](DEMO_SCENARIOS.md).

The full endpoint list (≈80 routes under `/api/v1`) is in [docs/API.md](docs/API.md). All responses use the envelope `{ "success": true, "data": … }` / `{ "success": false, "error": { "code", "message" } }`.

## Architecture

```
 Android app (Expo / React Native)          Public share page (browser)
   Screens → Zustand stores → services            │  GET /api/v1/v/:token
              │  HTTPS/JSON + JWT                  │  + tracking events
              ▼                                    ▼
        ┌──────────────────────── Fastify API ────────────────────────┐
        │ modules M1–M9 + media (routes → controller → service → repo) │
        └──────────┬──────────────────────┬───────────────────┬────────┘
                   ▼                      ▼                   ▼
            PostgreSQL 16           MinIO / S3          Brevo (email)
              (Prisma 5)             (media)        WhatsApp/SMS: stubs
```

| Layer | Technologies |
|-------|--------------|
| Backend | Node.js 20, Fastify 4, TypeScript 5, Prisma 5, Zod 3, JWT, bcrypt |
| Data | PostgreSQL 16, MinIO (S3 API via `@aws-sdk/client-s3`) |
| Mobile | React Native 0.76, Expo SDK 52, Zustand 4, React Navigation 6, expo-secure-store |
| Tests | Jest 29, React Native Testing Library, Maestro (E2E) |
| Tooling | pnpm workspaces, Docker Compose, gitleaks |

Each backend module follows `types → schemas → errors → service → controller → routes → repository → index` (barrel export).

```
immo-share/
├── packages/api/              # Fastify + Prisma backend
│   ├── prisma/                # schema.prisma + 10 migrations
│   ├── src/common/            # middleware, types, utils, storage
│   ├── src/modules/           # auth, agency, property, page, share, tracking,
│   │                          # partner, notification, branding, media
│   ├── src/server.ts          # entry point (wires all modules)
│   └── tests/                 # unit/ + integration/
├── apps/mobile/               # Expo app (see apps/mobile/README.md)
│   ├── src/                   # navigation, screens, services, stores, theme
│   ├── __tests__/             # Jest suites per module
│   ├── .maestro/              # E2E flows (see .maestro/README.md)
│   └── android/               # native Android project
├── docs/API.md                # endpoint reference
├── docker-compose.yml         # PostgreSQL + MinIO
└── CHANGELOG.md
```

## Tests

```bash
# Backend — unit + integration (integration tests need the Docker DB up)
pnpm --filter @immo-share/api test
pnpm --filter @immo-share/api test:coverage

# Mobile — services, stores, screens, navigation (all boundaries mocked)
cd apps/mobile && npx jest

# E2E — installed app against the live API/DB (device + backend required)
maestro test apps/mobile/.maestro/
```

- **Backend** (Jest): service logic per module and HTTP integration tests through the Fastify app.
- **Mobile** (Jest + RNTL): API client, stores, screens and navigation.
- **E2E** (Maestro): login, logout, property create/edit/status/delete/search, notification settings, contact creation and share composition. Prerequisites and demo account: [apps/mobile/.maestro/README.md](apps/mobile/.maestro/README.md).

## Build

```bash
# API
pnpm --filter @immo-share/api build   # tsc → dist/
pnpm --filter @immo-share/api start   # node dist/server.js

# Android release APK (JDK 17, ANDROID_HOME set); single ABI for speed
cd apps/mobile/android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
```

## Versioning

[Semantic Versioning](https://semver.org). The version is visible at runtime (`GET /api/version`, footer of the Login and Settings screens) and bumped together in every canonical source at each release; the Android `versionCode` is incremented by exactly 1 per build. History: [CHANGELOG.md](CHANGELOG.md) (Keep a Changelog).

## Roadmap

- Page creation UI in the mobile app (pages are currently created via the API)
- Real WhatsApp (Meta Cloud API) and SMS (Twilio) channel adapters — placeholders already in `.env.example`
- Production deployment (hosted API, HTTPS, managed storage)
- iOS build

## Security

- Report vulnerabilities privately to the repository owner (not in a public issue).
- Secrets stay out of the repo: `.env` is git-ignored, only `.env.example` with placeholder values is tracked; a gitleaks config (`.gitleaks.toml`) is provided — run `gitleaks detect` before pushing.
- The default `JWT_SECRET` and MinIO credentials in the templates are **for local development only** — change them on any shared or exposed host.
- `HOST=0.0.0.0` exposes the API on every network interface so devices can reach it; only do this on a trusted network, and never expose the dev setup (or MinIO's console) to the Internet.
- Tracking anonymizes visitor IPs; contacts and tracking data are personal data — handle DB dumps accordingly.

## Contributing

Private project. Work on a branch, keep the module layering, add tests with every change (`pnpm --filter @immo-share/api test` and `npx jest` must pass), and follow the release rules in [CLAUDE.md](CLAUDE.md) (version bump + CHANGELOG entry).

## License

Proprietary — all rights reserved. No license file; no use or redistribution without the author's permission.

## Author

Stéphane Hercot ([@StephaneHe](https://github.com/StephaneHe))
