import { afterTransitions } from './transition.js';
/** The tab stays the same button while moving into the native modal's top layer. */
export class TabDrawer {
  readonly dialog: HTMLDialogElement;
  readonly panel: HTMLDivElement;
  readonly content: HTMLDivElement;
  readonly scrim: HTMLDivElement;
  private phase: 'closed' | 'open' | 'closing' | 'disposed' = 'closed';
  private revision = 0;
  private readonly originalLabel: string | null;

  constructor(
    private readonly root: ShadowRoot,
    private readonly trigger: HTMLButtonElement,
    private readonly closeLabel: string,
  ) {
    const doc = trigger.ownerDocument;
    const rect = trigger.getBoundingClientRect();
    this.originalLabel = trigger.getAttribute('aria-label');
    this.dialog = doc.createElement('dialog');
    this.dialog.className = 'drawer-shell';
    this.dialog.dataset.state = 'closed';
    this.dialog.style.setProperty('--mw-tab-length', `${rect.height}px`);
    this.dialog.style.setProperty('--mw-tab-width', `${rect.width}px`);
    this.scrim = doc.createElement('div');
    this.scrim.className = 'drawer-scrim';
    this.scrim.setAttribute('aria-hidden', 'true');
    this.panel = doc.createElement('div');
    this.panel.className = 'drawer-panel';
    this.panel.setAttribute('aria-busy', 'true');
    this.content = doc.createElement('div');
    this.content.className = 'drawer-content';
    this.content.inert = true;
    this.panel.append(this.content);
    this.dialog.append(this.scrim, this.panel, trigger);
  }

  get isClosing(): boolean {
    return this.phase === 'closing';
  }

  show(): void {
    if (this.phase === 'disposed' || this.phase === 'open') return;
    this.revision++;
    // Resolve the initial closed style before setting the transition's destination.
    void this.panel.getBoundingClientRect();
    this.phase = 'open';
    this.panel.inert = false;
    this.dialog.dataset.state = 'open';
    this.trigger.setAttribute('aria-label', this.closeLabel);
    this.trigger.setAttribute('aria-expanded', 'true');
  }

  loaded(): void {
    if (this.phase === 'disposed') return;
    this.content.dataset.loaded = 'true';
    this.content.inert = false;
    this.panel.setAttribute('aria-busy', 'false');
  }

  close(finished: () => void): void {
    if (this.phase === 'disposed' || this.phase === 'closing') return;
    this.phase = 'closing';
    const revision = ++this.revision;
    this.panel.inert = true;
    this.dialog.dataset.state = 'closing';
    this.restoreLabel();
    this.trigger.focus({ preventScroll: true });
    afterTransitions(
      this.dialog,
      () => revision === this.revision && this.phase === 'closing',
      finished,
    );
  }

  private restoreLabel(): void {
    if (this.originalLabel === null) this.trigger.removeAttribute('aria-label');
    else this.trigger.setAttribute('aria-label', this.originalLabel);
    this.trigger.setAttribute('aria-expanded', 'false');
  }

  dispose(): void {
    this.phase = 'disposed';
    this.revision++;
    this.dialog.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
    this.restoreLabel();
    this.root.append(this.trigger);
  }
}
