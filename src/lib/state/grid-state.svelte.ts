import type { Camera, HexCoord } from '../hex/types';

export function createGridState() {
  let camera = $state<Camera>({ x: 0, y: 0, zoom: 1.0 }); // D-08: centered on (0,0)
  let hoveredHex = $state<HexCoord | null>(null);
  let debugCoords = $state(false); // D-11: hidden by default
  let isPanning = $state(false);
  let needsRedraw = $state(true);

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
  };
}

export type GridState = ReturnType<typeof createGridState>;
