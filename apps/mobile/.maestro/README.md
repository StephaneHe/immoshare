# Maestro E2E tests

Real end-to-end flows that drive the **installed app** against the **real backend**
(app ↔ API ↔ Postgres). This is the layer the Jest suite can't cover — Jest mocks every
boundary (`services`, stores, navigation), so no true round-trip is exercised there.

## Flows

| Flow | What it proves |
|------|----------------|
| `login-smoke.yaml` | Login → lands on **My Properties** → Profile shows the authenticated user (`Sophie Martin` / `AGENT`) → Share + Alerts tabs render. |
| `login-invalid.yaml` | Wrong password is rejected by the API (`Invalid email or password`); app stays on Login. |
| `logout.yaml` | Profile → Sign Out returns to the Login screen. |
| `property-create.yaml` | Create a property (real write to Postgres) → it appears in the list. |
| `property-edit.yaml` | Edit a property's title → API confirms (`Property updated`). |
| `property-status.yaml` | Change status draft → Active via the confirm dialog (the `Under Offer` transition then proves it). |
| `property-delete.yaml` | Delete a property via the confirm dialog → gone from the list. |
| `property-search.yaml` | Server-side search filters the list (non-matching query hides the property). |
| `notifications-settings.yaml` | Alerts → Notification Settings loads the toggles (`Email Notifications`, …). |
| `contact-create.yaml` | Create a contact via the **Add Contact** screen (real write to Postgres) → it appears in the contact list. |
| `share-journey.yaml` | Create a contact → open the share screen → the contact is selectable → pick a channel + contact → ready to share (see the send limitation below). |

`subflows/login.yaml` and `subflows/create-property.yaml` are reusable building blocks
(`runFlow:`), not standalone tests.

## Test data / idempotency

Flows that write to the DB use a **unique title per run** (`E2E <random>` via an
`evalScript` suffix), so re-running never collides. Created rows are left in Postgres
(except `property-delete`, which removes its own). To reset, recreate the DB volume
(`docker-compose down -v && docker-compose up -d` + re-run migrations + re-register the
demo account).

## Partial coverage (app limitation, not a test gap)

Contact creation is now a first-class UI flow (`contact-create.yaml`, since 0.2.0).
**Completing a share (sending a link), however, still cannot be driven by the app alone**:
`ShareCreate` requires a property `pageId`, and the mobile app has **no UI to create a
property page** (`PageList` only lists; the only entry to `ShareCreate` — the contacts FAB —
passes no `pageId`, so a send returns "No page selected"). `share-journey.yaml` therefore
composes a share up to "ready to share with 1 contact"; an actual send would need a page
seeded via the API. Flagged for the product/UX backlog.

## Prerequisites

1. **App installed** on the device: `com.immoshare.app` (≥ 0.1.2), built with
   `EXPO_PUBLIC_API_URL` pointing at a host the device can reach and cleartext HTTP enabled.
2. **Backend up** and reachable from the device at that URL
   (`http://100.113.178.120:3000`, Tailscale host `stephane`):
   ```bash
   # docker DB (postgres :5433 + minio) must be running: docker-compose up -d
   cd packages/api && PRISMA_HIDE_UPDATE_MESSAGE=1 pnpm exec tsx src/server.ts
   ```
3. **Device connected**: `adb devices` shows a `device` (e.g. V30T `V30T000000000012908`).
   If it shows `offline`: `adb reconnect offline && adb kill-server && adb start-server`.
4. **Demo account** exists: `sophie@demo.com` / `Demo12345` (role `agent`).

## Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash   # installs to ~/.maestro/bin
```
Maestro runs on the JVM (JDK 17) and drives the device through the Windows `adb`.

## Run

```bash
export PATH="$HOME/.maestro/bin:$PATH"
maestro test apps/mobile/.maestro/login-smoke.yaml   # a single flow
maestro test apps/mobile/.maestro/                    # the whole suite
```
