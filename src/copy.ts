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

export const recoveryLabels: Record<
  WidgetLanguage,
  {
    blockedTitle: string;
    blockedBody: string;
    failedTitle: string;
    failedBody: string;
    settings: string;
    retry: string;
  }
> = {
  de: {
    blockedTitle: 'Website noch nicht freigegeben',
    blockedBody: 'Der Restaurantbetreiber muss diese Adresse in MenüQR unter Website hinterlegen.',
    failedTitle: 'Reservierung lädt nicht',
    failedBody: 'Versuchen Sie es erneut oder öffnen Sie die Reservierung direkt.',
    settings: 'Website-Einstellungen öffnen',
    retry: 'Erneut versuchen',
  },
  en: {
    blockedTitle: 'Website not approved yet',
    blockedBody: 'The restaurant owner needs to add this address under Website in MenüQR.',
    failedTitle: 'Reservation could not load',
    failedBody: 'Try again or open the reservation page directly.',
    settings: 'Open website settings',
    retry: 'Try again',
  },
  fr: {
    blockedTitle: 'Site pas encore autorisé',
    blockedBody: 'Le restaurant doit ajouter cette adresse dans le champ Site web de MenüQR.',
    failedTitle: 'La réservation ne se charge pas',
    failedBody: 'Réessayez ou ouvrez directement la page de réservation.',
    settings: 'Ouvrir les paramètres du site',
    retry: 'Réessayer',
  },
  it: {
    blockedTitle: 'Sito non ancora autorizzato',
    blockedBody: 'Il ristorante deve aggiungere questo indirizzo nel campo Sito web di MenüQR.',
    failedTitle: 'La prenotazione non si carica',
    failedBody: 'Riprova oppure apri direttamente la pagina di prenotazione.',
    settings: 'Apri le impostazioni del sito',
    retry: 'Riprova',
  },
  es: {
    blockedTitle: 'Sitio web aún no autorizado',
    blockedBody: 'El restaurante debe añadir esta dirección en el campo Sitio web de MenüQR.',
    failedTitle: 'No se puede cargar la reserva',
    failedBody: 'Inténtalo de nuevo o abre directamente la página de reservas.',
    settings: 'Abrir ajustes del sitio web',
    retry: 'Reintentar',
  },
  pt: {
    blockedTitle: 'Site ainda não autorizado',
    blockedBody: 'O restaurante precisa de adicionar este endereço no campo Site de MenüQR.',
    failedTitle: 'Não foi possível carregar a reserva',
    failedBody: 'Tente novamente ou abra a página de reservas diretamente.',
    settings: 'Abrir as definições do site',
    retry: 'Tentar novamente',
  },
  pl: {
    blockedTitle: 'Witryna nie jest jeszcze zatwierdzona',
    blockedBody: 'Restauracja musi dodać ten adres w polu Strona internetowa w MenüQR.',
    failedTitle: 'Nie można wczytać rezerwacji',
    failedBody: 'Spróbuj ponownie lub otwórz bezpośrednio stronę rezerwacji.',
    settings: 'Otwórz ustawienia witryny',
    retry: 'Spróbuj ponownie',
  },
  uk: {
    blockedTitle: 'Сайт ще не дозволено',
    blockedBody: 'Власник ресторану має додати цю адресу в полі «Вебсайт» у MenüQR.',
    failedTitle: 'Бронювання не завантажується',
    failedBody: 'Спробуйте ще раз або відкрийте сторінку бронювання напряму.',
    settings: 'Відкрити налаштування сайту',
    retry: 'Спробувати ще раз',
  },
  tr: {
    blockedTitle: 'Web sitesi henüz onaylanmadı',
    blockedBody: 'Restoranın bu adresi MenüQR içindeki Web sitesi alanına eklemesi gerekiyor.',
    failedTitle: 'Rezervasyon yüklenemedi',
    failedBody: 'Tekrar deneyin veya rezervasyon sayfasını doğrudan açın.',
    settings: 'Web sitesi ayarlarını aç',
    retry: 'Tekrar dene',
  },
};
