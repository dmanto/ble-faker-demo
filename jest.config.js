/** @type {import('jest-expo').JestExpoConfig} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^react-native-ble-plx$': '<rootDir>/node_modules/ble-faker/dist/mock.js',
    '^ble-faker/mock$': '<rootDir>/node_modules/ble-faker/dist/mock.js',
    '^ble-faker/test$': '<rootDir>/node_modules/ble-faker/dist/test-client.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(\\.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|native-base|ble-faker|react-native-ble-plx-mock|react-native-safe-area-context))',
  ],
};
