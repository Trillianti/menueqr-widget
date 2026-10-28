import {
  mountReservations,
  mountReservationButton,
  mountReservationFloating,
  mountReservationTab,
  mountReservationInline,
  type ReservationComponent,
  type ReservationComponentOptions,
  type WidgetMode,
  type ReservationWidget,
  type ReservationWidgetOptions,
} from '../src/index.js';
import { defineReservationsElement, defineReservationElements } from '../src/element.js';
declare const __FIXTURE_ORIGIN__: string;
declare global {
  interface Window {
    harness: typeof harness;
  }
}
let current: ReservationWidget | ReservationComponent | null = null;
let second: ReservationWidget | null = null;
const events: string[] = [];
const defaults = {
  restaurant: 'sandbox-bistro',
  language: 'en' as const,
  baseUrl: __FIXTURE_ORIGIN__,
  onOpen: () => events.push('open'),
  onReady: () => events.push('ready'),
  onClose: () => events.push('close'),
};
const components = {
  button: mountReservationButton,
  floating: mountReservationFloating,
  tab: mountReservationTab,
  inline: mountReservationInline,
};
const harness = {
  mountVariant(component: WidgetMode, options: Partial<ReservationComponentOptions> = {}) {
    current = components[component]('#booking', { ...defaults, ...options });
  },
  defineAll() {
    defineReservationElements();
  },
  mount(options: Partial<ReservationWidgetOptions> = {}) {
    current = mountReservations('#booking', { ...defaults, ...options });
  },
  mountAgain(options: Partial<ReservationWidgetOptions> = {}) {
    const again = mountReservations('#booking', { ...defaults, ...options });
    return again === current;
  },
  second() {
    second = mountReservations('#second', defaults);
    second.open();
  },
  closeSecond() {
    second?.close();
  },
  open() {
    return current?.open();
  },
  close() {
    current?.close();
  },
  destroy() {
    current?.destroy();
  },
  update(options: Partial<ReservationWidgetOptions>) {
    current?.update(options);
  },
  options() {
    return current?.options;
  },
  events() {
    return [...events];
  },
  define() {
    return defineReservationsElement();
  },
  send(type: string, origin: string, source: 'self' | 'frame') {
    const frame = document
      .querySelector('[data-menueqr-widget-host]')
      ?.shadowRoot?.querySelector('iframe');
    // Firefox rejects cross-origin WindowProxy values in MessageEventInit.
    // Define the fixture event fields directly to exercise each validation branch.
    const event = new Event('message');
    Object.defineProperties(event, {
      origin: { value: origin },
      source: { value: source === 'frame' ? (frame?.contentWindow ?? window) : window },
      data: { value: { type } },
    });
    window.dispatchEvent(event);
  },
};
window.harness = harness;
