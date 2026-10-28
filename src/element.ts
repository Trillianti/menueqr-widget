import { mountReservations } from './index.js';
import type {
  ReservationWidget,
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
export function defineReservationsElement(name = 'menueqr-reservations'): boolean {
  if (typeof window === 'undefined' || !window.customElements) return false;
  if (window.customElements.get(name)) return false;
  class ReservationsElement extends HTMLElement {
    private instance: ReservationWidget | null = null;
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
      ];
    }
    private options(): ReservationWidgetOptions {
      const result: ReservationWidgetOptions = {
        restaurant: this.getAttribute('restaurant') ?? '',
      };
      const set = (attribute: string, key: keyof ReservationWidgetOptions) => {
        const value = this.getAttribute(attribute);
        if (value !== null) Object.assign(result, { [key]: value });
      };
      set('mode', 'mode');
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
            mode: 'button' as WidgetMode,
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
        else this.instance = mountReservations(this, options);
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
