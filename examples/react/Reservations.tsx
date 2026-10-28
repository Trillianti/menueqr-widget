'use client';
import { ReservationButton } from '@menueqr/widget/react';
import type { WidgetLanguage } from '@menueqr/widget';

export function Reservations({
  restaurant,
  language = 'de',
}: {
  restaurant: string;
  language?: WidgetLanguage;
}) {
  return <ReservationButton restaurant={restaurant} language={language} />;
}
