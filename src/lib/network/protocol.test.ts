import { describe, it, expect } from 'vitest';
import { serializeSnapshot, deserializeSnapshot } from './protocol';
import type { GameSnapshot } from '../hex/types';
import type { SerializedSnapshot, GameMessage } from './protocol';

describe('serializeSnapshot / deserializeSnapshot', () => {
  it('round-trips an empty board', () => {
    const snapshot: GameSnapshot = {
      board: new Map(),
      currentPlayer: 'X',
      placementsThisTurn: 0,
      isFirstTurn: true,
      totalMoves: 0,
      status: 'playing',
      winner: null,
      winningLine: [],
      startingPlayer: 'X',
    };

    const serialized = serializeSnapshot(snapshot);
    const deserialized = deserializeSnapshot(serialized);

    expect(deserialized.board).toBeInstanceOf(Map);
    expect(deserialized.board.size).toBe(0);
    expect(deserialized.currentPlayer).toBe('X');
    expect(deserialized.isFirstTurn).toBe(true);
  });

  it('round-trips a board with multiple entries', () => {
    const board = new Map<string, 'X' | 'O'>([
      ['0,0', 'X'],
      ['1,-1', 'O'],
      ['2,0', 'X'],
      ['-1,1', 'O'],
      ['0,2', 'X'],
    ]);

    const snapshot: GameSnapshot = {
      board,
      currentPlayer: 'O',
      placementsThisTurn: 1,
      isFirstTurn: false,
      totalMoves: 5,
      status: 'playing',
      winner: null,
      winningLine: [],
      startingPlayer: 'X',
    };

    const serialized = serializeSnapshot(snapshot);
    const deserialized = deserializeSnapshot(serialized);

    expect(deserialized.board).toBeInstanceOf(Map);
    expect(deserialized.board.size).toBe(5);
    expect(deserialized.board.get('0,0')).toBe('X');
    expect(deserialized.board.get('1,-1')).toBe('O');
    expect(deserialized.board.get('2,0')).toBe('X');
    expect(deserialized.board.get('-1,1')).toBe('O');
    expect(deserialized.board.get('0,2')).toBe('X');
    expect(deserialized.currentPlayer).toBe('O');
    expect(deserialized.totalMoves).toBe(5);
  });

  it('serialized board is a plain object, not a Map', () => {
    const snapshot: GameSnapshot = {
      board: new Map([['0,0', 'X']]),
      currentPlayer: 'X',
      placementsThisTurn: 1,
      isFirstTurn: true,
      totalMoves: 1,
      status: 'playing',
      winner: null,
      winningLine: [],
      startingPlayer: 'X',
    };

    const serialized = serializeSnapshot(snapshot);
    expect(serialized.board).not.toBeInstanceOf(Map);
    expect(typeof serialized.board).toBe('object');
    expect(serialized.board['0,0']).toBe('X');
  });

  it('deserialized board is a Map', () => {
    const serialized: SerializedSnapshot = {
      board: { '0,0': 'X', '1,0': 'O' },
      currentPlayer: 'X',
      placementsThisTurn: 0,
      isFirstTurn: false,
      totalMoves: 2,
      status: 'playing',
      winner: null,
      winningLine: [],
      startingPlayer: 'X',
    };

    const deserialized = deserializeSnapshot(serialized);
    expect(deserialized.board).toBeInstanceOf(Map);
    expect(deserialized.board.get('0,0')).toBe('X');
    expect(deserialized.board.get('1,0')).toBe('O');
  });

  it('preserves winningLine through round-trip', () => {
    const snapshot: GameSnapshot = {
      board: new Map(),
      currentPlayer: 'X',
      placementsThisTurn: 0,
      isFirstTurn: false,
      totalMoves: 12,
      status: 'won',
      winner: 'X',
      winningLine: [
        { q: 0, r: 0 },
        { q: 1, r: 0 },
        { q: 2, r: 0 },
        { q: 3, r: 0 },
        { q: 4, r: 0 },
        { q: 5, r: 0 },
      ],
      startingPlayer: 'X',
    };

    const serialized = serializeSnapshot(snapshot);
    const deserialized = deserializeSnapshot(serialized);

    expect(deserialized.winningLine).toEqual(snapshot.winningLine);
    expect(deserialized.winner).toBe('X');
    expect(deserialized.status).toBe('won');
  });
});

describe('GameMessage type coverage', () => {
  it('supports all expected message types', () => {
    // Type-level test: if these compile, the union covers all types
    const messages: GameMessage[] = [
      { type: 'move-request', q: 0, r: 0 },
      { type: 'state-update', snapshot: { board: {}, currentPlayer: 'X', placementsThisTurn: 0, isFirstTurn: true, totalMoves: 0, status: 'playing', winner: null, winningLine: [], startingPlayer: 'X' } },
      { type: 'game-start', snapshot: { board: {}, currentPlayer: 'X', placementsThisTurn: 0, isFirstTurn: true, totalMoves: 0, status: 'playing', winner: null, winningLine: [], startingPlayer: 'X' } },
      { type: 'rematch-request' },
      { type: 'rematch-accept', snapshot: { board: {}, currentPlayer: 'O', placementsThisTurn: 0, isFirstTurn: true, totalMoves: 0, status: 'playing', winner: null, winningLine: [], startingPlayer: 'O' } },
      { type: 'ping' },
      { type: 'pong' },
    ];

    expect(messages).toHaveLength(7);
    const types = messages.map(m => m.type);
    expect(types).toContain('move-request');
    expect(types).toContain('state-update');
    expect(types).toContain('game-start');
    expect(types).toContain('rematch-request');
    expect(types).toContain('rematch-accept');
    expect(types).toContain('ping');
    expect(types).toContain('pong');
  });
});
