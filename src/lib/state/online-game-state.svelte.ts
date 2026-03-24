import type { HexCoord } from '../hex/types';
import type { PlayerRole, NetworkStateAPI } from '../network/network-state.svelte';
import type { GameMessage } from '../network/protocol';
import { serializeSnapshot, deserializeSnapshot } from '../network/protocol';
import { createHost, joinGame, buildShareLink } from '../network/connection';
import { applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey } from '../game/rules';
import { createGridState } from './grid-state.svelte';
import { DEFAULT_CAMERA } from '../render/camera';

export function createOnlineGameState(
  role: PlayerRole,
  gameId: string | null,
  networkState: NetworkStateAPI,
) {
  let snapshot = $state(createInitialSnapshot('X'));
  let rejectedHex = $state<HexCoord | null>(null);
  let rejectedTimeout: ReturnType<typeof setTimeout> | null = null;
  let waitingForConfirmation = $state(false);

  const grid = createGridState();

  // Connection handle -- NOT stored in $state (per research anti-pattern)
  let conn: { send: (msg: GameMessage) => void; destroy: () => void } | null = null;

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
      },
      onData(msg: GameMessage) {
        if (msg.type === 'move-request') {
          const hex: HexCoord = { q: msg.q, r: msg.r };
          if (isValidMove(snapshot, hex)) {
            snapshot = applyMove(snapshot, hex);
            hostConn.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
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
        } else if (msg.type === 'ping') {
          hostConn.send({ type: 'pong' });
        }
      },
      onClose() {
        networkState.status = 'disconnected';
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
      },
    });
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
          snapshot = deserializeSnapshot(msg.snapshot);
          waitingForConfirmation = false;
          grid.needsRedraw = true;
        } else if (msg.type === 'rematch-accept') {
          snapshot = deserializeSnapshot(msg.snapshot);
          grid.camera = DEFAULT_CAMERA;
          grid.needsRedraw = true;
        }
        // pong: no-op (keepalive)
      },
      onClose() {
        networkState.status = 'disconnected';
      },
      onError(err: Error) {
        networkState.error = err.message;
        networkState.status = 'disconnected';
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
      snapshot = applyMove(snapshot, hex);
      conn?.send({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
      grid.needsRedraw = true;
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
    } else {
      // Guest sends request and waits for host to respond
      conn?.send({ type: 'rematch-request' });
    }
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
    destroy: () => conn?.destroy(),
  };
}

export type OnlineGameStateAPI = ReturnType<typeof createOnlineGameState>;
