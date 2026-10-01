# ImmoShare

Monorepo pnpm — Backend Fastify/Prisma (`packages/api`) + Mobile React Native/Expo (`apps/mobile`).

## Règles standing du fleet

Ces règles s'appliquent à TOUS les projets du fleet (instaurées le 2026-04-30). Aucune release ne doit être poussée sans les respecter.

### Règle 1 — Versioning visible et incrémenté à chaque release

Chaque release/build DOIT (a) afficher un numéro de version **visible** sur le runtime, et (b) être **incrémenté** par rapport au build précédent.

**Adapté à ce projet (monorepo Node.js + Android via Expo) :**

| Composant | Source canonique | Surface visible (runtime) |
|-----------|------------------|---------------------------|
| API (`packages/api`) | `package.json` `"version"` + `APP_VERSION` const dans `src/server.ts` | Endpoint `GET /api/version` |
| Mobile JS (`apps/mobile`) | `package.json` `"version"` + `app.json` `expo.version` + `src/constants/version.ts` (`APP_VERSION`) | Footer dans `LoginScreen.tsx` ET `Profile/SettingsScreen.tsx` |
| Mobile Android | `apps/mobile/android/app/build.gradle` (`versionCode` + `versionName`) | UI (via `APP_VERSION` JS) |
| Monorepo | `package.json` racine `"version"` | — (reflète la version globale) |

**Règles d'incrémentation :**
- **patch** (`X.Y.Z` → `X.Y.Z+1`) — fix / petit changement
- **minor** (`X.Y.0` → `X.Y+1.0`) — nouvelle feature
- **major** (`X.0.0` → `X+1.0.0`) — breaking change
- **Android `versionCode`** : **strictement +1** à chaque build poussé (indépendant du bump semver de `versionName`)

**Démarrage :** `1.0.0` par défaut, ou conserver une version antérieure déjà présente et incrémenter à partir de là. (Ce projet est actuellement à `0.1.0`.)

**À bumper ENSEMBLE** lors de chaque release : `package.json` racine, `packages/api/package.json`, `apps/mobile/package.json`, `apps/mobile/app.json` (`expo.version`), `apps/mobile/android/app/build.gradle` (`versionCode` +1, `versionName` semver), `packages/api/src/server.ts` (`APP_VERSION`), `apps/mobile/src/constants/version.ts` (`APP_VERSION`).

### Règle 2 — Changelog (Keep a Changelog), couplé au versioning

Ce projet maintient un `CHANGELOG.md` à la racine, format [Keep a Changelog](https://keepachangelog.com).

**Format requis :**
- En-tête entrée : `## [X.Y.Z] - YYYY-MM-DD`
- Sections autorisées (dans cet ordre quand utilisées) : `Added`, `Changed`, `Fixed`, `Removed`, `Deprecated`, `Security`
- Plus récent en haut, sous une éventuelle section `## [Unreleased]`

**Couplage strict avec la Règle 1 :** aucune release ne doit être poussée sans (a) bump de version dans **toutes** les sources canoniques listées ci-dessus, ET (b) entrée correspondante dans `CHANGELOG.md`. Pas de version bumpée sans entrée changelog ; pas d'entrée changelog sans version bumpée.

---

> Pour les conventions techniques détaillées du projet (structure modulaire backend, règles d'interaction ADB pour l'émulateur Android, etc.), voir `.claude/CLAUDE.md`.
