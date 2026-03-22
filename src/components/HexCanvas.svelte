<script lang="ts">
  import { createGridState } from '../lib/state/grid-state.svelte';
  import type { GameStateAPI } from '../lib/state/game-state.svelte';
  import { render } from '../lib/render/renderer';
  import { panCamera, zoomAtPoint, screenToWorld } from '../lib/render/camera';
  import { pixelToHex, hexRound } from '../lib/hex/math';

  let { debugActive = $bindable(false), gameState }: { debugActive?: boolean; gameState?: GameStateAPI } = $props();

  const HEX_SIZE = 30;
  const CLICK_THRESHOLD = 5;

  const state = createGridState();

  let dragDistance = 0;

  // Sync debugCoords state to bindable prop
  $effect(() => {
    debugActive = state.debugCoords;
  });

  // Trigger redraw when game state changes
  $effect(() => {
    if (gameState) {
      // Touch reactive properties to track them
      gameState.board;
      gameState.status;
      gameState.rejectedHex;
      gameState.currentPlayer;
      state.needsRedraw = true;
    }
  });

  let canvas: HTMLCanvasElement;
  let lastMouseX = 0;
  let lastMouseY = 0;

  function setupCanvas() {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
    state.needsRedraw = true;
  }

  // rAF render loop (Pattern 4 from RESEARCH.md)
  $effect(() => {
    if (!canvas) return;
    setupCanvas();

    let animationId: number;
    const loop = () => {
      if (state.needsRedraw) {
        const ctx = canvas.getContext('2d')!;
        render(
          ctx,
          state.camera,
          canvas.clientWidth,
          canvas.clientHeight,
          HEX_SIZE,
          state.hoveredHex,
          state.debugCoords,
          gameState?.board,
          gameState?.currentPlayer,
          gameState?.status,
          gameState?.winningLine,
          gameState?.winner,
          gameState?.rejectedHex,
        );
        state.needsRedraw = false;
      }
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  });

  // Window resize handler
  $effect(() => {
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  // Debug toggle: Ctrl+D / Cmd+D (D-11)
  $effect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        state.debugCoords = !state.debugCoords;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function handleMouseDown(e: MouseEvent) {
    if (e.button !== 0) return; // left button only
    if (gameState?.status === 'won') return; // D-06: board freeze on win
    dragDistance = 0;
    state.isPanning = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  }

  function handleMouseMove(e: MouseEvent) {
    if (state.isPanning) {
      dragDistance += Math.abs(e.clientX - lastMouseX) + Math.abs(e.clientY - lastMouseY);
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      state.camera = panCamera(state.camera, deltaX, deltaY);
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    } else {
      // Hover handling (GRID-06)
      const worldPoint = screenToWorld(
        { x: e.offsetX, y: e.offsetY },
        state.camera,
      );
      const fractional = pixelToHex(worldPoint, HEX_SIZE);
      state.hoveredHex = hexRound(fractional.q, fractional.r);
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (state.isPanning && dragDistance < CLICK_THRESHOLD && gameState && gameState.status === 'playing') {
      const worldPoint = screenToWorld(
        { x: e.offsetX, y: e.offsetY },
        state.camera,
      );
      const fractional = pixelToHex(worldPoint, HEX_SIZE);
      const hex = hexRound(fractional.q, fractional.r);
      gameState.placeStone(hex, state);
    }
    state.isPanning = false;
  }

  function handleMouseLeave() {
    state.isPanning = false;
    state.hoveredHex = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    if (gameState?.status === 'won') return; // D-06: zoom freeze on win
    const zoomDelta = e.deltaY * 0.001;
    const cursorPoint = { x: e.offsetX, y: e.offsetY };
    state.camera = zoomAtPoint(state.camera, cursorPoint, zoomDelta);
  }
</script>

<canvas
  bind:this={canvas}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseLeave}
  onwheel={handleWheel}
  style="width: 100%; height: 100%; display: block; cursor: {gameState?.status === 'won' ? 'default' : state.isPanning ? 'grabbing' : 'grab'};"
></canvas>
