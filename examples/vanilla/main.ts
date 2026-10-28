import { mountReservationButton } from '@menueqr/widget';

// Add <div id="reservations"></div> to your HTML. Load through a module bundler.
const widget = mountReservationButton('#reservations', {
  restaurant: 'your-restaurant-slug',
  language: 'de',
});

// Call on page/component disposal, not before the guest can use the widget.
window.addEventListener('pagehide', () => widget.destroy(), { once: true });
