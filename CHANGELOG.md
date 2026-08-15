# Changelog

All notable changes to ImmoShare will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Per the fleet standing rules, every release MUST bump the version (in all canonical
locations: root `package.json`, `packages/api/package.json`, `apps/mobile/package.json`,
`apps/mobile/app.json`, `apps/mobile/android/app/build.gradle`, `packages/api/src/server.ts`,
`apps/mobile/src/constants/version.ts`) AND add an entry here.

## [Unreleased]

## [0.2.1] - 2026-08-15

### Added

- **E2E — `contact-create.yaml` and `share-journey.yaml`** Maestro flows: creating a contact
  through the new Add Contact screen (real DB write, verified in the list) and composing a
  share (select the new contact + a channel). Verified PASS on the V30T. README updated —
  completing a send still needs a property page seeded via the API (no page-creation UI).

## [0.2.0] - 2026-08-15

### Added

- **Mobile — "Add Contact" screen** (`apps/mobile/src/screens/Share/ContactCreateScreen.tsx`).
  A dedicated form (name required; email, phone, company, notes optional) that creates a
  contact through the store → service → `POST /api/v1/contacts`, then returns to the list
  (which refreshes from the store). Handles validation, loading and error states.
- Registered the `ContactCreate` route in the Share stack and added a clear
  **"+ Add Contact"** entry point in `ContactListScreen` (the share FAB is unchanged).
- Jest tests for `ContactCreateScreen` (render, name validation, submit payload, empty-field
  omission, error handling).

## [0.1.4] - 2026-08-15

### Added

- **E2E coverage expanded — 8 more Maestro flows** (`apps/mobile/.maestro/`): `login-invalid`,
  `logout`, `property-create`, `property-edit`, `property-status`, `property-delete`,
  `property-search`, `notifications-settings`, plus reusable `subflows/login` and
  `subflows/create-property`. All drive the real app against the live API/DB and are
  verified PASS on the V30T. README documents each flow, prerequisites and the run command.
- **Documented app gap** (since addressed by 0.2.0): no UI to create a contact.

## [0.1.3] - 2026-08-15

### Added

- **E2E test layer — Maestro smoke flow** (`apps/mobile/.maestro/login-smoke.yaml`
  + `.maestro/README.md`). Drives the real installed app against the live backend
  (app ↔ API ↔ Postgres): launch with clear state → login with real credentials
  (`sophie@demo.com`) → assert the API/DB round-trip lands on **My Properties** →
  Profile shows the authenticated user (`Sophie Martin` / `sophie@demo.com` / `AGENT`)
  → Share and Alerts tabs render.

## [0.1.2] - 2026-08-14

### Changed

- **Mobile — API base URL points to the LAN/Tailscale host so the app is usable on a
  physical device** (`apps/mobile/.env`). `EXPO_PUBLIC_API_URL` was `http://10.0.2.2:3000`
  (Android emulator loopback, unreachable from a real phone); it now targets
  `http://100.113.178.120:3000` (Tailscale host `stephane`) which the V30T reaches over
  the tailnet. The value is compiled into the bundle at build time, so a rebuild is required.
- **Mobile — allow cleartext (HTTP) traffic in the release build** so the app can reach
  the plain-HTTP API (`android/app/src/main/AndroidManifest.xml`,
  `android:usesCleartextTraffic="true"`). Apps targeting Android API ≥ 28 block cleartext
  by default, so the release APK silently failed every `http://` request.

## [0.1.1] - 2026-08-14

### Fixed

- **Mobile — login screen flicker/shake on physical Android devices**
  (`apps/mobile/src/screens/Auth/LoginScreen.tsx`). The `KeyboardAvoidingView`
  used `behavior="height"` on Android while the activity already resizes via
  `windowSoftInputMode="adjustResize"`. The two resized the layout simultaneously on
  every keyboard frame; on physical devices (display cutout / nav-bar insets, animated
  keyboard) they never converged, producing a continuous shake. Android now lets the
  native resize handle the keyboard (`behavior={undefined}`); iOS keeps `behavior="padding"`.

## [0.1.0] - 2026-04-24

Initial documented state. ImmoShare is a real estate property sharing platform for
Israeli agents — agents create property pages, share them via WhatsApp/Email/SMS, and
track interactions.

### Added

- **Backend API** (`packages/api`) — Fastify 4 + Prisma 5 + PostgreSQL 16 + TypeScript 5
  (9 modules M1–M9, media upload, 19 tables, health + version endpoints, channel adapters).
- **Mobile app** (`apps/mobile`) — React Native 0.76 + Expo SDK 52 + Zustand 4 +
  React Navigation 6 (22 screens, 10 services, 7 stores, visible version footer).
- **Infrastructure** — Docker Compose (PostgreSQL 16 + MinIO), pnpm workspaces monorepo.

[Unreleased]: https://github.com/StephaneHe/immo-share/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/StephaneHe/immo-share/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/StephaneHe/immo-share/compare/v0.1.4...v0.2.0
[0.1.4]: https://github.com/StephaneHe/immo-share/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/StephaneHe/immo-share/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/StephaneHe/immo-share/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/StephaneHe/immo-share/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/StephaneHe/immo-share/releases/tag/v0.1.0
