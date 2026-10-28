'use client';
import { mountReservationTab } from '../components/tab.js';
import { useReservationComponent, type ReservationComponentProps } from './shared.js';
export function ReservationTab(props: ReservationComponentProps) {
  return useReservationComponent(mountReservationTab, props);
}
