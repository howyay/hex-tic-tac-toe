import type { HexCoord, Player, GameStatus } from '../hex/types';
import { createGridState } from './grid-state.svelte';
import { applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey } from '../game/rules';
import { DEFAULT_CAMERA } from '../render/camera';

export function createGameState() {
  let snapshot = $state(createInitialSnapshot('X'));
  let rejectedHex = $state<HexCoord | null>(null);
  let rejectedTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastPlacedHexes = $state<HexCoord[]>([]);
  let moveHistory = $state<{ player: Player; hex: HexCoord }[]>([]);

  const grid = createGridState();

  const currentPlayer = $derived(snapshot.currentPlayer);
  const board = $derived(snapshot.board);
  const totalMoves = $derived(snapshot.totalMoves);
  const placementsThisTurn = $derived(snapshot.placementsThisTurn);
  const maxPlacements = $derived(snapshot.isFirstTurn ? 1 : 2);
  const status = $derived(snapshot.status);
  const winner = $derived(snapshot.winner);
  const winningLine = $derived(snapshot.winningLine);

  function placeStone(hex: HexCoord): void {
    if (!isValidMove(snapshot, hex)) {
      // If hex is occupied, show rejection flash
      if (snapshot.board.has(coordKey(hex))) {
        if (rejectedTimeout) clearTimeout(rejectedTimeout);
        rejectedHex = hex;
        rejectedTimeout = setTimeout(() => {
          rejectedHex = null;
          rejectedTimeout = null;
          grid.needsRedraw = true;
        }, 150);
        grid.needsRedraw = true;
      }
      return;
    }
    const prevPlayer = snapshot.currentPlayer;
    moveHistory = [...moveHistory, { player: prevPlayer, hex }];
    snapshot = applyMove(snapshot, hex);
    // Track last placed hexes — reset on turn change
    if (snapshot.currentPlayer !== prevPlayer) {
      lastPlacedHexes = [hex];
    } else {
      lastPlacedHexes = [...lastPlacedHexes, hex];
    }
    grid.needsRedraw = true;
  }

  function rematch(): void {
    snapshot = applyRematch(snapshot);
    lastPlacedHexes = [];
    moveHistory = [];
    rejectedHex = null;
    if (rejectedTimeout) {
      clearTimeout(rejectedTimeout);
      rejectedTimeout = null;
    }
    grid.camera = DEFAULT_CAMERA;
    grid.needsRedraw = true;
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
    get lastPlacedHexes() { return lastPlacedHexes; },
    get moveHistory() { return moveHistory; },
    placeStone,
    rematch,
  };
}

export type GameStateAPI = ReturnType<typeof createGameState>;
