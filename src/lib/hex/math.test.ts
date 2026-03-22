import { describe, it, expect } from 'vitest';
import { hexToPixel, pixelToHex, hexRound, hexCorners, HEX_DIRECTIONS, SQRT3 } from './math';

describe('hexToPixel', () => {
  it('returns origin for hex (0,0)', () => {
    const p = hexToPixel({ q: 0, r: 0 }, 30);
    expect(p.x).toBeCloseTo(0, 2);
    expect(p.y).toBeCloseTo(0, 2);
  });

  it('returns correct pixel for hex (1,0)', () => {
    const p = hexToPixel({ q: 1, r: 0 }, 30);
    expect(p.x).toBeCloseTo(SQRT3 * 30, 2);
    expect(p.y).toBeCloseTo(0, 2);
  });

  it('returns correct pixel for hex (0,1)', () => {
    const p = hexToPixel({ q: 0, r: 1 }, 30);
    expect(p.x).toBeCloseTo(SQRT3 / 2 * 30, 2);
    expect(p.y).toBeCloseTo(45, 2);
  });

  it('returns correct pixel for hex (1,1)', () => {
    const p = hexToPixel({ q: 1, r: 1 }, 30);
    expect(p.x).toBeCloseTo(SQRT3 * 30 + SQRT3 / 2 * 30, 2);
    expect(p.y).toBeCloseTo(45, 2);
  });

  it('returns finite numbers for large coordinates (GRID-02)', () => {
    const p = hexToPixel({ q: 10000, r: -5000 }, 30);
    expect(Number.isFinite(p.x)).toBe(true);
    expect(Number.isFinite(p.y)).toBe(true);
  });
});

describe('pixelToHex round-trip', () => {
  const testCoords = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: 3, r: -2 },
    { q: -5, r: 7 },
  ];

  testCoords.forEach(({ q, r }) => {
    it(`round-trips correctly for (${q}, ${r})`, () => {
      const pixel = hexToPixel({ q, r }, 30);
      const frac = pixelToHex(pixel, 30);
      const rounded = hexRound(frac.q, frac.r);
      expect(rounded.q).toBe(q);
      expect(rounded.r).toBe(r);
    });
  });
});

describe('hexRound', () => {
  it('rounds near cell center to (0,0)', () => {
    const result = hexRound(0.1, 0.1);
    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
  });

  it('rounds near boundary to (0,0)', () => {
    const result = hexRound(0.49, 0.01);
    expect(result.q).toBe(0);
    expect(result.r).toBe(0);
  });

  it('rounds across boundary to (1,0)', () => {
    const result = hexRound(0.51, -0.01);
    expect(result.q).toBe(1);
    expect(result.r).toBe(0);
  });
});

describe('hexCorners', () => {
  it('returns 6 points', () => {
    const corners = hexCorners({ x: 0, y: 0 }, 30);
    expect(corners).toHaveLength(6);
  });

  it('first corner angle is -30 degrees (pointy-top per D-01)', () => {
    const corners = hexCorners({ x: 0, y: 0 }, 30);
    const angleDeg = -30;
    const angleRad = (Math.PI / 180) * angleDeg;
    expect(corners[0].x).toBeCloseTo(30 * Math.cos(angleRad), 2);
    expect(corners[0].y).toBeCloseTo(30 * Math.sin(angleRad), 2);
  });
});

describe('HEX_DIRECTIONS', () => {
  it('has exactly 6 entries', () => {
    expect(HEX_DIRECTIONS).toHaveLength(6);
  });
});
