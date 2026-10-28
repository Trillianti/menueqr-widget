import { StrictMode, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createApp, h, onBeforeUnmount, onMounted, ref } from 'vue';
import { mountReservations, type ReservationWidget } from '../src/index.js';
declare const __FIXTURE_ORIGIN__: string;
function ReactBooking() {
  const target = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!target.current) return;
    const widget = mountReservations(target.current, {
      restaurant: 'react-smoke',
      language: 'en',
      baseUrl: __FIXTURE_ORIGIN__,
    });
    return () => widget.destroy();
  }, []);
  return <div data-framework="react" ref={target} />;
}
const reactRoot = createRoot(document.getElementById('react-root')!);
reactRoot.render(
  <StrictMode>
    <ReactBooking />
  </StrictMode>,
);
const vueApp = createApp({
  setup() {
    const target = ref<HTMLDivElement>();
    let widget: ReservationWidget | undefined;
    onMounted(() => {
      if (target.value)
        widget = mountReservations(target.value, {
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
