import { labels } from '../copy.js';
import { createTrigger } from './trigger.js';
import type { PresentationContext, Presentation } from './types.js';
export function renderTab(context: PresentationContext): Presentation {
  return {
    portal: true,
    inline: null,
    trigger: createTrigger(context, 'tab', labels[context.options.language].short),
  };
}
