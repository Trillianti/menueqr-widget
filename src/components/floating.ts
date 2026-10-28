import { mountComponent } from '../core.js';
import type { ReservationMount } from '../types.js';
export const mountReservationFloating: ReservationMount = (target, options) =>
  mountComponent(target, options, 'floating');
