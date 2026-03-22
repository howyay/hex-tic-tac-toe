<script lang="ts">
  let { currentPlayer, placementsThisTurn, maxPlacements, visible = true }:
    { currentPlayer: 'X' | 'O'; placementsThisTurn: number; maxPlacements: number; visible?: boolean } = $props();

  const playerColor = $derived(currentPlayer === 'X' ? 'var(--color-player-x)' : 'var(--color-player-o)');
</script>

{#if visible}
<div class="turn-indicator">
  <span class="player-letter" style:color={playerColor}>{currentPlayer}</span> — {placementsThisTurn + 1} of {maxPlacements}
</div>
{/if}

<style>
  .turn-indicator {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-overlay-bg);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text);
    z-index: 10;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    user-select: none;
  }
</style>
