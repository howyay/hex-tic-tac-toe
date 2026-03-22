import type { HexCoord, Player, GameStatus } from '../hex/types';
import type { GridState } from './grid-state.svelte';
import { applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey } from '../game/rules';
import { DEFAULT_CAMERA } from '../render/camera';

export function createGameState() {
  let snapshot = $state(createInitialSnapshot('X'));
  let rejectedHex = $state<HexCoord | null>(null);
  let rejectedTimeout: ReturnType<typeof setTimeout> | null = null;

  const currentPlayer = $derived(snapshot.currentPlayer);
  const board = $derived(snapshot.board);
  const totalMoves = $derived(snapshot.totalMoves);
  const placementsThisTurn = $derived(snapshot.placementsThisTurn);
  const maxPlacements = $derived(snapshot.isFirstTurn ? 1 : 2);
  const status = $derived(snapshot.status);
  const winner = $derived(snapshot.winner);
  const winningLine = $derived(snapshot.winningLine);

  function placeStone(hex: HexCoord, gridState: GridState): void {
    if (!isValidMove(snapshot, hex)) {
      // If hex is occupied, show rejection flash
      if (snapshot.board.has(coordKey(hex))) {
        if (rejectedTimeout) clearTimeout(rejectedTimeout);
        rejectedHex = hex;
        rejectedTimeout = setTimeout(() => {
          rejectedHex = null;
          rejectedTimeout = null;
          gridState.needsRedraw = true;
        }, 150);
        gridState.needsRedraw = true;
      }
      return;
    }
    snapshot = applyMove(snapshot, hex);
    gridState.needsRedraw = true;
  }

  function rematch(gridState: GridState): void {
    snapshot = applyRematch(snapshot);
    rejectedHex = null;
    if (rejectedTimeout) {
      clearTimeout(rejectedTimeout);
      rejectedTimeout = null;
    }
    gridState.camera = DEFAULT_CAMERA;
    gridState.needsRedraw = true;
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
    placeStone,
    rematch,
  };
}

export type GameStateAPI = ReturnType<typeof createGameState>;
