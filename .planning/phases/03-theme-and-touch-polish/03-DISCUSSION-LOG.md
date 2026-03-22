# Phase 3: Theme and Touch Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 03-theme-and-touch-polish
**Areas discussed:** Light theme colors, Theme toggle placement, Touch gesture thresholds

---

## Light Theme Colors

### Background
| Option | Description | Selected |
|--------|-------------|----------|
| Warm off-white | Soft cream/beige tone, paper-like | ✓ |
| Cool light gray | Neutral, modern, muted | |
| Pure white | Maximum contrast, very clean | |
| You decide | Claude picks | |

**User's choice:** Warm off-white

### Player colors
| Option | Description | Selected |
|--------|-------------|----------|
| Same colors both themes | Keep existing X/O colors | |
| Slightly adjusted for contrast | Darker variants in light mode | ✓ |
| You decide | Claude picks | |

**User's choice:** Slightly adjusted for contrast

### Grid lines
| Option | Description | Selected |
|--------|-------------|----------|
| Light gray outlines | Subtle gray on white | ✓ |
| You decide | Claude picks | |

**User's choice:** Light gray outlines

---

## Theme Toggle Placement

### Position
| Option | Description | Selected |
|--------|-------------|----------|
| Top-right corner | Small icon, always accessible | ✓ |
| Bottom-left corner | Near debug hint | |
| You decide | Claude picks | |

**User's choice:** Top-right corner

### Style
| Option | Description | Selected |
|--------|-------------|----------|
| Sun/moon icon | Universally understood emoji-style | ✓ |
| Minimal icon button | Clean geometric | |
| You decide | Claude picks | |

**User's choice:** Sun/moon icon
**Notes:** User also requested auto theme detection (prefers-color-scheme) added to backlog

---

## Touch Gesture Thresholds

### Tap vs drag
| Option | Description | Selected |
|--------|-------------|----------|
| Quick tap only | <200ms, minimal movement = place stone | ✓ |
| Tap with tolerance | <10px wiggle tolerance | |
| You decide | Claude tunes | |

**User's choice:** Quick tap only

### Pinch zoom
| Option | Description | Selected |
|--------|-------------|----------|
| Standard map-like | Zoom toward center of two fingers | ✓ |
| You decide | Standard behavior | |

**User's choice:** Standard map-like

---

## Claude's Discretion

- Exact off-white hex value
- Darkened player color variants for light mode
- Touch movement threshold
- Sun/moon icon implementation
- Edge fade gradient per theme
- Overlay colors per theme
- Theme transition behavior

## Deferred Ideas

- Auto theme detection from system preference (prefers-color-scheme)
