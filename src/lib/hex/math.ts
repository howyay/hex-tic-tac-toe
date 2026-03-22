import type { HexCoord, Point } from './types';

export const SQRT3 = Math.sqrt(3);

/** Convert axial hex coordinate to pixel center (pointy-top) */
export function hexToPixel(hex: HexCoord, size: number): Point {
  return {
    x: size * (SQRT3 * hex.q + SQRT3 / 2 * hex.r),
    y: size * (1.5 * hex.r),
  };
}

/** Convert pixel to fractional axial hex coordinate (pointy-top) */
export function pixelToHex(point: Point, size: number): { q: number; r: number } {
  const q = (SQRT3 / 3 * point.x - 1 / 3 * point.y) / size;
  const r = (2 / 3 * point.y) / size;
  return { q, r };
}

/** Round fractional hex coords to nearest hex (cube rounding) */
export function hexRound(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq || 0, r: rr || 0 };  // normalize -0 to +0
}

/** Get 6 corner points of a pointy-top hex */
export function hexCorners(center: Point, size: number): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // pointy-top: start at -30 degrees (D-01)
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  return corners;
}

/** Axial neighbor direction vectors */
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
