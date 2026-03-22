# Phase 1: Hex Grid Engine - Research

**Researched:** 2026-03-21
**Domain:** Hex grid rendering, canvas pan/zoom, viewport culling
**Confidence:** HIGH

## Summary

This phase implements a navigable infinite hex grid on HTML5 Canvas with pan, zoom, and hover feedback. The core challenge is rendering an unbounded pointy-top hex grid efficiently with smooth camera controls.

The hex math is well-documented via Red Blob Games and is straightforward to implement directly. The honeycomb-grid library (v4.1.5) requires pre-populating all hexes in a Grid object and its `pointToHex` only returns hexes that already exist in the grid -- making it a poor fit for an infinite/unbounded grid where hexes are computed on-the-fly from viewport bounds. **Recommendation: hand-roll hex math using Red Blob Games formulas** rather than fighting honeycomb-grid's finite-grid model.

The canvas rendering pattern uses a camera state `{x, y, zoom}` applied via `ctx.setTransform()`, with a `requestAnimationFrame` render loop. Svelte 5's `$effect` tracks reactive state changes but fires via microtask (not synced to animation frames), so the correct pattern is: use `$effect` to set a "dirty" flag when state changes, and a rAF loop that checks the flag and redraws.

**Primary recommendation:** Hand-roll hex coordinate math (Red Blob Games formulas), implement camera transform with `ctx.setTransform`, compute visible hex range from viewport bounds each frame, and use a rAF render loop with Svelte reactive state for game data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Pointy-top hex orientation (vertex pointing up)
- **D-02:** Subtle outlines on each hex cell showing grid structure
- **D-03:** Placed pieces render as X and O marks with distinct colors (not filled circles or filled hexes -- true to tic-tac-toe identity)
- **D-04:** Grid hex outlines fade to transparent near viewport edges, implying infinite extent beyond
- **D-05:** Zoom anchored to cursor position (Google Maps style -- zoom toward/away from mouse pointer)
- **D-06:** Moderate zoom range -- zoom out to ~50 hexes visible, zoom in to ~10 hexes filling screen
- **D-07:** At far zoom levels, simplify rendering -- hexes become simple colored dots, X/O marks hidden for performance and readability
- **D-08:** Game starts centered on hex (0,0) at default zoom level, grid extends in all directions
- **D-09:** No explicit "empty state" -- grid is always visible from the start
- **D-10:** Axial coordinates (q, r) per Red Blob Games standard, with implicit s = -q - r
- **D-11:** Coordinate display hidden by default, toggleable via keyboard shortcut (debug mode for power users)

### Claude's Discretion
- Exact hex size in pixels at default zoom
- Fade gradient implementation for viewport edges
- Specific zoom level thresholds for LOD transitions
- Keyboard shortcut choice for debug coordinate toggle
- Hover preview visual treatment (color, opacity, animation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRID-01 | Hex grid rendered on HTML5 Canvas using axial coordinates (q, r) | Red Blob Games hex-to-pixel formulas for pointy-top; hand-rolled hex math module |
| GRID-02 | Grid is unbounded -- pieces can be placed at any hex position | No pre-allocated grid; compute visible hexes from viewport bounds per frame |
| GRID-03 | Only hexes within the visible viewport are rendered (viewport culling) | Convert viewport corners to axial coords, iterate rectangular hex range with padding |
| GRID-04 | User can pan the board by click-dragging (desktop) or touch-dragging (mobile) | Camera state + mouse/touch event handlers; delta-based panning |
| GRID-05 | User can zoom in/out via scroll wheel (desktop) or pinch gesture (mobile) | Cursor-anchored zoom via screen-to-world transform adjustment; zoom min/max clamping |
| GRID-06 | Hex under cursor/finger shows hover preview of current player's stone color | Screen-to-world point conversion + pixel-to-hex rounding algorithm |
</phase_requirements>

## Standard Stack

### Core (already decided in project stack)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | 5.54.x | UI framework, reactive state | Project constraint; $state/$derived drive game state |
| Vite | 8.0.x | Build tool | Project constraint; scaffolded via svelte-ts template |
| TypeScript | 5.x | Type safety | Hex coordinate math benefits from typed interfaces |
| HTML5 Canvas 2D | native | Hex grid rendering | Project constraint; direct ctx API for geometry |

### Supporting (for this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.x | Unit testing | Test hex math functions (coordinate conversion, rounding, viewport range) |

### NOT Using: honeycomb-grid
| Instead of | Use | Reason |
|------------|-----|--------|
| honeycomb-grid Grid class | Hand-rolled hex math | honeycomb-grid requires pre-populating all hexes; `getHex()` returns undefined for missing hexes; `pointToHex()` only finds hexes in the grid. Infinite grid needs on-the-fly computation. The hex math itself is ~80 lines of well-documented formulas from Red Blob Games. |

**Rationale:** honeycomb-grid v4.1.5 is designed for finite, pre-defined grids. Its `Grid` constructor takes a traverser (e.g., `rectangle({ width: 10, height: 10 })`) that pre-creates all hexes. For an infinite grid where we compute visible hexes from camera viewport each frame, carrying a library that fights the architecture is worse than 80 lines of typed hex math. The standalone `pointToCube` function exists but using the library just for that adds unnecessary dependency.

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    hex/
      types.ts          # HexCoord, Camera, Point interfaces
      math.ts           # Hex geometry: hex-to-pixel, pixel-to-hex, neighbors, distance
      viewport.ts       # Compute visible hex range from camera + canvas size
    render/
      renderer.ts       # Canvas rendering: draw hex, draw grid, apply camera transform
      camera.ts         # Camera state, pan/zoom logic, screen<->world conversion
      effects.ts        # Edge fade, hover highlight, LOD thresholds
    state/
      grid-state.svelte.ts  # Svelte 5 reactive state ($state for camera, hover, pieces)
  components/
    HexCanvas.svelte    # Main canvas component, event handlers, rAF loop
    DebugOverlay.svelte # Coordinate display toggle (D-11)
  App.svelte            # Root component
  main.ts               # Entry point
```

### Pattern 1: Camera Transform
**What:** Represent the camera as `{x, y, zoom}` and apply it via `ctx.setTransform()` before drawing.
**When to use:** Every frame, before any drawing calls.
**Example:**
```typescript
// Source: Steve Ruiz "Creating a Zoom UI" + Harrison Milbradt "Canvas Pan/Zoom"
interface Camera {
  x: number;  // world-space offset
  y: number;
  zoom: number;  // 1.0 = default
}

function applyCamera(ctx: CanvasRenderingContext2D, camera: Camera): void {
  ctx.setTransform(camera.zoom, 0, 0, camera.zoom, camera.x * camera.zoom, camera.y * camera.zoom);
}

function screenToWorld(screenPoint: Point, camera: Camera): Point {
  return {
    x: (screenPoint.x - camera.x * camera.zoom) / camera.zoom,
    y: (screenPoint.y - camera.y * camera.zoom) / camera.zoom,
  };
  // Simplified: screenToWorld = { x: screenX / zoom - camX, y: screenY / zoom - camY }
}

function worldToScreen(worldPoint: Point, camera: Camera): Point {
  return {
    x: (worldPoint.x + camera.x) * camera.zoom,
    y: (worldPoint.y + camera.y) * camera.zoom,
  };
}
```

### Pattern 2: Cursor-Anchored Zoom (D-05)
**What:** When zooming, the world point under the cursor stays fixed on screen.
**When to use:** On wheel events.
**Example:**
```typescript
// Source: Steve Ruiz "Creating a Zoom UI"
function zoomAtPoint(camera: Camera, screenPoint: Point, zoomDelta: number): Camera {
  const newZoom = clamp(camera.zoom * (1 - zoomDelta), ZOOM_MIN, ZOOM_MAX);
  // Convert cursor to world coords before and after zoom
  const worldBefore = screenToWorld(screenPoint, camera);
  const worldAfter = screenToWorld(screenPoint, { ...camera, zoom: newZoom });
  return {
    x: camera.x + (worldAfter.x - worldBefore.x),
    y: camera.y + (worldAfter.y - worldBefore.y),
    zoom: newZoom,
  };
}
```

### Pattern 3: Viewport Culling (GRID-03)
**What:** Each frame, compute which hex coordinates are visible and only draw those.
**When to use:** In the render loop, before iterating hexes.
**Example:**
```typescript
// Source: Red Blob Games hex grid guide - range/rectangle iteration
function getVisibleHexes(camera: Camera, canvasWidth: number, canvasHeight: number, hexSize: number): HexCoord[] {
  // Convert all 4 viewport corners to world coordinates
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera);
  const bottomRight = screenToWorld({ x: canvasWidth, y: canvasHeight }, camera);

  // Convert world corners to fractional hex coordinates
  const hexTL = pixelToHex(topLeft, hexSize);
  const hexBR = pixelToHex(bottomRight, hexSize);

  // Iterate rectangular range with padding (+1 hex on each side)
  const hexes: HexCoord[] = [];
  for (let q = Math.floor(hexTL.q) - 1; q <= Math.ceil(hexBR.q) + 1; q++) {
    for (let r = Math.floor(hexTL.r) - 1; r <= Math.ceil(hexBR.r) + 1; r++) {
      hexes.push({ q, r });
    }
  }
  return hexes;
}
```

### Pattern 4: rAF Render Loop with Svelte Reactive State
**What:** Use `requestAnimationFrame` for smooth rendering; use Svelte `$state` for game data; bridge them with a dirty flag.
**When to use:** In the HexCanvas component.
**Why not pure $effect:** `$effect` fires via microtask, not synced to animation frames. Rapidly changing state (mouse move during pan) can trigger 100+ redraws per second, causing jank. A rAF loop naturally throttles to 60fps.
**Example:**
```svelte
<script lang="ts">
  let canvas: HTMLCanvasElement;
  let camera = $state<Camera>({ x: 0, y: 0, zoom: 1.0 });
  let hoveredHex = $state<HexCoord | null>(null);
  let needsRedraw = $state(true);

  // Mark dirty when reactive state changes
  $effect(() => {
    // Touch reactive dependencies to track them
    camera; hoveredHex;
    needsRedraw = true;
  });

  // rAF render loop
  $effect(() => {
    let animationId: number;
    const loop = () => {
      if (needsRedraw) {
        render(canvas, camera, hoveredHex);
        needsRedraw = false;
      }
      animationId = requestAnimationFrame(loop);
    };
    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  });
</script>
```

### Anti-Patterns to Avoid
- **Drawing inside $effect directly:** Fires via microtask, not vsync-aligned. Use rAF loop instead.
- **Pre-allocating hex objects for visible area:** Creates GC pressure. Compute hex coords as simple `{q, r}` structs, don't instantiate class objects.
- **Using ctx.save()/ctx.restore() per hex:** Expensive at scale. Use `setTransform()` once, draw all hexes, then reset.
- **Clearing with `clearRect` in transformed space:** Always reset transform before clearing: `ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,w,h);`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex geometry math | N/A -- DO hand-roll this | Red Blob Games formulas (~80 lines) | Well-documented, simple, perfectly fits infinite grid model |
| Canvas framework abstraction | Don't build a generic canvas lib | Direct Canvas 2D API calls | Hex rendering is simple geometry; abstraction adds overhead |
| State management | Don't use external state lib | Svelte 5 runes ($state, $derived) | Native to the framework, zero overhead |
| Touch gesture detection | Don't hand-roll pinch-to-zoom math | Defer to Phase 3 (UI-06, UI-07) | Out of scope for Phase 1; desktop mouse events only |

**Key insight:** For this phase, the hex math IS the thing to hand-roll (it's the core domain), while everything else should use the simplest possible implementation (native canvas, native Svelte state, native browser events).

## Common Pitfalls

### Pitfall 1: Wrong Hex-to-Pixel Formula for Pointy-Top
**What goes wrong:** Using flat-top formulas for pointy-top hexes produces a rotated grid.
**Why it happens:** Red Blob Games documents both orientations; easy to copy the wrong one.
**How to avoid:** Pointy-top hex-to-pixel:
```
x = size * (sqrt(3) * q + sqrt(3)/2 * r)
y = size * (3/2 * r)
```
Flat-top is different. Verify orientation visually in first render.
**Warning signs:** Hexes appear rotated 30 degrees from expected.

### Pitfall 2: Pixel-to-Hex Rounding Errors
**What goes wrong:** Naive rounding of fractional hex coords picks the wrong hex near edges.
**Why it happens:** Simple `Math.round()` on q and r doesn't maintain the constraint q + r + s = 0.
**How to avoid:** Always use cube_round algorithm:
```typescript
function cubeRound(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  // else rs = -rq - rr (not needed since we only return q, r)
  return { q: rq, r: rr };
}
```
**Warning signs:** Hovering near hex borders causes flicker between two hexes.

### Pitfall 3: Zoom Anchor Math Ordering
**What goes wrong:** Zoom doesn't anchor to cursor -- grid slides during zoom.
**Why it happens:** Computing new camera position before or after applying zoom incorrectly.
**How to avoid:** The correct sequence is: (1) convert cursor to world-space with OLD zoom, (2) compute new zoom, (3) convert cursor to world-space with NEW zoom, (4) adjust camera by the difference.
**Warning signs:** Zooming in makes the grid "drift" away from the cursor position.

### Pitfall 4: Canvas DPI / Retina Scaling
**What goes wrong:** Hexes look blurry on high-DPI displays (Retina, 4K).
**Why it happens:** Canvas pixel buffer doesn't match CSS display size.
**How to avoid:**
```typescript
const dpr = window.devicePixelRatio || 1;
canvas.width = canvas.clientWidth * dpr;
canvas.height = canvas.clientHeight * dpr;
ctx.scale(dpr, dpr);
```
**Warning signs:** Grid lines appear fuzzy or anti-aliased excessively.

### Pitfall 5: Viewport Culling Off-by-One
**What goes wrong:** Hexes at viewport edges pop in/out visibly during pan.
**Why it happens:** Not adding padding to the visible hex range.
**How to avoid:** Add +1 (or +2) hex padding on all sides of the computed visible range. The cost of drawing a few extra off-screen hexes is negligible.
**Warning signs:** Hexes appear/disappear at screen edges during smooth panning.

### Pitfall 6: Edge Fade Effect Breaking Camera Transform
**What goes wrong:** Fade effect (D-04) drawn in world space moves with the camera instead of staying at viewport edges.
**Why it happens:** Drawing the fade gradient while the camera transform is active.
**How to avoid:** Reset transform to screen space before drawing the edge fade overlay. Draw it as a fixed screen-space gradient on top of the hex grid.
**Warning signs:** Fade effect pans with the grid instead of staying at screen edges.

## Code Examples

### Hex Geometry (Pointy-Top)
```typescript
// Source: Red Blob Games https://www.redblobgames.com/grids/hexagons/
const SQRT3 = Math.sqrt(3);

interface HexCoord { q: number; r: number; }
interface Point { x: number; y: number; }

/** Convert axial hex coordinate to pixel center (pointy-top) */
function hexToPixel(hex: HexCoord, size: number): Point {
  return {
    x: size * (SQRT3 * hex.q + SQRT3 / 2 * hex.r),
    y: size * (1.5 * hex.r),
  };
}

/** Convert pixel to fractional axial hex coordinate (pointy-top) */
function pixelToHex(point: Point, size: number): { q: number; r: number } {
  const q = (SQRT3 / 3 * point.x - 1 / 3 * point.y) / size;
  const r = (2 / 3 * point.y) / size;
  return { q, r };
}

/** Round fractional hex coords to nearest hex (cube rounding) */
function hexRound(q: number, r: number): HexCoord {
  const s = -q - r;
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  return { q: rq, r: rr };
}

/** Get 6 corner points of a pointy-top hex */
function hexCorners(center: Point, size: number): Point[] {
  const corners: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i - 30; // pointy-top: start at -30 degrees
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: center.x + size * Math.cos(angleRad),
      y: center.y + size * Math.sin(angleRad),
    });
  }
  return corners;
}

/** Axial neighbor direction vectors */
const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
```

### Drawing a Single Hex
```typescript
function drawHex(ctx: CanvasRenderingContext2D, center: Point, size: number, strokeColor: string, fillColor?: string): void {
  const corners = hexCorners(center, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}
```

### Edge Fade Overlay (D-04)
```typescript
// Draw AFTER resetting camera transform to screen space
function drawEdgeFade(ctx: CanvasRenderingContext2D, width: number, height: number, fadeSize: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to screen space

  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, fadeSize);
  topGrad.addColorStop(0, 'rgba(background, 1)');  // match page background
  topGrad.addColorStop(1, 'rgba(background, 0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, fadeSize);

  // Repeat for bottom, left, right edges...
}
```

## Discretionary Recommendations

These items were marked as Claude's discretion in CONTEXT.md:

| Item | Recommendation | Rationale |
|------|---------------|-----------|
| Hex size at default zoom | **30px** (radius/size parameter) | Width = sqrt(3)*30 = ~52px. At default zoom, fits ~20-25 hexes across a 1280px viewport -- balanced between D-06 constraints. |
| Fade gradient size | **60-80px** from each edge | ~2-3 hex widths. Subtle but clearly implies continuation. Use CSS background color as the fade-to color. |
| LOD transition threshold | **zoom < 0.4** for dot mode | When hexes are < ~20px wide, outlines merge visually. Switch to filled circles of ~3px radius. |
| Debug coordinate toggle | **Ctrl+D** (or **Cmd+D** on Mac) | Common debug shortcut convention. Show "(q, r)" text at hex center in small font. |
| Hover preview | **Semi-transparent fill (opacity 0.3)** of current player's color | Light, non-distracting. No animation needed -- instant on mousemove. Disappears when cursor leaves hex. |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| honeycomb-grid for all hex needs | Hand-roll for infinite grids | Always true for unbounded grids | honeycomb-grid is for finite pre-defined grids |
| ctx.save()/ctx.restore() per object | ctx.setTransform() once per frame | Performance best practice | Significant perf gain at 1000+ hexes |
| Svelte stores (writable/readable) | Svelte 5 $state/$derived runes | Svelte 5 (Oct 2024) | Simpler reactive patterns, fine-grained reactivity |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | None -- see Wave 0 |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRID-01 | Hex-to-pixel produces correct coords for pointy-top | unit | `npx vitest run src/lib/hex/math.test.ts -t "hexToPixel"` | No -- Wave 0 |
| GRID-01 | Pixel-to-hex round-trips correctly | unit | `npx vitest run src/lib/hex/math.test.ts -t "pixelToHex"` | No -- Wave 0 |
| GRID-02 | Any arbitrary (q,r) coordinate can be converted and rendered | unit | `npx vitest run src/lib/hex/math.test.ts -t "arbitrary"` | No -- Wave 0 |
| GRID-03 | Viewport culling returns correct hex range for given camera | unit | `npx vitest run src/lib/hex/viewport.test.ts` | No -- Wave 0 |
| GRID-04 | Pan updates camera position by mouse delta | unit | `npx vitest run src/lib/render/camera.test.ts -t "pan"` | No -- Wave 0 |
| GRID-05 | Zoom anchors to cursor position correctly | unit | `npx vitest run src/lib/render/camera.test.ts -t "zoom"` | No -- Wave 0 |
| GRID-06 | Mouse position converts to correct hovered hex | unit | `npx vitest run src/lib/hex/math.test.ts -t "hexRound"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- vitest configuration (may come with Vite template)
- [ ] `src/lib/hex/math.test.ts` -- covers GRID-01, GRID-02, GRID-06
- [ ] `src/lib/hex/viewport.test.ts` -- covers GRID-03
- [ ] `src/lib/render/camera.test.ts` -- covers GRID-04, GRID-05

## Open Questions

1. **Vite 8 + Svelte plugin compatibility**
   - What we know: Vite 8.0.1 is current, Svelte 5.54.1 is current. STATE.md flags this as a blocker.
   - What's unclear: Whether `@sveltejs/vite-plugin-svelte` has a version compatible with Vite 8 (Rolldown).
   - Recommendation: Attempt Vite 8 first during project scaffolding. If plugin errors occur, pin Vite 7.x. This is a Wave 0 / scaffolding concern, not a hex-grid-engine concern.

2. **Touch events (mobile)**
   - What we know: GRID-04 and GRID-05 mention mobile (touch-drag, pinch). But CONTEXT.md and the broader plan scope this to Phase 3 (UI-06, UI-07).
   - Recommendation: Phase 1 implements mouse events only (mousedown/mousemove/mouseup for pan, wheel for zoom). Touch is deferred. Design event handlers to be extensible for touch later.

## Sources

### Primary (HIGH confidence)
- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) -- Hex geometry formulas, axial coordinates, pixel conversion, cube rounding, neighbor offsets
- [Steve Ruiz: Creating a Zoom UI](https://www.steveruiz.me/posts/zoom-ui) -- Camera state pattern, screen/world coordinate conversion, cursor-anchored zoom
- [Svelte $effect docs](https://svelte.dev/docs/svelte/$effect) -- Effect lifecycle, cleanup, canvas rendering pattern, async tracking limitation

### Secondary (MEDIUM confidence)
- [honeycomb-grid API docs](https://abbekeultjes.nl/honeycomb/) -- Grid class methods, defineHex API, pointToHex limitations
- [Harrison Milbradt: Canvas Panning and Zooming](https://harrisonmilbradt.com/blog/canvas-panning-and-zooming) -- setTransform pattern, mouse event handling for pan/zoom

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- project constraints are clear, hand-rolled hex math is well-documented
- Architecture: HIGH -- camera transform and viewport culling are established patterns with authoritative sources
- Pitfalls: HIGH -- all pitfalls sourced from Red Blob Games documentation and canvas rendering best practices

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain, no fast-moving dependencies)
