import type { HexCoord } from '../hex/types';
import type { PlayerRole, NetworkStateAPI } from '../network/network-state.svelte';
import type { GameMessage } from '../network/protocol';
import type { TimerMode } from '../game/timer';
import { serializeSnapshot, deserializeSnapshot } from '../network/protocol';
import { createHost, joinGame, buildShareLink } from '../network/connection';
import { applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey, forfeitTurn } from '../game/rules';
import { createGridState } from './grid-state.svelte';
import { DEFAULT_CAMERA } from '../render/camera';
import { TIMER_WARNING_THRESHOLD } from '../game/timer';

export function createOnlineGameState(
  role: PlayerRole,
  gameId: string | null,
  networkState: NetworkStateAPI,
  timerMode: TimerMode = 0,
) {
  let snapshot = $state(createInitialSnapshot('X'));
  let rejectedHex = $state<HexCoord | null>(null);
  let rejectedTimeout: ReturnType<typeof setTimeout> | null = null;
  let waitingForConfirmation = $state(false);

  const grid = createGridState();

  // Connection handle -- NOT stored in $state (per research anti-pattern)
  let conn: { send: (msg: GameMessage) => void; destroy: () => void } | null = null;

  // Timer state (transient, not in snapshot)
  let timerRemaining = $state(0);
  let timerRunning = $state(false);
  let timerExpired = $state(false);
  let shaking = $state(false);
  const timerWarning = $derived(timerRunning && timerRemaining <= TIMER_WARNING_THRESHOLD && timerRemaining > 0);
  const timerActive = $derived(timerMode > 0);

  // Timer internals (not reactive)
  let timerStartedAt = 0;
  let timerDuration = 0;
  let timerIntervalId: ReturnType<typeof setInterval> | null = null;
  let syncTickCount = 0;
  let shakeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let forfeitTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Guest-side timer internals
  let guestTimerMode: TimerMode = 0;
  let guestTimerStartedAt = 0;
  let guestTimerIntervalId: ReturnType<typeof setInterval> | null = null;

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

      // Sync every 25 ticks (~5 seconds)
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
      resetTimer();
      // Send sync with full duration for new turn
      conn?.send({ type: 'timer-sync', remaining: timerMode });
    }, 1000);
  }

  // Guest timer display functions
  function startGuestDisplayTimer(): void {
    stopGuestDisplayTimer();
    guestTimerStartedAt = Date.now();
    timerRunning = true;
    timerExpired = false;

    guestTimerIntervalId = setInterval(() => {
      const elapsed = (Date.now() - guestTimerStartedAt) / 1000;
      const remaining = Math.max(0, Math.ceil(timerRemaining - elapsed));
      // Only update display, don't overwrite timerRemaining (that comes from sync)
      // Actually we need a display value; use timerRemaining directly as sync updates it
      const displayRemaining = Math.max(0, timerRemaining - Math.floor(elapsed));
      if (displayRemaining !== timerRemaining) {
        // Smooth local countdown between syncs
        timerRemaining = Math.max(0, Math.ceil((guestTimerStartedAt + timerRemaining * 1000 - Date.now()) / 1000));
      }
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
    guestTimerStartedAt = Date.now();
    if (guestTimerMode > 0) {
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

  if (role === 'host') {
    const hostConn = createHost({
      onOpen(id: string) {
        networkState.status = 'connecting'; // waiting for guest
        networkState.gameId = id;
      },
      onConnect() {
        networkState.status = 'connected';
        // Send initial game state to guest
        hostConn.send({ type: 'game-start', snapshot: serializeSnapshot(snapshot) });
        // Send timer config and start timer
        if (timerActive) {
          hostConn.send({ type: 'timer-config', mode: timerMode });
          startTimer();
        }
      },
      onData(msg: GameMessage) {
        if (msg.type === 'move-request') {
          const hex: HexCoord = { q: msg.q, r: msg.r };
          const previousPlayer = snapshot.currentPlayer;
          if (isValidMove(snapshot, hex)) {
            snapshot = applyMove(snapshot, hex);
            hostConn.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
            // If turn changed, reset timer
            if (snapshot.currentPlayer !== previousPlayer) {
              resetTimer();
              if (timerActive) {
                conn?.send({ type: 'timer-sync', remaining: timerMode });
              }
            }
          } else {
            // Send current state as correction
            hostConn.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
          }
          grid.needsRedraw = true;
        } else if (msg.type === 'rematch-request') {
          snapshot = applyRematch(snapshot);
          hostConn.send({ type: 'rematch-accept', snapshot: serializeSnapshot(snapshot) });
          grid.camera = DEFAULT_CAMERA;
          grid.needsRedraw = true;
          // Reset timer for rematch
          stopTimer();
          if (timerActive) {
            hostConn.send({ type: 'timer-config', mode: timerMode });
            startTimer();
          }
        } else if (msg.type === 'ping') {
          hostConn.send({ type: 'pong' });
        }
      },
      onClose() {
        networkState.status = 'disconnected';
        stopTimer();
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
        stopTimer();
      },
    }, gameId ?? undefined);
    conn = hostConn;
  } else {
    // Guest role
    networkState.status = 'connecting';
    const guestConn = joinGame(gameId!, {
      onOpen() {
        // Guest peer opened, connection in progress
      },
      onConnect() {
        networkState.status = 'connected';
      },
      onData(msg: GameMessage) {
        if (msg.type === 'game-start') {
          snapshot = deserializeSnapshot(msg.snapshot);
          grid.needsRedraw = true;
        } else if (msg.type === 'state-update') {
          const previousPlayer = snapshot.currentPlayer;
          snapshot = deserializeSnapshot(msg.snapshot);
          waitingForConfirmation = false;
          grid.needsRedraw = true;
          // If turn changed, reset guest display timer
          if (snapshot.currentPlayer !== previousPlayer && guestTimerMode > 0) {
            resetGuestTimer(guestTimerMode);
          }
        } else if (msg.type === 'rematch-accept') {
          snapshot = deserializeSnapshot(msg.snapshot);
          grid.camera = DEFAULT_CAMERA;
          grid.needsRedraw = true;
        } else if (msg.type === 'timer-config') {
          guestTimerMode = msg.mode;
          timerRemaining = msg.mode;
          if (msg.mode > 0) {
            startGuestDisplayTimer();
          }
        } else if (msg.type === 'timer-sync') {
          timerRemaining = msg.remaining;
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
        }
        // pong: no-op (keepalive)
      },
      onClose() {
        networkState.status = 'disconnected';
        stopGuestDisplayTimer();
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
        stopGuestDisplayTimer();
      },
    });
    conn = guestConn;
  }

  function placeStone(hex: HexCoord): void {
    if (role === 'host') {
      // Host can only place during their turn (X)
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
      // If turn changed, reset timer
      if (snapshot.currentPlayer !== previousPlayer) {
        resetTimer();
        if (timerActive) {
          conn?.send({ type: 'timer-sync', remaining: timerMode });
        }
      }
    } else {
      // Guest can only place during their turn (O)
      if (snapshot.currentPlayer !== 'O') return;
      // Prevent double-click while waiting for host confirmation
      if (waitingForConfirmation) return;

      // Client-side check to avoid unnecessary network round-trip
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
      // Host computes and broadcasts new state directly
      snapshot = applyRematch(snapshot);
      conn?.send({ type: 'rematch-accept', snapshot: serializeSnapshot(snapshot) });
      rejectedHex = null;
      if (rejectedTimeout) {
        clearTimeout(rejectedTimeout);
        rejectedTimeout = null;
      }
      grid.camera = DEFAULT_CAMERA;
      grid.needsRedraw = true;
      // Reset timer for rematch
      stopTimer();
      if (timerActive) {
        conn?.send({ type: 'timer-config', mode: timerMode });
        startTimer();
      }
    } else {
      // Guest sends request and waits for host to respond
      conn?.send({ type: 'rematch-request' });
    }
  }

  function destroy(): void {
    stopTimer();
    stopGuestDisplayTimer();
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
    // Additional network-specific getters
    get networkStatus() { return networkState.status; },
    get shareLink() { return networkState.gameId ? buildShareLink(networkState.gameId) : null; },
    get waitingForGuest() { return role === 'host' && networkState.status === 'connecting'; },
    get playerRole() { return role; },
    // Timer getters
    get timerSeconds() { return timerActive ? timerRemaining : undefined; },
    get timerWarning() { return timerWarning; },
    get timerExpired() { return timerExpired; },
    get shaking() { return shaking; },
    get timerActive() { return timerActive; },
    destroy,
  };
}

export type OnlineGameStateAPI = ReturnType<typeof createOnlineGameState>;
