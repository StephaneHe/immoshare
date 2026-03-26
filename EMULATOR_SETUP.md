# Running ImmoShare Mobile on Android Emulator from WSL2

## Prerequisites

- **Windows**: Android Studio with Android SDK installed at `C:\Users\steph\AppData\Local\Android\Sdk`
- **WSL2**: Node.js 20+, pnpm 10+, Docker
- **AVD**: `Pixel_3a_API_33_x86_64` created via Android Studio Virtual Device Manager
- **Expo Go**: Must be installed on the emulator. Use the latest version from the Play Store (or an SDK-compatible version matching the project).

## Architecture

The setup spans two environments -- WSL2 and Windows -- each handling different parts of the stack:

```
+-----------------------------+       +-----------------------------+
|           WSL2              |       |          Windows            |
|                             |       |                             |
|  Docker                     |       |  Android Studio             |
|    - PostgreSQL             |       |    - Android Emulator       |
|    - MinIO                  |       |      (Pixel_3a_API_33)      |
|                             |       |      with Expo Go           |
|  Backend API (localhost:3000)|      |                             |
|  Metro Bundler (:8081)      |       |                             |
+-----------------------------+       +-----------------------------+
         |                                        |
         +---- WSL2 network bridge IP ------------+
```

- **Backend API** runs inside WSL2 on `localhost:3000`.
- **Docker** (PostgreSQL + MinIO) runs inside WSL2.
- **Android Emulator** runs on Windows via Android Studio.
- **Metro bundler** runs inside WSL2.
- **Communication**: The emulator on Windows accesses WSL2 services via the WSL2 network bridge IP address. This IP is dynamically assigned and must be retrieved each session.

## Step-by-step Startup

Follow these steps in order.

### a. Start Docker

```bash
sudo service docker start && docker-compose up -d
```

### b. Start the backend API

```bash
cd packages/api && npx tsx watch src/server.ts
```

### c. Get the WSL2 IP address

This IP is needed so the emulator (running on Windows) can reach services inside WSL2.

```bash
ip addr show eth0 | grep 'inet ' | awk '{print $2}' | cut -d/ -f1
```

Note the IP (e.g., `172.22.x.x`). You will substitute it as `<WSL_IP>` in the steps below.

### d. Start the Android emulator from WSL

```bash
/mnt/c/Users/steph/AppData/Local/Android/Sdk/emulator/emulator.exe -avd Pixel_3a_API_33_x86_64 -no-audio &
```

### e. Wait for the emulator to boot and verify

```bash
adb devices
```

You should see the emulator listed as a device. If `adb` is not found, use the full path: `/mnt/c/Users/steph/AppData/Local/Android/Sdk/platform-tools/adb.exe`.

### f. Start Metro bundler

```bash
cd apps/mobile && EXPO_PUBLIC_API_URL=http://<WSL_IP>:3000 npx expo start --port 8081
```

Replace `<WSL_IP>` with the IP from step c.

### g. Open the app on the emulator

```bash
adb shell am start -a android.intent.action.VIEW -d "exp://<WSL_IP>:8081" host.exp.exponent
```

Replace `<WSL_IP>` with the IP from step c.

## Known Issues & Solutions

### Bundle stuck at 40%

WSL2's network bridge can have issues with large HTTP responses, causing the JavaScript bundle download to stall.

**Solution**: Use tunnel mode, which routes traffic through ngrok instead of the local network.

```bash
npx expo start --tunnel --no-dev
```

This requires the `@expo/ngrok` package. Install it if missing:

```bash
pnpm add -D @expo/ngrok
```

### ANR "Expo Go isn't responding"

This happens in dev mode because Expo Go tries to connect to the React DevTools WebSocket on port 8097, which is not accessible from the emulator across the WSL2 bridge. The connection attempt blocks and triggers an Android "Application Not Responding" dialog.

**Solution**: Use the `--no-dev` flag to disable dev mode, or simply tap "Wait" when the dialog appears.

### Expo Go SDK mismatch

This project uses SDK 52. The version of Expo Go installed on the emulator must match. If you see an SDK version mismatch error, update Expo Go from the Play Store (the latest version supports SDK 52).

### `newArchEnabled` warning

Expo Go always runs with the New Architecture enabled. To suppress the warning about mismatched architecture settings, set the following in `app.json`:

```json
{
  "expo": {
    "newArchEnabled": true
  }
}
```

### React version conflicts in monorepo

If you see an error like `Cannot read property 'useRef' of null`, it usually means multiple copies of React are resolved in the monorepo.

**Solution**: Perform a clean install:

```bash
rm -rf node_modules apps/mobile/node_modules pnpm-lock.yaml && pnpm install
```

## ADB Cheat Sheet

| Command | Description |
|---------|-------------|
| `adb devices` | List connected devices |
| `adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png /tmp/screen.png` | Take a screenshot |
| `adb shell uiautomator dump /sdcard/ui_test.xml && adb shell cat /sdcard/ui_test.xml` | Dump UI tree |
| `adb shell input tap X Y` | Tap at coordinates (X, Y) |
| `adb shell input text 'text'` | Type text |
| `adb shell input swipe x1 y1 x2 y2 duration` | Swipe/scroll gesture |
| `adb logcat -d ReactNativeJS:* *:S` | View React Native JS logs |
| `adb shell am force-stop host.exp.exponent` | Force stop Expo Go |
