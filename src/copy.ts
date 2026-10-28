import type { WidgetLanguage } from './types.js';
export const labels: Record<
  WidgetLanguage,
  { reserve: string; short: string; close: string; fallback: string }
> = {
  de: {
    reserve: 'Tisch reservieren',
    short: 'Reservieren',
    close: 'Schließen',
    fallback: 'Reservierung öffnen',
  },
  en: {
    reserve: 'Reserve a table',
    short: 'Reserve',
    close: 'Close',
    fallback: 'Open reservation',
  },
  fr: {
    reserve: 'Réserver une table',
    short: 'Réserver',
    close: 'Fermer',
    fallback: 'Ouvrir la réservation',
  },
  it: {
    reserve: 'Prenota un tavolo',
    short: 'Prenota',
    close: 'Chiudi',
    fallback: 'Apri prenotazione',
  },
  es: {
    reserve: 'Reservar una mesa',
    short: 'Reservar',
    close: 'Cerrar',
    fallback: 'Abrir reserva',
  },
  pt: {
    reserve: 'Reservar uma mesa',
    short: 'Reservar',
    close: 'Fechar',
    fallback: 'Abrir reserva',
  },
  pl: {
    reserve: 'Zarezerwuj stolik',
    short: 'Rezerwacja',
    close: 'Zamknij',
    fallback: 'Otwórz rezerwację',
  },
  uk: {
    reserve: 'Забронювати столик',
    short: 'Бронювання',
    close: 'Закрити',
    fallback: 'Відкрити бронювання',
  },
  tr: { reserve: 'Masa ayırt', short: 'Rezervasyon', close: 'Kapat', fallback: 'Rezervasyonu aç' },
};
