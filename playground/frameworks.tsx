import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { mountReservationButton, type ReservationComponent } from '../src/index.js';
import {
  ReservationButton,
  ReservationFloating,
  ReservationTab,
  ReservationInline,
} from '../src/react.js';
declare const __FIXTURE_ORIGIN__: string;
const reactComponents = {
  button: ReservationButton,
  floating: ReservationFloating,
  tab: ReservationTab,
  inline: ReservationInline,
};
let reactPresentation: keyof typeof reactComponents = 'button';
let restaurant = 'react-smoke';
const reactRoot = createRoot(document.getElementById('react-root')!);
function renderReact() {
  const Component = reactComponents[reactPresentation];
  reactRoot.render(
    <StrictMode>
      <div data-framework="react">
        <Component restaurant={restaurant} language="en" baseUrl={__FIXTURE_ORIGIN__} />
      </div>
    </StrictMode>,
  );
}
renderReact();
document.getElementById('react-component')!.onchange = (event) => {
  reactPresentation = (event.target as HTMLSelectElement).value as keyof typeof reactComponents;
  restaurant = 'react-smoke';
  renderReact();
};
document.getElementById('update-react')!.onclick = () => {
  restaurant = 'https://www.menueqr.de/menu/react-updated/';
  renderReact();
};
const vueApp = createApp({
  setup() {
    const target = ref<HTMLDivElement>();
    let widget: ReservationComponent | undefined;
    onMounted(() => {
      if (target.value)
        widget = mountReservationButton(target.value, {
          restaurant: 'vue-smoke',
          language: 'en',
          baseUrl: __FIXTURE_ORIGIN__,
        });
    });
    onBeforeUnmount(() => widget?.destroy());
    return () => h('div', { ref: target, 'data-framework': 'vue' });
  },
});
vueApp.mount('#vue-root');
document.getElementById('remove-react')!.onclick = () => reactRoot.unmount();
document.getElementById('remove-vue')!.onclick = () => vueApp.unmount();
