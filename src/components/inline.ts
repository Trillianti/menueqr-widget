import { mountComponent } from '../core.js';
import type { ReservationMount } from '../types.js';
export const mountReservationInline: ReservationMount = (target, options) =>
  mountComponent(target, options, 'inline');
