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
  updates: {
    ...(expoConfig.updates || {}),
    url: 'https://u.expo.dev/2a1dfbb6-a789-4560-a14c-fa396b1b6a22',
  },
  extra: {
    ...(expoConfig.extra || {}),
    eas: {
      ...((expoConfig.extra && expoConfig.extra.eas) || {}),
      projectId: '2a1dfbb6-a789-4560-a14c-fa396b1b6a22',
    },
  },
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
