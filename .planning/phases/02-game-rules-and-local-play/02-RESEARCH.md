# Phase 2: Game Rules and Local Play - Research

**Researched:** 2026-03-22
**Domain:** Game logic (Connect6 rules), win detection on hex grids, Svelte 5 reactive state management, Canvas UI overlay
**Confidence:** HIGH

## Summary

Phase 2 adds game logic to the existing hex grid engine: turn management (1 stone first turn, then 2 per turn), stone placement with visual feedback, win detection (6 consecutive along any hex axis), game over overlay, and rematch. All code is local hot-seat -- no networking.

The core technical challenges are: (1) an efficient win detection algorithm that checks 3 hex axes from each newly placed stone, (2) extending the existing reactive state pattern with game-specific state, and (3) adding the first DOM UI elements (turn indicator, game over overlay) alongside the existing canvas. The existing codebase provides all necessary hex math primitives (`HEX_DIRECTIONS`, `hexToPixel`, etc.) and a clean state pattern to extend.

**Primary recommendation:** Build game state as a new `createGameState()` module wrapping `createGridState()`, use a `Map<string, Player>` keyed by `"q,r"` for the board, check win only from the last-placed stone outward along 3 axis pairs, and render DOM overlays as sibling Svelte components to the canvas.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Instant placement -- click a hex and the stone appears immediately, no confirmation step
- **D-02:** Clicking an occupied hex shows a brief visual rejection (quick shake or flash)
- **D-03:** When placing 2 stones per turn, flow is seamless -- place first, then second, counter updates between
- **D-04:** Hover preview color changes based on current player (blue for X, red for O)
- **D-05:** Winning 6 stones get a glow or thicker outline -- rest of the board stays visible
- **D-06:** Board freezes after a win -- no more panning/zooming, locked on the final state
- **D-07:** Full semi-transparent overlay covers the entire board, winner text centered
- **D-08:** Text says "X wins!" or "O wins!" (tic-tac-toe identity, not color names)
- **D-09:** Single "Rematch" button on the overlay -- either player clicks it
- **D-10:** On rematch, loser goes first next game
- **D-11:** Turn indicator positioned top center, always visible and prominent
- **D-12:** Format: text showing "X -- 1 of 2" (whose turn + placement count)
- **D-13:** Total move counter displayed separately in a subtle corner position
- **D-14:** Hot-seat play -- no transition screen between turns, players just pass the device
- **D-15:** Turn indicator is the primary signal for whose turn it is

### Claude's Discretion
- Exact glow/outline style for winning stones
- Visual rejection animation for occupied hex (shake vs flash)
- Move counter exact position (which corner)
- Game over overlay opacity and styling
- X and O mark drawing style (size, thickness, font vs canvas paths)
- Whether to auto-center on the winning line when game ends

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | X places 1 stone on the first turn | Turn state machine: first turn = 1 placement, subsequent = 2 |
| GAME-02 | After first turn, players alternate placing 2 stones per turn | Turn counter within turn + player swap logic |
| GAME-03 | Win with 6 consecutive stones along any hex axis | Win detection algorithm using HEX_DIRECTIONS pairs |
| GAME-04 | Win detection checks all 3 hex axes | 3 axis pairs from HEX_DIRECTIONS: (0,1), (2,3), (4,5) |
| GAME-05 | Game ends immediately on win detection | Check after each placement, freeze state on win |
| GAME-06 | Winning line highlighted on board | Store winning coords, render with glow/outline in canvas |
| GAME-07 | Game over screen displays winner | DOM overlay component with "X wins!" / "O wins!" |
| GAME-08 | Rematch without new link | Reset game state, keep same page |
| GAME-09 | On rematch, first player alternates | Track who lost, swap starting player |
| UI-01 | Turn indicator shows whose turn (X or O) | DOM element top-center, reads from game state |
| UI-02 | Placement counter shows remaining stones this turn | "$player -- $placed of $total" format |
| UI-03 | Move counter tracks total moves | Increment on each stone placed, display in corner |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Svelte 5 | 5.53.x | UI framework + reactive state | Already in project. $state/$derived for game logic. |
| Vite | 8.x | Build tool | Already in project. |
| TypeScript | 5.9.x | Type safety | Already in project. Critical for game state types. |
| vitest | 4.1.x | Unit testing | Already in devDependencies. Use for game logic tests. |

### Supporting
No new dependencies needed. Phase 2 uses only existing libraries plus native Canvas 2D and DOM APIs.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Map<string, Player> for board | 2D array | Map is ideal for sparse infinite board; array requires bounds |
| DOM overlay for game-over | Canvas-drawn text | DOM is simpler for buttons (Rematch), text selection, accessibility |
| Checking from last stone only | Full board scan | O(1) per axis vs O(n) -- always check from the stone just placed |

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    hex/
      types.ts         # EXTEND: add Player, GameStatus, Move types
      math.ts          # EXISTING: hexToPixel, hexNeighbors, HEX_DIRECTIONS
    state/
      grid-state.svelte.ts   # EXISTING: camera, hover, pan state
      game-state.svelte.ts   # NEW: game logic, board, turns, win detection
    render/
      renderer.ts      # EXTEND: add stone rendering, win highlight
      stones.ts        # NEW: drawX(), drawO(), drawWinHighlight()
    game/
      rules.ts         # NEW: pure functions -- isValidMove, checkWin, nextTurn
  components/
    HexCanvas.svelte       # EXTEND: add click-to-place handler
    TurnIndicator.svelte   # NEW: DOM overlay -- top center
    GameOverlay.svelte     # NEW: DOM overlay -- winner + rematch
    MoveCounter.svelte     # NEW: DOM overlay -- corner counter
  App.svelte               # EXTEND: compose new components
```

### Pattern 1: Game State as Reactive Module
**What:** A `createGameState()` function following the same pattern as `createGridState()` -- a closure returning getters/setters backed by `$state` runes.
**When to use:** For all game-level state (board, current player, turn phase, game status).
**Example:**
```typescript
// src/lib/state/game-state.svelte.ts
import type { HexCoord } from '../hex/types';

export type Player = 'X' | 'O';
export type GameStatus = 'playing' | 'won' | 'draw';

export interface GameState {
  board: Map<string, Player>;
  currentPlayer: Player;
  placementsThisTurn: number;
  maxPlacements: number;  // 1 on first turn, 2 after
  totalMoves: number;
  status: GameStatus;
  winner: Player | null;
  winningLine: HexCoord[];
  isFirstTurn: boolean;
}

function coordKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

export function createGameState() {
  let board = $state(new Map<string, Player>());
  let currentPlayer = $state<Player>('X');
  let placementsThisTurn = $state(0);
  let isFirstTurn = $state(true);
  let totalMoves = $state(0);
  let status = $state<GameStatus>('playing');
  let winner = $state<Player | null>(null);
  let winningLine = $state<HexCoord[]>([]);
  let startingPlayer = $state<Player>('X');

  // $derived values
  let maxPlacements = $derived(isFirstTurn ? 1 : 2);
  let placementsRemaining = $derived(maxPlacements - placementsThisTurn);

  return {
    get board() { return board; },
    get currentPlayer() { return currentPlayer; },
    get placementsThisTurn() { return placementsThisTurn; },
    get maxPlacements() { return maxPlacements; },
    get placementsRemaining() { return placementsRemaining; },
    get totalMoves() { return totalMoves; },
    get status() { return status; },
    get winner() { return winner; },
    get winningLine() { return winningLine; },
    // ... placeStone(), reset(), etc.
  };
}
```

### Pattern 2: Pure Game Rules (Testable)
**What:** Separate pure functions for game logic so they can be unit tested without Svelte reactivity.
**When to use:** Win detection, move validation, turn advancement.
**Example:**
```typescript
// src/lib/game/rules.ts
import type { HexCoord } from '../hex/types';
import type { Player } from '../state/game-state.svelte';
import { HEX_DIRECTIONS } from '../hex/math';

function coordKey(hex: HexCoord): string {
  return `${hex.q},${hex.r}`;
}

/**
 * Check for 6 consecutive stones along any axis from a given hex.
 * Returns the winning line if found, or null.
 */
export function checkWinFromHex(
  board: Map<string, Player>,
  hex: HexCoord,
  player: Player,
): HexCoord[] | null {
  // 3 axis pairs: directions (0,3), (1,4), (2,5)
  for (let axis = 0; axis < 3; axis++) {
    const forward = HEX_DIRECTIONS[axis];
    const backward = HEX_DIRECTIONS[axis + 3];

    const line: HexCoord[] = [hex];

    // Count forward
    let q = hex.q + forward.q;
    let r = hex.r + forward.r;
    while (board.get(coordKey({ q, r })) === player) {
      line.push({ q, r });
      q += forward.q;
      r += forward.r;
    }

    // Count backward
    q = hex.q + backward.q;
    r = hex.r + backward.r;
    while (board.get(coordKey({ q, r })) === player) {
      line.push({ q, r });
      q += backward.q;
      r += backward.r;
    }

    if (line.length >= 6) {
      return line;
    }
  }
  return null;
}

export function isValidMove(
  board: Map<string, Player>,
  hex: HexCoord,
): boolean {
  return !board.has(coordKey(hex));
}
```

### Pattern 3: DOM Overlays on Canvas
**What:** Svelte components positioned absolutely over the canvas element, rather than drawing UI text on the canvas.
**When to use:** For turn indicator, game over screen, move counter -- anything with text, buttons, or interactivity.
**Example:**
```svelte
<!-- TurnIndicator.svelte -->
<script lang="ts">
  let { currentPlayer, placementsThisTurn, maxPlacements }:
    { currentPlayer: string; placementsThisTurn: number; maxPlacements: number } = $props();
</script>

<div class="turn-indicator">
  {currentPlayer} &mdash; {placementsThisTurn + 1} of {maxPlacements}
</div>

<style>
  .turn-indicator {
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    /* styling */
  }
</style>
```

### Pattern 4: Click-to-Place with Pan Discrimination
**What:** Distinguish between a click (place stone) and a drag (pan) on mouseup by tracking whether the mouse moved beyond a threshold.
**When to use:** The existing HexCanvas uses mousedown for pan start. Need to add click detection without breaking panning.
**Example:**
```typescript
// In HexCanvas.svelte
let dragDistance = 0;
const CLICK_THRESHOLD = 5; // pixels

function handleMouseDown(e: MouseEvent) {
  dragDistance = 0;
  // ... existing pan logic
}

function handleMouseMove(e: MouseEvent) {
  if (state.isPanning) {
    dragDistance += Math.abs(e.movementX) + Math.abs(e.movementY);
    // ... existing pan logic
  }
}

function handleMouseUp(e: MouseEvent) {
  if (dragDistance < CLICK_THRESHOLD && !state.isPanning) {
    // This was a click, not a drag
    const worldPoint = screenToWorld({ x: e.offsetX, y: e.offsetY }, camera);
    const hex = hexRound(...pixelToHex(worldPoint, HEX_SIZE));
    // Attempt placement
    gameState.placeStone(hex);
  }
  state.isPanning = false;
}
```

### Anti-Patterns to Avoid
- **Board as 2D array:** The grid is infinite/unbounded. A Map keyed by coordinate string is the correct sparse representation.
- **Full board scan for win detection:** Only check from the last-placed stone outward along 3 axes. O(6*6) = O(36) worst case per check, not O(n).
- **Drawing buttons on canvas:** Use DOM elements for anything interactive. Canvas buttons are inaccessible, hard to style, and require manual hit testing.
- **Mutating board Map in-place without triggering reactivity:** Svelte 5's `$state` tracks assignment, not deep mutation. After `board.set()`, you must reassign or use a reactive wrapper to trigger re-render.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hex coordinate math | Custom axial/pixel conversion | Existing `src/lib/hex/math.ts` | Already implemented and tested in Phase 1 |
| Neighbor directions | Direction vectors from scratch | `HEX_DIRECTIONS` from `math.ts` | Already defined as 6 axial direction vectors |
| Canvas hit testing for hexes | Manual polygon-point intersection | `pixelToHex` + `hexRound` | Existing math converts pixel to nearest hex coord |
| Reactive state pattern | Custom event emitter or store | Svelte 5 runes (`$state`, `$derived`) | Project convention established in Phase 1's `grid-state.svelte.ts` |

**Key insight:** Phase 1 built all the hex math primitives needed for Phase 2. The win detection algorithm is the only new algorithmic work, and it composes existing `HEX_DIRECTIONS` with a simple loop.

## Common Pitfalls

### Pitfall 1: Svelte 5 Map Reactivity
**What goes wrong:** Calling `board.set(key, value)` does not trigger Svelte 5 reactivity because `$state` tracks reassignment, not internal Map mutations.
**Why it happens:** Svelte 5 runes use proxy-based reactivity for plain objects/arrays but Maps need special handling.
**How to avoid:** After mutating the Map, either: (a) reassign `board = new Map(board)` to trigger reactivity, or (b) use a version counter that increments on each mutation and is read by derived/effects. Option (a) is simpler and correct for a game board with hundreds of entries max.
**Warning signs:** Board updates in state but canvas does not re-render.

### Pitfall 2: Click vs Pan Ambiguity
**What goes wrong:** Every mouseup triggers a stone placement, even when the user was panning.
**Why it happens:** mousedown starts panning AND is the beginning of a click. Without discrimination, mouseup always looks like a click.
**How to avoid:** Track cumulative mouse movement between mousedown and mouseup. Only treat as click if movement < threshold (5px). The existing `isPanning` state helps but is not sufficient alone -- need distance tracking.
**Warning signs:** Stones appear after dragging the board.

### Pitfall 3: Win Check Only After Last Stone in Turn
**What goes wrong:** Win is only checked after both stones are placed in a 2-stone turn, missing a win on the first stone of a turn.
**Why it happens:** Developer assumes win check happens at end-of-turn.
**How to avoid:** Check win after EVERY stone placement (GAME-05: "game ends immediately when a win is detected"). If the first of 2 stones wins, the turn ends early.
**Warning signs:** Player must place a second unnecessary stone after already winning.

### Pitfall 4: Forgetting to Freeze Interactions on Win
**What goes wrong:** After game ends, players can still place stones, pan, or zoom.
**Why it happens:** Canvas event handlers not gated by game status.
**How to avoid:** Check `gameState.status === 'playing'` before processing any placement click. Per D-06, also disable pan/zoom after win.
**Warning signs:** Stones appear on board after "X wins!" is shown.

### Pitfall 5: Coordinate Key Consistency
**What goes wrong:** `"-0,3"` and `"0,3"` are different string keys but represent the same hex.
**Why it happens:** JavaScript's `-0` converts to `"-0"` in template literals.
**How to avoid:** Phase 1 already normalizes `-0` to `+0` in `hexRound()` (see line 27 of math.ts: `rq || 0`). Ensure all hex coords pass through `hexRound` before being used as keys.
**Warning signs:** Stone placed at a hex but not detected for win checking.

### Pitfall 6: Rematch State Reset Incompleteness
**What goes wrong:** After rematch, some state from previous game leaks (e.g., winning line still highlighted, or camera position persists in a frozen state).
**Why it happens:** Reset function misses some state fields.
**How to avoid:** Explicit reset function that sets ALL game state fields to initial values. Camera unfreeze on rematch.
**Warning signs:** Visual artifacts from previous game appear after rematch.

## Code Examples

### Win Detection (3 Hex Axes)
```typescript
// The 3 hex axes in axial coordinates are pairs of opposite directions:
// Axis 0: (+1, 0) / (-1, 0)  -- "East/West" (q-axis)
// Axis 1: (+1,-1) / (-1,+1)  -- "NE/SW" (r-axis)
// Axis 2: ( 0,-1) / ( 0,+1)  -- "NW/SE" (s-axis)
//
// HEX_DIRECTIONS from math.ts: indices 0-5
// Pairs: [0,3], [1,4], [2,5]
//
// Source: Red Blob Games hex grid reference + existing HEX_DIRECTIONS

function countInDirection(
  board: Map<string, Player>,
  start: HexCoord,
  dir: HexCoord,
  player: Player,
): HexCoord[] {
  const result: HexCoord[] = [];
  let q = start.q + dir.q;
  let r = start.r + dir.r;
  while (board.get(`${q},${r}`) === player) {
    result.push({ q, r });
    q += dir.q;
    r += dir.r;
  }
  return result;
}
```

### Drawing X and O Marks on Canvas
```typescript
// Source: Canvas 2D API standard patterns

const PLAYER_X_COLOR = '#4fc3f7';  // From Phase 1 UI-SPEC
const PLAYER_O_COLOR = '#ef5350';  // From Phase 1 UI-SPEC
const MARK_SCALE = 0.55; // Fraction of hex size for mark radius

function drawX(ctx: CanvasRenderingContext2D, center: Point, size: number): void {
  const r = size * MARK_SCALE;
  ctx.strokeStyle = PLAYER_X_COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(center.x - r, center.y - r);
  ctx.lineTo(center.x + r, center.y + r);
  ctx.moveTo(center.x + r, center.y - r);
  ctx.lineTo(center.x - r, center.y + r);
  ctx.stroke();
}

function drawO(ctx: CanvasRenderingContext2D, center: Point, size: number): void {
  const r = size * MARK_SCALE;
  ctx.strokeStyle = PLAYER_O_COLOR;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center.x, center.y, r, 0, Math.PI * 2);
  ctx.stroke();
}
```

### Win Highlight Glow Effect
```typescript
// Source: Canvas 2D shadowBlur API for glow

function drawWinHighlight(
  ctx: CanvasRenderingContext2D,
  center: Point,
  size: number,
  playerColor: string,
): void {
  ctx.save();
  ctx.shadowColor = playerColor;
  ctx.shadowBlur = 15;
  ctx.strokeStyle = playerColor;
  ctx.lineWidth = 3;
  const corners = hexCorners(center, size);
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
```

### Svelte 5 Map Reactivity Workaround
```typescript
// Trigger reactivity after Map mutation
function placeStone(hex: HexCoord): void {
  const key = `${hex.q},${hex.r}`;
  if (board.has(key) || status !== 'playing') return;

  board.set(key, currentPlayer);
  board = new Map(board); // Trigger $state reassignment reactivity

  totalMoves++;
  placementsThisTurn++;

  // Check win from the just-placed hex
  const win = checkWinFromHex(board, hex, currentPlayer);
  if (win) {
    status = 'won';
    winner = currentPlayer;
    winningLine = win;
    return;
  }

  // Advance turn if all placements used
  if (placementsThisTurn >= maxPlacements) {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    placementsThisTurn = 0;
    if (isFirstTurn) isFirstTurn = false;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Svelte stores (writable/readable) | Svelte 5 runes ($state, $derived) | Svelte 5 (2024) | Use runes exclusively -- project already uses them |
| External state managers | Built-in runes | Svelte 5 (2024) | No need for Redux/Zustand/etc. |

**Deprecated/outdated:**
- Svelte writable/readable stores: Replaced by $state/$derived runes in Svelte 5. Project already uses runes.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | vitest.config.ts (exists) |
| Quick run command | `npx vitest run src/lib/game/ --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-01 | X places 1 stone first turn | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-02 | Alternate 2 stones per turn after first | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-03 | Win with 6 consecutive on any axis | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-04 | Win checks all 3 hex axes | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-05 | Game ends immediately on win | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-06 | Winning line highlighted | manual-only | Visual inspection | N/A |
| GAME-07 | Game over displays winner | manual-only | Visual inspection | N/A |
| GAME-08 | Rematch without new link | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| GAME-09 | Loser goes first on rematch | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |
| UI-01 | Turn indicator shows current player | manual-only | Visual inspection | N/A |
| UI-02 | Placement counter shows remaining | manual-only | Visual inspection (derived from state) | N/A |
| UI-03 | Move counter tracks total | unit | `npx vitest run src/lib/game/rules.test.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/game/ --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/game/rules.test.ts` -- covers GAME-01 through GAME-05, GAME-08, GAME-09, UI-03
- [ ] No framework install needed -- vitest already in devDependencies

## Open Questions

1. **Map reactivity in Svelte 5**
   - What we know: $state tracks assignment, not internal Map mutations. Reassigning `board = new Map(board)` works but copies O(n).
   - What's unclear: Whether Svelte 5.54 has improved deep reactive tracking for Maps/Sets.
   - Recommendation: Use the reassignment approach. Board will have at most a few hundred entries -- copy cost is negligible.

2. **Canvas shadowBlur performance for win glow**
   - What we know: `shadowBlur` is expensive per draw call on some browsers.
   - What's unclear: Exact performance impact of drawing 6 glowing hexes per frame.
   - Recommendation: Only apply glow when game is over (not every frame during play). 6 hexes with shadow is well within budget.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/hex/math.ts` -- HEX_DIRECTIONS, hexToPixel, hexRound
- Existing codebase: `src/lib/state/grid-state.svelte.ts` -- reactive state pattern
- Existing codebase: `src/lib/render/renderer.ts` -- canvas render pipeline
- Phase 1 UI-SPEC: `.planning/phases/01-hex-grid-engine/01-UI-SPEC.md` -- color tokens
- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) -- canonical hex grid algorithms, neighbor directions, axis definitions

### Secondary (MEDIUM confidence)
- [Connect6 - Wikipedia](https://en.wikipedia.org/wiki/Connect6) -- Connect6 rules reference (traditional square grid, adapted to hex)
- Canvas 2D API: shadowBlur, lineCap, arc -- standard browser APIs

### Tertiary (LOW confidence)
- Svelte 5 Map reactivity behavior -- based on Svelte 5 general reactivity model; specific Map behavior not verified against latest 5.54 docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all already installed
- Architecture: HIGH -- extends established Phase 1 patterns, straightforward game logic
- Pitfalls: HIGH -- based on direct codebase analysis (e.g., -0 normalization, existing pan handler)
- Win detection algorithm: HIGH -- well-known approach, hex directions already in codebase

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days -- stable domain, no fast-moving dependencies)
