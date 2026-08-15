# Maestro E2E tests

Real end-to-end flows that drive the **installed app** against the **real backend**
(app ↔ API ↔ Postgres). This is the layer the Jest suite can't cover — Jest mocks every
boundary (`services`, stores, navigation), so no true round-trip is exercised there.

## Flows

| Flow | What it proves |
|------|----------------|
| `login-smoke.yaml` | Launch (clear state) → login with real credentials → the API/DB round-trip lands on **My Properties** → Profile shows the authenticated user (`Sophie Martin` / `sophie@demo.com` / `AGENT`) → Share + Alerts tabs render. |

## Prerequisites

1. **App installed** on the target device: `com.immoshare.app` (≥ 0.1.2), built with
   `EXPO_PUBLIC_API_URL` pointing at a host the device can reach and cleartext HTTP enabled.
2. **Backend up** and reachable from the device at that URL
   (`http://100.113.178.120:3000`, Tailscale host `stephane`):
   ```bash
   # docker DB (postgres :5433 + minio) must be running: docker-compose up -d
   cd packages/api && PRISMA_HIDE_UPDATE_MESSAGE=1 npx tsx src/server.ts
   ```
3. **Device connected**: `adb devices` shows a `device` (e.g. V30T `V30T000000000012908`).
   If it shows `offline`: `adb reconnect offline && adb kill-server && adb start-server`.
4. **Demo account** exists: `sophie@demo.com` / `Demo12345` (role `agent`). Create it once
   via `POST /api/v1/auth/register` if the DB volume is fresh.

## Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash   # installs to ~/.maestro/bin
```
Maestro runs on the JVM (JDK 17) and drives the device through the Windows `adb`.

## Run

```bash
export PATH="$HOME/.maestro/bin:$PATH"
maestro test apps/mobile/.maestro/login-smoke.yaml
```
