const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
const reactNativeRoot = path.dirname(
  require.resolve('react-native/package.json', { paths: [projectRoot, workspaceRoot] }),
);
const emptyModulePath = require.resolve('metro-runtime/src/modules/empty-module.js', {
  paths: [reactNativeRoot],
});

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.unstable_enableSymlinks = true;
config.resolver.emptyModulePath = emptyModulePath;

module.exports = config;
