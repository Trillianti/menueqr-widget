import {
  mountReservations,
  mountReservationButton,
  mountReservationFloating,
  mountReservationTab,
  mountReservationInline,
} from './index.js';
const components = {
  button: mountReservationButton,
  floating: mountReservationFloating,
  tab: mountReservationTab,
  inline: mountReservationInline,
};
import type {
  ReservationWidget,
  ReservationComponent,
  ReservationWidgetOptions,
  WidgetMode,
  WidgetLanguage,
} from './types.js';
export { type ReservationWidgetOptions } from './types.js';
export interface ReservationElement extends HTMLElement {
  open(): boolean;
  close(): void;
}
/** Explicit registration prevents module-level browser globals from breaking SSR imports. */
function registerElement(name: string, component?: WidgetMode): boolean {
  if (typeof window === 'undefined' || !window.customElements) return false;
  if (window.customElements.get(name)) return false;
  class ReservationsElement extends HTMLElement {
    private instance: ReservationWidget | ReservationComponent | null = null;
    private pending = false;
    static get observedAttributes() {
      return [
        'restaurant',
        'mode',
        'language',
        'color',
        'label',
        'side',
        'offset-x',
        'offset-y',
        'mobile',
        'icon',
        'inline-height',
        'nonce',
        'base-url',
      ].filter((attribute) => !component || attribute !== 'mode');
    }
    private options(): ReservationWidgetOptions {
      const result: ReservationWidgetOptions = {
        restaurant: this.getAttribute('restaurant') ?? '',
      };
      const set = (attribute: string, key: keyof ReservationWidgetOptions) => {
        const value = this.getAttribute(attribute);
        if (value !== null) Object.assign(result, { [key]: value });
      };
      if (!component) set('mode', 'mode');
      set('language', 'language');
      set('color', 'color');
      set('label', 'label');
      set('side', 'side');
      set('nonce', 'nonce');
      set('base-url', 'baseUrl');
      for (const [attribute, key] of [
        ['offset-x', 'offsetX'],
        ['offset-y', 'offsetY'],
        ['inline-height', 'inlineHeight'],
      ] as const)
        if (this.hasAttribute(attribute))
          Object.assign(result, { [key]: Number(this.getAttribute(attribute)) });
      for (const key of ['mobile', 'icon'] as const)
        if (this.hasAttribute(key)) {
          const value = this.getAttribute(key);
          if (!['true', 'false'].includes(value ?? ''))
            throw new TypeError(`MenüQR: ${key} must be "true" or "false".`);
          result[key] = value === 'true';
        }
      result.onOpen = () => this.dispatchEvent(new CustomEvent('menueqr:open', { bubbles: true }));
      result.onReady = () =>
        this.dispatchEvent(new CustomEvent('menueqr:ready', { bubbles: true }));
      result.onClose = (detail) =>
        this.dispatchEvent(new CustomEvent('menueqr:close', { bubbles: true, detail }));
      return result;
    }
    open(): boolean {
      return this.instance?.open() ?? false;
    }
    close(): void {
      this.instance?.close();
    }
    connectedCallback(): void {
      this.requestSync();
    }
    disconnectedCallback(): void {
      this.instance?.destroy();
      this.instance = null;
    }
    attributeChangedCallback(): void {
      if (this.isConnected) this.requestSync();
    }
    private requestSync(): void {
      if (this.pending) return;
      this.pending = true;
      queueMicrotask(() => {
        this.pending = false;
        if (this.isConnected) this.sync();
      });
    }
    private sync(): void {
      try {
        const options = this.options();
        // Attribute removal restores defaults instead of retaining a previous value.
        if (this.instance)
          this.instance.update({
            ...(!component ? { mode: 'button' as WidgetMode } : {}),
            language: 'de' as WidgetLanguage,
            color: '#ff730a',
            label: '',
            side: 'right',
            offsetX: 24,
            offsetY: 24,
            mobile: true,
            icon: true,
            inlineHeight: 720,
            nonce: '',
            baseUrl: 'https://www.menueqr.de',
            ...options,
          });
        else
          this.instance = component
            ? components[component](this, options)
            : mountReservations(this, options);
      } catch (error) {
        this.dispatchEvent(
          new CustomEvent('menueqr:error', {
            bubbles: true,
            detail: {
              message: error instanceof Error ? error.message : 'MenüQR: Invalid widget options.',
            },
          }),
        );
      }
    }
  }
  window.customElements.define(name, ReservationsElement);
  return true;
}

/** @deprecated Use the separate custom elements. */
export function defineReservationsElement(name = 'menueqr-reservations'): boolean {
  return registerElement(name);
}
export function defineReservationButtonElement(name = 'menueqr-reservation-button'): boolean {
  return registerElement(name, 'button');
}
export function defineReservationFloatingElement(name = 'menueqr-reservation-floating'): boolean {
  return registerElement(name, 'floating');
}
export function defineReservationTabElement(name = 'menueqr-reservation-tab'): boolean {
  return registerElement(name, 'tab');
}
export function defineReservationInlineElement(name = 'menueqr-reservation-inline'): boolean {
  return registerElement(name, 'inline');
}
export function defineReservationElements(): void {
  defineReservationButtonElement();
  defineReservationFloatingElement();
  defineReservationTabElement();
  defineReservationInlineElement();
}
