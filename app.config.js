const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withGradleVersion = (config, gradleVersion) =>
  withDangerousMod(config, [
    'android',
    (config) => {
      const filePath = path.join(
        config.modRequest.projectRoot,
        'android/gradle/wrapper/gradle-wrapper.properties',
      );
      const contents = fs.readFileSync(filePath, 'utf8');
      const updated = contents.replace(
        /distributionUrl=.*/,
        `distributionUrl=https\\://services.gradle.org/distributions/gradle-${gradleVersion}-all.zip`,
      );
      fs.writeFileSync(filePath, updated);
      return config;
    },
  ]);

module.exports = withGradleVersion(
  {
    expo: {
      name: 'ble-faker-demo',
      slug: 'ble-faker-demo',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'light',
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      ios: {
        supportsTablet: true,
        bundleIdentifier: 'com.dmanto.blefakerdemo',
      },
      android: {
        package: 'com.dmanto.blefakerdemo',
        adaptiveIcon: {
          backgroundColor: '#E6F4FE',
          foregroundImage: './assets/android-icon-foreground.png',
          backgroundImage: './assets/android-icon-background.png',
          monochromeImage: './assets/android-icon-monochrome.png',
        },
        predictiveBackGestureEnabled: false,
      },
      web: {
        favicon: './assets/favicon.png',
      },
      plugins: ['react-native-ble-plx'],
    },
  },
  '8.10.2',
);
