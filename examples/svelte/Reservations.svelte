<script lang="ts">
  import { onMount } from 'svelte';
  import { mountReservationButton, type ReservationComponent, type WidgetLanguage } from '@menueqr/widget';

  export let restaurant: string;
  export let language: WidgetLanguage = 'de';
  let target: HTMLDivElement;
  let widget: ReservationComponent | undefined;

  onMount(() => {
    widget = mountReservationButton(target, { restaurant, language });
    return () => {
      widget?.destroy();
      widget = undefined;
    };
  });

  $: widget?.update({ restaurant, language });
</script>

<div bind:this={target}></div>
