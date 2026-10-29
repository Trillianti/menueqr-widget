# Publishing @menueqr/widget

The repository uses npm Trusted Publishing (OIDC). GitHub provides a short-lived identity for a specific release job; no `NPM_TOKEN` or application environment variable is needed. The authoritative reference is [npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/).

## One-time owner setup

1. Create and verify an npm account, enable two-factor authentication, and create or obtain publishing access to the `menueqr` organization. The package scope is independent of the GitHub username.
2. Bootstrap the public package from a clean, merged checkout. npm's package settings become available after this first publication. Run these commands from this repository, not from an installed copy of the widget:

   ```sh
   git switch main
   git pull --ff-only
   npm ci
   npm login
   npm run check
   npm run release:pack
   npm publish ./release/menueqr-widget-0.3.0.tgz --access public --registry https://registry.npmjs.org --ignore-scripts
   ```

   Complete npm's 2FA prompt yourself. `release:pack` only prepares files. The final `npm publish` command makes version `0.3.0` publicly available. If that version already exists, never replace it with different bytes; choose a new version instead.

3. Open the npm package's **Settings → Trusted publishing**, add **GitHub Actions**, and enter:

   | Field                | Value                        |
   | -------------------- | ---------------------------- |
   | Organization or user | `Trillianti`                 |
   | Repository           | `menueqr-widget`             |
   | Workflow filename    | `release.yml`                |
   | Environment name     | Leave empty                  |
   | Allowed actions      | Enable **Allow npm publish** |

   Enter the filename only, without `.github/workflows/`. The current npm default permits staging; direct automatic publication needs **Allow npm publish**. No separate `npm dist-tag` permission is used.

4. Publish the next version through the workflow, for example `0.3.1`, within two days of creating the trusted publisher. npm expires an unvalidated configuration after that window. A successful OIDC publication validates the connection. The manual bootstrap is not an OIDC validation.

5. After verifying OIDC publication, the npm setting **Require two-factor authentication and disallow tokens** can be used; trusted publishing continues to work with it. Do not add a long-lived publishing token to GitHub Secrets.

## Validate GitHub setup without publishing

Open **Actions → Release package → Run workflow** and select **main**. This runs the checks, creates the npm tarball, transfers it to the second job and verifies its checksum, package metadata and source commit. npm publication and GitHub release creation are skipped for manual runs.

Use this before owner setup or when testing the workflow. It validates packaging and job handoff, not npm permissions. Only an actual tag publication can verify the npm OIDC connection. GitHub release-artifact storage is used temporarily, with seven-day retention.

## Subsequent releases

Update `CHANGELOG.md`, then prepare a version on a release branch:

```sh
npm version 0.3.1 --no-git-tag-version
npm run check
git add package.json package-lock.json src/version.ts CHANGELOG.md
git commit -m "chore: prepare widget 0.3.1"
```

Merge that commit into `main` through the normal PR checks. Then, from the updated `main` checkout:

```sh
git pull --ff-only
git tag v0.3.1
git push origin v0.3.1
```

The tag must match `package.json` and the synchronized `src/version.ts`. The release commit must already belong to `main`. Tags do not move automatically when a later commit fixes a release; prepare a new version instead of rewriting a published release.

The workflow:

- runs the package checks, release-policy tests, all browser journeys and the installed-package Next.js checks without publishing permissions;
- packs once and passes that exact archive, checksum and source commit to the publication job;
- uses a fresh job with no dependency installation or lifecycle hooks to publish through OIDC with provenance;
- publishes versions such as `0.3.1` to `latest`, and explicit prereleases such as `0.4.0-beta.1` to `next`;
- attaches the published archive and `SHA256SUMS` to a GitHub release after npm succeeds.

Releases are serialized. A new stable version cannot move `latest` backwards. If a version already exists with identical archive integrity, a retry skips the npm publish. Different bytes under the same version stop the workflow. This also permits a tag workflow to recognize a manually bootstrapped version, although that skipped publish does not validate a new OIDC configuration.

## Verify a release

```sh
npm view @menueqr/widget@0.3.1 version dist.integrity
npm view @menueqr/widget dist-tags
```

Install the released package in a clean consumer project and check its integration. npm, pnpm, Yarn and Bun read the same npm registry package; no separate publication is needed.
