import { afterTransitions } from './transition.js';

/** Native modality with a reversible entrance anchored to the ordinary button. */
export class ButtonDialog {
  readonly dialog: HTMLDialogElement;
  private phase: 'closed' | 'open' | 'closing' | 'disposed' = 'closed';
  private revision = 0;

  constructor(private readonly trigger: HTMLButtonElement) {
    this.dialog = trigger.ownerDocument.createElement('dialog');
    this.dialog.className = 'button-modal';
    this.dialog.dataset.state = 'closed';
    this.dialog.tabIndex = -1;
  }

  get isClosing(): boolean {
    return this.phase === 'closing';
  }

  position(): void {
    const view = this.trigger.ownerDocument.defaultView;
    if (!view || !this.dialog.open) return;
    const launcher = this.trigger.getBoundingClientRect();
    const width = this.dialog.offsetWidth;
    const height = this.dialog.offsetHeight;
    const dx = launcher.left + launcher.width / 2 - view.innerWidth / 2;
    const dy = launcher.top + launcher.height / 2 - view.innerHeight / 2;
    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));
    this.dialog.style.setProperty('--mw-modal-x', `${clamp(dx, 24)}px`);
    this.dialog.style.setProperty('--mw-modal-y', `${dy < 0 ? -12 : 12}px`);
    this.dialog.style.setProperty('--mw-modal-exit-x', `${clamp(dx, 12)}px`);
    this.dialog.style.setProperty('--mw-modal-exit-y', `${dy < 0 ? -8 : 8}px`);
    this.dialog.style.transformOrigin = `${Math.max(width * 0.1, Math.min(width * 0.9, width / 2 + dx))}px ${Math.max(height * 0.1, Math.min(height * 0.9, height / 2 + dy))}px`;
  }

  show(): void {
    if (this.phase === 'disposed' || this.phase === 'open') return;
    this.revision++;
    this.position();
    void this.dialog.getBoundingClientRect();
    this.phase = 'open';
    this.dialog.dataset.state = 'open';
    const frame = this.dialog.querySelector('iframe');
    if (frame) frame.inert = !this.dialog.dataset.loaded;
  }

  loaded(trustedReady = false): void {
    if (this.phase === 'disposed') return;
    this.dialog.dataset.loaded = 'true';
    const frame = this.dialog.querySelector('iframe');
    if (frame) frame.inert = this.phase === 'closing';
    const root = this.dialog.getRootNode() as ShadowRoot;
    if (
      trustedReady &&
      this.phase === 'open' &&
      root.activeElement === this.dialog.querySelector('.close')
    ) {
      // The hosted form supplies its own close control; keep focus inside the modal
      // when the temporary local control is hidden after the trusted ready event.
      this.dialog.focus({ preventScroll: true });
    }
  }

  close(finished: () => void): void {
    if (this.phase === 'disposed' || this.phase === 'closing') return;
    this.phase = 'closing';
    const revision = ++this.revision;
    this.dialog.dataset.state = 'closing';
    const frame = this.dialog.querySelector('iframe');
    if (frame) frame.inert = true;
    this.dialog.focus({ preventScroll: true });
    afterTransitions(
      this.dialog,
      () => this.phase === 'closing' && revision === this.revision,
      finished,
    );
  }

  dispose(): void {
    this.phase = 'disposed';
    this.revision++;
    this.dialog.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
  }
}
