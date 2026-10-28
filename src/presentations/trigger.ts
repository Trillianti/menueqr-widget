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
    const icon = doc.createElement('span');
    icon.className = 'icon';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon);
  }
  const text = doc.createElement('span');
  text.textContent = options.label || label;
  button.append(text);
  return button;
}
