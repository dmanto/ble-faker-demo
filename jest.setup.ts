jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: unknown }) => children,
    SafeAreaView: ({ children, style }: { children: unknown; style?: object }) =>
      React.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

import fs from 'fs';
import path from 'path';
import os from 'os';

// Intercept the /ble-faker-config request that ble-faker/mock makes to
// discover the server — the same information that metro.config.js serves
// at runtime via the custom /ble-faker-config middleware.
const _originalFetch = global.fetch;
global.fetch = function (input, init) {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : (input as Request).url;

  if (url.endsWith('/ble-faker-config')) {
    let port = 58083;
    try {
      const info = JSON.parse(
        fs.readFileSync(path.join(os.homedir(), '.ble-faker-server.json'), 'utf8'),
      ) as { port: number };
      port = info.port;
    } catch {
      // server not running or state file missing — use default port
    }
    return Promise.resolve(
      new Response(
        JSON.stringify({
          port,
          dir: path.resolve(process.cwd(), 'mocks'),
          label: 'ble-faker-demo',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
  }

  return _originalFetch.call(this, input, init);
} as typeof fetch;
