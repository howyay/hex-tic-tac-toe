import type { Point, Camera } from '../hex/types';

export const ZOOM_MIN = 0.25;  // ~50 hexes visible per D-06
export const ZOOM_MAX = 3.0;   // ~10 hexes visible per D-06
export const DEFAULT_CAMERA: Camera = { x: 0, y: 0, zoom: 1.0 };

/** Convert screen-space point to world-space point */
export function screenToWorld(screenPoint: Point, camera: Camera): Point {
  return {
    x: screenPoint.x / camera.zoom - camera.x,
    y: screenPoint.y / camera.zoom - camera.y,
  };
}

/** Convert world-space point to screen-space point */
export function worldToScreen(worldPoint: Point, camera: Camera): Point {
  return {
    x: (worldPoint.x + camera.x) * camera.zoom,
    y: (worldPoint.y + camera.y) * camera.zoom,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Zoom camera at a screen point, keeping the world point under cursor fixed */
export function zoomAtPoint(camera: Camera, screenPoint: Point, zoomDelta: number): Camera {
  const newZoom = clamp(camera.zoom * (1 - zoomDelta), ZOOM_MIN, ZOOM_MAX);
  const worldBefore = screenToWorld(screenPoint, camera);
  const worldAfter = screenToWorld(screenPoint, { ...camera, zoom: newZoom });
  return {
    x: camera.x + (worldAfter.x - worldBefore.x),
    y: camera.y + (worldAfter.y - worldBefore.y),
    zoom: newZoom,
  };
}

/** Pan camera by screen-space delta */
export function panCamera(camera: Camera, deltaX: number, deltaY: number): Camera {
  return {
    x: camera.x + deltaX / camera.zoom,
    y: camera.y + deltaY / camera.zoom,
    zoom: camera.zoom,
  };
}
