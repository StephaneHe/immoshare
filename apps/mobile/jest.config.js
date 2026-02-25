/**
 * Jest configuration for ImmoShare mobile app.
 * Merges with jest-expo preset to keep RN native module mocks intact.
 * Uses custom resolver for pnpm symlink deduplication (see jest.resolver.js).
 */
const path = require('path');
const preset = require('jest-expo/jest-preset');

// Monorepo root node_modules — single source of truth for module resolution
const rootNodeModules = path.resolve(__dirname, '../../node_modules');

module.exports = {
  ...preset,

  // Custom resolver to deduplicate pnpm symlinks
  resolver: './jest.resolver.js',

  // Force module resolution to monorepo root first, avoiding local symlinks
  moduleDirectories: ['node_modules', rootNodeModules],

  // Merge setupFiles: preset provides RN + Expo mocks, we add our own
  setupFiles: [...preset.setupFiles, './jest.setup.ts'],

  // pnpm stores packages in node_modules/.pnpm/pkg@version/node_modules/pkg/
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/[^/]+/node_modules/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand))',
  ],

  moduleNameMapper: {
    ...preset.moduleNameMapper,
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.spec.ts?(x)',
  ],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
};
