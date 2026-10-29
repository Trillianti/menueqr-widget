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

## Next.js consumer verification

With Next.js, React and React DOM already installed in a local project:

```sh
NEXT_SMOKE_MODULES=/absolute/path/to/next-project/node_modules npm run test:next
```

The module directory is read-only input. This command builds and packs the SDK, creates a disposable Next.js app in the system temporary folder and runs its generated root layout on loopback port `4340`. Browser tests intercept hosted-form requests locally. It verifies server metadata, client hydration, route transitions and refresh, then stops only its own server processes. `NEXT_SMOKE_PORT` changes that test port if needed. These variables are development-only and are not required by an installed widget.

## Releases

Update the changelog and run `npm version <version> --no-git-tag-version`. Review and commit `package.json`, `package-lock.json`, `src/version.ts` and the changelog together. Installation examples use the registry package name, so they need no versioned GitHub URL edits.

After the version commit is merged into `main` and checks pass, push a matching `v<version>` tag. The release workflow tests and packs the SDK, then publishes the checked tarball through npm Trusted Publishing and attaches the archive/checksum to a GitHub release. Stable `0.x` versions use `latest`; versions with an explicit prerelease suffix use `next`. A manual Actions run on `main` validates the release without publishing.

Complete the [one-time npm owner setup](docs/publishing.md) before the first automatic publication. No long-lived npm token is required. The package's `files` allowlist limits archive contents. Verify the published package in a clean consumer project before announcing a release.
