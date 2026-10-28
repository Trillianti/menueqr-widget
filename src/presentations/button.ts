import { labels } from '../copy.js';
import { createTrigger } from './trigger.js';
import type { PresentationContext, Presentation } from './types.js';
export function renderButton(context: PresentationContext): Presentation {
  return {
    portal: false,
    inline: null,
    trigger: createTrigger(context, 'button', labels[context.options.language].reserve),
  };
}
