<div align="center">

# MenüQR Widget

### A table for two. A few lines of code.

The reservation flow for your restaurant website.<br />
Four components. Any framework. One public restaurant link.

[![npm](https://img.shields.io/npm/v/@menueqr/widget?style=flat-square&color=ef6709&label=npm)](https://www.npmjs.com/package/@menueqr/widget)
[![CI](https://github.com/Trillianti/menueqr-widget/actions/workflows/ci.yml/badge.svg)](https://github.com/Trillianti/menueqr-widget/actions/workflows/ci.yml)
[![MIT license](https://img.shields.io/badge/license-MIT-202a24?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-included-202a24?style=flat-square)](docs/integration.md)

**[Live demo](https://www.menueqr.de/en/reservierungswidget/)** · **[Quick start](#quick-start)** · **[Integration reference](docs/integration.md)** · **[AI prompt](AI_INTEGRATION.md)**

[![The real Floating widget on an example restaurant website](https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-floating.jpg)](https://www.menueqr.de/en/reservierungswidget/)

</div>

**Built to fit your website, without building another booking system.** The SDK handles the entry point, presentation and lifecycle. [MenüQR](https://www.menueqr.de) handles availability, configurable guest fields and reservation requests. The restaurant accepts each booking in its dashboard.

- **Zero runtime dependencies** in the core. React is an optional adapter.
- **Four separate components**, with a typed API and automatic cleanup in React.
- **Full-screen booking on phones**, keyboard support and reduced-motion support.
- **Nine languages**, configurable colour and placement. No API key in your frontend.

The SDK is **free and MIT-licensed**. Live reservations require a published MenüQR restaurant with **PRO or above**, enabled reservations and an approved website origin. The online demo uses sample times and does not create bookings.

## Pick your entry point

<table>
<tr>
<td width="50%">

### 01 / Button

A button in your layout. A dialog above it.

[![Button reservation dialog](https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-button.jpg)](https://www.menueqr.de/en/reservierungswidget/?variant=button#widget-demo)

```tsx
<ReservationButton restaurant="bistro-lumi" />
```

</td>
<td width="50%">

### 02 / Floating

A corner launcher that grows into a booking panel.

[![Floating reservation panel](https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-floating.jpg)](https://www.menueqr.de/en/reservierungswidget/?variant=floating#widget-demo)

```tsx
<ReservationFloating restaurant="bistro-lumi" />
```

</td>
</tr>
<tr>
<td width="50%">

### 03 / Tab

A slim page-edge tab. A drawer from the side.

[![Tab reservation drawer](https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-tab.jpg)](https://www.menueqr.de/en/reservierungswidget/?variant=tab#widget-demo)

```tsx
<ReservationTab restaurant="bistro-lumi" />
```

</td>
<td width="50%">

### 04 / Inline

The booking form, already part of your page.

[![Inline reservation form](https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-inline.jpg)](https://www.menueqr.de/en/reservierungswidget/?variant=inline#widget-demo)

```tsx
<ReservationInline restaurant="bistro-lumi" />
```

</td>
</tr>
</table>

Each has its own React component, JavaScript mount function and custom element. **Choose a component, rather than passing a `mode` prop.** All four share the same hosted booking flow.

<details>
<summary><strong>See the mobile booking flow</strong></summary>

<img src="https://raw.githubusercontent.com/Trillianti/menueqr-widget/main/docs/screenshots/showcase-mobile.jpg" width="280" alt="The real reservation contact step on a phone, with a fixed action button" />

Overlay components open full screen on narrow devices. The same guest fields, booking conditions and language settings follow the restaurant across integrations.

</details>

## Quick start

Install with the package manager your project already uses. Run **one** command:

```sh
npm install @menueqr/widget
# or
pnpm add @menueqr/widget
# or
yarn add @menueqr/widget
# or
bun add @menueqr/widget
```

### React

Place the component in your page or shared layout. Mounting and cleanup are automatic.

```tsx
import { ReservationFloating } from '@menueqr/widget/react';

export default function App() {
  return <ReservationFloating restaurant="bistro-lumi" language="en" color="#ef6709" />;
}
```

`ReservationButton`, `ReservationTab` and `ReservationInline` use the same import path.

### Next.js App Router

Add the component inside your existing layout's `<body>`:

```tsx
import { ReservationFloating } from '@menueqr/widget/react';

// Inside your existing app/layout.tsx:
<body>
  {children}
  <ReservationFloating restaurant="bistro-lumi" />
</body>;
```

Keep your existing fonts, providers and metadata. The adapter already has a `"use client"` boundary; your layout can stay a Server Component. Put event callbacks in a separate client wrapper. [Full Next.js guide →](docs/integration.md)

### JavaScript / TypeScript

Use the core SDK with any bundler. Mount after the target is connected, then clean up when your page or component unmounts.

```html
<div id="reservations"></div>
```

```ts
import { mountReservationButton } from '@menueqr/widget';

const widget = mountReservationButton('#reservations', {
  restaurant: 'bistro-lumi',
  language: 'en',
  color: '#ef6709',
});

// When leaving the page or unmounting:
widget.destroy();
```

The same entry point exports `mountReservationFloating`, `mountReservationTab` and `mountReservationInline`. ESM and CommonJS are supported; importing on a server does not touch the DOM.

<details>
<summary><strong>Vue / Nuxt</strong></summary>

Mount in `onMounted`, release in `onBeforeUnmount`. Imports are SSR-safe.

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { mountReservationFloating, type ReservationComponent } from '@menueqr/widget';

const target = ref<HTMLElement | null>(null);
let widget: ReservationComponent | undefined;

onMounted(() => {
  if (target.value) {
    widget = mountReservationFloating(target.value, { restaurant: 'bistro-lumi' });
  }
});
onBeforeUnmount(() => widget?.destroy());
</script>

<template>
  <div ref="target" />
</template>
```

[Reactive Vue / Nuxt example →](examples/vue/Reservations.vue)

</details>

<details>
<summary><strong>Svelte · Angular · Web Components</strong></summary>

| Environment              | Integration                                                                       |
| ------------------------ | --------------------------------------------------------------------------------- |
| Svelte                   | [`onMount` with cleanup](examples/svelte/Reservations.svelte)                     |
| Angular                  | [Browser-guarded lifecycle component](examples/angular/reservations.component.ts) |
| Astro / other frameworks | [JavaScript API](examples/vanilla/main.ts) inside a client lifecycle              |
| HTML with a bundler      | Register a custom element, then use its tag                                       |

```ts
import { defineReservationFloatingElement } from '@menueqr/widget/element';

defineReservationFloatingElement();
```

```html
<menueqr-reservation-floating
  restaurant="bistro-lumi"
  language="en"
  color="#ef6709"
></menueqr-reservation-floating>
```

Register individual elements or call `defineReservationElements()` once. Attribute updates change configuration; disconnection releases the widget. Boolean attributes use literal `"true"` / `"false"` strings. [Full custom-element reference →](docs/integration.md)

Svelte and Angular examples are integration recipes, rather than a claim of full framework certification. React, Next.js, Vue and the browser SDK have dedicated integration tests.

</details>

## Connect your restaurant

**1. Use your public slug or menu link.** Both work:

```ts
restaurant: 'bistro-lumi';
// or
restaurant: 'https://www.menueqr.de/menu/bistro-lumi/';
```

**2. Enable reservations in MenüQR.** Live bookings need PRO or above and an eligible, published restaurant.

**3. Approve your website.** Add its HTTPS URL in [Settings → Profile → Website](https://www.menueqr.de/dashboard/settings/profile/?setting=restaurant-website), or connect an additional WordPress site through the supported connection flow.

No password, private token or database ID belongs in the integration. Knowing the slug grants no administrative access. The hosted service enforces feature access and allowed origins. If it reports a blocked website, the widget explains the origin and links to the setting; connection failures offer a separate retry. [CSP and diagnostics →](docs/integration.md#browser--ssr-and-csp)

## Make it yours

| Option                           | Default      | Purpose                                                      |
| -------------------------------- | ------------ | ------------------------------------------------------------ |
| `restaurant`                     | **Required** | Public slug or MenüQR menu link                              |
| `language`                       | `de`         | `de` · `en` · `fr` · `it` · `es` · `pt` · `pl` · `uk` · `tr` |
| `color`                          | `#ff730a`    | Six-digit hex accent; launcher text contrast is automatic    |
| `label`                          | Localized    | Launcher label, up to 120 characters                         |
| `side`                           | `right`      | Floating / Tab: `left` or `right`                            |
| `offsetX` / `offsetY`            | `24` / `24`  | Floating launcher offsets in pixels                          |
| `mobile`                         | `true`       | Show the widget on screens up to 540 px                      |
| `icon`                           | `true`       | Show the launcher icon                                       |
| `inlineHeight`                   | `720`        | Inline form height: 240–1600 px                              |
| `nonce`                          | Empty        | Server-generated CSP nonce for the widget's styles           |
| `onOpen` / `onReady` / `onClose` | —            | Lifecycle callbacks; no guest data                           |

React also accepts `id`, `className` and `style` for the mount element. Guest fields and reservation conditions are configured **in the restaurant dashboard**, so every integration uses the same settings.

The JavaScript controller exposes `open()`, `close()`, `update(options)` and `destroy()`. Destroy before replacing a component type on the same target. Repeated mounts of the same component on the same target reuse its controller. [Complete API →](docs/integration.md)

## Give your AI assistant the right context

Choose your framework and component in the [live installation guide](https://www.menueqr.de/en/reservierungswidget/#installation), then copy its AI prompt. Or give your assistant [`AI_INTEGRATION.md`](AI_INTEGRATION.md).

```ts
import { createIntegrationPrompt } from '@menueqr/widget/prompt';

const prompt = createIntegrationPrompt({
  restaurant: 'bistro-lumi',
  component: 'floating',
  integration: 'react', // react | next | api | element
  packageManager: 'pnpm',
  language: 'en',
});
```

The prompt uses the real public API and selected component. It includes lifecycle, SSR and restaurant connection instructions.

## Run the playground

Requires Node.js **22.12+ or 24+**.

```sh
git clone https://github.com/Trillianti/menueqr-widget.git
cd menueqr-widget
npm ci
npm run dev
```

Open **[127.0.0.1:4310](http://127.0.0.1:4310/)**. The cross-origin form fixture uses `4311`; `Ctrl+C` stops both. The local preview uses fictional data and sends no bookings, emails or payments. Live mode is an explicit opt-in and can create real reservations.

<details>
<summary><strong>Development, verification and compatibility</strong></summary>

```sh
npm run check
npm run format:check
npx playwright install chromium firefox webkit
npm run test:e2e
npm pack
```

Browser tests cover the four components, lifecycle cleanup, source/origin checks, keyboard behaviour, mobile viewports and local preview submissions. The packed-package Next.js consumer checks server metadata, hydration, navigation and refresh. Browser emulation does not replace physical-device testing.

The deprecated `mountReservations({ mode })` and `<menueqr-reservations mode="…">` remain for 0.1.x integrations. New code should use separate components. Optional `/button`, `/floating`, `/tab` and `/inline` subpaths remain supported; importing from the root is enough.

This repository contains the SDK, examples and preview tools. The WordPress plugin and hosted MenüQR application are maintained separately.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Publishing](docs/publishing.md) · [Releases](https://github.com/Trillianti/menueqr-widget/releases)

</details>

---

Built by **[MenüQR](https://www.menueqr.de)**. SDK licensed under **[MIT](LICENSE)**. The hosted service has its own terms. The local preview's Inter font uses the [SIL Open Font License](scripts/fixture/fonts/LICENSE-Inter.txt).
