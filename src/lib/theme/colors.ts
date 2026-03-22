/** All color tokens used by the canvas render pipeline */
export interface ThemeColors {
  background: string;
  gridStroke: string;
  playerX: string;
  playerO: string;
  playerXHover: string;
  playerOHover: string;
  debugText: string;
  lodDot: string;
  rejectionFlash: string;
  edgeFadeOpaque: string;
  edgeFadeTransparent: string;
}

/** Dark theme — matches the original hardcoded color values */
export const DARK_THEME: ThemeColors = {
  background: '#1a1a2e',
  gridStroke: 'rgba(255, 255, 255, 0.12)',
  playerX: '#4fc3f7',
  playerO: '#ef5350',
  playerXHover: 'rgba(79, 195, 247, 0.3)',
  playerOHover: 'rgba(239, 83, 80, 0.3)',
  debugText: 'rgba(255, 255, 255, 0.5)',
  lodDot: 'rgba(255, 255, 255, 0.2)',
  rejectionFlash: 'rgba(255, 80, 80, 0.4)',
  edgeFadeOpaque: 'rgba(26, 26, 46, 1.0)',
  edgeFadeTransparent: 'rgba(26, 26, 46, 0.0)',
};

/** Light theme — warm off-white per UI-SPEC D-01/D-02/D-03 */
export const LIGHT_THEME: ThemeColors = {
  background: '#f5f0e8',
  gridStroke: 'rgba(0, 0, 0, 0.10)',
  playerX: '#0288d1',
  playerO: '#c62828',
  playerXHover: 'rgba(2, 136, 209, 0.25)',
  playerOHover: 'rgba(198, 40, 40, 0.25)',
  debugText: 'rgba(0, 0, 0, 0.4)',
  lodDot: 'rgba(0, 0, 0, 0.15)',
  rejectionFlash: 'rgba(198, 40, 40, 0.35)',
  edgeFadeOpaque: 'rgba(245, 240, 232, 1.0)',
  edgeFadeTransparent: 'rgba(245, 240, 232, 0.0)',
};
