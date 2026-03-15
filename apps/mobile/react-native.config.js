/* eslint-env node */
const isDevelopment = process.env.APP_VARIANT === 'development';

module.exports = {
  project: {
    android: {
      packageName: isDevelopment ? 'com.schooltiffin.mobile.dev' : 'com.schooltiffin.mobile',
    },
  },
};
