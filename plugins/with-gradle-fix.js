const { withGradleProperties } = require('@expo/config-plugins');

// Workaround for https://github.com/facebook/react-native/issues/55781
// @react-native/gradle-plugin ships foojay-resolver-convention 0.5.0 which
// references JvmVendorSpec.IBM_SEMERU, removed in Gradle 9.0.0.
// Disabling auto-download bypasses the foojay resolver entirely.
module.exports = (config) =>
  withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => item.key !== 'org.gradle.java.installations.auto-download',
    );
    config.modResults.push({
      type: 'property',
      key: 'org.gradle.java.installations.auto-download',
      value: 'false',
    });
    return config;
  });
