/**
 * Custom Jest resolver for pnpm monorepo.
 *
 * Problem: pnpm creates symlinks in each package's node_modules/ pointing to
 * .pnpm/pkg@version/node_modules/pkg/. When the same package is required
 * from different paths, Node.js (and Jest) creates separate module cache entries,
 * even though they resolve to the same file. This causes "dual React instance"
 * crashes where hooks fail with "Cannot read properties of null (reading 'useState')".
 *
 * Solution: Intercept resolution and resolve symlinks for critical packages (react,
 * react-dom, react-native) so they always map to the same cache key.
 */
const path = require('path');
const fs = require('fs');

// Packages that MUST be singletons
const SINGLETON_PACKAGES = ['react', 'react-native'];

// Cache resolved paths
const resolvedCache = {};

module.exports = (request, options) => {
  // Use default resolver first
  const defaultResolver = options.defaultResolver;
  const resolved = defaultResolver(request, options);

  // For singleton packages, resolve symlinks to canonical path
  const isSingleton = SINGLETON_PACKAGES.some(
    (pkg) => request === pkg || request.startsWith(pkg + '/')
  );

  if (isSingleton) {
    if (!resolvedCache[resolved]) {
      try {
        resolvedCache[resolved] = fs.realpathSync(resolved);
      } catch {
        resolvedCache[resolved] = resolved;
      }
    }
    return resolvedCache[resolved];
  }

  return resolved;
};
