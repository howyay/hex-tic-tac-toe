<script lang="ts">
  import HexCanvas from './components/HexCanvas.svelte';
  import DebugOverlay from './components/DebugOverlay.svelte';
  import TurnIndicator from './components/TurnIndicator.svelte';
  import MoveCounter from './components/MoveCounter.svelte';
  import GameOverlay from './components/GameOverlay.svelte';
  import ThemeToggle from './components/ThemeToggle.svelte';
  import LandingPage from './components/LandingPage.svelte';
  import WaitingOverlay from './components/WaitingOverlay.svelte';
  import JoinOverlay from './components/JoinOverlay.svelte';
  import ConnectionStatus from './components/ConnectionStatus.svelte';
  import TimerSelector from './components/TimerSelector.svelte';
  import { createGameState, type GameStateAPI } from './lib/state/game-state.svelte';
  import { createOnlineGameState, type OnlineGameStateAPI } from './lib/state/online-game-state.svelte';
  import { createNetworkState, type NetworkStateAPI } from './lib/network/network-state.svelte';
  import { createThemeState } from './lib/theme/theme-state.svelte';
  import { DARK_THEME, LIGHT_THEME } from './lib/theme/colors';
  import type { TimerMode } from './lib/game/timer';
  import { DEFAULT_TIMER_MODE } from './lib/game/timer';

  type AppView = 'landing' | 'local-game' | 'online-setup' | 'online-host' | 'online-guest';

  let debugActive = $state(false);
  let gameId = $state<string | null>(null);
  let gameState = $state<GameStateAPI | null>(null);
  let networkState = $state<NetworkStateAPI | null>(null);
  let onlineGameState = $state<OnlineGameStateAPI | null>(null);
  let joinStatus = $state<'ready' | 'connecting' | 'error'>('ready');
  let joinError = $state<string | null>(null);
  let timerMode = $state<TimerMode>(DEFAULT_TIMER_MODE);

  // Theme persists across all views
  const themeState = createThemeState();
  const themeColors = $derived(themeState.theme === 'dark' ? DARK_THEME : LIGHT_THEME);

  // Background game state — always exists so the board is always visible behind overlays
  const backgroundState = createGameState();

  // Detect initial view from URL hash + sessionStorage
  function detectInitialView(): AppView {
    const hash = window.location.hash.slice(1);
    if (hash.length >= 6) {
      const storedRole = sessionStorage.getItem('hex-role');
      if (storedRole === 'host') {
        // Host refreshed — re-create as host with same game ID
        gameId = hash;
        return 'online-host';
      }
      gameId = hash;
      return 'online-guest';
    }
    return 'landing';
  }

  let view = $state<AppView>(detectInitialView());

  // If host refreshed, auto-restart the online game (timer lost on refresh -- unlimited)
  if (view === 'online-host' && gameId) {
    networkState = createNetworkState();
    onlineGameState = createOnlineGameState('host', gameId, networkState, 0);
  }

  // Active game state for gameplay: local or online (when connected)
  const activeGameState = $derived<GameStateAPI | null>(
    view === 'local-game' ? gameState :
    (view === 'online-host' || view === 'online-guest') ? onlineGameState :
    null
  );

  // The game state to render on the canvas — active game if playing, background otherwise
  const displayGameState = $derived<GameStateAPI>(activeGameState ?? backgroundState);

  // Whether the game is actively playable (no overlay blocking it)
  const isPlaying = $derived(
    activeGameState != null &&
    view !== 'landing' &&
    view !== 'online-setup' &&
    !showWaitingOverlay &&
    !showJoinOverlay
  );

  // Shake animation derived from online game state
  const isShaking = $derived(onlineGameState?.shaking ?? false);

  function startLocalGame() {
    gameState = createGameState();
    view = 'local-game';
  }

  function startOnlineGame() {
    view = 'online-setup';
  }

  function handleTimerSelect(mode: TimerMode) {
    timerMode = mode;
    sessionStorage.setItem('hex-role', 'host');
    networkState = createNetworkState();
    onlineGameState = createOnlineGameState('host', null, networkState, timerMode);
    view = 'online-host';
  }

  // Update URL hash when host gets a share link
  $effect(() => {
    if (view === 'online-host' && onlineGameState?.shareLink) {
      const hashPart = onlineGameState.shareLink.split('#')[1];
      if (hashPart) {
        window.location.hash = hashPart;
      }
    }
  });

  // Watch network state for guest connection result
  $effect(() => {
    if (view === 'online-guest' && networkState) {
      if (networkState.status === 'connected') {
        joinStatus = 'ready';
      } else if (networkState.error) {
        joinStatus = 'error';
        joinError = networkState.error;
      }
    }
  });

  function handleJoin() {
    if (!gameId) return;
    joinStatus = 'connecting';
    networkState = createNetworkState();
    onlineGameState = createOnlineGameState('guest', gameId, networkState);
  }

  function handleBack() {
    onlineGameState?.destroy();
    onlineGameState = null;
    networkState = null;
    gameId = null;
    joinStatus = 'ready';
    joinError = null;
    sessionStorage.removeItem('hex-role');
    window.location.hash = '';
    view = 'landing';
  }

  // Whether the guest join overlay should be shown
  const showJoinOverlay = $derived(
    view === 'online-guest' && (
      joinStatus === 'ready' ||
      joinStatus === 'connecting' ||
      joinStatus === 'error'
    ) && networkState?.status !== 'connected'
  );

  // Whether the host waiting overlay should be shown
  const showWaitingOverlay = $derived(
    view === 'online-host' && (
      onlineGameState?.waitingForGuest === true ||
      !onlineGameState ||
      networkState?.status === 'disconnected'
    )
  );

  // Whether the connection status should be shown
  const showConnectionStatus = $derived(
    (view === 'online-host' || view === 'online-guest') &&
    networkState != null &&
    !showWaitingOverlay &&
    !showJoinOverlay
  );

  // Determine waiting overlay status
  const waitingStatus = $derived<'registering' | 'waiting'>(
    networkState?.status === 'disconnected' ? 'registering' : 'waiting'
  );
</script>

<div class="game-container" class:shake={isShaking}>
  <!-- Board always renders as background -->
  <HexCanvas bind:debugActive gameState={displayGameState} {themeColors} />
  <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />

  <!-- Game UI overlays (only when actively playing) -->
  {#if isPlaying && activeGameState}
    <TurnIndicator
      currentPlayer={activeGameState.currentPlayer}
      placementsThisTurn={activeGameState.placementsThisTurn}
      maxPlacements={activeGameState.maxPlacements}
      visible={activeGameState.status === 'playing'}
      timerSeconds={onlineGameState?.timerSeconds}
      timerWarning={onlineGameState?.timerWarning ?? false}
    />
    <MoveCounter totalMoves={activeGameState.totalMoves} />
    {#if activeGameState.status === 'won' && activeGameState.winner}
      <GameOverlay winner={activeGameState.winner} onRematch={() => activeGameState!.rematch()} />
    {/if}
  {/if}

  <!-- Menu/connection overlays (semi-transparent over the board) -->
  {#if view === 'landing'}
    <LandingPage onLocalGame={startLocalGame} onOnlineGame={startOnlineGame} />
  {/if}
  {#if view === 'online-setup'}
    <TimerSelector onSelect={handleTimerSelect} />
  {/if}
  {#if showWaitingOverlay}
    <WaitingOverlay link={onlineGameState?.shareLink ?? ''} status={waitingStatus} />
  {/if}
  {#if showJoinOverlay}
    <JoinOverlay onJoin={handleJoin} status={joinStatus} error={joinError ?? undefined} onBack={handleBack} />
  {/if}
  {#if showConnectionStatus && networkState}
    <ConnectionStatus status={networkState.status} />
  {/if}
  <DebugOverlay active={debugActive} />
</div>

<style>
  .game-container {
    position: relative;
    width: 100%;
    height: 100%;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 50%, 90% { transform: translateX(-3px); }
    30%, 70% { transform: translateX(3px); }
  }

  .game-container.shake {
    animation: shake 0.4s ease-in-out;
  }

  :global(html, body, #app) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
</style>
