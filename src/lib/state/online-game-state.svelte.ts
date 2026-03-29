import type { HexCoord } from '../hex/types';
import type { PlayerRole, NetworkStateAPI } from '../network/network-state.svelte';
import type { GameMessage } from '../network/protocol';
import type { TimerMode } from '../game/timer';
import { serializeSnapshot, deserializeSnapshot } from '../network/protocol';
import type { SerializedSnapshot } from '../network/protocol';
import { createHost, joinGame, buildShareLink, startReconnectLoop, registerRoom } from '../network/connection';
import type { ReconnectHandle } from '../network/connection';
import { applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey, forfeitTurn } from '../game/rules';
import { createGridState } from './grid-state.svelte';
import { DEFAULT_CAMERA } from '../render/camera';
import { TIMER_WARNING_THRESHOLD } from '../game/timer';

// sessionStorage keys
const SS_SNAPSHOT = 'hex-game-snapshot';
const SS_ROLE = 'hex-role';
const SS_GAME_ID = 'hex-game-id';
const SS_TIMER_MODE = 'hex-timer-mode';

/** Persist game state to sessionStorage */
function persistState(snapshot: SerializedSnapshot, role: PlayerRole, gameId: string, timerMode: TimerMode): void {
  try {
    sessionStorage.setItem(SS_SNAPSHOT, JSON.stringify(snapshot));
    sessionStorage.setItem(SS_ROLE, role);
    sessionStorage.setItem(SS_GAME_ID, gameId);
    sessionStorage.setItem(SS_TIMER_MODE, String(timerMode));
  } catch {
    // sessionStorage may be unavailable
  }
}

/** Restore game state from sessionStorage */
export function restorePersistedState(): {
  snapshot: SerializedSnapshot;
  role: PlayerRole;
  gameId: string;
  timerMode: TimerMode;
} | null {
  try {
    const snapshotStr = sessionStorage.getItem(SS_SNAPSHOT);
    const role = sessionStorage.getItem(SS_ROLE) as PlayerRole | null;
    const gameId = sessionStorage.getItem(SS_GAME_ID);
    const timerModeStr = sessionStorage.getItem(SS_TIMER_MODE);
    if (!snapshotStr || !role || !gameId) return null;
    return {
      snapshot: JSON.parse(snapshotStr) as SerializedSnapshot,
      role,
      gameId,
      timerMode: (Number(timerModeStr) || 0) as TimerMode,
    };
  } catch {
    return null;
  }
}

/** Clear persisted game state */
export function clearPersistedState(): void {
  sessionStorage.removeItem(SS_SNAPSHOT);
  sessionStorage.removeItem(SS_ROLE);
  sessionStorage.removeItem(SS_GAME_ID);
  sessionStorage.removeItem(SS_TIMER_MODE);
}

export function createOnlineGameState(
  role: PlayerRole,
  gameId: string,
  networkState: NetworkStateAPI,
  timerMode: TimerMode = 0,
  restoredSnapshot?: SerializedSnapshot,
) {
  let snapshot = $state(restoredSnapshot ? deserializeSnapshot(restoredSnapshot) : createInitialSnapshot('X'));
  let rejectedHex = $state<HexCoord | null>(null);
  let rejectedTimeout: ReturnType<typeof setTimeout> | null = null;
  let waitingForConfirmation = $state(false);

  // Reconnection state
  let reconnectAttempt = $state(0);
  let reconnectFailed = $state(false);
  let reconnectHandle: ReconnectHandle | null = null;
  const maxReconnectAttempts = 20;

  const grid = createGridState();

  let conn: { send: (msg: GameMessage) => void; destroy: () => void } | null = null;

  // Timer state
  let guestTimerMode = $state<TimerMode>(0);
  let timerRemaining = $state(0);
  let timerRunning = $state(false);
  let timerExpired = $state(false);
  let shaking = $state(false);
  const timerWarning = $derived(timerRunning && timerRemaining <= TIMER_WARNING_THRESHOLD && timerRemaining > 0);
  const timerActive = $derived(role === 'host' ? timerMode > 0 : guestTimerMode > 0);

  // Timer internals
  let timerStartedAt = 0;
  let timerDuration = 0;
  let timerIntervalId: ReturnType<typeof setInterval> | null = null;
  let syncTickCount = 0;
  let shakeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let forfeitTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Guest timer internals
  let guestTimerStartedAt = 0;
  let guestTimerIntervalId: ReturnType<typeof setInterval> | null = null;
  let guestTimerDuration = 0;

  // Timer pause state for disconnect recovery
  let pausedTimerRemaining = 0;

  /** Persist current state to sessionStorage */
  function persist(): void {
    persistState(serializeSnapshot(snapshot), role, gameId, role === 'host' ? timerMode : guestTimerMode);
  }

  function startTimer(): void {
    if (!timerActive) return;
    stopTimer();
    timerStartedAt = Date.now();
    timerDuration = timerMode;
    timerRemaining = timerMode;
    timerRunning = true;
    timerExpired = false;
    syncTickCount = 0;

    timerIntervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerStartedAt + timerDuration * 1000 - Date.now()) / 1000));
      timerRemaining = remaining;
      syncTickCount++;

      if (syncTickCount % 25 === 0) {
        conn?.send({ type: 'timer-sync', remaining: timerRemaining });
      }

      if (remaining <= 0) {
        handleTimerExpiry();
      }
    }, 200);
  }

  function stopTimer(): void {
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
    timerRunning = false;
  }

  function pauseTimer(): void {
    pausedTimerRemaining = timerRemaining;
    stopTimer();
  }

  function resumeTimer(): void {
    if (!timerActive || pausedTimerRemaining <= 0) return;
    stopTimer();
    timerStartedAt = Date.now();
    timerDuration = pausedTimerRemaining;
    timerRemaining = pausedTimerRemaining;
    timerRunning = true;
    timerExpired = false;
    syncTickCount = 0;

    timerIntervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((timerStartedAt + timerDuration * 1000 - Date.now()) / 1000));
      timerRemaining = remaining;
      syncTickCount++;

      if (syncTickCount % 25 === 0) {
        conn?.send({ type: 'timer-sync', remaining: timerRemaining });
      }

      if (remaining <= 0) {
        handleTimerExpiry();
      }
    }, 200);

    pausedTimerRemaining = 0;
  }

  function resetTimer(): void {
    stopTimer();
    if (timerActive) {
      startTimer();
    }
  }

  function handleTimerExpiry(): void {
    stopTimer();
    timerExpired = true;
    timerRemaining = 0;

    if (snapshot.status !== 'playing') return;

    shaking = true;
    conn?.send({ type: 'timer-expired' });

    forfeitTimeoutId = setTimeout(() => {
      if (snapshot.status !== 'playing') {
        shaking = false;
        return;
      }
      snapshot = forfeitTurn(snapshot);
      conn?.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
      shaking = false;
      grid.needsRedraw = true;
      persist();
      resetTimer();
      conn?.send({ type: 'timer-sync', remaining: timerMode });
    }, 1000);
  }

  function startGuestDisplayTimer(): void {
    stopGuestDisplayTimer();
    guestTimerStartedAt = Date.now();
    guestTimerDuration = timerRemaining;
    timerRunning = true;
    timerExpired = false;

    guestTimerIntervalId = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((guestTimerStartedAt + guestTimerDuration * 1000 - Date.now()) / 1000));
      timerRemaining = remaining;
    }, 200);
  }

  function stopGuestDisplayTimer(): void {
    if (guestTimerIntervalId !== null) {
      clearInterval(guestTimerIntervalId);
      guestTimerIntervalId = null;
    }
  }

  function resetGuestTimer(remainingSeconds: number): void {
    stopGuestDisplayTimer();
    timerRemaining = remainingSeconds;
    if (guestTimerMode > 0 && remainingSeconds > 0) {
      startGuestDisplayTimer();
    }
  }

  const currentPlayer = $derived(snapshot.currentPlayer);
  const board = $derived(snapshot.board);
  const totalMoves = $derived(snapshot.totalMoves);
  const placementsThisTurn = $derived(snapshot.placementsThisTurn);
  const maxPlacements = $derived(snapshot.isFirstTurn ? 1 : 2);
  const status = $derived(snapshot.status);
  const winner = $derived(snapshot.winner);
  const winningLine = $derived(snapshot.winningLine);

  function showRejection(hex: HexCoord): void {
    if (rejectedTimeout) clearTimeout(rejectedTimeout);
    rejectedHex = hex;
    rejectedTimeout = setTimeout(() => {
      rejectedHex = null;
      rejectedTimeout = null;
      grid.needsRedraw = true;
    }, 150);
    grid.needsRedraw = true;
  }

  /** Send reconnect-state message (host only) */
  function sendReconnectState(): void {
    conn?.send({
      type: 'reconnect-state',
      snapshot: serializeSnapshot(snapshot),
      timerMode,
      timerRemaining: timerRemaining,
    });
  }

  if (role === 'host') {
    const hostConn = createHost({
      onOpen(id: string) {
        networkState.status = 'connecting';
        networkState.gameId = id;
      },
      onConnect() {
        const wasReconnecting = networkState.status === 'reconnecting';
        networkState.status = 'connected';

        if (wasReconnecting) {
          // Guest reconnected — send full state
          sendReconnectState();
          if (timerActive) resumeTimer();
        } else {
          // Fresh connection
          hostConn.send({ type: 'game-start', snapshot: serializeSnapshot(snapshot) });
          if (timerActive) {
            hostConn.send({ type: 'timer-config', mode: timerMode });
            startTimer();
          }
        }
        persist();
      },
      onData(msg: GameMessage) {
        if (msg.type === 'move-request') {
          const hex: HexCoord = { q: msg.q, r: msg.r };
          const previousPlayer = snapshot.currentPlayer;
          if (isValidMove(snapshot, hex)) {
            snapshot = applyMove(snapshot, hex);
            hostConn.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
            if (snapshot.currentPlayer !== previousPlayer) {
              resetTimer();
              if (timerActive) {
                conn?.send({ type: 'timer-sync', remaining: timerMode });
              }
            }
          } else {
            hostConn.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
          }
          grid.needsRedraw = true;
          persist();
        } else if (msg.type === 'rematch-request') {
          snapshot = applyRematch(snapshot);
          hostConn.send({ type: 'rematch-accept', snapshot: serializeSnapshot(snapshot) });
          grid.camera = DEFAULT_CAMERA;
          grid.needsRedraw = true;
          stopTimer();
          if (timerActive) {
            hostConn.send({ type: 'timer-config', mode: timerMode });
            startTimer();
          }
          persist();
        } else if (msg.type === 'ping') {
          hostConn.send({ type: 'pong' });
        }
      },
      onClose() {
        networkState.status = 'reconnecting';
        pauseTimer();
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
        stopTimer();
      },
    }, gameId);
    conn = hostConn;
  } else {
    // Guest role
    networkState.status = 'connecting';
    const guestConnPromise = joinGame(gameId, {
      onOpen() {},
      onConnect() {
        networkState.status = 'connected';
        // Cancel any active reconnection loop
        if (reconnectHandle) {
          reconnectHandle.cancel();
          reconnectHandle = null;
        }
        reconnectAttempt = 0;
        reconnectFailed = false;
      },
      onData(msg: GameMessage) {
        if (msg.type === 'game-start') {
          snapshot = deserializeSnapshot(msg.snapshot);
          grid.needsRedraw = true;
          persist();
        } else if (msg.type === 'state-update') {
          const previousPlayer = snapshot.currentPlayer;
          snapshot = deserializeSnapshot(msg.snapshot);
          waitingForConfirmation = false;
          grid.needsRedraw = true;
          if (snapshot.currentPlayer !== previousPlayer && guestTimerMode > 0) {
            resetGuestTimer(guestTimerMode);
          }
          persist();
        } else if (msg.type === 'rematch-accept') {
          snapshot = deserializeSnapshot(msg.snapshot);
          grid.camera = DEFAULT_CAMERA;
          grid.needsRedraw = true;
          persist();
        } else if (msg.type === 'timer-config') {
          guestTimerMode = msg.mode;
          timerRemaining = msg.mode;
          if (msg.mode > 0) {
            startGuestDisplayTimer();
          }
        } else if (msg.type === 'timer-sync') {
          timerRemaining = msg.remaining;
          guestTimerDuration = msg.remaining;
          guestTimerStartedAt = Date.now();
        } else if (msg.type === 'timer-expired') {
          timerExpired = true;
          shaking = true;
          stopGuestDisplayTimer();
          timerRunning = false;
          timerRemaining = 0;
          shakeTimeoutId = setTimeout(() => {
            shaking = false;
          }, 1000);
        } else if (msg.type === 'reconnect-state') {
          // Full state restore from host on reconnection
          snapshot = deserializeSnapshot(msg.snapshot);
          guestTimerMode = msg.timerMode;
          timerRemaining = msg.timerRemaining;
          grid.needsRedraw = true;
          persist();
          if (msg.timerMode > 0 && msg.timerRemaining > 0) {
            resetGuestTimer(msg.timerRemaining);
          }
        }
      },
      onClose() {
        stopGuestDisplayTimer();
        // Start reconnection loop
        networkState.status = 'reconnecting';
        reconnectAttempt = 0;
        reconnectFailed = false;

        reconnectHandle = startReconnectLoop(gameId, {
          onAttempt(attempt: number) {
            reconnectAttempt = attempt;
          },
          onOpen() {},
          onConnect() {
            networkState.status = 'connected';
            reconnectHandle = null;
            reconnectAttempt = 0;
            reconnectFailed = false;
          },
          onData(msg: GameMessage) {
            // Forward to same handler
            if (msg.type === 'reconnect-state') {
              snapshot = deserializeSnapshot(msg.snapshot);
              guestTimerMode = msg.timerMode;
              timerRemaining = msg.timerRemaining;
              grid.needsRedraw = true;
              persist();
              if (msg.timerMode > 0 && msg.timerRemaining > 0) {
                resetGuestTimer(msg.timerRemaining);
              }
            } else if (msg.type === 'state-update') {
              const previousPlayer = snapshot.currentPlayer;
              snapshot = deserializeSnapshot(msg.snapshot);
              waitingForConfirmation = false;
              grid.needsRedraw = true;
              if (snapshot.currentPlayer !== previousPlayer && guestTimerMode > 0) {
                resetGuestTimer(guestTimerMode);
              }
              persist();
            } else if (msg.type === 'game-start') {
              snapshot = deserializeSnapshot(msg.snapshot);
              grid.needsRedraw = true;
              persist();
            } else if (msg.type === 'timer-config') {
              guestTimerMode = msg.mode;
              timerRemaining = msg.mode;
              if (msg.mode > 0) startGuestDisplayTimer();
            } else if (msg.type === 'timer-sync') {
              timerRemaining = msg.remaining;
              guestTimerDuration = msg.remaining;
              guestTimerStartedAt = Date.now();
            } else if (msg.type === 'timer-expired') {
              timerExpired = true;
              shaking = true;
              stopGuestDisplayTimer();
              timerRunning = false;
              timerRemaining = 0;
              shakeTimeoutId = setTimeout(() => { shaking = false; }, 1000);
            }
          },
          onClose() {
            // Reconnected peer also disconnected — keep retrying unless cancelled/failed
          },
          onError(err: Error) {
            if (err.message === 'Reconnection timed out') {
              reconnectFailed = true;
              networkState.status = 'disconnected';
            }
          },
        });
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
        stopGuestDisplayTimer();
      },
    });
    guestConnPromise.then((guestConn) => {
      conn = guestConn;
    });
  }

  function placeStone(hex: HexCoord): void {
    if (role === 'host') {
      if (snapshot.currentPlayer !== 'X') return;

      if (!isValidMove(snapshot, hex)) {
        if (snapshot.board.has(coordKey(hex))) {
          showRejection(hex);
        }
        return;
      }
      const previousPlayer = snapshot.currentPlayer;
      snapshot = applyMove(snapshot, hex);
      conn?.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
      grid.needsRedraw = true;
      persist();
      if (snapshot.currentPlayer !== previousPlayer) {
        resetTimer();
        if (timerActive) {
          conn?.send({ type: 'timer-sync', remaining: timerMode });
        }
      }
    } else {
      if (snapshot.currentPlayer !== 'O') return;
      if (waitingForConfirmation) return;

      if (snapshot.board.has(coordKey(hex))) {
        showRejection(hex);
        return;
      }

      conn?.send({ type: 'move-request', q: hex.q, r: hex.r });
      waitingForConfirmation = true;
    }
  }

  function rematch(): void {
    if (role === 'host') {
      snapshot = applyRematch(snapshot);
      conn?.send({ type: 'rematch-accept', snapshot: serializeSnapshot(snapshot) });
      rejectedHex = null;
      if (rejectedTimeout) {
        clearTimeout(rejectedTimeout);
        rejectedTimeout = null;
      }
      grid.camera = DEFAULT_CAMERA;
      grid.needsRedraw = true;
      stopTimer();
      if (timerActive) {
        conn?.send({ type: 'timer-config', mode: timerMode });
        startTimer();
      }
      persist();
    } else {
      conn?.send({ type: 'rematch-request' });
    }
  }

  function cancelReconnect(): void {
    if (reconnectHandle) {
      reconnectHandle.cancel();
      reconnectHandle = null;
    }
    reconnectAttempt = 0;
    reconnectFailed = false;
  }

  function destroy(): void {
    stopTimer();
    stopGuestDisplayTimer();
    cancelReconnect();
    if (shakeTimeoutId !== null) {
      clearTimeout(shakeTimeoutId);
      shakeTimeoutId = null;
    }
    if (forfeitTimeoutId !== null) {
      clearTimeout(forfeitTimeoutId);
      forfeitTimeoutId = null;
    }
    if (rejectedTimeout) {
      clearTimeout(rejectedTimeout);
      rejectedTimeout = null;
    }
    conn?.destroy();
  }

  return {
    get currentPlayer() { return currentPlayer; },
    get board() { return board; },
    get totalMoves() { return totalMoves; },
    get placementsThisTurn() { return placementsThisTurn; },
    get maxPlacements() { return maxPlacements; },
    get status() { return status; },
    get winner() { return winner; },
    get winningLine() { return winningLine; },
    get rejectedHex() { return rejectedHex; },
    get gridState() { return grid; },
    placeStone,
    rematch,
    get networkStatus() { return networkState.status; },
    get shareLink() { return networkState.gameId ? buildShareLink(networkState.gameId) : null; },
    get waitingForGuest() { return role === 'host' && networkState.status === 'connecting'; },
    get playerRole() { return role; },
    get timerSeconds() { return timerActive ? timerRemaining : undefined; },
    get timerWarning() { return timerWarning; },
    get timerExpired() { return timerExpired; },
    get shaking() { return shaking; },
    get timerActive() { return timerActive; },
    // Reconnection getters
    get isReconnecting() { return networkState.status === 'reconnecting'; },
    get reconnectAttempt() { return reconnectAttempt; },
    get reconnectFailed() { return reconnectFailed; },
    get maxReconnectAttempts() { return maxReconnectAttempts; },
    cancelReconnect,
    destroy,
  };
}

export type OnlineGameStateAPI = ReturnType<typeof createOnlineGameState>;
