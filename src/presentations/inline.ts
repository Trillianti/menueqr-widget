import type { PresentationContext, Presentation } from './types.js';
export function renderInline({ document: doc }: PresentationContext): Presentation {
  const inline = doc.createElement('div');
  inline.className = 'inline';
  return { portal: false, inline, trigger: null };
}
