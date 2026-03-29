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
  import ReconnectOverlay from './components/ReconnectOverlay.svelte';
  import { createGameState, type GameStateAPI } from './lib/state/game-state.svelte';
  import { createOnlineGameState, restorePersistedState, clearPersistedState, type OnlineGameStateAPI } from './lib/state/online-game-state.svelte';
  import { createNetworkState, type NetworkStateAPI } from './lib/network/network-state.svelte';
  import { createThemeState } from './lib/theme/theme-state.svelte';
  import { DARK_THEME, LIGHT_THEME } from './lib/theme/colors';
  import type { TimerMode } from './lib/game/timer';
  import { DEFAULT_TIMER_MODE } from './lib/game/timer';
  import { generateGameId } from './lib/network/connection';

  type AppView = 'landing' | 'local-game' | 'online-setup' | 'online-host' | 'online-guest';

  let debugActive = $state(false);
  let gameId = $state<string | null>(null);
  let gameState = $state<GameStateAPI | null>(null);
  let networkState = $state<NetworkStateAPI | null>(null);
  let onlineGameState = $state<OnlineGameStateAPI | null>(null);
  let joinStatus = $state<'ready' | 'connecting' | 'error'>('ready');
  let joinError = $state<string | null>(null);
  let timerMode = $state<TimerMode>(DEFAULT_TIMER_MODE);

  const themeState = createThemeState();
  const themeColors = $derived(themeState.theme === 'dark' ? DARK_THEME : LIGHT_THEME);

  const backgroundState = createGameState();

  function detectInitialView(): AppView {
    const hash = window.location.hash.slice(1);
    if (hash.length < 6) return 'landing';

    // Try to restore persisted state
    const persisted = restorePersistedState();

    if (persisted && persisted.gameId === hash) {
      gameId = hash;
      if (persisted.role === 'host') {
        // Host refresh — restore state and reconnect
        networkState = createNetworkState();
        onlineGameState = createOnlineGameState('host', hash, networkState, persisted.timerMode, persisted.snapshot);
        return 'online-host';
      } else {
        // Guest refresh — restore state for display, will reconnect
        networkState = createNetworkState();
        onlineGameState = createOnlineGameState('guest', hash, networkState, persisted.timerMode, persisted.snapshot);
        return 'online-guest';
      }
    }

    // No persisted state — fresh guest join
    gameId = hash;
    return 'online-guest';
  }

  let view = $state<AppView>(detectInitialView());

  const activeGameState = $derived<GameStateAPI | null>(
    view === 'local-game' ? gameState :
    (view === 'online-host' || view === 'online-guest') ? onlineGameState :
    null
  );

  const displayGameState = $derived<GameStateAPI>(activeGameState ?? backgroundState);

  const isPlaying = $derived(
    activeGameState != null &&
    view !== 'landing' &&
    view !== 'online-setup' &&
    !showWaitingOverlay &&
    !showJoinOverlay &&
    !showReconnectOverlay
  );

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
    const newGameId = generateGameId();
    gameId = newGameId;
    sessionStorage.setItem('hex-role', 'host');
    networkState = createNetworkState();
    onlineGameState = createOnlineGameState('host', newGameId, networkState, timerMode);
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
    clearPersistedState();
    window.location.hash = '';
    view = 'landing';
  }

  // Whether the guest join overlay should be shown (not during reconnection)
  const showJoinOverlay = $derived(
    view === 'online-guest' && (
      joinStatus === 'ready' ||
      joinStatus === 'connecting' ||
      joinStatus === 'error'
    ) && networkState?.status !== 'connected' &&
    networkState?.status !== 'reconnecting'
  );

  // Whether the host waiting overlay should be shown
  const showWaitingOverlay = $derived(
    view === 'online-host' && (
      onlineGameState?.waitingForGuest === true ||
      !onlineGameState
    ) && networkState?.status !== 'reconnecting'
  );

  // Whether reconnect overlay should be shown
  const showReconnectOverlay = $derived(
    (view === 'online-host' || view === 'online-guest') &&
    networkState?.status === 'reconnecting'
  );

  // Whether the connection status should be shown
  const showConnectionStatus = $derived(
    (view === 'online-host' || view === 'online-guest') &&
    networkState != null &&
    !showWaitingOverlay &&
    !showJoinOverlay &&
    !showReconnectOverlay
  );

  const waitingStatus = $derived<'registering' | 'waiting'>(
    networkState?.status === 'disconnected' ? 'registering' : 'waiting'
  );
</script>

<div class="game-container" class:shake={isShaking}>
  <HexCanvas bind:debugActive gameState={displayGameState} {themeColors} />
  <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />

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
  {#if showReconnectOverlay && onlineGameState}
    <ReconnectOverlay
      attempt={onlineGameState.reconnectAttempt}
      maxAttempts={onlineGameState.maxReconnectAttempts}
      failed={onlineGameState.reconnectFailed}
      onCancel={() => onlineGameState?.cancelReconnect()}
      onBack={handleBack}
    />
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
