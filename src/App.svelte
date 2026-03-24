<script lang="ts">
  import HexCanvas from './components/HexCanvas.svelte';
  import DebugOverlay from './components/DebugOverlay.svelte';
  import TurnIndicator from './components/TurnIndicator.svelte';
  import MoveCounter from './components/MoveCounter.svelte';
  import GameOverlay from './components/GameOverlay.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import LandingPage from './components/LandingPage.svelte';
  import { createGameState, type GameStateAPI } from './lib/state/game-state.svelte';
  import { createThemeState } from './lib/theme/theme-state.svelte';
  import { DARK_THEME, LIGHT_THEME } from './lib/theme/colors';

  type AppView = 'landing' | 'local-game' | 'online-host' | 'online-guest';

  let debugActive = $state(false);
  let gameId = $state<string | null>(null);
  let gameState = $state<GameStateAPI | null>(null);

  // Theme persists across all views (D-02)
  const themeState = createThemeState();
  const themeColors = $derived(themeState.theme === 'dark' ? DARK_THEME : LIGHT_THEME);

  // Detect guest link hash on mount (D-03) -- read ONCE, no hashchange listener
  function detectInitialView(): AppView {
    const hash = window.location.hash.slice(1);
    if (hash.length >= 6) {
      gameId = hash;
      return 'online-guest';
    }
    return 'landing';
  }

  let view = $state<AppView>(detectInitialView());

  // Create gameState lazily when entering a game view
  function ensureGameState(): GameStateAPI {
    if (!gameState) {
      gameState = createGameState();
    }
    return gameState;
  }

  function startLocalGame() {
    gameState = createGameState();
    view = 'local-game';
  }

  function startOnlineGame() {
    gameState = createGameState();
    view = 'online-host';
  }

  // If guest link detected, create game state immediately
  if (view === 'online-guest') {
    gameState = createGameState();
  }
</script>

{#if view === 'landing'}
  <div class="landing-container">
    <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />
    <LandingPage onLocalGame={startLocalGame} onOnlineGame={startOnlineGame} />
  </div>
{:else}
  {@const gs = ensureGameState()}
  <div class="game-container">
    <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />
    <HexCanvas bind:debugActive gameState={gs} {themeColors} />
    <TurnIndicator
      currentPlayer={gs.currentPlayer}
      placementsThisTurn={gs.placementsThisTurn}
      maxPlacements={gs.maxPlacements}
      visible={gs.status === 'playing'}
    />
    <MoveCounter totalMoves={gs.totalMoves} />
    {#if gs.status === 'won' && gs.winner}
      <GameOverlay winner={gs.winner} onRematch={() => gs.rematch()} />
    {/if}
    {#if view === 'online-host'}
      <!-- WaitingOverlay will be added in Plan 04 -->
    {/if}
    {#if view === 'online-guest'}
      <!-- JoinOverlay will be added in Plan 04 -->
    {/if}
    <DebugOverlay active={debugActive} />
  </div>
{/if}

<style>
  .landing-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

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
