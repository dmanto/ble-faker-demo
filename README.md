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

---

## Prerequisites

- Node.js 20+
- Expo Go or a simulator/emulator
- [ble-faker](https://www.npmjs.com/package/ble-faker) (installed as a devDependency — no global install needed)

---

## Setup

```sh
npm install
# or
pnpm install
```

---

## Running with the BLE mock

### 1. Start the ble-faker server

```sh
npm run ble:start
```

This starts the mock server at `http://localhost:58083`. Open that URL in your browser to see the live device dashboard.

### 2. Start Expo with the mock enabled

```sh
# iOS simulator
npm run ios:mock

# Android emulator
npm run android:mock

# Expo Go (scan QR code)
npm run start:mock
```

The `BLE_MOCK=true` flag tells Metro to redirect `react-native-ble-plx` imports to ble-faker's mock client. No changes to app code are needed.

### 3. Use the dashboard

Open `http://localhost:58083` in your browser. Click through to the **heart-rate** namespace and the CorSense device. From there you can:

- Watch the **Current BPM** output update in real time as the app receives it
- Override the heart rate by entering a value in the **Heart rate (bpm)** input
- Trigger a forced disconnect from the device panel to test the app's error handling

### 4. Stop the server

```sh
npm run ble:stop
```

---

## Project structure

```
mocks/
└── heart-rate/
    ├── gatt-profile.json       ← GATT service/characteristic definition
    └── aa-bb-cc-dd-ee-11.js    ← device logic (named by MAC address)
App.tsx                         ← React Native app
metro.config.js                 ← Metro config with BLE_MOCK redirect
```

The device logic file (`aa-bb-cc-dd-ee-11.js`) simulates a heart rate monitor that:
- Advertises as `CorSense`
- Initialises with a BPM of 72
- Drifts the BPM randomly by ±3 each second while connected
- Accepts manual BPM overrides from the browser dashboard

---

## Running without the mock

Remove `BLE_MOCK=true` (use `npm run ios` / `npm run android` / `npm run start`) to run against a real BLE device. The app scans for any device named `CorSense` and reads the standard Heart Rate Measurement characteristic (`0x2A37`).

---

## Related

- [ble-faker on npm](https://www.npmjs.com/package/ble-faker)
- [ble-faker on GitHub](https://github.com/dmanto/ble-faker)
- [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)
