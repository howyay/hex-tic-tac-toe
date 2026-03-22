import type { Point } from '../hex/types';

/** Draw edge fade overlay on all 4 viewport edges (screen space) */
export function drawEdgeFade(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fadeSize: number,
  opaqueColor: string,
  transparentColor: string,
): void {
  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, fadeSize);
  topGrad.addColorStop(0, opaqueColor);
  topGrad.addColorStop(1, transparentColor);
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, fadeSize);

  // Bottom edge
  const bottomGrad = ctx.createLinearGradient(0, height, 0, height - fadeSize);
  bottomGrad.addColorStop(0, opaqueColor);
  bottomGrad.addColorStop(1, transparentColor);
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, height - fadeSize, width, fadeSize);

  // Left edge
  const leftGrad = ctx.createLinearGradient(0, 0, fadeSize, 0);
  leftGrad.addColorStop(0, opaqueColor);
  leftGrad.addColorStop(1, transparentColor);
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, fadeSize, height);

  // Right edge
  const rightGrad = ctx.createLinearGradient(width, 0, width - fadeSize, 0);
  rightGrad.addColorStop(0, opaqueColor);
  rightGrad.addColorStop(1, transparentColor);
  ctx.fillStyle = rightGrad;
  ctx.fillRect(width - fadeSize, 0, fadeSize, height);
}

/** Draw a filled circle (LOD dot) at a given center point */
export function drawLODDot(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
