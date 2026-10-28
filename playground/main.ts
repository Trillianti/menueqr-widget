import {
  mountReservationButton,
  mountReservationFloating,
  mountReservationTab,
  mountReservationInline,
  resolveRestaurantSlug,
  type ReservationComponent,
  type ReservationComponentOptions,
  type WidgetLanguage,
  type WidgetMode,
} from '../src/index.js';
import { defineReservationElements, type ReservationElement } from '../src/element.js';
import {
  createIntegrationGuide,
  createIntegrationPrompt,
  type IntegrationTarget,
} from '../src/prompt.js';
import { createElement, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  ReservationButton,
  ReservationFloating,
  ReservationTab,
  ReservationInline,
} from '../src/react.js';
import { normalizeOptions } from '../src/options.js';
const reactComponents = {
  button: ReservationButton,
  floating: ReservationFloating,
  tab: ReservationTab,
  inline: ReservationInline,
};
declare const __FIXTURE_ORIGIN__: string;
declare const __WIDGET_VERSION__: string;
const mounts = {
  button: mountReservationButton,
  floating: mountReservationFloating,
  tab: mountReservationTab,
  inline: mountReservationInline,
};
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const field = (id: string) => byId<HTMLInputElement | HTMLSelectElement>(id).value;
const container = byId<HTMLDivElement>('booking');
let widget: ReservationComponent | null = null;
let element: ReservationElement | null = null;
let reactRoot: Root | null = null;
let mountedComponent = '';
const log = (message: string) => {
  const node = document.createElement('li');
  node.textContent = message;
  byId('events').prepend(node);
  while (byId('events').children.length > 8) byId('events').lastElementChild?.remove();
  byId('state').textContent = message;
};
const live = () => byId<HTMLInputElement>('live').checked;
const component = () => field('component') as WidgetMode;
const integration = () => field('integration') as IntegrationTarget;
const isReact = () => ['react', 'next'].includes(integration());
function options(): ReservationComponentOptions {
  const restaurant = field('restaurant').trim();
  if (live() && !restaurant)
    throw new Error('Enter a restaurant link or slug before enabling live preview.');
  return {
    restaurant: resolveRestaurantSlug(restaurant || 'sandbox-bistro'),
    language: field('language') as WidgetLanguage,
    color: field('color'),
    side: field('side') as 'left' | 'right',
    label: field('button-label'),
    mobile: byId<HTMLInputElement>('mobile').checked,
    ...(!live() ? { baseUrl: __FIXTURE_ORIGIN__ } : {}),
    onOpen: () => log('Opened'),
    onClose: ({ reason }) => log(`Closed · ${reason}`),
    onReady: () => log(live() ? 'Ready · hosted form initialized' : 'Ready · local preview loaded'),
  };
}
function publicConfiguration() {
  const { baseUrl: _base, onOpen: _open, onReady: _ready, onClose: _close, ...config } = options();
  return {
    ...config,
    restaurant: field('restaurant').trim()
      ? resolveRestaurantSlug(field('restaurant'))
      : 'your-restaurant-slug',
    component: component(),
    integration: integration(),
    codeLanguage: field('code-syntax') as 'typescript' | 'javascript',
  };
}
function syncCode() {
  const guide = createIntegrationGuide(publicConfiguration());
  byId('guide-title').textContent = guide.title;
  byId('guide-description').textContent = guide.description;
  byId('install-command').textContent = guide.installCommand;
  byId('code').textContent = guide.primary.code;
  byId('code-language').textContent = `${guide.primary.filename} · ${guide.primary.language}`;
  byId('support-example').hidden = !guide.support;
  byId('support-file').textContent = guide.support
    ? `${guide.support.filename} · ${guide.support.language}`
    : '';
  byId('support-code').textContent = guide.support?.code ?? '';
  byId('copy-support').textContent =
    guide.support?.language === 'HTML' ? 'Copy HTML' : 'Copy registration';
  byId('guide-notes').replaceChildren(
    ...guide.notes.map((note) => {
      const item = document.createElement('li');
      item.textContent = note;
      return item;
    }),
  );
}
function destroy() {
  widget?.destroy();
  widget = null;
  element?.remove();
  element = null;
  reactRoot?.unmount();
  reactRoot = null;
  mountedComponent = '';
}
function mount() {
  byId('error').hidden = true;
  try {
    const config = options();
    normalizeOptions({ ...config, mode: component() });
    const key = `${isReact() ? 'react' : integration()}:${component()}`;
    if (mountedComponent && mountedComponent !== key) destroy();
    if (isReact()) {
      if (!reactRoot) {
        const owner = createRoot(container, {
          onUncaughtError: (error) =>
            queueMicrotask(() => {
              if (reactRoot === owner)
                showError(
                  error instanceof Error ? error.message : 'Unable to render the React preview.',
                );
            }),
        });
        reactRoot = owner;
      }
      reactRoot.render(
        createElement(StrictMode, null, createElement(reactComponents[component()], config)),
      );
    } else if (integration() === 'element') {
      defineReservationElements();
      if (!element) {
        element = document.createElement(
          `menueqr-reservation-${component()}`,
        ) as ReservationElement;
        for (const name of ['open', 'ready', 'close'])
          element.addEventListener(`menueqr:${name}`, () => log(`Web Component · ${name}`));
        element.addEventListener('menueqr:error', (event) =>
          showError((event as CustomEvent<{ message: string }>).detail.message),
        );
      }
      for (const [key, value] of Object.entries({
        restaurant: config.restaurant,
        language: config.language,
        color: config.color,
        side: config.side,
        label: config.label,
        mobile: String(config.mobile),
        'base-url': config.baseUrl ?? 'https://www.menueqr.de',
      }))
        element.setAttribute(key, String(value));
      if (!element.isConnected) container.append(element);
    } else if (widget) widget.update(config);
    else widget = mounts[component()](container, config);
    mountedComponent = key;
    byId<HTMLSelectElement>('side').disabled = !['floating', 'tab'].includes(component());
    byId('environment').textContent = live() ? 'Live restaurant' : 'Local sandbox';
    byId('preview-description').textContent = live()
      ? 'This is the hosted restaurant form. Submitting it creates a real reservation request.'
      : 'This is the real SDK, connected to a local preview form. No bookings are sent.';
    byId('open').hidden = isReact();
    byId('close').hidden = isReact();
    byId('react-preview-help').hidden = !isReact();
    byId('react-preview-help').textContent =
      component() === 'inline'
        ? 'The form is displayed inline. React handles its lifecycle.'
        : 'Use the widget button in the preview. React handles its lifecycle.';
    byId('syntax-control').hidden = !isReact();
    log(`Mounted · ${integration()} · ${component()} · ${config.restaurant}`);
    syncCode();
    byId<HTMLButtonElement>('copy-code').disabled = false;
    byId<HTMLButtonElement>('copy-prompt').disabled = false;
    byId<HTMLButtonElement>('copy-support').disabled = false;
    byId<HTMLButtonElement>('open').disabled = false;
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Unable to mount the widget.');
  }
}
function showError(message: string) {
  // Do not leave a launcher pointing at a previous restaurant after invalid input.
  destroy();
  byId('error').hidden = false;
  byId('error').textContent = message;
  byId('code').textContent =
    'Fix the restaurant reference or settings above to generate your integration code.';
  byId('support-example').hidden = true;
  byId<HTMLButtonElement>('copy-code').disabled = true;
  byId<HTMLButtonElement>('copy-prompt').disabled = true;
  byId<HTMLButtonElement>('copy-support').disabled = true;
  byId<HTMLButtonElement>('open').disabled = true;
}
byId('settings').addEventListener('submit', (event) => {
  event.preventDefault();
  mount();
});
byId('settings').addEventListener('change', mount);
byId('button-label').addEventListener('input', mount);
byId('code-syntax').addEventListener('change', () => {
  try {
    syncCode();
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Invalid restaurant.');
  }
});
byId('open').onclick = () => {
  if (!widget && !element && !reactRoot) mount();
  const opened = widget?.open() ?? element?.open();
  if (!opened) log('Hidden on mobile, or no native dialog support.');
};
byId('close').onclick = () => {
  widget?.close();
  element?.close();
};
byId('remount').onclick = () => {
  destroy();
  mount();
};
byId('destroy').onclick = () => {
  destroy();
  log('Destroyed · listeners and DOM removed');
};
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    byId('copy-state').textContent = 'Copied.';
  } catch {
    byId('copy-state').textContent = 'Clipboard unavailable. Select and copy the code manually.';
  }
}
byId('copy-install').onclick = () => void copy(byId('install-command').textContent ?? '');
byId('copy-support').onclick = () => void copy(byId('support-code').textContent ?? '');
byId('copy-code').onclick = () => void copy(byId('code').textContent ?? '');
byId('copy-prompt').onclick = () => {
  try {
    void copy(createIntegrationPrompt(publicConfiguration()));
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Invalid restaurant.');
  }
};
window.addEventListener('pagehide', destroy, { once: true });
mount();

byId('version').textContent = `MenüQR · MVP ${__WIDGET_VERSION__}`;
