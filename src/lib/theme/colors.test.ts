import { describe, it, expect } from 'vitest';
import { DARK_THEME, LIGHT_THEME, type ThemeColors } from './colors';

const THEME_KEYS: (keyof ThemeColors)[] = [
  'background',
  'gridStroke',
  'playerX',
  'playerO',
  'playerXHover',
  'playerOHover',
  'debugText',
  'lodDot',
  'rejectionFlash',
  'edgeFadeOpaque',
  'edgeFadeTransparent',
];

describe('ThemeColors', () => {
  describe('DARK_THEME', () => {
    it('has all 11 ThemeColors keys', () => {
      for (const key of THEME_KEYS) {
        expect(DARK_THEME).toHaveProperty(key);
      }
      expect(Object.keys(DARK_THEME)).toHaveLength(11);
    });

    it('background is #1a1a2e', () => {
      expect(DARK_THEME.background).toBe('#1a1a2e');
    });

    it('gridStroke is rgba(255, 255, 255, 0.12)', () => {
      expect(DARK_THEME.gridStroke).toBe('rgba(255, 255, 255, 0.12)');
    });

    it('playerX is #4fc3f7', () => {
      expect(DARK_THEME.playerX).toBe('#4fc3f7');
    });

    it('playerO is #ef5350', () => {
      expect(DARK_THEME.playerO).toBe('#ef5350');
    });

    it('playerXHover is rgba(79, 195, 247, 0.3)', () => {
      expect(DARK_THEME.playerXHover).toBe('rgba(79, 195, 247, 0.3)');
    });

    it('playerOHover is rgba(239, 83, 80, 0.3)', () => {
      expect(DARK_THEME.playerOHover).toBe('rgba(239, 83, 80, 0.3)');
    });

    it('debugText is rgba(255, 255, 255, 0.5)', () => {
      expect(DARK_THEME.debugText).toBe('rgba(255, 255, 255, 0.5)');
    });

    it('lodDot is rgba(255, 255, 255, 0.2)', () => {
      expect(DARK_THEME.lodDot).toBe('rgba(255, 255, 255, 0.2)');
    });

    it('rejectionFlash is rgba(255, 80, 80, 0.4)', () => {
      expect(DARK_THEME.rejectionFlash).toBe('rgba(255, 80, 80, 0.4)');
    });

    it('edgeFadeOpaque is rgba(26, 26, 46, 1.0)', () => {
      expect(DARK_THEME.edgeFadeOpaque).toBe('rgba(26, 26, 46, 1.0)');
    });

    it('edgeFadeTransparent is rgba(26, 26, 46, 0.0)', () => {
      expect(DARK_THEME.edgeFadeTransparent).toBe('rgba(26, 26, 46, 0.0)');
    });
  });

  describe('LIGHT_THEME', () => {
    it('has all 11 ThemeColors keys', () => {
      for (const key of THEME_KEYS) {
        expect(LIGHT_THEME).toHaveProperty(key);
      }
      expect(Object.keys(LIGHT_THEME)).toHaveLength(11);
    });

    it('background is #f5f0e8 (D-01: warm off-white)', () => {
      expect(LIGHT_THEME.background).toBe('#f5f0e8');
    });

    it('gridStroke is rgba(0, 0, 0, 0.10) (D-02: light gray)', () => {
      expect(LIGHT_THEME.gridStroke).toBe('rgba(0, 0, 0, 0.10)');
    });

    it('playerX is #0288d1 (D-03: darker blue)', () => {
      expect(LIGHT_THEME.playerX).toBe('#0288d1');
    });

    it('playerO is #c62828 (D-03: darker red)', () => {
      expect(LIGHT_THEME.playerO).toBe('#c62828');
    });

    it('playerXHover is rgba(2, 136, 209, 0.25)', () => {
      expect(LIGHT_THEME.playerXHover).toBe('rgba(2, 136, 209, 0.25)');
    });

    it('playerOHover is rgba(198, 40, 40, 0.25)', () => {
      expect(LIGHT_THEME.playerOHover).toBe('rgba(198, 40, 40, 0.25)');
    });

    it('debugText is rgba(0, 0, 0, 0.4)', () => {
      expect(LIGHT_THEME.debugText).toBe('rgba(0, 0, 0, 0.4)');
    });

    it('lodDot is rgba(0, 0, 0, 0.15)', () => {
      expect(LIGHT_THEME.lodDot).toBe('rgba(0, 0, 0, 0.15)');
    });

    it('rejectionFlash is rgba(198, 40, 40, 0.35)', () => {
      expect(LIGHT_THEME.rejectionFlash).toBe('rgba(198, 40, 40, 0.35)');
    });

    it('edgeFadeOpaque is rgba(245, 240, 232, 1.0)', () => {
      expect(LIGHT_THEME.edgeFadeOpaque).toBe('rgba(245, 240, 232, 1.0)');
    });

    it('edgeFadeTransparent is rgba(245, 240, 232, 0.0)', () => {
      expect(LIGHT_THEME.edgeFadeTransparent).toBe('rgba(245, 240, 232, 0.0)');
    });
  });
});
