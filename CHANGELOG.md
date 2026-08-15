# Changelog

All notable changes to ImmoShare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Per the fleet standing rules, every release MUST bump the version (in all canonical
locations: root `package.json`, `packages/api/package.json`, `apps/mobile/package.json`,
`apps/mobile/app.json`, `apps/mobile/android/app/build.gradle`, `packages/api/src/server.ts`,
`apps/mobile/src/constants/version.ts`) AND add an entry here.

## [Unreleased]

## [0.1.4] - 2026-08-15

### Added

- **E2E coverage expanded — 8 more Maestro flows** (`apps/mobile/.maestro/`): `login-invalid`,
  `logout`, `property-create`, `property-edit`, `property-status`, `property-delete`,
  `property-search`, `notifications-settings`, plus reusable `subflows/login` and
  `subflows/create-property`. All drive the real app against the live API/DB and are
  verified PASS on the V30T. README documents each flow, prerequisites and the run command.
- **Documented app gap**: no UI to create a contact or a property page, so "add contact" /
  "share" scenarios can't be driven through the app alone (see `.maestro/README.md`).

## [0.1.3] - 2026-08-15

### Added

- **E2E test layer — Maestro smoke flow** (`apps/mobile/.maestro/login-smoke.yaml`
  + `.maestro/README.md`). Drives the real installed app against the live backend
  (app ↔ API ↔ Postgres): launch with clear state → login with real credentials
  (`sophie@demo.com`) → assert the API/DB round-trip lands on **My Properties** →
  Profile shows the authenticated user (`Sophie Martin` / `sophie@demo.com` / `AGENT`)
  → Share and Alerts tabs render. Fills the gap left by the Jest suite, which mocks
  every boundary. Verified PASS on the V30T (`maestro test apps/mobile/.maestro/login-smoke.yaml`).

## [0.1.2] - 2026-08-14

### Changed

- **Mobile — API base URL points to the LAN/Tailscale host so the app is usable on a
  physical device** (`apps/mobile/.env`). `EXPO_PUBLIC_API_URL` was `http://10.0.2.2:3000`
  (Android emulator loopback, unreachable from a real phone); it now targets
  `http://100.113.178.120:3000` (Tailscale host `stephane`) which the V30T reaches over
  the tailnet. The value is compiled into the bundle at build time (`api.ts` reads
  `process.env.EXPO_PUBLIC_API_URL`), so a rebuild is required to change it.
- **Mobile — allow cleartext (HTTP) traffic in the release build** so the app can reach
  the plain-HTTP API (`android/app/src/main/AndroidManifest.xml`,
  `android:usesCleartextTraffic="true"`). Apps targeting Android API ≥ 28 block cleartext
  by default, so the release APK silently failed every `http://` request ("Login failed"
  with no request reaching the server) even though the host was reachable. (Android
  `versionCode` 3 → 4; `versionName` unchanged at 0.1.2.)

## [0.1.1] - 2026-08-14

### Fixed

- **Mobile — login screen flicker/shake on physical Android devices**
  (`apps/mobile/src/screens/Auth/LoginScreen.tsx`). The `KeyboardAvoidingView`
  used `behavior="height"` on Android while the activity already resizes via
  `windowSoftInputMode="adjustResize"`. The two mechanisms resized the layout
  simultaneously on every keyboard frame; on physical devices (non-zero display
  cutout / navigation-bar insets, animated keyboard) the two never converged to a
  fixed point, producing a continuous shake. Emulators (clean insets, non-animated
  keyboard) reached a fixed point, so the bug was invisible there. Android now lets
  the native resize handle the keyboard (`behavior={undefined}`); iOS keeps
  `behavior="padding"`.

## [0.1.0] - 2026-04-24

Initial documented state. ImmoShare is a real estate property sharing platform for
Israeli agents — agents create property pages, share them via WhatsApp/Email/SMS, and
track interactions.

### Added

- **Backend API** (`packages/api`) — Fastify 4 + Prisma 5 + PostgreSQL 16 + TypeScript 5
  - 9 modules (M1–M9): Auth, Agencies, Properties, Pages, Sharing & Contacts,
    Tracking & Analytics, Partners & Reshare, Notifications, Branding
  - Media upload module (MinIO/S3-compatible storage, 10MB file limit)
  - 19 Prisma tables, 9 migrations
  - Health endpoints: `GET /health`, `GET /isAlive`
  - Version endpoint: `GET /api/version` returning `{ version, service }`
  - Channel adapters for WhatsApp (stub), SMS (stub), Brevo (transactional email)
  - FCM push notification provider, auto-notifications on share & link-opened events
- **Mobile app** (`apps/mobile`) — React Native 0.76 + Expo SDK 52 + Zustand 4 + React Navigation 6
  - 22 screens across 9 feature modules (Auth, Agencies, Properties, Pages, Share,
    Tracking, Notifications, Branding, Profile)
  - 10 API client services, 7 Zustand stores
  - Visible version footer in `LoginScreen` and `Profile/SettingsScreen`
    (sourced from `src/constants/version.ts`)
  - 224+ Jest tests (property lifecycle, contact + sharing flow, etc.)
- **Infrastructure**
  - Docker Compose: PostgreSQL 16 + MinIO
  - pnpm workspaces monorepo (`packages/*` + `apps/*`)
  - Prisma generator with binary targets `["native", "windows", "debian-openssl-1.1.x"]`
- **Fleet rules adoption (2026-04-24)**
  - Visible version display surfaces wired (API endpoint + mobile footer)
  - This `CHANGELOG.md` created at repo root
  - CLAUDE.md updated with standing rules section

[Unreleased]: https://github.com/StephaneHe/immo-share/compare/v0.1.4...HEAD
[0.1.4]: https://github.com/StephaneHe/immo-share/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/StephaneHe/immo-share/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/StephaneHe/immo-share/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/StephaneHe/immo-share/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/StephaneHe/immo-share/releases/tag/v0.1.0
