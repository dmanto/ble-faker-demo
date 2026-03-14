const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');
const os = require('os');

const config = getDefaultConfig(__dirname);

if (process.env.BLE_MOCK) {
  const bleFakerRoot = path.resolve(__dirname, 'node_modules/ble-faker');
  const serverInfoPath = path.join(os.homedir(), '.ble-faker-server.json');

  config.watchFolders = [...(config.watchFolders ?? []), bleFakerRoot];

  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react-native-ble-plx') {
      return { filePath: path.join(bleFakerRoot, 'dist/mock.js'), type: 'sourceFile' };
    }
    return context.resolveRequest(context, moduleName, platform);
  };

  const originalMiddleware = config.server?.enhanceMiddleware;
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware, server) => {
      const enhanced = originalMiddleware ? originalMiddleware(middleware, server) : middleware;
      return (req, res, next) => {
        if (req.url === '/ble-faker-config') {
          const info = fs.existsSync(serverInfoPath)
            ? JSON.parse(fs.readFileSync(serverInfoPath, 'utf8'))
            : {};
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            port: info.port ?? 58083,
            dir: path.join(__dirname, 'mocks'),
            label: 'ble-faker-demo',
          }));
          return;
        }
        enhanced(req, res, next);
      };
    },
  };
}

module.exports = config;
