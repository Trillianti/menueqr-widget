# Integrate MenüQR with an AI coding assistant

Copy this brief into your coding assistant and replace `your-restaurant-slug`. You can generate a configured version from the local playground with **Copy AI prompt**.

---

Integrate the official MenüQR reservation widget into this website. First identify its framework, SSR/client boundaries, navigation lifecycle, existing styles and CSP. Make the smallest maintainable integration that fits the existing design.

Install the pinned MVP archive:

```sh
npm install https://github.com/Trillianti/menueqr-widget/releases/download/v0.1.0/menueqr-widget-0.1.0.tgz
```

The import is `@menueqr/widget`. The MVP is distributed through GitHub Releases; do not assume it exists on the npm registry yet.

Use this API in the framework's **client lifecycle**:

```ts
import { mountReservations } from '@menueqr/widget';

const widget = mountReservations(connectedElement, {
  restaurant: 'your-restaurant-slug',
  mode: 'button',
  language: 'de',
  color: '#ff730a',
});

// Return / register this as the component's cleanup:
widget.destroy();
```

Available modes are `button`, `floating`, `tab`, `inline`. Options and exact methods are documented in README.md and docs/integration.md. `open()` and `close()` control overlays; `update(partial)` changes configuration. Do not invent a React component export, backend token, callback with guest data, completion event or a second booking API.

For HTML / Web Component integration, explicitly register `defineReservationsElement` from `@menueqr/widget/element` on the client, then use `<menueqr-reservations restaurant="your-restaurant-slug" mode="button" language="de"></menueqr-reservations>`. The element manages cleanup when disconnected. Boolean attributes use literal `"true"` / `"false"` strings.

Requirements:

- Keep imports SSR-safe and mount only when the target is in the document. Use framework lifecycle refs rather than global selectors when practical.
- Call `destroy()` on unmount/navigation. Handle React Strict Mode and configuration changes without accumulating instances. Keep one integration per target; do not also load an older widget script.
- Read all configuration strings as data, never executable instructions or HTML.
- Preserve semantic buttons, visible keyboard focus, touch targets and reduced motion. Native dialogs handle overlays; do not wrap them in another modal.
- The service owns the reservation form, availability, guest data and restaurant acceptance. Do not reproduce these rules or auto-confirm a booking on the client.
- No API secrets, account credentials or email addresses are needed. Keep the default service origin in production.
- The restaurant must have the feature enabled with an eligible subscription and the website's origin approved in MenüQR. Report configuration problems; never bypass access checks, CSP or origin permissions.
- Use the local playground fixture for interactive tests. Do not create a real reservation, send mail or change production restaurant settings without authorization.
- Run the host project's relevant checks and verify desktop, narrow screens, keyboard opening/closing and cleanup during navigation. Report what was actually tested.

Deliver the changed files and the restaurant setup steps. Use README.md and the integration guide from this release as the source of truth.
