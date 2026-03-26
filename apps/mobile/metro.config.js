// metro.config.js — pnpm monorepo support for Expo
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root (2 levels up from apps/mobile)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro resolve from both local and root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// 3. Enable symlink support (Metro 0.80+)
config.resolver.unstable_enableSymlinks = true;

// 4. Force React to resolve from apps/mobile/node_modules (avoid root 18.2.0)
config.resolver.extraNodeModules = {
  react: path.resolve(projectRoot, 'node_modules/react'),
  'react-native': path.resolve(projectRoot, 'node_modules/react-native'),
  'react-dom': path.resolve(projectRoot, 'node_modules/react-dom'),
};

module.exports = config;
