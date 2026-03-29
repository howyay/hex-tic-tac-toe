import type { Camera, HexCoord } from '../hex/types';
import { lerpCamera } from '../render/camera';

const ANIMATION_DURATION = 300; // ms

export function createGridState() {
  let camera = $state<Camera>({ x: 0, y: 0, zoom: 1.0 });
  let hoveredHex = $state<HexCoord | null>(null);
  let debugCoords = $state(false);
  let isPanning = $state(false);
  let needsRedraw = $state(true);

  // Camera animation state
  let animationId: number | null = null;

  function animateTo(target: Camera): void {
    if (animationId !== null) cancelAnimationFrame(animationId);

    const start = { ...camera };
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      camera = lerpCamera(start, target, eased);
      needsRedraw = true;

      if (t < 1) {
        animationId = requestAnimationFrame(tick);
      } else {
        animationId = null;
      }
    }

    animationId = requestAnimationFrame(tick);
  }

  return {
    get camera() { return camera; },
    set camera(v: Camera) { camera = v; needsRedraw = true; },
    get hoveredHex() { return hoveredHex; },
    set hoveredHex(v: HexCoord | null) { hoveredHex = v; needsRedraw = true; },
    get debugCoords() { return debugCoords; },
    set debugCoords(v: boolean) { debugCoords = v; needsRedraw = true; },
    get isPanning() { return isPanning; },
    set isPanning(v: boolean) { isPanning = v; },
    get needsRedraw() { return needsRedraw; },
    set needsRedraw(v: boolean) { needsRedraw = v; },
    animateTo,
  };
}

export type GridState = ReturnType<typeof createGridState>;
