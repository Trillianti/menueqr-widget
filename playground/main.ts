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
import { integrationSnippet, elementSnippet, createIntegrationPrompt } from '../src/prompt.js';
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
  };
}
function syncCode() {
  byId('code').textContent = (
    field('integration') === 'element' ? elementSnippet : integrationSnippet
  )(publicConfiguration());
  byId('code-language').textContent =
    field('integration') === 'element' ? 'Web Component' : 'JavaScript / TypeScript';
}
function destroy() {
  widget?.destroy();
  widget = null;
  element?.remove();
  element = null;
  mountedComponent = '';
}
function mount() {
  byId('error').hidden = true;
  try {
    const config = options();
    const key = `${field('integration')}:${component()}`;
    if (mountedComponent && mountedComponent !== key) destroy();
    if (field('integration') === 'element') {
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
    log(`Mounted · ${component()} · ${config.restaurant}`);
    syncCode();
    byId<HTMLButtonElement>('copy-code').disabled = false;
    byId<HTMLButtonElement>('copy-prompt').disabled = false;
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
  byId<HTMLButtonElement>('copy-code').disabled = true;
  byId<HTMLButtonElement>('copy-prompt').disabled = true;
  byId<HTMLButtonElement>('open').disabled = true;
}
byId('settings').addEventListener('submit', (event) => {
  event.preventDefault();
  mount();
});
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
