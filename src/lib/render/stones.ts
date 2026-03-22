import type { Point, Player } from '../hex/types';
import type { ThemeColors } from '../theme/colors';
import { hexCorners } from '../hex/math';

const MARK_SCALE = 0.55;
const MARK_STROKE_WIDTH = 3;
const WIN_GLOW_BLUR = 15;
const WIN_GLOW_STROKE_WIDTH = 3;

/** Get the color for a given player */
export function getPlayerColor(player: Player, colors: ThemeColors): string {
  return player === 'X' ? colors.playerX : colors.playerO;
}

/** Draw an X mark (two crossed lines) at the given center */
export function drawX(ctx: CanvasRenderingContext2D, center: Point, size: number, color: string): void {
  const r = size * MARK_SCALE;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = MARK_STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(center.x - r, center.y - r);
  ctx.lineTo(center.x + r, center.y + r);
  ctx.moveTo(center.x + r, center.y - r);
  ctx.lineTo(center.x - r, center.y + r);
  ctx.stroke();
  ctx.restore();
}

/** Draw an O mark (circle) at the given center */
export function drawO(ctx: CanvasRenderingContext2D, center: Point, size: number, color: string): void {
  const r = size * MARK_SCALE;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = MARK_STROKE_WIDTH;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw a glowing highlight outline on a winning hex */
export function drawWinHighlight(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  playerColor: string,
): void {
  const corners = hexCorners(center, size);
  ctx.save();
  ctx.shadowColor = playerColor;
  ctx.shadowBlur = WIN_GLOW_BLUR;
  ctx.strokeStyle = playerColor;
  ctx.lineWidth = WIN_GLOW_STROKE_WIDTH;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/** Draw a red flash fill on a rejected (occupied) hex */
export function drawRejectionFlash(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  color: string,
): void {
  const corners = hexCorners(center, size);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
