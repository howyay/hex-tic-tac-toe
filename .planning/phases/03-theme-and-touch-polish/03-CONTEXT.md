# Phase 3: Theme and Touch Polish - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Add light/dark theme toggle with localStorage persistence, implement touch controls (tap-to-place, drag-to-pan, pinch-to-zoom), and ensure the minimal clean aesthetic across both themes. Requirements: UI-04, UI-05, UI-06, UI-07, UI-08.

</domain>

<decisions>
## Implementation Decisions

### Light theme colors
- **D-01:** Light theme background is warm off-white (cream/beige tone — easy on the eyes, paper-like feel)
- **D-02:** Grid outlines in light mode are light gray — mirrors the subtle white-on-dark approach
- **D-03:** Player colors slightly adjusted for contrast in light mode — darker variants of X blue and O red for readability on light background
- **D-04:** Overlays (turn indicator pill, game over overlay, move counter) adapt colors to match each theme

### Theme toggle
- **D-05:** Theme toggle positioned in the top-right corner — small, out of the way, always accessible
- **D-06:** Sun/moon icon toggle — switches between sun (light mode) and moon (dark mode), universally understood
- **D-07:** Theme preference persisted in localStorage
- **D-08:** Default to dark theme on first visit (current behavior)

### Touch gesture handling
- **D-09:** Quick tap (<200ms, minimal movement) places a stone. Longer press or any drag = pan.
- **D-10:** Pinch-to-zoom is standard map-like — zooms toward center of two fingers, smooth and continuous
- **D-11:** Touch drag for panning — single finger drag detected by movement threshold, no conflict with tap

### Claude's Discretion
- Exact warm off-white hex color value
- Exact darkened player color variants for light mode
- Touch movement threshold for tap vs drag discrimination (suggested ~10px)
- Sun/moon icon implementation (SVG vs Unicode)
- Edge fade gradient colors per theme
- Overlay backdrop and text colors per theme
- Whether theme transition is instant or has a brief CSS transition

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase 1 UI-SPEC (dark theme baseline)
- `.planning/phases/01-hex-grid-engine/01-UI-SPEC.md` — Dark theme color tokens: background #1a1a2e, grid rgba(255,255,255,0.12), Player X #4fc3f7, Player O #ef5350

### Phase 2 UI-SPEC (DOM overlay styling)
- `.planning/phases/02-game-rules-and-local-play/02-UI-SPEC.md` — Turn indicator, game over overlay, move counter styling and color tokens

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/render/renderer.ts` — Canvas rendering pipeline; all color values are currently hardcoded (need to accept theme colors)
- `src/lib/render/effects.ts` — Edge fade uses hardcoded `#1a1a2e` background color
- `src/lib/render/stones.ts` — Player colors `#4fc3f7` and `#ef5350` hardcoded
- `src/components/HexCanvas.svelte` — Mouse event handlers (extend with touch event handlers)
- `src/components/TurnIndicator.svelte` — Hardcoded dark theme colors in CSS
- `src/components/GameOverlay.svelte` — Hardcoded overlay colors
- `src/components/MoveCounter.svelte` — Hardcoded muted text color

### Established Patterns
- Svelte 5 runes: `$state` for reactive values, `$derived` for computed
- `createGridState()` / `createGameState()` factory pattern for reactive state
- Canvas colors passed as parameters to render functions

### Integration Points
- All canvas rendering functions need theme-aware color parameters
- All DOM components need CSS custom properties or theme-aware styling
- HexCanvas needs `touch*` event handlers alongside existing `mouse*` handlers
- App.svelte needs theme state and toggle wiring

</code_context>

<specifics>
## Specific Ideas

- Light theme should feel like reading on paper — warm, not clinical
- The game should feel equally polished in both themes, not like dark is "primary" and light is an afterthought
- Touch controls should feel natural on a phone — tap to place, drag to explore, pinch to zoom, no confusion between gestures

</specifics>

<deferred>
## Deferred Ideas

- Auto theme detection from system preference (prefers-color-scheme) — backlog for future polish
- Theme-aware favicon

</deferred>

---

*Phase: 03-theme-and-touch-polish*
*Context gathered: 2026-03-22*
