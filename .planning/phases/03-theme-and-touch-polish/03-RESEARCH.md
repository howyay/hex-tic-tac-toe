# Phase 3: Theme and Touch Polish - Research

**Researched:** 2026-03-22
**Domain:** CSS theming, Canvas color parameterization, touch gesture handling
**Confidence:** HIGH

## Summary

Phase 3 has two orthogonal workstreams: (1) a light/dark theme system, and (2) touch gesture handling (tap, drag, pinch). The UI-SPEC is exceptionally detailed -- it specifies every color token, every CSS variable, every touch threshold, and the exact TypeScript interface for theme colors passed to canvas renderers. The research confirms that this work is entirely achievable with the existing stack (Svelte 5 runes, native Canvas 2D, CSS custom properties) with no new dependencies.

The theme work is a systematic refactor: extract hardcoded colors into a `ThemeColors` object, thread that object through all render functions, define CSS custom properties for DOM components, and wire a toggle with localStorage persistence. The touch work is additive: new `touchstart`/`touchmove`/`touchend` handlers on the canvas element, using the existing `panCamera` and `zoomAtPoint` functions from `camera.ts`.

**Primary recommendation:** Implement theme infrastructure first (colors object, CSS variables, toggle), then refactor all renderers and components to consume theme colors, then add touch handlers as a separate concern. This ordering avoids interleaving two unrelated changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Light theme background is warm off-white (cream/beige tone -- easy on the eyes, paper-like feel)
- **D-02:** Grid outlines in light mode are light gray -- mirrors the subtle white-on-dark approach
- **D-03:** Player colors slightly adjusted for contrast in light mode -- darker variants of X blue and O red for readability on light background
- **D-04:** Overlays (turn indicator pill, game over overlay, move counter) adapt colors to match each theme
- **D-05:** Theme toggle positioned in the top-right corner -- small, out of the way, always accessible
- **D-06:** Sun/moon icon toggle -- switches between sun (light mode) and moon (dark mode), universally understood
- **D-07:** Theme preference persisted in localStorage
- **D-08:** Default to dark theme on first visit (current behavior)
- **D-09:** Quick tap (<200ms, minimal movement) places a stone. Longer press or any drag = pan.
- **D-10:** Pinch-to-zoom is standard map-like -- zooms toward center of two fingers, smooth and continuous
- **D-11:** Touch drag for panning -- single finger drag detected by movement threshold, no conflict with tap

### Claude's Discretion
- Exact warm off-white hex color value
- Exact darkened player color variants for light mode
- Touch movement threshold for tap vs drag discrimination (suggested ~10px)
- Sun/moon icon implementation (SVG vs Unicode)
- Edge fade gradient colors per theme
- Overlay backdrop and text colors per theme
- Whether theme transition is instant or has a brief CSS transition

### Deferred Ideas (OUT OF SCOPE)
- Auto theme detection from system preference (prefers-color-scheme) -- backlog for future polish
- Theme-aware favicon
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-04 | Light and dark theme toggle | Theme state module with `$state`, ThemeToggle component, CSS custom properties, ThemeColors canvas object |
| UI-05 | Theme preference persisted in localStorage | `createThemeState()` factory reads/writes `localStorage.getItem('theme')` / `setItem('theme', ...)` |
| UI-06 | Touch-friendly: tap to place stone on mobile | Touch event handlers with 200ms/10px tap discrimination, `touchend` triggers same hex resolution as mouse click |
| UI-07 | Touch gestures: drag to pan, pinch to zoom -- distinct from tap-to-place | Single-finger drag reuses `panCamera()`, two-finger pinch computes scale ratio and reuses `zoomAtPoint()` |
| UI-08 | Minimal, clean aesthetic -- board and status only, no clutter | Theme toggle is minimal (transparent button, 32px with 16px icon), no new visual elements beyond the toggle |
</phase_requirements>

## Standard Stack

### Core
No new dependencies. Phase 3 uses only what is already installed.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | 5.54.x | `$state` for theme, `$derived` for theme colors, `$effect` for localStorage sync | Already installed |
| CSS Custom Properties | N/A | DOM component theming via `[data-theme]` selectors | Native browser API, zero overhead |
| Canvas 2D API | N/A | Render functions accept `ThemeColors` object | Already in use |
| Touch Events API | N/A | `touchstart`, `touchmove`, `touchend` on canvas | Native browser API, universal support |

### Supporting
None needed. No new packages.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CSS custom properties | Svelte store + inline styles | CSS vars are simpler, work with scoped `<style>`, no prop drilling for DOM components |
| Manual touch event handling | Hammer.js / use-gesture | Overkill -- we need exactly 3 gestures (tap, drag, pinch) with simple thresholds. A library adds bundle size and abstraction for no benefit. |
| `data-theme` attribute | CSS class toggle | Attribute selectors are equally performant and more semantic. Either works. |

## Architecture Patterns

### Recommended Project Structure (new files)
```
src/
  lib/
    theme/
      colors.ts              # ThemeColors type, DARK_THEME, LIGHT_THEME objects
      theme-state.svelte.ts  # createThemeState() factory with localStorage sync
  components/
    ThemeToggle.svelte        # Sun/moon icon button
```

### Pattern 1: Theme State Factory
**What:** A `createThemeState()` function that returns reactive theme state with localStorage persistence.
**When to use:** Single source of truth for theme, created in App.svelte.
**Example:**
```typescript
// src/lib/theme/theme-state.svelte.ts
export type Theme = 'dark' | 'light';

export function createThemeState() {
  const stored = localStorage.getItem('theme') as Theme | null;
  let theme = $state<Theme>(stored ?? 'dark');

  // Sync to DOM and localStorage
  $effect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  });

  return {
    get theme() { return theme; },
    toggle() { theme = theme === 'dark' ? 'light' : 'dark'; },
  };
}
```

### Pattern 2: Static Theme Color Objects for Canvas
**What:** Two plain objects (`DARK_THEME`, `LIGHT_THEME`) conforming to `ThemeColors` interface. The renderer receives the current one by reference.
**When to use:** Canvas cannot read CSS custom properties. The renderer needs a plain object.
**Example:**
```typescript
// src/lib/theme/colors.ts
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
// LIGHT_THEME follows same structure with UI-SPEC values
```

### Pattern 3: Touch Gesture Discrimination
**What:** A single set of `touchstart`/`touchmove`/`touchend` handlers that discriminate between tap (place stone), drag (pan), and pinch (zoom) using time and distance thresholds.
**When to use:** On the canvas element, alongside existing mouse handlers.
**Key state tracked:**
- `touchStartTime`: timestamp of `touchstart`
- `touchStartPos`: `{x, y}` of first finger
- `touchMoved`: cumulative pixel movement
- `initialPinchDistance`: distance between two fingers at pinch start
- `lastPinchMidpoint`: for simultaneous pan during pinch
- `activeTouchId`: `touch.identifier` of the primary finger

### Pattern 4: Render Function Signature Refactor
**What:** Add `colors: ThemeColors` parameter to `render()`, `drawGrid()`, `drawEdgeFade()`, `drawX()`, `drawO()`, `drawRejectionFlash()`, etc. Remove all module-level color constants.
**When to use:** Every render function that currently has hardcoded colors.

### Anti-Patterns to Avoid
- **Reading CSS vars from canvas:** Canvas 2D context cannot read `var(--color-bg)`. Always pass a ThemeColors object.
- **Separate touch and mouse code paths for the same logic:** The hex resolution and stone placement logic is identical. Touch handlers should call the same `screenToWorld` + `pixelToHex` + `hexRound` pipeline.
- **Using `touchstart` clientX/clientY directly without canvas offset:** Must compute canvas-relative coordinates using `canvas.getBoundingClientRect()`.
- **Forgetting `preventDefault()` on touch events:** Without it, the browser will scroll/zoom the page instead of the canvas.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence | Custom serialization | `localStorage.getItem/setItem` with simple string | Theme is a single string value, no need for anything complex |
| Touch coordinate conversion | Custom touch-to-canvas math | `canvas.getBoundingClientRect()` + `touch.clientX - rect.left` | Standard approach, handles scrolled/positioned canvases correctly |
| Pinch distance calculation | Complex geometry | `Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)` | Two-point distance is trivial with `Math.hypot` |

## Common Pitfalls

### Pitfall 1: Touch Events Fire Mouse Events Too
**What goes wrong:** On mobile, a tap fires both `touchend` AND `mouseup`/`click`, causing double stone placement.
**Why it happens:** Browsers synthesize mouse events from touch for backward compatibility.
**How to avoid:** Call `e.preventDefault()` in `touchstart` handler. This suppresses the synthesized mouse events. The UI-SPEC already specifies this (line: "touchstart calls preventDefault() to suppress 300ms click delay and prevent scroll").
**Warning signs:** Stones placed twice per tap, or taps registering with a 300ms delay.

### Pitfall 2: Pinch Zoom Conflicts with Browser Zoom
**What goes wrong:** Two-finger pinch zooms the browser page instead of the game canvas.
**Why it happens:** Default browser behavior for pinch on a page.
**How to avoid:** Call `e.preventDefault()` on `touchmove` when `touches.length >= 2`. Also set `touch-action: none` CSS on the canvas element to disable browser touch handling.
**Warning signs:** The whole page zooms, or zoom fights between browser and game.

### Pitfall 3: Canvas getBoundingClientRect During Touch
**What goes wrong:** Touch coordinates are in viewport space (`clientX/clientY`), but the canvas might not be at (0,0) if there are margins or scrolling.
**Why it happens:** Unlike `offsetX/offsetY` on mouse events, touch events don't provide offset coordinates.
**How to avoid:** Always compute: `const rect = canvas.getBoundingClientRect(); const x = touch.clientX - rect.left; const y = touch.clientY - rect.top;`
**Warning signs:** Taps register on the wrong hex, offset from where the finger touched.

### Pitfall 4: Theme Flash on Page Load
**What goes wrong:** Page loads with dark theme CSS, then JavaScript reads localStorage and switches to light, causing a visible flash.
**Why it happens:** CSS loads before JS executes.
**How to avoid:** Add a tiny inline `<script>` in `index.html` (before any stylesheets) that reads localStorage and sets `data-theme` on `<html>` immediately. This runs synchronously before the first paint.
**Warning signs:** Brief dark flash when user has light theme selected.

### Pitfall 5: Losing Touch Identifier During Multi-Touch
**What goes wrong:** When one finger lifts during a pinch, the remaining touch events reference a different `touch.identifier`, causing pan to jump.
**Why it happens:** The `touches` list reindexes when a finger is removed.
**How to avoid:** Always track touches by `identifier`, not by index in the `touches` array. On `touchend`, check which identifier was removed and reset state accordingly.
**Warning signs:** Jerky camera jumps when transitioning from pinch back to single-finger pan.

### Pitfall 6: CSS Custom Properties Not Cascading into Scoped Svelte Styles
**What goes wrong:** `var(--color-text)` returns the initial value or is undefined inside scoped `<style>` blocks.
**Why it happens:** This does NOT actually happen -- CSS custom properties cascade through the DOM regardless of Svelte scoping. The pitfall is believing this is a problem and over-engineering a workaround.
**How to avoid:** Simply use `var(--color-text)` in scoped styles. Svelte's scoping adds class selectors but does not prevent CSS variable inheritance. Verified: CSS custom properties defined on `:root` or `[data-theme]` are accessible in all components.
**Warning signs:** None -- this just works.

## Code Examples

### Touch Event Handler Structure (Canvas)
```typescript
// In HexCanvas.svelte <script>
let touchStartTime = 0;
let touchStartX = 0;
let touchStartY = 0;
let touchMoved = 0;
let activeTouchId: number | null = null;
let initialPinchDist = 0;
let lastPinchMidX = 0;
let lastPinchMidY = 0;

const TOUCH_TAP_TIME = 200;    // ms
const TOUCH_TAP_DIST = 10;     // px cumulative

function handleTouchStart(e: TouchEvent) {
  e.preventDefault(); // suppress mouse events + 300ms delay

  if (e.touches.length === 1) {
    const t = e.touches[0];
    activeTouchId = t.identifier;
    touchStartTime = performance.now();
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchMoved = 0;
  } else if (e.touches.length === 2) {
    // Pinch start
    const [t1, t2] = [e.touches[0], e.touches[1]];
    initialPinchDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    lastPinchMidX = (t1.clientX + t2.clientX) / 2;
    lastPinchMidY = (t1.clientY + t2.clientY) / 2;
    activeTouchId = null; // cancel any tap/drag
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    e.preventDefault(); // prevent browser pinch zoom
    const [t1, t2] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    const midX = (t1.clientX + t2.clientX) / 2;
    const midY = (t1.clientY + t2.clientY) / 2;

    // Zoom: ratio of current distance to initial distance
    const scale = dist / initialPinchDist;
    const rect = canvas.getBoundingClientRect();
    const canvasPoint = { x: midX - rect.left, y: midY - rect.top };
    // Convert scale ratio to a zoomDelta compatible with zoomAtPoint
    const zoomDelta = 1 - scale;
    state.camera = zoomAtPoint(state.camera, canvasPoint, zoomDelta);
    initialPinchDist = dist; // reset for next frame's delta

    // Pan: midpoint translation
    const panDx = midX - lastPinchMidX;
    const panDy = midY - lastPinchMidY;
    state.camera = panCamera(state.camera, panDx, panDy);
    lastPinchMidX = midX;
    lastPinchMidY = midY;
  } else if (e.touches.length === 1 && activeTouchId !== null) {
    const t = e.touches[0];
    if (t.identifier !== activeTouchId) return;
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    touchMoved += Math.abs(dx) + Math.abs(dy);

    if (touchMoved > TOUCH_TAP_DIST) {
      // Pan
      state.camera = panCamera(state.camera, dx, dy);
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }
  }
}

function handleTouchEnd(e: TouchEvent) {
  if (activeTouchId === null) return;
  const elapsed = performance.now() - touchStartTime;

  if (elapsed < TOUCH_TAP_TIME && touchMoved < TOUCH_TAP_DIST && gameState.status === 'playing') {
    // Tap -> place stone
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
```

### Inline Script for Theme Flash Prevention
```html
<!-- In index.html, before any stylesheets or <link> tags -->
<script>
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

### CSS Custom Properties Block
```css
/* In app.css */
[data-theme="dark"] {
  --color-bg: #1a1a2e;
  --color-grid: rgba(255, 255, 255, 0.12);
  --color-player-x: #4fc3f7;
  --color-player-o: #ef5350;
  --color-text: #ffffff;
  --color-text-muted: rgba(255, 255, 255, 0.6);
  --color-overlay-bg: rgba(0, 0, 0, 0.5);
  --color-gameover-bg: rgba(0, 0, 0, 0.7);
  --color-button-bg: #4fc3f7;
  --color-button-text: #1a1a2e;
  --color-button-hover: #81d4fa;
}

[data-theme="light"] {
  --color-bg: #f5f0e8;
  --color-grid: rgba(0, 0, 0, 0.10);
  --color-player-x: #0288d1;
  --color-player-o: #c62828;
  --color-text: #1a1a2e;
  --color-text-muted: rgba(0, 0, 0, 0.5);
  --color-overlay-bg: rgba(255, 255, 255, 0.7);
  --color-gameover-bg: rgba(245, 240, 232, 0.85);
  --color-button-bg: #0288d1;
  --color-button-text: #ffffff;
  --color-button-hover: #0277bd;
}
```

### ThemeToggle Component
```svelte
<script lang="ts">
  let { theme, onToggle }: { theme: 'dark' | 'light'; onToggle: () => void } = $props();
</script>

<button class="theme-toggle" aria-label="Toggle theme" onclick={onToggle}>
  {#if theme === 'dark'}
    <svg><!-- moon icon 16px --></svg>
  {:else}
    <svg><!-- sun icon 16px --></svg>
  {/if}
</button>

<style>
  .theme-toggle {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 32px;
    height: 32px;
    min-width: 44px;   /* touch target */
    min-height: 44px;  /* touch target */
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 10;
    color: var(--color-text-muted);
    padding: 0;
  }
  .theme-toggle:hover {
    color: var(--color-text);
  }
</style>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Media query only `prefers-color-scheme` | `data-theme` attribute + localStorage override | Standard practice 2023+ | User choice trumps system preference; both can coexist |
| Touch event libraries (Hammer.js) | Native Touch Events API | Hammer.js effectively unmaintained since 2020 | No dependency needed for simple gestures |
| Pointer Events for unified input | Touch Events for mobile + Mouse Events for desktop | Both valid; Touch Events give finer control for multi-touch | Pointer Events simplify single-pointer use but complicate pinch |

**Note on Pointer Events vs Touch Events:** Pointer Events unify mouse/touch/pen into one API, but for pinch-to-zoom you still need to track multiple pointers manually. Since HexCanvas already has mouse handlers and we need explicit multi-touch, adding Touch Events alongside mouse is simpler than rewriting everything to Pointer Events. This can be revisited in a future polish pass.

## Open Questions

1. **Canvas `touch-action` CSS property**
   - What we know: Setting `touch-action: none` on the canvas element prevents the browser from handling any touch gestures (scroll, zoom). The `preventDefault()` calls in touch handlers also help.
   - What's unclear: Whether `touch-action: none` alone is sufficient or if `preventDefault()` is also needed for all browsers.
   - Recommendation: Use both. Set `touch-action: none` on the canvas style AND call `preventDefault()` in handlers. Belt-and-suspenders approach costs nothing.

2. **Pinch zoom delta calculation**
   - What we know: The existing `zoomAtPoint` uses a `zoomDelta` that maps to `camera.zoom * (1 - zoomDelta)`. For scroll, `zoomDelta = e.deltaY * 0.001`.
   - What's unclear: The exact mapping from pinch scale ratio to `zoomDelta` -- the code example above resets `initialPinchDist` each frame to get per-frame deltas, which should work but needs testing for smoothness.
   - Recommendation: Implement the per-frame delta approach. If it feels jerky, switch to computing absolute zoom from initial zoom * cumulative scale ratio, clamped to min/max.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-04 | ThemeColors objects have correct values for both themes | unit | `npx vitest run src/lib/theme/colors.test.ts -x` | Wave 0 |
| UI-05 | createThemeState reads/writes localStorage correctly | unit | `npx vitest run src/lib/theme/theme-state.test.ts -x` | Wave 0 |
| UI-06 | Touch tap discrimination logic (time + distance thresholds) | unit | `npx vitest run src/lib/input/touch.test.ts -x` | Wave 0 |
| UI-07 | Pinch distance and midpoint calculations | unit | `npx vitest run src/lib/input/touch.test.ts -x` | Wave 0 |
| UI-08 | Visual cleanliness -- manual inspection | manual-only | N/A | N/A |

**Note:** Touch gesture handlers are tightly coupled to DOM events and canvas element. The tap/drag discrimination logic can be extracted into a pure function for unit testing (takes timestamps and positions, returns gesture type). Pinch math (distance, midpoint, scale ratio) is also pure math that can be unit tested. Full integration testing requires a browser environment.

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/theme/colors.test.ts` -- covers UI-04: validate DARK_THEME and LIGHT_THEME objects have all required keys and correct values
- [ ] `src/lib/theme/theme-state.test.ts` -- covers UI-05: test localStorage read/write (requires mocking localStorage in vitest node env)
- [ ] Touch gesture discrimination tests -- covers UI-06, UI-07: extract pure gesture logic into testable functions

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/render/renderer.ts`, `src/lib/render/effects.ts`, `src/lib/render/stones.ts`, `src/components/HexCanvas.svelte` -- current hardcoded colors and event handlers
- Phase 3 UI-SPEC: `.planning/phases/03-theme-and-touch-polish/03-UI-SPEC.md` -- complete color tokens, component inventory, interaction contract
- Phase 3 CONTEXT.md: `.planning/phases/03-theme-and-touch-polish/03-CONTEXT.md` -- locked decisions and discretion areas

### Secondary (MEDIUM confidence)
- MDN Touch Events API documentation -- standard browser API, well-documented
- MDN `touch-action` CSS property -- browser support is universal in modern browsers

### Tertiary (LOW confidence)
- None -- this phase uses only standard browser APIs with no external dependencies

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all native browser APIs
- Architecture: HIGH - UI-SPEC prescribes exact interfaces, file structure, and color values
- Pitfalls: HIGH - touch event pitfalls are well-documented and understood; theme flash prevention is a known pattern

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable -- no fast-moving dependencies)
