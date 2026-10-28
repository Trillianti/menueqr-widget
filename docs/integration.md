# Integration guide

## Service setup

1. Enable reservations and the reservation widget in the restaurant's MenüQR settings with an eligible subscription.
2. Add the embedding website's **origin** to the allowed sites: for example `https://restaurant.example`, without a path. `www`, different ports and different schemes are distinct origins.
3. Install a pinned release and mount using the public restaurant slug.
4. Verify on the actual website over HTTPS. Use the local fixture for development; do not create production reservations as a test without restaurant approval.

The backend enforces access, availability and reservation rules. A frontend option cannot grant access, approve a reservation or bypass an origin restriction. Receiving the form's `ready` message means the frame initialized, not that the service accepted a booking.

## Lifecycle API

```ts
import { mountReservations, type ReservationWidget } from '@menueqr/widget';

const widget: ReservationWidget = mountReservations(element, {
  restaurant: 'your-restaurant-slug',
  onOpen: () => console.log('Opened'),
  onReady: () => console.log('Form initialized'),
  onClose: ({ reason }) => console.log('Closed', reason),
});
```

- `open(): boolean`: opens an overlay, or returns whether an inline frame is present. Returns `false` if hidden, destroyed or native dialog support is unavailable. Repeated calls do not create another frame.
- `close(): void`: closes an overlay and restores focus to its launcher. Inline forms stay visible.
- `update(partial): void`: validates first. Invalid options throw without replacing the current view. A presentation change closes the current overlay and discards its in-frame draft. Updating only callbacks preserves the live frame.
- `destroy(): void`: releases listeners, the iframe, DOM and this instance's scroll lock. Idempotent. Mount again to create a new instance; updating a destroyed controller throws.
- `options`: immutable normalized configuration.
- `isOpen`: `true` for an open overlay or a displayed inline frame. It does not indicate successful loading or booking.

Close reasons: `api`, `escape`, `backdrop`, `frame`, `update`, `destroy`.

The SDK appends its own host without removing existing target content. Floating and tab hosts are portaled to `document.body` to avoid clipped or transformed ancestors; their lifecycle still belongs to the target/controller. Always clean up during client navigation.

## Browser / SSR behavior

Imports do not access browser globals. Mount after the page has a body and a connected HTML target, inside `useEffect`, `onMounted`, `onMount` or the equivalent client lifecycle. A missing target or a `file://` page produces a clear error.

Modern browsers with native `<dialog>`, Shadow DOM and `matchMedia().addEventListener` are the target. In browsers lacking native dialog support, clicking the launcher opens the restaurant's public reservation page in a new tab. An imperative `open()` returns `false`; use a normal reservation link as your own fallback if you use only a custom trigger.

Server-rendered HTML cannot show an interactive iframe before hydration. Keep an ordinary link in your page if you need a no-JavaScript fallback:

```html
<a href="https://www.menueqr.de/menu/your-restaurant-slug/reserve/">Reserve a table</a>
```

## Web Component

```ts
import { defineReservationsElement, type ReservationElement } from '@menueqr/widget/element';

defineReservationsElement(); // true on registration; false if unavailable/already registered
const element = document.querySelector<ReservationElement>('menueqr-reservations');
element?.open();
element?.close();
```

JavaScript option names map to attributes as follows:

| Attributes                                                 | Values                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------- |
| `restaurant`, `mode`, `language`, `color`, `label`, `side` | Same as JavaScript options                               |
| `offset-x`, `offset-y`, `inline-height`                    | Numeric strings                                          |
| `mobile`, `icon`                                           | Exactly `"true"` or `"false"`; presence alone is invalid |
| `nonce`                                                    | CSP style nonce                                          |
| `base-url`                                                 | Advanced local fixture origin only; see below            |

Events bubble from the custom element:

| Event           | `detail`                                |
| --------------- | --------------------------------------- |
| `menueqr:open`  | None                                    |
| `menueqr:ready` | None                                    |
| `menueqr:close` | `{ reason }`                            |
| `menueqr:error` | `{ message }` for invalid configuration |

Configuration changes are batched within a microtask. Removing an attribute restores its default; removing the custom element destroys the widget. Invalid updates emit an error and preserve the previous working instance. These events never expose guest or booking data.

## Content Security Policy and styling

The parent website must allow frames from `https://www.menueqr.de` in its `frame-src`. The service must independently allow the website's origin. Do not relax your policy to `*` or disable origin checks.

The SDK injects a style element into its Shadow DOM. If your CSP requires a style nonce, pass the same per-response nonce used by your server as `nonce`. Runtime CSS variables and positioning are assigned through DOM style properties; test the site's actual CSP, including `style-src-attr`, before rollout. A nonce is not a universal workaround for all CSP policies.

Colors and positions use the public options. The SDK does not inject global CSS, load fonts or support reaching into the hosted cross-origin form. Its launcher uses automatic black/white contrast; the service owns form styling.

The iframe is sandboxed, sends no referrer, and accepts lifecycle messages only from its exact origin and window. The package has no analytics or direct backend fetches. Opening the hosted form still contacts MenüQR; account for the hosted service in the website's applicable privacy disclosures.

## Local fixture origin

`baseUrl` defaults to `https://www.menueqr.de`. The only other accepted origins are loopback HTTP(S) origins (`localhost`, `127.0.0.1`, `[::1]`) with an optional port. Paths, query strings, credentials and arbitrary hosts are rejected.

This option exists for isolated development. The bundled playground uses `http://127.0.0.1:4311`, validates its local parent origin and never sends a real booking. Keep the default in production. Custom proxy domains and self-hosting the MenüQR backend are outside this MVP.

Configure local ports, if necessary:

```sh
WIDGET_PLAYGROUND_PORT=4410 WIDGET_FIXTURE_PORT=4411 npm run dev
```

## Troubleshooting

| Symptom                         | Check                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Form unavailable                | Restaurant widget/reservations enabled, subscription eligible, website origin approved     |
| Browser refuses the frame       | Parent `frame-src`, service origin permission, browser console CSP errors                  |
| Duplicate launchers             | Use one target/controller; do not also load the legacy script on the same integration      |
| Widget remains after navigation | Call `destroy()` in component cleanup                                                      |
| No UI during SSR                | Expected; mount on the client                                                              |
| Color rejected                  | Use a complete six-digit hex string, for example `#ff730a`                                 |
| Custom element does not mount   | Call `defineReservationsElement()` on the client; inspect `menueqr:error`                  |
| Invalid attribute               | Boolean values must be literal `true` / `false`; numeric attributes must be valid integers |

The direct reservation link remains available while a frame has not signalled readiness. It is a fallback, not a promise that an unavailable restaurant can accept bookings. This SDK does not retry or submit reservations on its own.
