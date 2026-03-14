/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const appJson = require('./app.json');

const appVariant = process.env.APP_VARIANT === 'development' ? 'development' : 'production';
const isDevelopment = appVariant === 'development';

const expoConfig = appJson.expo || {};
const androidConfig = expoConfig.android || {};
const iosConfig = expoConfig.ios || {};

module.exports = {
  ...expoConfig,
  name: isDevelopment ? 'School-tiffin (dev)' : 'School-tiffin',
  android: {
    ...androidConfig,
    // Use a separate package in development so dev/prod can be installed together.
    package: isDevelopment ? 'com.schooltiffin.mobile.dev' : 'com.schooltiffin.mobile',
  },
  ios: {
    ...iosConfig,
    bundleIdentifier: isDevelopment ? 'com.schooltiffin.mobile.dev' : 'com.schooltiffin.mobile',
  },
};
