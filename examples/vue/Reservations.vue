<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  mountReservationButton,
  type ReservationComponent,
  type WidgetLanguage,
} from '@menueqr/widget';

// Nuxt: the import is SSR-safe; mounting happens only on the client.
const props = defineProps<{ restaurant: string; language?: WidgetLanguage }>();
const target = ref<HTMLElement | null>(null);
let widget: ReservationComponent | undefined;

onMounted(() => {
  if (!target.value) return;
  widget = mountReservationButton(target.value, {
    restaurant: props.restaurant,
    language: props.language ?? 'de',
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
