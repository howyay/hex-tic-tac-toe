import type { HexCoord, Point, Camera } from '../hex/types';
import { hexToPixel, hexCorners } from '../hex/math';
import { getVisibleHexes } from '../hex/viewport';
import { drawEdgeFade, drawLODDot } from './effects';

const GRID_STROKE = 'rgba(255, 255, 255, 0.12)';
const BACKGROUND = '#1a1a2e';
const LOD_DOT_COLOR = 'rgba(255, 255, 255, 0.2)';
const LOD_DOT_RADIUS = 3;
const LOD_THRESHOLD = 0.4;
const HOVER_COLOR = 'rgba(79, 195, 247, 0.3)'; // Player X default for Phase 1
const DEBUG_TEXT_COLOR = 'rgba(255, 255, 255, 0.5)';
const EDGE_FADE_SIZE = 64;

/** Apply camera transform to the canvas context */
export function applyCamera(ctx: CanvasRenderingContext2D, camera: Camera): void {
  ctx.setTransform(
    camera.zoom, 0,
    0, camera.zoom,
    camera.x * camera.zoom,
    camera.y * camera.zoom,
  );
}

/** Draw a single hex outline (and optional fill) */
export function drawHex(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  strokeColor: string,
  fillColor?: string,
): void {
  const corners = hexCorners(center, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

/** Draw all visible hexes (full outlines or LOD dots based on zoom) */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  hexes: HexCoord[],
  hexSize: number,
  _camera: Camera,
  zoom: number,
): void {
  if (zoom >= LOD_THRESHOLD) {
    // Full hex outlines
    ctx.strokeStyle = GRID_STROKE;
    ctx.lineWidth = 1;
    for (let i = 0; i < hexes.length; i++) {
      const center = hexToPixel(hexes[i], hexSize);
      const corners = hexCorners(center, hexSize);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let j = 1; j < 6; j++) {
        ctx.lineTo(corners[j].x, corners[j].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  } else {
    // LOD dot mode at far zoom
    for (let i = 0; i < hexes.length; i++) {
      const center = hexToPixel(hexes[i], hexSize);
      drawLODDot(ctx, center, LOD_DOT_RADIUS, LOD_DOT_COLOR);
    }
  }
}

/** Full render pipeline */
export function render(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvasWidth: number,
  canvasHeight: number,
  hexSize: number,
  hoveredHex: HexCoord | null,
  debugCoords: boolean,
): void {
  // 1. Clear canvas with background color
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Apply camera transform
  applyCamera(ctx, camera);

  // 3. Get visible hexes via viewport culling
  const hexes = getVisibleHexes(camera, canvasWidth, canvasHeight, hexSize);

  // 4. Draw hex grid
  drawGrid(ctx, hexes, hexSize, camera, camera.zoom);

  // 5. Draw hover preview if hoveredHex is set
  if (hoveredHex !== null) {
    const hoverCenter = hexToPixel(hoveredHex, hexSize);
    if (camera.zoom >= LOD_THRESHOLD) {
      drawHex(ctx, hoverCenter, hexSize, 'transparent', HOVER_COLOR);
    } else {
      // In LOD mode, draw a slightly larger/brighter dot for hover
      drawLODDot(ctx, hoverCenter, LOD_DOT_RADIUS + 2, HOVER_COLOR);
    }
  }

  // 6. Reset transform to screen space
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // 7. Draw edge fade overlay
  drawEdgeFade(ctx, canvasWidth, canvasHeight, EDGE_FADE_SIZE);

  // 8. Draw debug coordinate labels if enabled
  if (debugCoords && camera.zoom >= LOD_THRESHOLD) {
    ctx.font = '10px system-ui';
    ctx.fillStyle = DEBUG_TEXT_COLOR;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < hexes.length; i++) {
      const worldCenter = hexToPixel(hexes[i], hexSize);
      // Transform world to screen space
      const sx = (worldCenter.x + camera.x) * camera.zoom;
      const sy = (worldCenter.y + camera.y) * camera.zoom;
      ctx.fillText(`(${hexes[i].q},${hexes[i].r})`, sx, sy);
    }
  }
}
