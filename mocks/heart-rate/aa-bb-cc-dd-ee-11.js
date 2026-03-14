/// <reference types="ble-faker/device" />

/**
 * CorSense heart rate monitor — ble-faker device mock
 *
 * Simulates the Bluetooth Heart Rate Service (0x180D).
 * Payload: byte 0 = flags (0x00 = 8-bit format), byte 1 = BPM.
 */

const HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';

/** @type {import('ble-faker/device').DeviceLogicFn} */
export default function (state, event) {
  const { vars } = state;

  if (event.kind === 'advertise') {
    return [{ name: 'CorSense', rssi: -62 }];
  }

  if (event.kind === 'start') {
    return [
      { vars: { bpm: 72 } },
      { in:  [{ name: 'bpm', label: 'Heart rate (bpm)' }] },
      { out: [{ name: 'bpm', label: 'Current BPM'      }] },
    ];
  }

  if (event.kind === 'connect') {
    console.log('App connected');
    return [heartRatePayload(vars.bpm), { set: { bpm: `${vars.bpm} bpm` } }];
  }

  if (event.kind === 'disconnect') {
    console.log('App disconnected');
  }

  if (event.kind === 'tick') {
    const delta = Math.round((Math.random() - 0.5) * 6);
    const bpm = Math.max(45, Math.min(180, vars.bpm + delta));
    return [{ vars: { bpm } }, heartRatePayload(bpm), { set: { bpm: `${bpm} bpm` } }];
  }

  if (event.kind === 'input' && event.id === 'bpm') {
    const bpm = Math.max(0, Math.min(255, parseInt(event.payload, 10) || vars.bpm));
    return [{ vars: { bpm } }, heartRatePayload(bpm), { set: { bpm: `${bpm} bpm` } }];
  }
}

function heartRatePayload(bpm) {
  const buf = Buffer.alloc(2);
  buf[0] = 0x00;
  buf[1] = bpm & 0xff;
  return [HEART_RATE_CHARACTERISTIC, buf.toString('base64')];
}
