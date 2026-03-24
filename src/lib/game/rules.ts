import type { HexCoord, Player, GameSnapshot } from '../hex/types';
import { HEX_DIRECTIONS } from '../hex/math';

/** Convert hex coordinate to string key for Map lookups */
export function coordKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

/** Create a fresh game snapshot */
export function createInitialSnapshot(startingPlayer: Player = 'X'): GameSnapshot {
  return {
    board: new Map(),
    currentPlayer: startingPlayer,
    placementsThisTurn: 0,
    isFirstTurn: true,
    totalMoves: 0,
    status: 'playing',
    winner: null,
    winningLine: [],
    startingPlayer,
  };
}

/** Check if a move is valid: hex must be empty and game must be playing */
export function isValidMove(snapshot: GameSnapshot, hex: HexCoord): boolean {
  return snapshot.status === 'playing' && !snapshot.board.has(coordKey(hex));
}

/** Count consecutive same-player stones in a direction from a starting hex (exclusive) */
function countInDirection(
  board: Map<string, Player>,
  start: HexCoord,
  dir: HexCoord,
  player: Player,
): HexCoord[] {
  const result: HexCoord[] = [];
  let q = start.q + dir.q;
  let r = start.r + dir.r;
  while (board.get(`${q},${r}`) === player) {
    result.push({ q, r });
    q += dir.q;
    r += dir.r;
  }
  return result;
}

/**
 * Check for 6 consecutive stones along any of the 3 hex axes from a given hex.
 * Axis pairs use HEX_DIRECTIONS indices: [0,3], [1,4], [2,5].
 * Returns the winning line coordinates if found, or null.
 */
export function checkWinFromHex(
  board: Map<string, Player>,
  hex: HexCoord,
  player: Player,
): HexCoord[] | null {
  for (let axis = 0; axis < 3; axis++) {
    const forward = HEX_DIRECTIONS[axis];
    const backward = HEX_DIRECTIONS[axis + 3];

    const line: HexCoord[] = [
      ...countInDirection(board, hex, backward, player).reverse(),
      hex,
      ...countInDirection(board, hex, forward, player),
    ];

    if (line.length >= 6) {
      return line;
    }
  }
  return null;
}

/**
 * Apply a move to a game snapshot, returning a NEW snapshot (immutable).
 * Places stone, checks win, advances turn as needed.
 */
export function applyMove(snapshot: GameSnapshot, hex: HexCoord): GameSnapshot {
  if (!isValidMove(snapshot, hex)) {
    return snapshot;
  }

  const newBoard = new Map(snapshot.board);
  newBoard.set(coordKey(hex), snapshot.currentPlayer);

  const newTotalMoves = snapshot.totalMoves + 1;
  const newPlacementsThisTurn = snapshot.placementsThisTurn + 1;

  // Check win from the just-placed stone
  const winLine = checkWinFromHex(newBoard, hex, snapshot.currentPlayer);
  if (winLine) {
    return {
      ...snapshot,
      board: newBoard,
      totalMoves: newTotalMoves,
      placementsThisTurn: newPlacementsThisTurn,
      status: 'won',
      winner: snapshot.currentPlayer,
      winningLine: winLine,
    };
  }

  // Determine if turn is over
  const maxPlacements = snapshot.isFirstTurn ? 1 : 2;
  if (newPlacementsThisTurn >= maxPlacements) {
    return {
      ...snapshot,
      board: newBoard,
      totalMoves: newTotalMoves,
      placementsThisTurn: 0,
      isFirstTurn: false,
      currentPlayer: snapshot.currentPlayer === 'X' ? 'O' : 'X',
    };
  }

  // Still same player's turn
  return {
    ...snapshot,
    board: newBoard,
    totalMoves: newTotalMoves,
    placementsThisTurn: newPlacementsThisTurn,
  };
}

/**
 * Forfeit the current turn without placing any stones.
 * Advances to the next player and resets placement count.
 * Returns unchanged snapshot if game is already won.
 */
export function forfeitTurn(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status !== 'playing') {
    return snapshot;
  }

  return {
    ...snapshot,
    currentPlayer: snapshot.currentPlayer === 'X' ? 'O' : 'X',
    placementsThisTurn: 0,
    isFirstTurn: false,
  };
}

/**
 * Apply a rematch: reset the board, loser goes first (D-10).
 * If no winner, swap from previous starting player.
 */
export function applyRematch(snapshot: GameSnapshot): GameSnapshot {
  const newStartingPlayer: Player = snapshot.winner
    ? (snapshot.winner === 'X' ? 'O' : 'X')
    : (snapshot.startingPlayer === 'X' ? 'O' : 'X');

  return createInitialSnapshot(newStartingPlayer);
}
