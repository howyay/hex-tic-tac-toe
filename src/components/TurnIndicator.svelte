<script lang="ts">
  import { formatTime } from '../lib/game/timer';

  let { currentPlayer, placementsThisTurn, maxPlacements, visible = true, timerSeconds, timerWarning = false }:
    {
      currentPlayer: 'X' | 'O';
      placementsThisTurn: number;
      maxPlacements: number;
      visible?: boolean;
      timerSeconds?: number;
      timerWarning?: boolean;
    } = $props();

  const playerColor = $derived(currentPlayer === 'X' ? 'var(--color-player-x)' : 'var(--color-player-o)');
  const remaining = $derived(maxPlacements - placementsThisTurn);
  const hasTimer = $derived(timerSeconds !== undefined && timerSeconds >= 0);
</script>

{#if visible}
<div class="turn-indicator" class:warning={timerWarning}>
  <span class="player-letter" style:color={playerColor}>{currentPlayer}</span>
  {#if hasTimer}
    — {remaining} remaining — {formatTime(timerSeconds!)}
  {:else}
    — {remaining} remaining
  {/if}
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
    white-space: nowrap;
  }

  .turn-indicator.warning {
    color: var(--color-warning, #e53e3e);
  }
</style>
