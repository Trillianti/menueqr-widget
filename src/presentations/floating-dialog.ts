import { afterTransitions } from './transition.js';

/** Grow the surface from the launcher's actual bounds without scaling the form. */
export class FloatingDialog {
  readonly dialog: HTMLDialogElement;
  readonly content: HTMLDivElement;
  readonly closeControl: HTMLButtonElement;
  private phase: 'closed' | 'open' | 'closing' | 'disposed' = 'closed';
  private revision = 0;
  private trustedReady = false;

  constructor(private readonly trigger: HTMLButtonElement) {
    const doc = trigger.ownerDocument;
    this.dialog = doc.createElement('dialog');
    this.dialog.className = 'floating-popover';
    this.dialog.dataset.state = 'closed';
    this.dialog.tabIndex = -1;
    this.content = doc.createElement('div');
    this.content.className = 'floating-surface';
    this.closeControl = doc.createElement('button');
    this.closeControl.className = 'close';
    const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'm6 6 12 12M18 6 6 18');
    svg.append(path);
    this.closeControl.append(svg);
    const shadow = doc.createElement('div');
    shadow.className = 'floating-shadow';
    shadow.setAttribute('aria-hidden', 'true');
    this.dialog.append(shadow, this.content);
  }

  get isClosing(): boolean {
    return this.phase === 'closing';
  }

  position(): void {
    if (this.phase === 'disposed') return;
    const view = this.trigger.ownerDocument.defaultView;
    if (!view || !this.dialog.open) return;
    const launcher = this.trigger.getBoundingClientRect();
    this.dialog.style.setProperty('--mw-launcher-width', `${launcher.width}px`);
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
    const bounds = this.dialog.getBoundingClientRect();
    const width = this.dialog.offsetWidth;
    const height = this.dialog.offsetHeight;
    const left = bounds.left;
    const top = bounds.top;
    const capsuleWidth = Math.min(launcher.width, width);
    const capsuleHeight = Math.min(launcher.height, height);
    const capsuleLeft = clamp(launcher.left - left, 0, width - capsuleWidth);
    const capsuleTop = clamp(launcher.top - top, 0, height - capsuleHeight);
    const values = {
      '--mw-capsule-left': capsuleLeft,
      '--mw-capsule-top': capsuleTop,
      '--mw-capsule-right': width - capsuleLeft - capsuleWidth,
      '--mw-capsule-bottom': height - capsuleTop - capsuleHeight,
      '--mw-capsule-width': capsuleWidth,
      '--mw-capsule-height': capsuleHeight,
      '--mw-capsule-radius': launcher.height / 2,
      '--mw-capsule-x': launcher.left - left - capsuleLeft - (capsuleWidth - launcher.width) / 2,
      '--mw-capsule-y': launcher.top - top - capsuleTop - (capsuleHeight - launcher.height) / 2,
    };
    for (const [name, value] of Object.entries(values))
      this.dialog.style.setProperty(name, `${value}px`);
    this.dialog.style.setProperty(
      '--mw-capsule-scale-x',
      String(launcher.width / Math.max(1, capsuleWidth)),
    );
    this.dialog.style.setProperty(
      '--mw-capsule-scale-y',
      String(launcher.height / Math.max(1, capsuleHeight)),
    );
    this.content.style.transformOrigin = `${capsuleLeft + capsuleWidth / 2}px ${capsuleTop + capsuleHeight / 2}px`;
  }

  show(): void {
    if (this.phase === 'disposed' || this.phase === 'open') return;
    this.revision++;
    this.position();
    void this.content.getBoundingClientRect();
    this.phase = 'open';
    delete this.dialog.dataset.contentVisible;
    delete this.dialog.dataset.closeReady;
    this.closeControl.disabled = false;
    this.closeControl.removeAttribute('aria-hidden');
    this.dialog.dataset.state = 'open';
    this.dialog.setAttribute('aria-busy', 'true');
    this.settleOpen();
  }

  loaded(trustedReady = false): void {
    if (this.phase === 'disposed') return;
    this.trustedReady ||= trustedReady;
    if (!this.dialog.dataset.loaded) {
      this.dialog.dataset.loaded = 'true';
      this.settleOpen();
    }
    if (this.dialog.dataset.contentVisible) this.handoffClose();
  }

  private settleOpen(): void {
    if (this.phase !== 'open') return;
    const frame = this.content.querySelector('iframe');
    if (frame) frame.inert = true;
    const revision = this.revision;
    afterTransitions(
      this.dialog,
      () => this.phase === 'open' && revision === this.revision,
      () => {
        if (frame && this.dialog.dataset.loaded) {
          frame.inert = false;
          this.dialog.setAttribute('aria-busy', 'false');
          this.dialog.dataset.contentVisible = 'true';
          this.handoffClose();
        }
      },
    );
  }

  private handoffClose(): void {
    if (!this.trustedReady || this.phase !== 'open') return;
    const root = this.dialog.getRootNode() as ShadowRoot;
    if (root.activeElement === this.closeControl) this.dialog.focus({ preventScroll: true });
    this.closeControl.disabled = true;
    this.closeControl.setAttribute('aria-hidden', 'true');
    this.dialog.dataset.closeReady = 'true';
  }

  close(finished: () => void): void {
    if (this.phase === 'disposed' || this.phase === 'closing') return;
    this.position();
    this.phase = 'closing';
    delete this.dialog.dataset.closeReady;
    const revision = ++this.revision;
    this.dialog.dataset.state = 'closing';
    const frame = this.content.querySelector('iframe');
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
