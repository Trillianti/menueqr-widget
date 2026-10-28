'use client';
import { mountReservationButton } from '../components/button.js';
import { useReservationComponent, type ReservationComponentProps } from './shared.js';
export function ReservationButton(props: ReservationComponentProps) {
  return useReservationComponent(mountReservationButton, props);
}
