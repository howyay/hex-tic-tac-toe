export interface HexCoord {
  q: number;
  r: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Camera {
  x: number;  // world-space offset
  y: number;
  zoom: number;  // 1.0 = default
}

export type Player = 'X' | 'O';
export type GameStatus = 'playing' | 'won';

export interface GameSnapshot {
  board: Map<string, Player>;
  currentPlayer: Player;
  placementsThisTurn: number;
  isFirstTurn: boolean;
  totalMoves: number;
  status: GameStatus;
  winner: Player | null;
  winningLine: HexCoord[];
  startingPlayer: Player;
}
