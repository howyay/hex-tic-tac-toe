import { describe, it, expect } from 'vitest';
import {
  screenToWorld,
  worldToScreen,
  zoomAtPoint,
  panCamera,
  DEFAULT_CAMERA,
  ZOOM_MIN,
  ZOOM_MAX,
} from './camera';

describe('screenToWorld', () => {
  it('returns origin for screen origin at default camera', () => {
    const result = screenToWorld({ x: 0, y: 0 }, { x: 0, y: 0, zoom: 1 });
    expect(result.x).toBeCloseTo(0, 2);
    expect(result.y).toBeCloseTo(0, 2);
  });

  it('applies camera offset correctly', () => {
    const result = screenToWorld({ x: 100, y: 100 }, { x: 50, y: 50, zoom: 1 });
    expect(result.x).toBeCloseTo(50, 2);
    expect(result.y).toBeCloseTo(50, 2);
  });

  it('with zoom=2, pixel coords are halved in world space', () => {
    const result = screenToWorld({ x: 200, y: 200 }, { x: 0, y: 0, zoom: 2 });
    expect(result.x).toBeCloseTo(100, 2);
    expect(result.y).toBeCloseTo(100, 2);
  });
});

describe('worldToScreen', () => {
  it('is inverse of screenToWorld for any point', () => {
    const camera = { x: 30, y: -20, zoom: 1.5 };
    const screenPoint = { x: 400, y: 300 };
    const world = screenToWorld(screenPoint, camera);
    const backToScreen = worldToScreen(world, camera);
    expect(backToScreen.x).toBeCloseTo(screenPoint.x, 2);
    expect(backToScreen.y).toBeCloseTo(screenPoint.y, 2);
  });
});

describe('zoomAtPoint', () => {
  it('keeps world point under cursor fixed after zoom', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const cursor = { x: 400, y: 300 };
    const worldBefore = screenToWorld(cursor, camera);
    const newCamera = zoomAtPoint(camera, cursor, 0.1);
    const worldAfter = screenToWorld(cursor, newCamera);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x, 1);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y, 1);
  });

  it('clamps zoom to ZOOM_MIN', () => {
    const camera = { x: 0, y: 0, zoom: ZOOM_MIN };
    const result = zoomAtPoint(camera, { x: 0, y: 0 }, -10);
    expect(result.zoom).toBeGreaterThanOrEqual(ZOOM_MIN);
  });

  it('clamps zoom to ZOOM_MAX', () => {
    const camera = { x: 0, y: 0, zoom: ZOOM_MAX };
    const result = zoomAtPoint(camera, { x: 0, y: 0 }, 10);
    expect(result.zoom).toBeLessThanOrEqual(ZOOM_MAX);
  });
});

describe('panCamera', () => {
  it('adjusts camera position by delta in screen space', () => {
    const camera = { x: 0, y: 0, zoom: 1 };
    const result = panCamera(camera, 100, 50);
    expect(result.x).toBeCloseTo(100, 2);
    expect(result.y).toBeCloseTo(50, 2);
    expect(result.zoom).toBe(1);
  });

  it('accounts for zoom when panning', () => {
    const camera = { x: 0, y: 0, zoom: 2 };
    const result = panCamera(camera, 100, 50);
    expect(result.x).toBeCloseTo(50, 2);
    expect(result.y).toBeCloseTo(25, 2);
  });
});

describe('DEFAULT_CAMERA', () => {
  it('has x=0, y=0, zoom=1.0', () => {
    expect(DEFAULT_CAMERA.x).toBe(0);
    expect(DEFAULT_CAMERA.y).toBe(0);
    expect(DEFAULT_CAMERA.zoom).toBe(1.0);
  });
});
