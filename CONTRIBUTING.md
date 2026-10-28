# Contributing

Start with the local preview:

```sh
npm ci
npm run dev
```

Node.js 22.12+ or 24+ is required for the development toolchain. The core SDK has no runtime dependencies; the React adapter uses an optional peer dependency.

## Layout

- `src/components/` and `src/presentations/` — four separate JS components and rendering modules.
- `src/react/` — optional React components sharing lifecycle hooks.
- Other `src/` modules — shared core, validation, custom elements and prompt generator.
- `playground/` — interactive editor plus browser/framework harnesses.
- `scripts/fixture-server.mjs` — local cross-origin form; no accounts, database or real reservations.
- `tests/` — unit and browser integration tests.
- `examples/` — framework lifecycle recipes.
- `docs/` — integration reference and actual playground screenshots.

Keep the public API small and backwards compatibility explicit. Add focused tests for changes to lifecycle, origin validation, navigation and cleanup. Do not put booking business logic in the SDK.

Before a pull request:

```sh
npm run format
npm run check
npm run format:check
npx playwright install chromium firefox webkit
npm run test:e2e
npm pack --dry-run
```

Use local fixtures; never run mutating tests against a real restaurant. Do not commit credentials, private app sources, generated test output or `node_modules`.

## Releases

Update the changelog, run `npm version <version> --no-git-tag-version`, review changes and run all checks. This updates `src/version.ts`, keeping copied installation instructions aligned with the artifact. The current version's README / AI guide installation URLs must also be updated.

Create a `v<version>` tag only after the main branch checks pass. The release workflow builds an npm tarball and SHA-256 file and attaches them to a GitHub release (prerelease for `0.x`). It does **not** publish to the npm registry. The package's `files` allowlist limits archive contents. Verify the downloaded archive in a clean consumer project before announcing a release.
