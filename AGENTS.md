# Working in MenüQR Widget

This is the public framework-independent reservation widget SDK. Keep the hosted application, WordPress plugin and backend separate.

- Inspect relevant sources and tests before editing. Preserve unrelated changes.
- Use `MenüQR` in public text and `menueqr.de` for service URLs.
- No runtime dependencies without an explicit need. Keep browser imports safe during SSR.
- Mount only in client lifecycle and clean up DOM, listeners, frames and scroll locks.
- Validate iframe message origins **and** source windows. Do not weaken access or origin checks.
- Never expose credentials, guest data, private application sources or infrastructure details.
- Use local fixtures for tests. Do not submit real reservations or contact real guests.
- Run `npm run check`, `npm run format:check` and the relevant Playwright suite. Report browser/device coverage truthfully.
- Do not publish to npm or change repository visibility unless requested.
- Keep documentation and generated AI prompts aligned with the actual public API and release version.
