# ble-faker-demo

A minimal React Native / Expo app that demonstrates [ble-faker](https://github.com/dmanto/ble-faker) — a scriptable BLE peripheral simulator for React Native developers.

The app simulates connecting to a **CorSense heart rate monitor**: scan for devices, connect, watch the live BPM reading update every second, and experience an unexpected device disconnection — all without any physical hardware.

![ble-faker demo](https://raw.githubusercontent.com/dmanto/ble-faker/main/docs/demo.gif)

---

## What this demonstrates

- Scanning for BLE devices and displaying them in a list
- Connecting to a device and monitoring a GATT characteristic in real time
- Handling an unexpected device disconnection gracefully
- Using `ble-faker` as a drop-in replacement for `react-native-ble-plx` — **zero changes to app code**
- Automated RNTL integration tests that drive the BLE mock programmatically — no device or simulator required

---

## Prerequisites

- Node.js 20+
- pnpm
- Expo Go or a simulator/emulator (for the manual demo; not needed for tests)

---

## Setup

```sh
pnpm install
```

---

## Running the automated tests

```sh
pnpm test
```

This starts the ble-faker server and runs Jest in parallel. Jest exits when all tests pass, and the server is stopped automatically.

The test (`test/App.test.tsx`) exercises the full app flow using [React Native Testing Library](https://callstack.github.io/react-native-testing-library/):

1. Tap **Scan** → wait for `CorSense` to appear in the device list
2. Connect → wait for the initial BPM reading
3. Inject BPM = 100 via the test client → assert the display updates
4. Inject BPM = 150 → assert the display updates
5. Force-disconnect the device → assert the "Connection Lost" screen appears
6. Tap **Back to scan** → re-scan → assert `CorSense` is discoverable again

The test uses `BleTestClient` from `ble-faker/test` to control the mock device programmatically:

```ts
import { BleTestClient, BleNamespace } from 'ble-faker/test';

const client = BleTestClient.connect();
const ns = await client.mount({ dir: MOCKS_DIR, disableAutoTick: true });
const device = ns.device('aa-bb-cc-dd-ee-11');

await device.input('bpm', '100');   // inject a sensor reading
await device.forceDisconnect();      // simulate device dropping the connection
```

---

## Running with the BLE mock (manual demo)

### 1. Start the ble-faker server

```sh
pnpm ble:start
```

This starts the mock server at `http://localhost:58083`. Open that URL in your browser to see the live device dashboard.

### 2. Start Expo with the mock enabled

```sh
# iOS simulator
pnpm ios:mock

# Android emulator
pnpm android:mock

# Expo Go (scan QR code)
pnpm start:mock
```

The `BLE_MOCK=true` flag tells Metro to redirect `react-native-ble-plx` imports to ble-faker's mock client. No changes to app code are needed.

### 3. Use the dashboard

Open `http://localhost:58083` in your browser. Click through to the **heart-rate** namespace and the CorSense device. From there you can:

- Watch the **Current BPM** output update in real time as the app receives it
- Override the heart rate by entering a value in the **Heart rate (bpm)** input
- Trigger a forced disconnect from the device panel to test the app's error handling

### 4. Stop the server

```sh
pnpm ble:stop
```

---

## Running without the mock

Remove `BLE_MOCK=true` (use `pnpm ios` / `pnpm android` / `pnpm start`) to run against a real BLE device. The app scans for any device named `CorSense` and reads the standard Heart Rate Measurement characteristic (`0x2A37`).

---

## Project structure

```
mocks/
└── heart-rate/
    ├── gatt-profile.json       ← GATT service/characteristic definition
    └── aa-bb-cc-dd-ee-11.js    ← device logic (named by MAC address)
test/
└── App.test.tsx                ← RNTL integration test
App.tsx                         ← React Native app
jest.setup.ts                   ← Jest setup (BLE mock config, safe-area mock)
metro.config.js                 ← Metro config with BLE_MOCK redirect
```

The device logic file (`aa-bb-cc-dd-ee-11.js`) simulates a heart rate monitor that:
- Advertises as `CorSense`
- Initialises with a BPM of 72
- Drifts the BPM randomly by ±3 each second while connected
- Accepts manual BPM overrides from the browser dashboard or test client

The GATT profile (`gatt-profile.json`) declares the Heart Rate Service (`0x180D`) with the Heart Rate Measurement characteristic (`0x2A37`, notify).

---

## Related

- [ble-faker on npm](https://www.npmjs.com/package/ble-faker)
- [ble-faker on GitHub](https://github.com/dmanto/ble-faker)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
