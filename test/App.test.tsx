/**
 * RNTL test for the heart rate monitor app using ble-faker.
 *
 * Requires the ble-faker server to be running:
 *   npm run ble:start
 *
 * How namespace sharing works:
 *   ble-faker derives the namespace token from a hash of the absolute mocks
 *   directory path. The mock BleManager (used by the app) and BleTestClient
 *   (used by this test) both call POST /mount with the same dir, so they end
 *   up in the same namespace and share device state.
 *
 *   Key ordering: we call client.mount({ disableAutoTick: true }) AFTER the
 *   app has scanned (so the mock has already mounted the namespace) but BEFORE
 *   the app connects (so the tick interval is started with autoTick disabled).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import path from 'path';
import App from '../App';
import { BleTestClient, BleNamespace } from 'ble-faker/test';

const DEVICE_ID = 'aa-bb-cc-dd-ee-11';
const MOCKS_DIR = path.resolve(__dirname, '../mocks');

jest.setTimeout(30_000);

describe('heart rate monitor — RNTL + ble-faker', () => {
  let client: BleTestClient;
  let ns: BleNamespace;
  let unmountApp: () => void;

  beforeAll(() => {
    client = BleTestClient.connect();
  });

  afterAll(async () => {
    unmountApp?.();
    if (ns) await client.unmount(ns);
  });

  it('scans device → connects → injects BPM values → disconnects → re-scans', async () => {
    ({ unmount: unmountApp } = render(<App />));

    // ── 1. Scan ────────────────────────────────────────────────────────────
    // Tapping scan triggers startDeviceScan → mock mounts the namespace and
    // polls the device list. CorSense appears once the poll completes (~800 ms
    // per the mock library's discovery interval).
    fireEvent.press(screen.getByTestId('scan-button'));
    await waitFor(() => screen.getByText('CorSense'), { timeout: 10_000 });

    // ── 2. Disable auto-tick before connecting ─────────────────────────────
    // Mount the test client into the SAME namespace (same dir → same token).
    // This updates disableAutoTick = true on the namespace so the tick
    // interval won't start when the WebSocket bridge opens.
    ns = await client.mount({
      dir: MOCKS_DIR,
      label: 'rntl-test',
      disableAutoTick: true,
    });
    const device = ns.device(DEVICE_ID);

    // ── 3. Connect ─────────────────────────────────────────────────────────
    fireEvent.press(screen.getByText('CorSense'));
    // The connect event sends the initial BPM notification; wait for the
    // bpm-value element to appear (the ActivityIndicator is shown until then).
    await waitFor(() => screen.getByTestId('bpm-value'), { timeout: 5_000 });

    // ── 4. Inject BPM = 100 and verify ────────────────────────────────────
    await device.input('bpm', '100');
    await waitFor(() => screen.getByText('100'), { timeout: 5_000 });

    // ── 5. Inject BPM = 150 and verify ────────────────────────────────────
    await device.input('bpm', '150');
    await waitFor(() => screen.getByText('150'), { timeout: 5_000 });

    // ── 6. Simulate device disconnecting ──────────────────────────────────
    await device.forceDisconnect();
    await waitFor(() => screen.getByText('Connection Lost'), { timeout: 5_000 });

    // ── 7. Back to scan state ──────────────────────────────────────────────
    fireEvent.press(screen.getByTestId('back-to-scan'));
    await waitFor(() => screen.getByTestId('scan-button'));

    // ── 8. Re-scan — device is still discoverable ──────────────────────────
    fireEvent.press(screen.getByTestId('scan-button'));
    await waitFor(() => screen.getByText('CorSense'), { timeout: 10_000 });
  });
});
