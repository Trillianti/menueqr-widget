<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { mountReservations, type ReservationWidget, type WidgetLanguage } from '@menueqr/widget';

// Nuxt: the import is SSR-safe; mounting happens only on the client.
const props = defineProps<{ restaurant: string; language?: WidgetLanguage }>();
const target = ref<HTMLElement | null>(null);
let widget: ReservationWidget | undefined;

onMounted(() => {
  if (!target.value) return;
  widget = mountReservations(target.value, {
    restaurant: props.restaurant,
    language: props.language ?? 'de',
    mode: 'button',
  });
});

watch(
  () => [props.restaurant, props.language] as const,
  ([restaurant, language]) => widget?.update({ restaurant, language: language ?? 'de' }),
);

onBeforeUnmount(() => widget?.destroy());
</script>

<template>
  <div ref="target"></div>
</template>
