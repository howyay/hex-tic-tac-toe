<script lang="ts">
  import HexCanvas from './components/HexCanvas.svelte';
  import DebugOverlay from './components/DebugOverlay.svelte';
  import TurnIndicator from './components/TurnIndicator.svelte';
  import MoveCounter from './components/MoveCounter.svelte';
  import GameOverlay from './components/GameOverlay.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import { createGameState } from './lib/state/game-state.svelte';
  import { createThemeState } from './lib/theme/theme-state.svelte';
  import { DARK_THEME, LIGHT_THEME } from './lib/theme/colors';

  let debugActive = $state(false);
  const gameState = createGameState();
  const themeState = createThemeState();
  const themeColors = $derived(themeState.theme === 'dark' ? DARK_THEME : LIGHT_THEME);
</script>

<div class="game-container">
  <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />
  <HexCanvas bind:debugActive {gameState} {themeColors} />
  <TurnIndicator
    currentPlayer={gameState.currentPlayer}
    placementsThisTurn={gameState.placementsThisTurn}
    maxPlacements={gameState.maxPlacements}
    visible={gameState.status === 'playing'}
  />
  <MoveCounter totalMoves={gameState.totalMoves} />
  {#if gameState.status === 'won' && gameState.winner}
    <GameOverlay winner={gameState.winner} onRematch={() => gameState.rematch()} />
  {/if}
  <DebugOverlay active={debugActive} />
</div>

<style>
  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  :global(html, body, #app) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
