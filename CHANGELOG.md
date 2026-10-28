# Changelog

## 0.2.0

- Four separate reservation components with their own presentation modules and JS entry points.
- React / Next.js components and four fixed Web Components; no `mode` setting in the new API.
- Restaurant configuration accepts either a public slug or a MenüQR menu link.
- Playground restaurant field, explicit live-preview opt-in and generated component-specific code / AI prompts.
- Preview form matches the WordPress guest interface, including dates, party size, contacts, languages and the linked MenüQR footer.
- Shared module registry across package entry points; 0.1.x APIs remain available for compatibility.

## 0.1.0

Initial public MVP.

- Typed JavaScript API with button, floating, edge tab and inline layouts.
- Explicitly registered Web Component, nine UI languages and configurable accent/placement.
- SSR-safe ESM/CommonJS builds and TypeScript declarations; no runtime dependencies.
- Isolated styling, native dialog focus/dismissal and iframe origin/source validation.
- Local playground, cross-origin preview fixture and configured AI integration prompts.
- Unit tests and browser integration tests including React Strict Mode and Vue lifecycle.
- GitHub release archive distribution; npm registry publication is deferred.
