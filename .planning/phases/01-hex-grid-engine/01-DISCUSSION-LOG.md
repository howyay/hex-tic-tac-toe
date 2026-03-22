# Phase 1: Hex Grid Engine - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-21
**Phase:** 01-hex-grid-engine
**Areas discussed:** Hex visual style, Zoom behavior, Board origin, Coordinate display

---

## Hex Visual Style

### Hex orientation
| Option | Description | Selected |
|--------|-------------|----------|
| Pointy-top (Recommended) | Pointy vertex up. More natural for board games, better vertical stacking. | ✓ |
| Flat-top | Flat edge on top. Used in some wargames, wider horizontal rows. | |

**User's choice:** Pointy-top
**Notes:** None

### Grid appearance
| Option | Description | Selected |
|--------|-------------|----------|
| Subtle outlines | Thin borders on each hex cell — shows the grid structure | ✓ |
| Dots at centers | Minimalist — just dot markers where hexes are, no borders | |
| No grid shown | Completely blank until stones are placed nearby | |

**User's choice:** Subtle outlines
**Notes:** None

### Stone style
| Option | Description | Selected |
|--------|-------------|----------|
| Filled circles | Clean circles inside hex cells, two distinct colors | |
| Filled hexes | Entire hex fills with player color when placed | |
| You decide | Claude picks whatever looks cleanest | |

**User's choice:** Other — "X and O with distinct colors"
**Notes:** User wants X and O marks rather than abstract stones, maintaining tic-tac-toe identity

---

## Zoom Behavior

### Zoom target
| Option | Description | Selected |
|--------|-------------|----------|
| Zoom to cursor (Recommended) | Like Google Maps — zooms toward/away from mouse pointer | ✓ |
| Zoom to center | Always zooms toward center of viewport | |
| You decide | Claude picks the better UX | |

**User's choice:** Zoom to cursor
**Notes:** None

### Zoom range
| Option | Description | Selected |
|--------|-------------|----------|
| Wide range | Zoom way out to see 100+ hexes, zoom in to 5-10 hexes | |
| Moderate range | Zoom out to ~50 hexes, zoom in to ~10 hexes | ✓ |
| You decide | Claude picks sensible limits | |

**User's choice:** Moderate range
**Notes:** None

### Distant hex rendering
| Option | Description | Selected |
|--------|-------------|----------|
| Simplify at distance | Far zoom: hexes become colored dots, X/O marks hidden | ✓ |
| Always full detail | Render X/O marks at all zoom levels | |
| You decide | Claude optimizes for performance and readability | |

**User's choice:** Simplify at distance
**Notes:** None

---

## Board Origin

### Start view
| Option | Description | Selected |
|--------|-------------|----------|
| Centered on (0,0) | Start at origin hex, default zoom, grid extends in all directions | ✓ |
| Blank until first move | Show empty grid, auto-center after first placement | |
| You decide | Claude picks best initial experience | |

**User's choice:** Centered on (0,0)
**Notes:** None

### Grid extent hint
| Option | Description | Selected |
|--------|-------------|----------|
| Grid fades at edges | Hex outlines fade to transparent near viewport edges | ✓ |
| Hard viewport cut | Grid stops at viewport edge, redraws on pan | |
| You decide | Claude picks the cleaner look | |

**User's choice:** Grid fades at edges
**Notes:** None

---

## Coordinate Display

### Visibility
| Option | Description | Selected |
|--------|-------------|----------|
| Hidden entirely | No coordinates — clean board | |
| On hover only | Show (q, r) when hovering | |
| Debug toggle | Hidden by default, toggleable via keyboard shortcut | ✓ |
| You decide | Claude picks what fits minimal aesthetic | |

**User's choice:** Debug toggle
**Notes:** User also asked about coordinate system — confirmed axial (q, r) per Red Blob Games standard

---

## Claude's Discretion

- Exact hex size in pixels at default zoom
- Fade gradient implementation for viewport edges
- Zoom level thresholds for LOD transitions
- Keyboard shortcut for debug coordinate toggle
- Hover preview visual treatment

## Deferred Ideas

None — discussion stayed within phase scope
