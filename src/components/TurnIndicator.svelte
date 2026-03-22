<script lang="ts">
  let { currentPlayer, placementsThisTurn, maxPlacements, visible = true }:
    { currentPlayer: 'X' | 'O'; placementsThisTurn: number; maxPlacements: number; visible?: boolean } = $props();

  const playerColor = $derived(currentPlayer === 'X' ? '#4fc3f7' : '#ef5350');
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
    background: rgba(0, 0, 0, 0.5);
    border-radius: 20px;
    padding: 8px 16px;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
    color: #ffffff;
    z-index: 10;
    font-family: system-ui, -apple-system, sans-serif;
    pointer-events: none;
    user-select: none;
  }
</style>
