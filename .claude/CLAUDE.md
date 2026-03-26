# ImmoShare — Claude Code Instructions

## Project Overview

ImmoShare is a real estate property sharing platform for Israeli agents. Agents create property pages, share them via WhatsApp/Email/SMS, and track interactions.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Backend | Fastify 4 + Prisma 5 + PostgreSQL 16 + TypeScript 5 |
| Mobile | React Native 0.76 + Expo SDK 52 + Zustand 4 + React Navigation 6 |
| Storage | MinIO (S3-compatible) for media uploads |
| Email | Brevo (transactional) |
| Testing | Jest 29 (backend + mobile) |
| Containers | Docker Compose (PostgreSQL + MinIO) |

### Project Structure

```
immo-share/                          # pnpm monorepo root
├── packages/
│   └── api/                         # Backend API (Fastify + Prisma)
│       ├── prisma/schema.prisma     # DB schema (19 tables, 9 migrations)
│       ├── src/
│       │   ├── common/              # Middleware, types, utils, storage
│       │   └── modules/             # M1-M9 + media (layered architecture)
│       └── tests/                   # Unit + integration tests
├── apps/
│   └── mobile/                      # Expo mobile app
│       ├── src/
│       │   ├── navigation/          # RootNavigator, AuthStack, MainTabs
│       │   ├── screens/             # 22 screens across 9 modules
│       │   ├── services/            # 10 API client services
│       │   ├── stores/              # 7 Zustand stores
│       │   └── theme/               # Design tokens
│       └── __tests__/               # 224+ mobile tests
├── docker-compose.yml               # PostgreSQL 16 + MinIO
└── pnpm-workspace.yaml              # packages/* + apps/*
```

### Backend Module Pattern

Each module follows: `types.ts` -> `schemas.ts` -> `errors.ts` -> `service.ts` -> `controller.ts` -> `routes.ts` -> `repository.ts` -> `index.ts` (barrel export).

### Commands

```bash
# Backend
pnpm --filter @immo-share/api test                    # Run backend tests
cd packages/api && npx tsx watch src/server.ts         # Dev server
pnpm --filter @immo-share/api exec prisma migrate dev  # Run migrations

# Mobile
cd apps/mobile && npx jest                             # Run mobile tests
cd apps/mobile && npx expo start --android             # Start on Android

# Infrastructure
docker compose up -d                                   # Start PostgreSQL + MinIO
```

### WSL2 + Android Emulator

The emulator runs on Windows, backend runs in WSL. The mobile app reaches the backend via WSL2 IP:

```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
export EXPO_PUBLIC_API_URL=http://<WSL_IP>:3000
```

---

## Android Emulator Interaction Rules (ADB)

These rules MUST be followed when interacting with the Android emulator via ADB.

### 1. Never guess coordinates from screenshots

Always use `uiautomator dump` to get the accessibility tree with exact bounds for every UI element:

```bash
adb shell uiautomator dump /dev/tty
```

Parse the `bounds="[x1,y1][x2,y2]"` attributes to compute the center point:

```
tap_x = (x1 + x2) / 2
tap_y = (y1 + y2) / 2
```

### 2. Tapping elements

First run `uiautomator dump`, find the element by its `text`, `resource-id`, or `content-desc` attribute, compute center from bounds, then tap:

```bash
adb shell input tap <tap_x> <tap_y>
```

### 3. Filling text fields

First tap the field (using the method above) to give it focus, then type:

```bash
adb shell input text '<escaped_text>'
```

For special characters, use key events:

```bash
adb shell input keyevent <keycode>
```

Never try to type by tapping individual keyboard keys.

### 4. Scrolling

Use swipe commands with duration:

```bash
adb shell input swipe <x1> <y1> <x2> <y2> <duration_ms>
```

- **Scroll down:** swipe from center-bottom to center-top
- **Scroll up:** swipe from center-top to center-bottom

### 5. Verify after every interaction

After every interaction (tap, text input, scroll), take a screenshot and verify the result before proceeding:

```bash
adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png /tmp/screen.png
```

### 6. Handle off-screen elements

If an element is not found in the UI dump, it may be off-screen. Scroll and dump again before concluding it doesn't exist.

### 7. React Native testID

For React Native apps, elements often have `resource-id` matching their `testID` prop. Prefer matching by `resource-id` when available.
