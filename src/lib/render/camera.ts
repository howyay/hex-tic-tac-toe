import type { Point, Camera } from '../hex/types';

export const ZOOM_MIN = 0.4;   // Never zoom past LOD threshold — hexes always render full detail
export const ZOOM_MAX = 1.0;   // Default zoom is the max — no zooming in past default
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

/** Compute camera that centers a bounding box (world-space min/max) within the viewport */
export function cameraForBounds(
  minX: number, minY: number, maxX: number, maxY: number,
  viewportWidth: number, viewportHeight: number,
  padding: number = 60,
): Camera {
  const bboxW = maxX - minX + padding * 2;
  const bboxH = maxY - minY + padding * 2;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const zoom = clamp(
    Math.min(viewportWidth / bboxW, viewportHeight / bboxH),
    ZOOM_MIN,
    ZOOM_MAX,
  );

  return {
    x: viewportWidth / (2 * zoom) - centerX,
    y: viewportHeight / (2 * zoom) - centerY,
    zoom,
  };
}

/** Linearly interpolate between two cameras */
export function lerpCamera(a: Camera, b: Camera, t: number): Camera {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    zoom: a.zoom + (b.zoom - a.zoom) * t,
  };
}
