import {
  mountReservations,
  type ReservationWidget,
  type ReservationWidgetOptions,
} from '../src/index.js';
import { defineReservationsElement } from '../src/element.js';
declare const __FIXTURE_ORIGIN__: string;
declare global {
  interface Window {
    harness: typeof harness;
  }
}
let current: ReservationWidget | null = null;
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
const harness = {
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
