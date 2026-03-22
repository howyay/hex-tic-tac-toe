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
