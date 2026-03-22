# Phase 2: Game Rules and Local Play - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Two players sharing one browser can play a complete game of hex Connect6 with correct rules, win detection, turn management, game over screen, and rematch. This is a local hot-seat prototype — no networking. Requirements: GAME-01 through GAME-09, UI-01, UI-02, UI-03.

</domain>

<decisions>
## Implementation Decisions

### Stone placement flow
- **D-01:** Instant placement — click a hex and the stone appears immediately, no confirmation step
- **D-02:** Clicking an occupied hex shows a brief visual rejection (quick shake or flash)
- **D-03:** When placing 2 stones per turn, flow is seamless — place first, then second, counter updates between
- **D-04:** Hover preview color changes based on current player (blue for X, red for O)

### Win line presentation
- **D-05:** Winning 6 stones get a glow or thicker outline — rest of the board stays visible
- **D-06:** Board freezes after a win — no more panning/zooming, locked on the final state

### Game over & rematch UX
- **D-07:** Full semi-transparent overlay covers the entire board, winner text centered
- **D-08:** Text says "X wins!" or "O wins!" (tic-tac-toe identity, not color names)
- **D-09:** Single "Rematch" button on the overlay — either player clicks it
- **D-10:** On rematch, loser goes first next game

### Turn indicator design
- **D-11:** Turn indicator positioned top center, always visible and prominent
- **D-12:** Format: text showing "X — 1 of 2" (whose turn + placement count)
- **D-13:** Total move counter displayed separately in a subtle corner position

### Local play mode
- **D-14:** Hot-seat play — no transition screen between turns, players just pass the device
- **D-15:** Turn indicator is the primary signal for whose turn it is

### Claude's Discretion
- Exact glow/outline style for winning stones
- Visual rejection animation for occupied hex (shake vs flash)
- Move counter exact position (which corner)
- Game over overlay opacity and styling
- X and O mark drawing style (size, thickness, font vs canvas paths)
- Whether to auto-center on the winning line when game ends

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md (GAME-01 through GAME-09, UI-01 through UI-03).

### Phase 1 UI-SPEC (color tokens)
- `.planning/phases/01-hex-grid-engine/01-UI-SPEC.md` — Player X color (#4fc3f7), Player O color (#ef5350), background (#1a1a2e)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/hex/types.ts` — HexCoord, Point, Camera interfaces (extend with game types)
- `src/lib/hex/math.ts` — hexToPixel, pixelToHex, hexRound, hexCorners, hexNeighbors (use for win detection axis traversal)
- `src/lib/state/grid-state.svelte.ts` — Svelte 5 reactive state pattern with dirty-flag redraw (extend for game state)
- `src/lib/render/renderer.ts` — Canvas render pipeline (extend drawGrid to render placed stones)
- `src/components/HexCanvas.svelte` — Canvas component with pan/zoom/hover (add click-to-place handler)

### Established Patterns
- Svelte 5 runes: `$state`, `$derived` in `.svelte.ts` files for shared reactive state
- Canvas rendering: rAF loop with dirty flag, camera transforms via `ctx.setTransform()`
- Hex math: axial coordinates (q, r), implicit s = -q - r for third axis

### Integration Points
- HexCanvas `onclick` handler → game state placement logic
- Renderer `render()` → needs to draw X/O marks on occupied hexes
- GridState → extend or create GameState that wraps grid state + game rules
- Hover preview → now needs current player color instead of fixed blue

</code_context>

<specifics>
## Specific Ideas

- Turn indicator text format "X — 1 of 2" is deliberately minimal, matching the clean aesthetic from Phase 1
- Game over text uses "X wins!" / "O wins!" not color names — maintaining tic-tac-toe identity (D-03 from Phase 1)
- Board freezes on win so the final state is preserved for both players to see

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-game-rules-and-local-play*
*Context gathered: 2026-03-22*
