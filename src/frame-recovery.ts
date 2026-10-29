import { labels, recoveryLabels } from './copy.js';
import type { WidgetConfiguration } from './types.js';

/** Diagnose a missing trusted handshake without changing iframe permissions. */
export class FrameRecovery {
  private readonly view: Window & typeof globalThis;
  private readonly fallback: HTMLAnchorElement;
  private panel: HTMLDivElement | null = null;
  private phase: 'pending' | 'failed' | 'ready' | 'destroyed' = 'pending';
  private checkTimer: number;
  private deadline: number;
  private abortTimer: number | undefined;
  private request: AbortController | null = null;

  constructor(
    private readonly frame: HTMLIFrameElement,
    private readonly container: HTMLElement,
    private readonly config: WidgetConfiguration,
    private readonly onFailure: () => void,
    private readonly onRetry: () => void,
  ) {
    const doc = container.ownerDocument;
    this.view = doc.defaultView!;
    this.fallback = doc.createElement('a');
    this.fallback.className = 'fallback';
    this.fallback.href = `${config.baseUrl}/menu/${encodeURIComponent(config.restaurant)}/reserve/`;
    this.fallback.target = '_blank';
    this.fallback.rel = 'noopener noreferrer';
    this.fallback.textContent = labels[config.language].fallback;
    container.append(this.fallback);
    this.checkTimer = this.view.setTimeout(() => void this.check(), 2000);
    this.deadline = this.view.setTimeout(() => this.show(false), 7000);
  }

  loaded(): void {
    if (this.phase !== 'pending' || this.request) return;
    this.view.clearTimeout(this.checkTimer);
    // A normal ready message follows load. Successful frames need no extra request.
    this.checkTimer = this.view.setTimeout(() => void this.check(), 800);
  }

  private async check(): Promise<void> {
    if (this.phase !== 'pending' || this.request) return;
    const request = new this.view.AbortController();
    this.request = request;
    this.abortTimer = this.view.setTimeout(() => request.abort(), 3000);
    try {
      const url = new URL('/api/reservation-widget/access/', this.config.baseUrl);
      url.searchParams.set('restaurant', this.config.restaurant);
      url.searchParams.set('origin', this.view.location.origin);
      const response = await this.view.fetch(url.href, {
        credentials: 'omit',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        signal: request.signal,
      });
      if (!response.ok) return;
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object' || !('status' in result)) return;
      if (result.status === 'origin_not_allowed') this.show(true);
      else if (result.status === 'unavailable') this.show(false);
    } catch {
      // Offline, host connect-src restrictions and older services use the neutral timeout.
    } finally {
      this.view.clearTimeout(this.abortTimer);
    }
  }

  private show(blocked: boolean): void {
    if (this.phase !== 'pending') return;
    this.phase = 'failed';
    this.view.clearTimeout(this.deadline);
    const doc = this.container.ownerDocument;
    const copy = recoveryLabels[this.config.language];
    const panel = doc.createElement('div');
    panel.className = 'frame-recovery';
    panel.setAttribute('role', 'status');
    const title = doc.createElement('h2');
    title.textContent = blocked ? copy.blockedTitle : copy.failedTitle;
    const description = doc.createElement('p');
    description.textContent = blocked ? copy.blockedBody : copy.failedBody;
    panel.append(title, description);
    if (blocked) {
      const origin = doc.createElement('code');
      origin.textContent = this.view.location.origin;
      panel.append(origin);
    }
    const actions = doc.createElement('div');
    actions.className = 'recovery-actions';
    const retry = doc.createElement('button');
    retry.type = 'button';
    retry.textContent = copy.retry;
    retry.addEventListener('click', this.onRetry);
    actions.append(this.fallback, retry);
    panel.append(actions);
    if (blocked) {
      const settings = new URL(
        `${this.config.language === 'de' ? '' : `/${this.config.language}`}/dashboard/settings/profile/`,
        this.config.baseUrl,
      );
      settings.searchParams.set('setting', 'restaurant-website');
      const link = doc.createElement('a');
      link.className = 'recovery-settings';
      link.href = settings.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = copy.settings;
      panel.append(link);
    }
    this.panel = panel;
    this.frame.hidden = true;
    this.onFailure();
    this.container.append(panel);
  }

  ready(): void {
    if (this.phase === 'destroyed') return;
    this.phase = 'ready';
    this.cleanup();
    this.frame.hidden = false;
  }

  private cleanup(): void {
    this.view.clearTimeout(this.checkTimer);
    this.view.clearTimeout(this.deadline);
    this.view.clearTimeout(this.abortTimer);
    this.request?.abort();
    this.fallback.remove();
    this.panel?.remove();
  }

  destroy(): void {
    this.phase = 'destroyed';
    this.cleanup();
  }
}
