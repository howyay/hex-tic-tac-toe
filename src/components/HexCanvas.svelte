<script lang="ts">
  import type { GameStateAPI } from '../lib/state/game-state.svelte';
  import type { ThemeColors } from '../lib/theme/colors';
  import { render } from '../lib/render/renderer';
  import { panCamera, zoomAtPoint, screenToWorld } from '../lib/render/camera';
  import { pixelToHex, hexRound } from '../lib/hex/math';

  let { debugActive = $bindable(false), gameState, themeColors }: { debugActive?: boolean; gameState: GameStateAPI; themeColors: ThemeColors } = $props();

  const HEX_SIZE = 30;
  const CLICK_THRESHOLD = 5;

  const state = gameState.gridState;

  let dragDistance = 0;

  // Touch gesture state
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = 0;
  let activeTouchId: number | null = null;
  let initialPinchDist = 0;
  let lastPinchMidX = 0;
  let lastPinchMidY = 0;

  const TOUCH_TAP_TIME = 200;   // ms (D-09: <200ms)
  const TOUCH_TAP_DIST = 10;    // px cumulative (D-09: minimal movement)

  // Sync debugCoords state to bindable prop
  $effect(() => {
    debugActive = state.debugCoords;
  });

  // Trigger redraw when game state changes
  $effect(() => {
    // Touch reactive properties to track them
    gameState.board;
    gameState.status;
    gameState.rejectedHex;
    gameState.currentPlayer;
    themeColors;
    state.needsRedraw = true;
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
          gameState.board,
          gameState.currentPlayer,
          gameState.status,
          gameState.winningLine,
          gameState.winner,
          gameState.rejectedHex,
          themeColors,
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
    if (gameState.status === 'won') return; // D-06: board freeze on win
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
    if (state.isPanning && dragDistance < CLICK_THRESHOLD && gameState.status === 'playing') {
      const worldPoint = screenToWorld(
        { x: e.offsetX, y: e.offsetY },
        state.camera,
      );
      const fractional = pixelToHex(worldPoint, HEX_SIZE);
      const hex = hexRound(fractional.q, fractional.r);
      gameState.placeStone(hex);
    }
    state.isPanning = false;
  }

  function handleMouseLeave() {
    state.isPanning = false;
    state.hoveredHex = null;
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    if (gameState.status === 'won') return; // D-06: zoom freeze on win
    const zoomDelta = e.deltaY * 0.001;
    const cursorPoint = { x: e.offsetX, y: e.offsetY };
    state.camera = zoomAtPoint(state.camera, cursorPoint, zoomDelta);
  }

  function handleTouchStart(e: TouchEvent) {
    e.preventDefault(); // Suppress synthesized mouse events and 300ms click delay

    if (e.touches.length === 1) {
      const t = e.touches[0];
      activeTouchId = t.identifier;
      touchStartTime = performance.now();
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchMoved = 0;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      lastPinchMidX = (t1.clientX + t2.clientX) / 2;
      lastPinchMidY = (t1.clientY + t2.clientY) / 2;
      activeTouchId = null; // Cancel tap/drag — now a pinch
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (e.touches.length === 2) {
      e.preventDefault(); // Prevent browser pinch zoom

      if (gameState.status === 'won') return; // Board freeze on win

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // Zoom: scale ratio relative to initial pinch distance
      if (initialPinchDist > 0) {
        const scale = dist / initialPinchDist;
        const rect = canvas.getBoundingClientRect();
        const canvasPoint = { x: midX - rect.left, y: midY - rect.top };
        state.camera = zoomAtPoint(state.camera, canvasPoint, 1 - scale);
        initialPinchDist = dist;
      }

      // Pan by midpoint delta
      const panDx = midX - lastPinchMidX;
      const panDy = midY - lastPinchMidY;
      state.camera = panCamera(state.camera, panDx, panDy);
      lastPinchMidX = midX;
      lastPinchMidY = midY;
    } else if (e.touches.length === 1 && activeTouchId !== null) {
      // Find touch by identifier (not array index)
      let touch: Touch | null = null;
      for (let i = 0; i < e.touches.length; i++) {
        if (e.touches[i].identifier === activeTouchId) {
          touch = e.touches[i];
          break;
        }
      }
      if (!touch) return;

      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      touchMoved += Math.abs(dx) + Math.abs(dy);

      if (touchMoved > TOUCH_TAP_DIST && gameState.status !== 'won') {
        state.camera = panCamera(state.camera, dx, dy);
      }
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (activeTouchId === null) return; // Was a pinch, not a tap

    const elapsed = performance.now() - touchStartTime;

    if (elapsed < TOUCH_TAP_TIME && touchMoved < TOUCH_TAP_DIST && gameState.status === 'playing') {
      const rect = canvas.getBoundingClientRect();
      const offsetX = touchStartX - rect.left;
      const offsetY = touchStartY - rect.top;
      const worldPoint = screenToWorld({ x: offsetX, y: offsetY }, state.camera);
      const fractional = pixelToHex(worldPoint, HEX_SIZE);
      const hex = hexRound(fractional.q, fractional.r);
      gameState.placeStone(hex);
    }

    activeTouchId = null;
  }
</script>

<canvas
  bind:this={canvas}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseLeave}
  onwheel={handleWheel}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  style="width: 100%; height: 100%; display: block; touch-action: none; cursor: {gameState.status === 'won' ? 'default' : state.isPanning ? 'grabbing' : 'grab'};"
></canvas>
