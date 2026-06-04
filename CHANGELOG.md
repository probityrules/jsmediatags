# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.0] - 2026-06-02

Published to npm as **`@probityrules/jsmediatags`** from [probityrules/jsmediatags](https://github.com/probityrules/jsmediatags).

### Added

- TypeScript source with published `.d.ts` declarations (`build/jsmediatags.d.ts`).
- Promise-based API: `read(location)` without callbacks, `readAsync()`, and matching methods on `Reader` and `MediaTagReader`. Callbacks remain supported.
- `package.json` `"exports"` map with `types`, `browser`, and `default` conditions.
- GitHub Actions CI (build, browser bundle, test).
- `prepublishOnly` script to build Node and browser artifacts before publish.
- esbuild browser bundles (`dist/jsmediatags.js`, `dist/jsmediatags.min.js`).
- Jest test suite in root `test/` with TypeScript tests and shared helpers.

### Changed

- **Breaking:** `main` entry is now `build/jsmediatags.js` (compile TypeScript with `npm run build` before use, or consume from npm where artifacts are prebuilt).
- **Breaking:** Node.js `>=18` required.
- **Breaking:** Browser bundle is an esbuild IIFE exposing `jsmediatags` globally, replacing the previous Browserify/Closure Compiler UMD build.
- **Breaking:** `browser` field points at `dist/jsmediatags.min.js`.
- Migrated from Flow to TypeScript; shared types live in `src/types.ts` (formerly `FlowTypes.ts`).
- Dev tooling: TypeScript (`tsc`), esbuild, Jest 29, ts-jest.
- `optionalPeerDependencies` replaced with standard `peerDependencies` and `peerDependenciesMeta` for `buffer` and `react-native-fs`.

### Removed

- Flow, Babel, Browserify, Watchify, and Google Closure Compiler from the build pipeline.
- Bower (`bower.json`).
- Unused `react` / `react-native` devDependencies (React Native support remains via optional peers and source).

### Fixed

- ID3v2 frame flag defaults when partial flags are provided.
- `XhrFileReader` `Content-Length` parsing return type.

## [3.9.7] and earlier

See [git history](https://github.com/aadsm/jsmediatags/commits/master) for releases prior to the 4.0 modernization.
