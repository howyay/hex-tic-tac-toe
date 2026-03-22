# Phase 1: Hex Grid Engine - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Render an infinite hexagonal grid on HTML5 Canvas with pan, zoom, and hover preview. This is the visual foundation — no game logic, no networking. Users should be able to navigate a boundless hex grid smoothly and see hover feedback on individual cells.

</domain>

<decisions>
## Implementation Decisions

### Hex visual style
- **D-01:** Pointy-top hex orientation (vertex pointing up)
- **D-02:** Subtle outlines on each hex cell showing grid structure
- **D-03:** Placed pieces render as X and O marks with distinct colors (not filled circles or filled hexes — true to tic-tac-toe identity)
- **D-04:** Grid hex outlines fade to transparent near viewport edges, implying infinite extent beyond

### Zoom behavior
- **D-05:** Zoom anchored to cursor position (Google Maps style — zoom toward/away from mouse pointer)
- **D-06:** Moderate zoom range — zoom out to ~50 hexes visible, zoom in to ~10 hexes filling screen
- **D-07:** At far zoom levels, simplify rendering — hexes become simple colored dots, X/O marks hidden for performance and readability

### Board origin
- **D-08:** Game starts centered on hex (0,0) at default zoom level, grid extends in all directions
- **D-09:** No explicit "empty state" — grid is always visible from the start

### Coordinate system
- **D-10:** Axial coordinates (q, r) per Red Blob Games standard, with implicit s = -q - r
- **D-11:** Coordinate display hidden by default, toggleable via keyboard shortcut (debug mode for power users)

### Claude's Discretion
- Exact hex size in pixels at default zoom
- Fade gradient implementation for viewport edges
- Specific zoom level thresholds for LOD transitions
- Keyboard shortcut choice for debug coordinate toggle
- Hover preview visual treatment (color, opacity, animation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and REQUIREMENTS.md (GRID-01 through GRID-06).

### Domain reference
- Red Blob Games hex grid guide (https://www.redblobgames.com/grids/hexagons/) — Definitive reference for axial coordinates, hex geometry, neighbor calculations, and rendering

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — this phase establishes the foundational patterns for canvas rendering and hex math

### Integration Points
- Canvas rendering module will be consumed by Phase 2 (game logic) for placing stones
- Hex coordinate system will be used by Phase 2 for win detection along 3 axes
- Pan/zoom transform will be shared with Phase 3 (touch controls)

</code_context>

<specifics>
## Specific Ideas

- Grid should feel like navigating a map (Google Maps-tier smoothness for pan/zoom)
- X and O marks maintain tic-tac-toe identity rather than Go-style stones
- Fade effect at viewport edges creates sense of infinite space without hard cutoff

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-hex-grid-engine*
*Context gathered: 2026-03-21*
