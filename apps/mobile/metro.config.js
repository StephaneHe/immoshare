// metro.config.js — pnpm monorepo support for Expo
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Monorepo root (2 levels up from apps/mobile)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the monorepo root so hoisted node_modules + workspace packages resolve during bundling.
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

// 5. Pin the Metro server root to the app dir. In a pnpm workspace Metro otherwise
//    derives the server root from the workspace root (where pnpm-workspace.yaml lives),
//    and then resolves the release `export:embed` entry (`--entry-file index.js`, passed
//    relative by the RN Gradle plugin) against the monorepo root instead of apps/mobile,
//    which fails the release APK build ("Unable to resolve module ./index.js").
config.server = config.server || {};
config.server.unstable_serverRoot = projectRoot;

module.exports = config;
