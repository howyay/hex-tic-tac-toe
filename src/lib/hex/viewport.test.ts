import { describe, it, expect } from 'vitest';
import { getVisibleHexes } from './viewport';

describe('getVisibleHexes', () => {
  it('includes hex (0,0) at default camera with 1280x720 canvas', () => {
    const hexes = getVisibleHexes({ x: 0, y: 0, zoom: 1 }, 1280, 720, 30);
    const hasOrigin = hexes.some(h => h.q === 0 && h.r === 0);
    expect(hasOrigin).toBe(true);
  });

  it('returns no duplicate coordinates', () => {
    const hexes = getVisibleHexes({ x: 0, y: 0, zoom: 1 }, 1280, 720, 30);
    const keys = new Set(hexes.map(h => `${h.q},${h.r}`));
    expect(keys.size).toBe(hexes.length);
  });

  it('count scales with viewport size', () => {
    const small = getVisibleHexes({ x: 0, y: 0, zoom: 1 }, 640, 360, 30);
    const large = getVisibleHexes({ x: 0, y: 0, zoom: 1 }, 1920, 1080, 30);
    expect(large.length).toBeGreaterThan(small.length);
  });

  it('includes padding hexes beyond visible edges (at least +2)', () => {
    // A very small viewport should still return hexes due to padding
    const hexes = getVisibleHexes({ x: 0, y: 0, zoom: 1 }, 1, 1, 30);
    expect(hexes.length).toBeGreaterThanOrEqual(25); // at least 5x5 with padding
  });

  it('zoomed-out camera returns more hexes than zoomed-in', () => {
    const zoomedIn = getVisibleHexes({ x: 0, y: 0, zoom: 2 }, 1280, 720, 30);
    const zoomedOut = getVisibleHexes({ x: 0, y: 0, zoom: 0.5 }, 1280, 720, 30);
    expect(zoomedOut.length).toBeGreaterThan(zoomedIn.length);
  });
});
