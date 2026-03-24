import type { HexCoord, Player, GameSnapshot, GameStatus } from '../hex/types';
import type { TimerMode } from '../game/timer';

/** Serializable version of GameSnapshot with board as plain object instead of Map */
export interface SerializedSnapshot {
  board: Record<string, Player>;
  currentPlayer: Player;
  placementsThisTurn: number;
  isFirstTurn: boolean;
  totalMoves: number;
  status: GameStatus;
  winner: Player | null;
  winningLine: HexCoord[];
  startingPlayer: Player;
}

/** Discriminated union of all P2P messages */
export type GameMessage =
  | { type: 'move-request'; q: number; r: number }
  | { type: 'state-update'; snapshot: SerializedSnapshot }
  | { type: 'game-start'; snapshot: SerializedSnapshot }
  | { type: 'rematch-request' }
  | { type: 'rematch-accept'; snapshot: SerializedSnapshot }
  | { type: 'ping' }
  | { type: 'pong' }
  | { type: 'timer-config'; mode: TimerMode }
  | { type: 'timer-sync'; remaining: number }
  | { type: 'timer-expired' };

/** Convert a GameSnapshot to a JSON-serializable form (Map -> Record) */
export function serializeSnapshot(s: GameSnapshot): SerializedSnapshot {
  return {
    ...s,
    board: Object.fromEntries(s.board),
  };
}

/** Convert a SerializedSnapshot back to a GameSnapshot (Record -> Map) */
export function deserializeSnapshot(s: SerializedSnapshot): GameSnapshot {
  return {
    ...s,
    board: new Map(Object.entries(s.board)) as Map<string, Player>,
  };
}
