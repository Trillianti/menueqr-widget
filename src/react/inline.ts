'use client';
import { mountReservationInline } from '../components/inline.js';
import { useReservationComponent, type ReservationComponentProps } from './shared.js';
export function ReservationInline(props: ReservationComponentProps) {
  return useReservationComponent(mountReservationInline, props);
}
