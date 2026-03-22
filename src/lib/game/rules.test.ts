import { describe, it, expect } from 'vitest';
import {
  coordKey,
  createInitialSnapshot,
  isValidMove,
  checkWinFromHex,
  applyMove,
  applyRematch,
} from './rules';
import type { HexCoord } from '../hex/types';

describe('coordKey', () => {
  it('produces consistent string keys', () => {
    expect(coordKey({ q: 3, r: -2 })).toBe('3,-2');
  });

  it('handles zero without -0 issues', () => {
    expect(coordKey({ q: 0, r: 0 })).toBe('0,0');
  });
});

describe('createInitialSnapshot', () => {
  it('creates a fresh game state with X as default starting player', () => {
    const snap = createInitialSnapshot();
    expect(snap.currentPlayer).toBe('X');
    expect(snap.startingPlayer).toBe('X');
    expect(snap.board.size).toBe(0);
    expect(snap.placementsThisTurn).toBe(0);
    expect(snap.isFirstTurn).toBe(true);
    expect(snap.totalMoves).toBe(0);
    expect(snap.status).toBe('playing');
    expect(snap.winner).toBeNull();
    expect(snap.winningLine).toEqual([]);
  });

  it('accepts a custom starting player', () => {
    const snap = createInitialSnapshot('O');
    expect(snap.currentPlayer).toBe('O');
    expect(snap.startingPlayer).toBe('O');
  });
});

describe('isValidMove', () => {
  it('returns true for an empty hex on a playing game', () => {
    const snap = createInitialSnapshot();
    expect(isValidMove(snap, { q: 0, r: 0 })).toBe(true);
  });

  it('returns false for an occupied hex', () => {
    let snap = createInitialSnapshot();
    snap = applyMove(snap, { q: 0, r: 0 });
    expect(isValidMove(snap, { q: 0, r: 0 })).toBe(false);
  });

  it('returns false when game status is won', () => {
    // Build a won game state manually
    let snap = createInitialSnapshot();
    // Place 6 X stones along q-axis to trigger a win
    // X first turn: 1 stone
    snap = applyMove(snap, { q: 0, r: 0 });
    // O: 2 scattered stones (no axis alignment)
    snap = applyMove(snap, { q: -5, r: 3 });
    snap = applyMove(snap, { q: -7, r: 1 });
    // X: 2 stones
    snap = applyMove(snap, { q: 1, r: 0 });
    snap = applyMove(snap, { q: 2, r: 0 });
    // O: 2 scattered stones
    snap = applyMove(snap, { q: -3, r: 5 });
    snap = applyMove(snap, { q: -9, r: 2 });
    // X: 2 stones
    snap = applyMove(snap, { q: 3, r: 0 });
    snap = applyMove(snap, { q: 4, r: 0 });
    // O: 2 scattered stones
    snap = applyMove(snap, { q: -4, r: 7 });
    snap = applyMove(snap, { q: -8, r: 4 });
    // X wins with 6th stone
    snap = applyMove(snap, { q: 5, r: 0 });
    expect(snap.status).toBe('won');
    expect(isValidMove(snap, { q: 10, r: 10 })).toBe(false);
  });
});

describe('GAME-01: First turn allows exactly 1 placement for X', () => {
  it('X places 1 stone then turn switches to O', () => {
    let snap = createInitialSnapshot();
    expect(snap.currentPlayer).toBe('X');
    expect(snap.isFirstTurn).toBe(true);

    snap = applyMove(snap, { q: 0, r: 0 });
    expect(snap.board.get('0,0')).toBe('X');
    expect(snap.currentPlayer).toBe('O');
    expect(snap.isFirstTurn).toBe(false);
  });
});

describe('GAME-02: After first turn, players alternate placing 2 stones', () => {
  it('O places 2 stones then switches to X with 2 placements', () => {
    let snap = createInitialSnapshot();
    // X first turn (1 stone)
    snap = applyMove(snap, { q: 0, r: 0 });
    expect(snap.currentPlayer).toBe('O');

    // O first placement
    snap = applyMove(snap, { q: 1, r: 0 });
    expect(snap.currentPlayer).toBe('O'); // still O's turn
    expect(snap.placementsThisTurn).toBe(1);

    // O second placement
    snap = applyMove(snap, { q: 2, r: 0 });
    expect(snap.currentPlayer).toBe('X'); // now X's turn
    expect(snap.placementsThisTurn).toBe(0);

    // X first placement
    snap = applyMove(snap, { q: 3, r: 0 });
    expect(snap.currentPlayer).toBe('X'); // still X
    expect(snap.placementsThisTurn).toBe(1);

    // X second placement
    snap = applyMove(snap, { q: 4, r: 0 });
    expect(snap.currentPlayer).toBe('O'); // now O again
    expect(snap.placementsThisTurn).toBe(0);
  });
});

describe('GAME-03: Win detection on q-axis (6 consecutive X stones)', () => {
  it('detects 6 consecutive X on q-axis', () => {
    // Build board with X at (0,0) through (5,0)
    const board = new Map<string, 'X' | 'O'>();
    for (let q = 0; q < 6; q++) {
      board.set(`${q},0`, 'X');
    }
    const result = checkWinFromHex(board, { q: 3, r: 0 }, 'X');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(6);
  });

  it('returns null for only 5 consecutive', () => {
    const board = new Map<string, 'X' | 'O'>();
    for (let q = 0; q < 5; q++) {
      board.set(`${q},0`, 'X');
    }
    const result = checkWinFromHex(board, { q: 2, r: 0 }, 'X');
    expect(result).toBeNull();
  });
});

describe('GAME-04: Win detection on r-axis and s-axis', () => {
  it('detects win along r-axis (NE/SW direction)', () => {
    // r-axis direction: (1,-1)/(−1,1) -- q+1,r-1 each step
    const board = new Map<string, 'X' | 'O'>();
    for (let i = 0; i < 6; i++) {
      board.set(`${i},${-i}`, 'X');
    }
    const result = checkWinFromHex(board, { q: 3, r: -3 }, 'X');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(6);
  });

  it('detects win along s-axis (NW/SE direction)', () => {
    // s-axis direction: (0,-1)/(0,1) -- r changes, q stays
    const board = new Map<string, 'X' | 'O'>();
    for (let i = 0; i < 6; i++) {
      board.set(`0,${i}`, 'O');
    }
    const result = checkWinFromHex(board, { q: 0, r: 3 }, 'O');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThanOrEqual(6);
  });
});

describe('GAME-05: Win on first of 2 placements ends game immediately', () => {
  it('game ends mid-turn when first placement completes a winning line', () => {
    let snap = createInitialSnapshot();

    // X first turn: 1 stone at (0,0)
    snap = applyMove(snap, { q: 0, r: 0 });

    // O: 2 scattered stones (no axis alignment)
    snap = applyMove(snap, { q: -5, r: 3 });
    snap = applyMove(snap, { q: -7, r: 1 });

    // X: (1,0), (2,0)
    snap = applyMove(snap, { q: 1, r: 0 });
    snap = applyMove(snap, { q: 2, r: 0 });

    // O: 2 scattered stones
    snap = applyMove(snap, { q: -3, r: 5 });
    snap = applyMove(snap, { q: -9, r: 2 });

    // X: (3,0), (4,0)
    snap = applyMove(snap, { q: 3, r: 0 });
    snap = applyMove(snap, { q: 4, r: 0 });

    // O: 2 scattered stones
    snap = applyMove(snap, { q: -4, r: 7 });
    snap = applyMove(snap, { q: -8, r: 4 });

    // X's turn with 2 placements. First placement at (5,0) completes 6 in a row.
    expect(snap.currentPlayer).toBe('X');
    snap = applyMove(snap, { q: 5, r: 0 });

    expect(snap.status).toBe('won');
    expect(snap.winner).toBe('X');
    expect(snap.winningLine.length).toBeGreaterThanOrEqual(6);

    // Second placement should be rejected (game already won)
    const snapAfter = applyMove(snap, { q: 6, r: 0 });
    expect(snapAfter).toBe(snap); // unchanged reference
  });
});

describe('UI-03: totalMoves increments by 1 on each stone placed', () => {
  it('increments totalMoves on each placement', () => {
    let snap = createInitialSnapshot();
    expect(snap.totalMoves).toBe(0);

    snap = applyMove(snap, { q: 0, r: 0 });
    expect(snap.totalMoves).toBe(1);

    snap = applyMove(snap, { q: 1, r: 0 });
    expect(snap.totalMoves).toBe(2);

    snap = applyMove(snap, { q: 2, r: 0 });
    expect(snap.totalMoves).toBe(3);
  });
});

describe('GAME-08: applyRematch resets game state', () => {
  it('resets board, status, totalMoves to initial playing state', () => {
    let snap = createInitialSnapshot();
    snap = applyMove(snap, { q: 0, r: 0 });
    snap = applyMove(snap, { q: 1, r: 0 });

    const rematch = applyRematch(snap);
    expect(rematch.board.size).toBe(0);
    expect(rematch.status).toBe('playing');
    expect(rematch.totalMoves).toBe(0);
    expect(rematch.isFirstTurn).toBe(true);
    expect(rematch.winner).toBeNull();
    expect(rematch.winningLine).toEqual([]);
    expect(rematch.placementsThisTurn).toBe(0);
  });
});

describe('GAME-09: applyRematch after X wins sets loser (O) as starting player', () => {
  it('loser goes first on rematch per D-10', () => {
    // Create a won game where X wins
    let snap = createInitialSnapshot();

    // X first turn
    snap = applyMove(snap, { q: 0, r: 0 });
    // O scattered turns (no axis alignment)
    snap = applyMove(snap, { q: -5, r: 3 });
    snap = applyMove(snap, { q: -7, r: 1 });
    // X turns
    snap = applyMove(snap, { q: 1, r: 0 });
    snap = applyMove(snap, { q: 2, r: 0 });
    // O scattered turns
    snap = applyMove(snap, { q: -3, r: 5 });
    snap = applyMove(snap, { q: -9, r: 2 });
    // X turns
    snap = applyMove(snap, { q: 3, r: 0 });
    snap = applyMove(snap, { q: 4, r: 0 });
    // O scattered turns
    snap = applyMove(snap, { q: -4, r: 7 });
    snap = applyMove(snap, { q: -8, r: 4 });
    // X wins with 6th stone
    snap = applyMove(snap, { q: 5, r: 0 });

    expect(snap.winner).toBe('X');

    const rematch = applyRematch(snap);
    expect(rematch.startingPlayer).toBe('O');
    expect(rematch.currentPlayer).toBe('O');
  });
});

describe('applyMove with invalid move', () => {
  it('returns same snapshot when move is invalid', () => {
    let snap = createInitialSnapshot();
    snap = applyMove(snap, { q: 0, r: 0 });

    // Try to place on occupied hex
    const snap2 = applyMove(snap, { q: 0, r: 0 });
    expect(snap2).toBe(snap);
  });
});
