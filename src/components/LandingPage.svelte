<script lang="ts">
  import { getVisibleHexes } from '../lib/hex/viewport';
  import { hexToPixel, hexCorners } from '../lib/hex/math';
  import type { Camera } from '../lib/hex/types';

  let { onLocalGame, onOnlineGame }: { onLocalGame: () => void; onOnlineGame: () => void } = $props();

  let bgCanvas: HTMLCanvasElement | undefined = $state(undefined);

  const HEX_SIZE = 30;
  const FIXED_CAMERA: Camera = { x: 0, y: 0, zoom: 1.0 };

  function drawDecorativeGrid() {
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = bgCanvas.clientWidth;
    const height = bgCanvas.clientHeight;

    bgCanvas.width = width * dpr;
    bgCanvas.height = height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Apply camera transform
    ctx.setTransform(
      FIXED_CAMERA.zoom * dpr, 0,
      0, FIXED_CAMERA.zoom * dpr,
      FIXED_CAMERA.x * FIXED_CAMERA.zoom * dpr,
      FIXED_CAMERA.y * FIXED_CAMERA.zoom * dpr,
    );

    const hexes = getVisibleHexes(FIXED_CAMERA, width, height, HEX_SIZE);

    // Get grid color from CSS custom property
    const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--color-grid').trim() || 'rgba(255, 255, 255, 0.12)';

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let i = 0; i < hexes.length; i++) {
      const center = hexToPixel(hexes[i], HEX_SIZE);
      const corners = hexCorners(center, HEX_SIZE);
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let j = 1; j < 6; j++) {
        ctx.lineTo(corners[j].x, corners[j].y);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }

  $effect(() => {
    if (bgCanvas) {
      drawDecorativeGrid();
    }
  });
</script>

<div class="landing-page">
  <canvas
    class="bg-canvas"
    bind:this={bgCanvas}
  ></canvas>
  <div class="content">
    <h1 class="title">Hex Connect6</h1>
    <p class="tagline">Connect 6 on a hex grid</p>
    <p class="rules">X places 1 stone first, then players alternate placing 2. First to 6 in a row along any axis wins.</p>
    <div class="buttons">
      <button class="cta-button" onclick={onLocalGame}>Local Game</button>
      <button class="cta-button" onclick={onOnlineGame}>Online Game</button>
    </div>
  </div>
</div>

<style>
  .landing-page {
    position: relative;
    width: 100%;
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .bg-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    opacity: 0.5;
  }

  .content {
    position: relative;
    z-index: 1;
    max-width: 400px;
    width: 100%;
    padding: 0 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .title {
    font-size: 36px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--color-text);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 8px 0;
  }

  .tagline {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
    margin: 0 0 24px 0;
  }

  .rules {
    font-size: 16px;
    font-weight: 400;
    line-height: 1.5;
    color: var(--color-text-muted);
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 320px;
    margin: 0 0 32px 0;
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }

  .cta-button {
    width: 100%;
    min-height: 44px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 600;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--color-button-bg);
    color: var(--color-button-text);
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cta-button:hover {
    background: var(--color-button-hover);
  }
</style>
