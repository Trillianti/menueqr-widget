<script lang="ts">
  import { onMount } from 'svelte';
  import { mountReservations, type ReservationWidget, type WidgetLanguage } from '@menueqr/widget';

  export let restaurant: string;
  export let language: WidgetLanguage = 'de';
  let target: HTMLDivElement;
  let widget: ReservationWidget | undefined;

  onMount(() => {
    widget = mountReservations(target, { restaurant, language, mode: 'button' });
    return () => {
      widget?.destroy();
      widget = undefined;
    };
  });

  $: widget?.update({ restaurant, language });
</script>

<div bind:this={target}></div>
