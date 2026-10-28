import type { WidgetConfiguration } from '../types.js';
export interface PresentationContext {
  document: Document;
  options: WidgetConfiguration;
  id: string;
}
export interface Presentation {
  portal: boolean;
  trigger: HTMLButtonElement | null;
  inline: HTMLDivElement | null;
}
