import { labels } from '../copy.js';
import { createTrigger } from './trigger.js';
import type { PresentationContext, Presentation } from './types.js';
export function renderFloating(context: PresentationContext): Presentation {
  return {
    portal: true,
    inline: null,
    trigger: createTrigger(context, 'floating', labels[context.options.language].short),
  };
}
