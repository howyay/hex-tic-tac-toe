<script lang="ts">
  import HexCanvas from './components/HexCanvas.svelte';
  import DebugOverlay from './components/DebugOverlay.svelte';

  let debugActive = $state(false);
</script>

<HexCanvas bind:debugActive />
<DebugOverlay active={debugActive} />

<style>
  :global(html, body, #app) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
