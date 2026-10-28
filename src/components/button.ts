import { mountComponent } from '../core.js';
import type { ReservationMount } from '../types.js';
export const mountReservationButton: ReservationMount = (target, options) =>
  mountComponent(target, options, 'button');
