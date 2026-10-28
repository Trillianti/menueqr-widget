# Integration reference

## Restaurant setup

Enable reservations and the widget in the restaurant's MenüQR settings with an eligible subscription. Add the embedding website's origin, for example `https://restaurant.example`. Paths are not origins; `www`, ports and schemes are distinct.

Set `restaurant` to the public slug (`bistro-lumi`) or a MenüQR menu URL (`https://www.menueqr.de/menu/bistro-lumi/`). Links under `menueqr.de` and `www.menueqr.de` are accepted over HTTPS. Supported menu tab paths and query/fragment suffixes are normalized to the slug. Foreign hosts, credentials, internal dashboard links and private reservation links are rejected.

No internal restaurant ID is necessary. The service independently enforces feature access, availability, website origins and acceptance. Knowing a slug does not grant management access. The frame's `ready` signal indicates initialization, not a successful reservation.

## Separate components

| Presentation | JS import path    | Mount function             | Custom element                 |
| ------------ | ----------------- | -------------------------- | ------------------------------ |
| Button       | `@menueqr/widget` | `mountReservationButton`   | `menueqr-reservation-button`   |
| Floating     | `@menueqr/widget` | `mountReservationFloating` | `menueqr-reservation-floating` |
| Tab          | `@menueqr/widget` | `mountReservationTab`      | `menueqr-reservation-tab`      |
| Inline       | `@menueqr/widget` | `mountReservationInline`   | `menueqr-reservation-inline`   |

Each presentation has its own rendering module. They reuse the button primitive, iframe transport, validation and lifecycle. A mounted component cannot change its type via configuration: destroy/unmount it and mount the other component. Do not pass `mode` to these components.

Use the package root for all four JS components. The `/button`, `/floating`, `/tab` and `/inline` subpaths remain supported for compatibility. ESM and CommonJS entry points preserve module boundaries, sharing one lifecycle registry. Mounting a different component onto an occupied target throws; repeated mounts of the same component update its existing controller.

## JS lifecycle

```ts
import { mountReservationButton } from '@menueqr/widget';
const widget = mountReservationButton(element, {
  restaurant: 'bistro-lumi',
  onOpen: () => console.log('Opened'),
  onReady: () => console.log('Form initialized'),
  onClose: ({ reason }) => console.log('Closed', reason),
});
```

- `open(): boolean`: opens an overlay, or reports whether an inline frame is displayed. Returns false if hidden, destroyed or native dialog support is unavailable.
- `close(): void`: closes an overlay and restores launcher focus. Inline stays displayed.
- `update(partial): void`: validates before changing restaurant, language, appearance or callbacks. A view change closes the overlay and discards its in-frame draft. Updating only callbacks preserves the frame. Invalid configuration leaves the previous instance intact.
- `destroy(): void`: releases the iframe, listeners, DOM and this instance's scroll lock. Safe to repeat. A destroyed controller cannot be updated.
- `options`: immutable normalized configuration. The restaurant reference is resolved to its slug.
- `isOpen`: whether an overlay or inline frame is displayed; it does not imply successful loading or booking.

Close reasons: `api`, `escape`, `backdrop`, `frame`, `update`, `destroy`.

Floating and Tab hosts are portaled to `document.body` to avoid clipping; their ownership still belongs to the original target. Clean them up during client navigation.

## React and Next.js

Import the separate components from `@menueqr/widget/react` in your page or layout. The library already declares its own client boundary. A Next.js server layout can keep its metadata and server behavior when it passes serializable options; event callbacks require a separate client wrapper. React is an optional peer dependency for this adapter, never a dependency of the core JS API. Each component accepts the shared restaurant/style/callback props and optional `id`, `className`, `style` for its mounting div.

Prop changes update the existing controller; unmount releases it. Replacing the component type tears down the old presentation. Strict Mode mount/cleanup cycles are supported. Imports and server rendering do not mount a browser iframe.

## Web Components

Register with `defineReservationButtonElement()`, `defineReservationFloatingElement()`, `defineReservationTabElement()`, `defineReservationInlineElement()` from `@menueqr/widget/element`. Each returns true on registration and false during SSR or if the name already exists. `defineReservationElements()` registers all four.

Attributes: `restaurant`, `language`, `color`, `label`, `side`, `offset-x`, `offset-y`, `mobile`, `icon`, `inline-height`, `nonce`, `base-url`. There is no supported `mode` attribute for these fixed components. Boolean values must be literal `"true"` / `"false"` strings. Numeric values are integer strings.

Changes are batched in a microtask. Attribute removal restores defaults. Removing the element destroys its controller. Invalid updates emit `menueqr:error` and preserve the previous instance.

| Event           | `detail`                                |
| --------------- | --------------------------------------- |
| `menueqr:open`  | None                                    |
| `menueqr:ready` | None                                    |
| `menueqr:close` | `{ reason }`                            |
| `menueqr:error` | `{ message }` for invalid configuration |

Events bubble from the custom element and contain no guest data. The element also exposes `open()` / `close()`.

## Browser / SSR and CSP

Importing is safe during SSR. With the JS API mount only after the page has a body and a connected HTML target. Serve via HTTP(S), not `file://`.

Modern native dialog, Shadow DOM and media-query event support are the target. When native dialogs are unavailable, clicking a launcher opens the public reservation page in a new tab. Imperative `open()` returns false; provide a normal link if you use only a custom trigger. Keep a regular reservation link for no-JavaScript visitors if needed.

The host's `frame-src` must allow `https://www.menueqr.de`. The service must also allow the host's origin. Do not use wildcard permissions or disable origin checks.

Isolated styles are injected into Shadow DOM. Pass a server-generated `nonce` if your CSP requires one. The SDK sets CSS variables and position through DOM style properties; test the website's actual `style-src-attr` policy. A nonce does not resolve every CSP configuration.

The sandboxed frame sends no referrer. Lifecycle messages must come from its exact origin and source window. The SDK has no telemetry or direct backend fetches; opening the hosted frame still contacts MenüQR and should be covered by the site's applicable privacy disclosures.

## Local preview

`baseUrl` defaults to `https://www.menueqr.de`. Only explicit loopback HTTP(S) origins (`localhost`, `127.0.0.1`, `[::1]`) are also accepted for local fixtures. Paths, credentials, query strings and arbitrary origins are rejected. Keep the default in production.

The playground uses ports `4310` and `4311`. Example times and contact data are local fixture state, not live restaurant availability. Preview submissions never leave the browser. The separate Live Preview control opts into the hosted restaurant form; it can create real bookings if submitted.

```sh
WIDGET_PLAYGROUND_PORT=4410 WIDGET_FIXTURE_PORT=4411 npm run dev
```

## Compatibility

The `mountReservations` API and generic `menueqr-reservations` element from 0.1.x are retained and deprecated. They alone support the old `mode` configuration. New code should use the separate components. Destroy an old integration before mounting a new component on the same target; do not also load the legacy script.

## Troubleshooting

Unavailable frame: check widget/reservations enabled, subscription eligibility, website origin approval and CSP. Missing mount target or server-side mounting produces a configuration error. A direct-link fallback remains while a frame has not reported readiness; it does not bypass restaurant availability or permissions.

## Generated setup guides

Select React, Next.js, JavaScript or Web Component in the playground. Each guide contains the pinned install command, complete component/layout example and restaurant setup steps. React / Next.js support TypeScript TSX and JavaScript JSX output. JSX components are rendered in the React and Next.js previews; the Next.js preview is a browser preview of that same component, not an embedded Next.js server.

`createIntegrationGuide({ restaurant, component, integration, codeLanguage })` from `@menueqr/widget/prompt` returns the install command, primary file, optional support file and notes. `createIntegrationPrompt` accepts the same `integration` choice; its AI instructions match the selected framework. The default for these helper functions remains `api` for compatibility.

## Plain HTML without a bundler

The npm examples assume a project build that resolves package imports. For a plain HTML site, download the pinned release archive and copy the **entire** `package/dist/` directory to `/vendor/menueqr-widget/` on your website. Preserve the module paths.

Create `booking-setup.js` on that website:

```js
import { defineReservationFloatingElement } from '/vendor/menueqr-widget/element.js';
defineReservationFloatingElement();
```

Then add this to the page:

```html
<script type="module" src="/booking-setup.js"></script>
<menueqr-reservation-floating restaurant="bistro-lumi"></menueqr-reservation-floating>
```

This uses self-hosted browser modules and needs no React runtime. Serve over HTTP(S) with JavaScript MIME types and the required frame permission. A CMS must allow you to include the setup module; for WordPress, the dedicated MenüQR plugin handles the integration instead.
