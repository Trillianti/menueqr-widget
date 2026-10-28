'use client';
import { mountReservationFloating } from '../components/floating.js';
import { useReservationComponent, type ReservationComponentProps } from './shared.js';
export function ReservationFloating(props: ReservationComponentProps) {
  return useReservationComponent(mountReservationFloating, props);
}
