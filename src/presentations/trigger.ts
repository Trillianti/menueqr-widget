import type { PresentationContext } from './types.js';
/** Shared button primitive; each presentation owns its mounting and placement. */
export function createTrigger(
  { document: doc, options, id }: PresentationContext,
  presentation: 'button' | 'floating' | 'tab',
  label: string,
): HTMLButtonElement {
  const button = doc.createElement('button');
  button.type = 'button';
  button.className = 'trigger';
  button.dataset.mode = presentation;
  button.dataset.side = options.side;
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', id);
  if (options.icon) {
    const namespace = 'http://www.w3.org/2000/svg';
    const icon = doc.createElementNS(namespace, 'svg');
    icon.setAttribute('class', 'icon');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '20');
    icon.setAttribute('height', '20');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.75');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const outline = doc.createElementNS(namespace, 'rect');
    outline.setAttribute('x', '4');
    outline.setAttribute('y', '5.5');
    outline.setAttribute('width', '16');
    outline.setAttribute('height', '15');
    outline.setAttribute('rx', '3');
    const detail = doc.createElementNS(namespace, 'path');
    detail.setAttribute('d', 'M8 3.5v4M16 3.5v4M4 10h16');
    icon.append(outline, detail);
    button.append(icon);
  }
  const text = doc.createElement('span');
  text.textContent = options.label || label;
  button.append(text);
  return button;
}
