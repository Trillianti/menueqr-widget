import { normalizeOptions, frameUrl, foreground } from './options.js';
import { labels } from './copy.js';
import { styles } from './styles.js';
import type {
  CloseReason,
  ReservationWidget,
  ReservationWidgetOptions,
  WidgetConfiguration,
} from './types.js';
export { languages } from './types.js';
export type {
  CloseReason,
  ReservationWidget,
  ReservationWidgetOptions,
  WidgetConfiguration,
  WidgetLanguage,
  WidgetMode,
} from './types.js';

const mounted = new WeakMap<HTMLElement, Instance>();
const locks = new WeakMap<Document, { count: number; overflow: string; priority: string }>();
let sequence = 0;
function lockScroll(doc: Document): () => void {
  let state = locks.get(doc);
  if (!state) {
    state = {
      count: 0,
      overflow: doc.body.style.getPropertyValue('overflow'),
      priority: doc.body.style.getPropertyPriority('overflow'),
    };
    locks.set(doc, state);
  }
  state.count++;
  doc.body.style.setProperty('overflow', 'hidden');
  let released = false;
  return () => {
    if (released) return;
    released = true;
    state.count--;
    if (state.count === 0) {
      if (doc.body.style.overflow === 'hidden') {
        if (state.overflow) doc.body.style.setProperty('overflow', state.overflow, state.priority);
        else doc.body.style.removeProperty('overflow');
      }
      locks.delete(doc);
    }
  };
}

class Instance implements ReservationWidget {
  private config: WidgetConfiguration;
  private destroyed = false;
  private transitioning = false;
  private host: HTMLSpanElement | null = null;
  private root: ShadowRoot | null = null;
  private trigger: HTMLButtonElement | null = null;
  private dialog: HTMLDialogElement | null = null;
  private frame: HTMLIFrameElement | null = null;
  private inline: HTMLDivElement | null = null;
  private frameCleanup: (() => void) | null = null;
  private overlayCleanup: (() => void) | null = null;
  private media: MediaQueryList | null = null;
  private readonly id = `menueqr-reservations-${++sequence}`;
  private readonly doc: Document;
  private readonly view: Window & typeof globalThis;
  constructor(
    private target: HTMLElement,
    options: WidgetConfiguration,
  ) {
    this.config = options;
    this.doc = target.ownerDocument;
    if (!this.doc.defaultView || !this.doc.body)
      throw new Error('MenüQR: Mount after the page has a body.');
    this.view = this.doc.defaultView;
    if (!['http:', 'https:'].includes(this.view.location.protocol))
      throw new Error('MenüQR: Serve the page over HTTP(S), not file://.');
    this.render();
  }
  get isOpen(): boolean {
    return Boolean(this.dialog?.open || (this.inline && this.frame));
  }
  get options(): WidgetConfiguration {
    return this.config;
  }
  private visible(): boolean {
    return this.config.mobile || !this.media?.matches;
  }
  private render(): void {
    const c = this.config;
    this.host = this.doc.createElement('span');
    this.host.dataset.menueqrWidgetHost = '';
    this.host.style.display = c.mode === 'inline' ? 'block' : 'contents';
    this.root = this.host.attachShadow({ mode: 'open' });
    const sheet = this.doc.createElement('style');
    if (c.nonce) sheet.nonce = c.nonce;
    sheet.textContent = styles;
    this.root.append(sheet);
    this.host.style.setProperty('--mw-color', c.color);
    this.host.style.setProperty('--mw-foreground', foreground(c.color));
    this.host.style.setProperty('--mw-focus', foreground(c.color));
    this.host.style.setProperty('--mw-offset-x', `${c.offsetX}px`);
    this.host.style.setProperty('--mw-offset-y', `${c.offsetY}px`);
    this.host.style.setProperty('--mw-inline-height', `${c.inlineHeight}px`);
    if (c.mode === 'floating' || c.mode === 'tab') this.doc.body.append(this.host);
    else this.target.append(this.host);
    this.media = this.view.matchMedia('(max-width:540px)');
    this.media.addEventListener('change', this.onMedia);
    const copy = labels[c.language];
    if (c.mode === 'inline') {
      this.inline = this.doc.createElement('div');
      this.inline.className = 'inline';
      this.root.append(this.inline);
    } else {
      this.trigger = this.doc.createElement('button');
      this.trigger.type = 'button';
      this.trigger.className = 'trigger';
      this.trigger.dataset.mode = c.mode;
      this.trigger.dataset.side = c.side;
      this.trigger.setAttribute('aria-haspopup', 'dialog');
      this.trigger.setAttribute('aria-expanded', 'false');
      this.trigger.setAttribute('aria-controls', this.id);
      if (c.icon) {
        const icon = this.doc.createElement('span');
        icon.className = 'icon';
        icon.setAttribute('aria-hidden', 'true');
        this.trigger.append(icon);
      }
      const text = this.doc.createElement('span');
      text.textContent = c.label || (c.mode === 'button' ? copy.reserve : copy.short);
      this.trigger.append(text);
      this.trigger.addEventListener('click', this.onTrigger);
      this.root.append(this.trigger);
    }
    this.syncVisibility();
  }
  private readonly onTrigger = () => {
    if (!this.open()) {
      const url = `${this.config.baseUrl}/menu/${encodeURIComponent(this.config.restaurant)}/reserve/`;
      this.view.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  private readonly onMedia = () => this.syncVisibility();
  private syncVisibility(): void {
    const node = this.inline ?? this.trigger;
    node?.classList.toggle('mobile-hidden', !this.visible());
    if (!this.visible()) {
      this.finishClose('update', false);
      if (this.inline) this.removeFrame();
    } else if (this.inline && !this.frame) this.mountFrame(this.inline, true);
  }
  private removeFrame(): void {
    this.frameCleanup?.();
    this.frameCleanup = null;
    this.frame?.remove();
    this.frame = null;
  }
  private mountFrame(container: HTMLElement, inline: boolean): void {
    const c = this.config;
    const copy = labels[c.language];
    const frame = this.doc.createElement('iframe');
    this.frame = frame;
    frame.title = copy.reserve;
    frame.referrerPolicy = 'no-referrer';
    frame.setAttribute(
      'sandbox',
      'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox',
    );
    const fallback = this.doc.createElement('a');
    fallback.className = 'fallback';
    fallback.href = `${c.baseUrl}/menu/${encodeURIComponent(c.restaurant)}/reserve/`;
    fallback.target = '_blank';
    fallback.rel = 'noopener noreferrer';
    fallback.textContent = copy.fallback;
    let ready = false;
    const message = (event: MessageEvent<unknown>) => {
      if (
        event.origin !== c.baseUrl ||
        event.source !== frame.contentWindow ||
        this.frame !== frame ||
        !event.data ||
        typeof event.data !== 'object'
      )
        return;
      const type = (event.data as { type?: unknown }).type;
      if (type === 'menueqr:reservation:ready' && !ready) {
        ready = true;
        fallback.remove();
        container.dataset.ready = 'true';
        this.notify(this.config.onReady);
      } else if (type === 'menueqr:reservation:close' && !inline) this.finishClose('frame', true);
    };
    this.view.addEventListener('message', message);
    this.frameCleanup = () => {
      this.view.removeEventListener('message', message);
      fallback.remove();
      delete container.dataset.ready;
    };
    // Install the message listener before navigation: cached pages can become ready immediately.
    container.append(frame, fallback);
    frame.src = frameUrl(c, this.view.location.origin);
  }
  open(): boolean {
    if (this.destroyed || this.transitioning || !this.visible()) return false;
    if (this.inline) return Boolean(this.frame);
    if (this.dialog?.open) return true;
    if (
      !this.root ||
      !this.trigger ||
      typeof this.view.HTMLDialogElement?.prototype.showModal !== 'function'
    )
      return false;
    const dialog = this.doc.createElement('dialog');
    const close = this.doc.createElement('button');
    dialog.id = this.id;
    dialog.dataset.mode = this.config.mode;
    dialog.dataset.side = this.config.side;
    dialog.setAttribute('aria-label', labels[this.config.language].reserve);
    close.className = 'close';
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', labels[this.config.language].close);
    close.addEventListener('click', () => this.finishClose('api', true));
    const cancel = (event: Event) => {
      event.preventDefault();
      this.finishClose('escape', true);
    };
    const backdrop = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        this.finishClose('backdrop', true);
    };
    const nativeClose = () => this.finishClose('api', true);
    dialog.addEventListener('cancel', cancel);
    dialog.addEventListener('click', backdrop);
    dialog.addEventListener('close', nativeClose);
    dialog.append(close);
    this.root.append(dialog);
    this.dialog = dialog;
    this.position();
    this.view.addEventListener('resize', this.position);
    const unlock = lockScroll(this.doc);
    this.overlayCleanup = () => {
      this.view.removeEventListener('resize', this.position);
      dialog.removeEventListener('cancel', cancel);
      dialog.removeEventListener('click', backdrop);
      dialog.removeEventListener('close', nativeClose);
      unlock();
    };
    try {
      dialog.showModal();
      this.mountFrame(dialog, false);
      this.trigger.disabled = true;
      this.trigger.setAttribute('aria-expanded', 'true');
      this.position();
      close.focus();
      this.notify(this.config.onOpen);
      return true;
    } catch (error) {
      this.finishClose('api', false);
      throw error;
    }
  }
  private readonly position = () => {
    if (!this.dialog || !this.trigger) return;
    const r = this.trigger.getBoundingClientRect();
    const bottom = Math.max(12, this.view.innerHeight - r.top + 12);
    const x = Math.max(
      16,
      Math.min(
        this.config.side === 'left' ? r.left : this.view.innerWidth - r.right,
        this.view.innerWidth - 456,
      ),
    );
    this.dialog.style.setProperty('--mw-panel-bottom', `${bottom}px`);
    this.dialog.style.setProperty('--mw-panel-x', `${x}px`);
    this.dialog.style.setProperty(
      '--mw-panel-max-height',
      `${Math.max(120, this.view.innerHeight - bottom - 16)}px`,
    );
  };
  private notify(callback: (() => void) | undefined): void {
    try {
      callback?.();
    } catch (error) {
      this.view.console.error('MenüQR: A widget callback failed.', error);
    }
  }
  private finishClose(reason: CloseReason, restoreFocus: boolean): void {
    const dialog = this.dialog;
    if (!dialog) return;
    this.dialog = null;
    this.removeFrame();
    this.overlayCleanup?.();
    this.overlayCleanup = null;
    if (dialog.open) dialog.close();
    dialog.remove();
    if (this.trigger) {
      this.trigger.disabled = false;
      this.trigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus && this.trigger.isConnected && this.visible()) this.trigger.focus();
    }
    this.notify(() => this.config.onClose?.({ reason }));
  }
  close(): void {
    this.finishClose('api', true);
  }
  update(input: Partial<ReservationWidgetOptions>): void {
    if (this.destroyed)
      throw new Error('MenüQR: Cannot update a destroyed widget. Mount a new instance.');
    const next = normalizeOptions({ ...this.config, ...input });
    const viewKeys = Object.keys(next).filter(
      (key) => !['onOpen', 'onReady', 'onClose'].includes(key),
    );
    if (
      viewKeys.every(
        (key) =>
          next[key as keyof WidgetConfiguration] === this.config[key as keyof WidgetConfiguration],
      )
    ) {
      this.config = next;
      return;
    }
    if (this.transitioning) throw new Error('MenüQR: An update is already in progress.');
    this.transitioning = true;
    try {
      this.teardown('update');
      // onClose may unmount the owning component and destroy this controller.
      if (this.destroyed) return;
      this.config = next;
      this.render();
    } finally {
      this.transitioning = false;
    }
  }
  private teardown(reason: CloseReason): void {
    this.finishClose(reason, false);
    this.removeFrame();
    this.media?.removeEventListener('change', this.onMedia);
    this.media = null;
    this.trigger?.removeEventListener('click', this.onTrigger);
    this.host?.remove();
    this.host = null;
    this.root = null;
    this.inline = null;
    this.trigger = null;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.teardown('destroy');
    if (mounted.get(this.target) === this) mounted.delete(this.target);
  }
}

/** Importing this module is safe during SSR. Call mountReservations in the browser lifecycle. */
export function mountReservations(
  target: string | HTMLElement,
  options: ReservationWidgetOptions,
): ReservationWidget {
  if (typeof document === 'undefined')
    throw new Error(
      'MenüQR: mountReservations runs in the browser. Use your framework’s mounted/client lifecycle.',
    );
  let node: Element | null;
  try {
    node = typeof target === 'string' ? document.querySelector(target) : target;
  } catch {
    throw new TypeError('MenüQR: Invalid target selector.');
  }
  if (!node || node.nodeType !== 1 || !('attachShadow' in node) || !node.isConnected)
    throw new TypeError('MenüQR: Target must be a connected HTML element.');
  if (node.namespaceURI !== 'http://www.w3.org/1999/xhtml')
    throw new TypeError('MenüQR: Target must be an HTML element.');
  const element = node as HTMLElement;
  const normalized = normalizeOptions(options);
  const existing = mounted.get(element);
  if (existing) {
    existing.update(options);
    return existing;
  }
  const instance = new Instance(element, normalized);
  mounted.set(element, instance);
  return instance;
}
