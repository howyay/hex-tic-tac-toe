<script lang="ts">
  let { active }: { active: boolean } = $props();
</script>

{#if active}
  <div class="debug-hint">
    Ctrl+D: coordinates
  </div>
{/if}

<style>
  .debug-hint {
    position: fixed;
    bottom: 8px;
    left: 8px;
    font: 12px system-ui, -apple-system, sans-serif;
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
    z-index: 10;
  }
</style>
