# Repository and release controls

The policy files in `.github/rulesets/` describe the live GitHub rulesets. Merging
these JSON files alone does not configure GitHub. An administrator applies a new
policy with `gh api --method POST repos/Trillianti/menueqr-widget/rulesets --input <file>`
or updates its existing ID with `PUT`. Review the live rules after every change.

## Main and release tags

- `main` requires a PR, one approval, resolved review threads and all seven CI
  contexts listed in `main.json`. Changes to release/build configuration and
  dependency manifests require the owner identified by `.github/CODEOWNERS`.
- Stale approvals are dismissed when new commits are pushed. Direct writes,
  deletion and force-pushes are blocked for normal contributors.
- Repository administrators can explicitly bypass main's rules **through a PR
  only**. This keeps the single-maintainer repository recoverable and permits its
  owner to merge their own reviewed changes. This is an administrative exception,
  not a substitute for reviewing the diff and waiting for green checks.
- Only repository administrators can create `v*` release tags. A separate ruleset
  prevents anyone from updating or deleting these tags, including administrators.
  Correct a release by creating a new version, never by moving a published tag.

The release workflow continues to require a version-matching commit already in
main. It checks and transfers one archive to a fresh OIDC publication job, with no
dependency installs or package hooks in that job. No npm token is needed.

## Dependency security

Enable **Dependabot alerts** and **Dependabot security updates** in the repository
settings. `.github/dependabot.yml` adds weekly npm and GitHub Actions update PRs.
CI reviews introduced dependencies and fails on known high/critical advisories;
the scheduled workflow repeats the audit weekly even when no code changes. The
release preparation job runs the same audit before producing an archive.

Actions are pinned to reviewed commit SHAs. Keep secret scanning and push
protection enabled. Do not add a long-lived npm or administration token to CI.

## Service contract verification

`npm run check` includes local HTTP contract tests for allowed, origin-denied and
unavailable restaurants, CORS, CSP and access failures. Browser tests separately
exercise trusted ready/close messages, failure recovery and keyboard access using
the local cross-origin fixture. They do not prove that an independently deployed
hosted application implements the same contract.

For a staging service with three public **test** restaurant slugs, run:

```sh
WIDGET_CONTRACT_BASE_URL=https://staging.example \
WIDGET_CONTRACT_PARENT_ORIGIN=https://test-restaurant.example \
WIDGET_CONTRACT_ALLOWED=allowed-test \
WIDGET_CONTRACT_BLOCKED=blocked-test \
WIDGET_CONTRACT_UNAVAILABLE=disabled-test \
npm run check:hosted
```

The command issues GET requests only, omits credentials, refuses redirects and
does not submit reservations. It checks diagnostics, CORS, frame responses and
explicit `frame-ancestors` permissions. No live target is selected by default.
The manual **Hosted widget contract** workflow accepts the same public inputs.
Do not supply account tokens, guest data or credentials.

After a staging deployment, also open its test form from the approved test site,
verify trusted ready and close signals, and repeat with an unapproved website.
Use fictional guests if further testing is explicitly authorized. This repository
does not contain the backend or verify its storage, rate limiting or booking rules.
