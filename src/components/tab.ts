import { mountComponent } from '../core.js';
import type { ReservationMount } from '../types.js';
export const mountReservationTab: ReservationMount = (target, options) =>
  mountComponent(target, options, 'tab');
