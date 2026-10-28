export { mountReservationButton } from './components/button.js';
export { mountReservationFloating } from './components/floating.js';
export { mountReservationTab } from './components/tab.js';
export { mountReservationInline } from './components/inline.js';
export { resolveRestaurantSlug } from './restaurant.js';
export { languages } from './types.js';
/** @deprecated Compatibility entry point for 0.1.x; use a separate component. */
export { mountReservations } from './core.js';
export type {
  ReservationComponent,
  ReservationComponentOptions,
  ReservationMount,
  CloseReason,
  ReservationWidget,
  ReservationWidgetOptions,
  WidgetConfiguration,
  WidgetLanguage,
  WidgetMode,
} from './types.js';
