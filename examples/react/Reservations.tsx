'use client';

import { useEffect, useRef } from 'react';
import { mountReservations, type WidgetLanguage } from '@menueqr/widget';

// Works in React and a Next.js client component. Effects never run during SSR.
export function Reservations({
  restaurant,
  language = 'de',
}: {
  restaurant: string;
  language?: WidgetLanguage;
}) {
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target.current) return;
    const widget = mountReservations(target.current, {
      restaurant,
      language,
      mode: 'button',
    });
    return () => widget.destroy();
  }, [restaurant, language]);

  return <div ref={target} />;
}
