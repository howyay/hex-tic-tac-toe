import type { HexCoord, Camera } from './types';
import { pixelToHex } from './math';
import { screenToWorld } from '../render/camera';

const PADDING = 2; // extra hexes beyond viewport per RESEARCH.md pitfall 5

/** Compute the set of hex coordinates visible in the current viewport */
export function getVisibleHexes(
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  hexSize: number,
): HexCoord[] {
  // Convert 4 viewport corners to world space, then to fractional hex coords
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const topRight = screenToWorld({ x: canvasWidth, y: 0 }, camera);
  const bottomLeft = screenToWorld({ x: 0, y: canvasHeight }, camera);
  const bottomRight = screenToWorld({ x: canvasWidth, y: canvasHeight }, camera);

  const corners = [topLeft, topRight, bottomLeft, bottomRight];
  const hexCorners = corners.map(c => pixelToHex(c, hexSize));

  // Find bounding range in q,r space
  const qValues = hexCorners.map(h => h.q);
  const rValues = hexCorners.map(h => h.r);
  const qMin = Math.floor(Math.min(...qValues)) - PADDING;
  const qMax = Math.ceil(Math.max(...qValues)) + PADDING;
  const rMin = Math.floor(Math.min(...rValues)) - PADDING;
  const rMax = Math.ceil(Math.max(...rValues)) + PADDING;

  const hexes: HexCoord[] = [];
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes.push({ q, r });
    }
  }
  return hexes;
}
