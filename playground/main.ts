import {
  mountReservations,
  type ReservationWidget,
  type ReservationWidgetOptions,
  type WidgetLanguage,
  type WidgetMode,
} from '../src/index.js';
import { defineReservationsElement, type ReservationElement } from '../src/element.js';
import { integrationSnippet, createIntegrationPrompt } from '../src/prompt.js';
declare const __FIXTURE_ORIGIN__: string;
const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const field = (id: string) => byId<HTMLInputElement | HTMLSelectElement>(id).value;
const container = byId<HTMLDivElement>('booking');
let widget: ReservationWidget | null = null;
let element: ReservationElement | null = null;
const log = (message: string) => {
  const node = document.createElement('li');
  node.textContent = message;
  byId('events').prepend(node);
  while (byId('events').children.length > 8) byId('events').lastElementChild?.remove();
  byId('state').textContent = message;
};
function options(): ReservationWidgetOptions {
  return {
    restaurant: 'sandbox-bistro',
    mode: field('mode') as WidgetMode,
    language: field('language') as WidgetLanguage,
    color: field('color'),
    side: field('side') as 'left' | 'right',
    label: field('button-label'),
    mobile: byId<HTMLInputElement>('mobile').checked,
    baseUrl: __FIXTURE_ORIGIN__,
    onOpen: () => log('Opened'),
    onClose: (event) => log(`Closed · ${event.reason}`),
    onReady: () => log('Ready · local preview loaded'),
  };
}
function syncCode() {
  const {
    baseUrl: _base,
    onOpen: _open,
    onReady: _ready,
    onClose: _close,
    ...publicOptions
  } = options();
  byId('code').textContent = integrationSnippet({
    ...publicOptions,
    restaurant: 'your-restaurant-slug',
  });
}
function destroy() {
  widget?.destroy();
  widget = null;
  element?.remove();
  element = null;
  log('Destroyed · listeners and DOM removed');
}
function mount() {
  byId('error').hidden = true;
  try {
    const config = options();
    if (field('integration') === 'element') {
      if (widget) {
        widget.destroy();
        widget = null;
      }
      defineReservationsElement();
      if (!element) {
        element = document.createElement('menueqr-reservations') as ReservationElement;
        for (const name of ['open', 'ready', 'close'])
          element.addEventListener(`menueqr:${name}`, () => log(`Web Component · ${name}`));
      }
      for (const [key, value] of Object.entries({
        restaurant: config.restaurant,
        mode: config.mode,
        language: config.language,
        color: config.color,
        side: config.side,
        label: config.label,
        mobile: String(config.mobile),
        'base-url': __FIXTURE_ORIGIN__,
      }))
        element.setAttribute(key, String(value));
      if (!element.isConnected) container.append(element);
    } else {
      element?.remove();
      element = null;
      if (widget) widget.update(config);
      else widget = mountReservations(container, config);
    }
    byId<HTMLSelectElement>('side').disabled = !['floating', 'tab'].includes(config.mode ?? '');
    log(`Mounted · ${config.mode} · ${config.language}`);
    syncCode();
  } catch (error) {
    byId('error').hidden = false;
    byId('error').textContent =
      error instanceof Error ? error.message : 'Unable to mount the widget.';
  }
}
byId('settings').addEventListener('submit', (event) => event.preventDefault());
byId('settings').addEventListener('change', mount);
byId('button-label').addEventListener('input', mount);
byId('open').onclick = () => {
  if (!widget && !element) mount();
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
byId('destroy').onclick = destroy;
async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    byId('copy-state').textContent = 'Copied.';
  } catch {
    byId('copy-state').textContent = 'Clipboard unavailable. Select and copy the code manually.';
  }
}
byId('copy-code').onclick = () => void copy(byId('code').textContent ?? '');
byId('copy-prompt').onclick = () => {
  const { baseUrl: _base, onOpen: _open, onReady: _ready, onClose: _close, ...config } = options();
  void copy(createIntegrationPrompt({ ...config, restaurant: 'your-restaurant-slug' }));
};
window.addEventListener(
  'pagehide',
  () => {
    widget?.destroy();
    element?.remove();
  },
  { once: true },
);
mount();
