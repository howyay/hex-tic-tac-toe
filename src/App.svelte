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
  import { createGameState, type GameStateAPI } from './lib/state/game-state.svelte';
  import { createOnlineGameState, type OnlineGameStateAPI } from './lib/state/online-game-state.svelte';
  import { createNetworkState, type NetworkStateAPI } from './lib/network/network-state.svelte';
  import { createThemeState } from './lib/theme/theme-state.svelte';
  import { DARK_THEME, LIGHT_THEME } from './lib/theme/colors';

  type AppView = 'landing' | 'local-game' | 'online-host' | 'online-guest';

  let debugActive = $state(false);
  let gameId = $state<string | null>(null);
  let gameState = $state<GameStateAPI | null>(null);
  let networkState = $state<NetworkStateAPI | null>(null);
  let onlineGameState = $state<OnlineGameStateAPI | null>(null);
  let joinStatus = $state<'ready' | 'connecting' | 'error'>('ready');
  let joinError = $state<string | null>(null);

  // Theme persists across all views (D-02)
  const themeState = createThemeState();
  const themeColors = $derived(themeState.theme === 'dark' ? DARK_THEME : LIGHT_THEME);

  // Background game state for guest join screen (renders empty board behind overlay)
  let guestBackgroundState = $state<GameStateAPI | null>(null);

  // Active game state: selects between local and online, with background fallback for guest
  const activeGameState = $derived<GameStateAPI | null>(
    view === 'local-game' ? gameState :
    (view === 'online-host' || view === 'online-guest') ? (onlineGameState ?? guestBackgroundState) :
    null
  );

  // Detect guest link hash on mount (D-03) -- read ONCE, no hashchange listener
  // Also check sessionStorage for host role to handle refresh correctly
  function detectInitialView(): AppView {
    const hash = window.location.hash.slice(1);
    if (hash.length >= 6) {
      // Check if we're the host who refreshed (not a guest joining)
      const storedRole = sessionStorage.getItem('hex-role');
      if (storedRole === 'host') {
        return 'landing'; // Host refreshed — go back to landing, clear hash
      }
      gameId = hash;
      return 'online-guest';
    }
    return 'landing';
  }

  let view = $state<AppView>(detectInitialView());

  // Create background board for guest join screen so overlay is semi-transparent over the grid
  if (view === 'online-guest') {
    guestBackgroundState = createGameState();
  }

  function startLocalGame() {
    gameState = createGameState();
    view = 'local-game';
  }

  function startOnlineGame() {
    sessionStorage.setItem('hex-role', 'host');
    networkState = createNetworkState();
    onlineGameState = createOnlineGameState('host', null, networkState);
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
        joinStatus = 'ready'; // Will hide JoinOverlay via condition below
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

  // Cleanup on navigation back to landing
  function cleanupOnline() {
    onlineGameState?.destroy();
    onlineGameState = null;
    networkState = null;
  }

  // Whether the guest join overlay should be shown
  const showJoinOverlay = $derived(
    view === 'online-guest' && (
      joinStatus === 'ready' ||
      joinStatus === 'connecting' ||
      joinStatus === 'error'
    ) && networkState?.status !== 'connected'
  );

  // Whether the host waiting overlay should be shown (including loading state before PeerJS connects)
  const showWaitingOverlay = $derived(
    view === 'online-host' && (
      onlineGameState?.waitingForGuest === true ||
      !onlineGameState ||
      networkState?.status === 'disconnected'
    )
  );

  // Whether the connection status should be shown (online game active, not in overlay)
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

{#if view === 'landing'}
  <div class="landing-container">
    <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />
    <LandingPage onLocalGame={startLocalGame} onOnlineGame={startOnlineGame} />
  </div>
{:else}
  <div class="game-container">
    <ThemeToggle theme={themeState.theme} onToggle={() => themeState.toggle()} />
    {#if activeGameState}
      <HexCanvas bind:debugActive gameState={activeGameState} {themeColors} />
      <TurnIndicator
        currentPlayer={activeGameState.currentPlayer}
        placementsThisTurn={activeGameState.placementsThisTurn}
        maxPlacements={activeGameState.maxPlacements}
        visible={activeGameState.status === 'playing'}
      />
      <MoveCounter totalMoves={activeGameState.totalMoves} />
      {#if activeGameState.status === 'won' && activeGameState.winner}
        <GameOverlay winner={activeGameState.winner} onRematch={() => activeGameState!.rematch()} />
      {/if}
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
