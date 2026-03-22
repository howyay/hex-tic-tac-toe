# Phase 2: Game Rules and Local Play - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 02-game-rules-and-local-play
**Areas discussed:** Stone placement flow, Win line presentation, Game over & rematch UX, Turn indicator design, Local play mode switching

---

## Stone Placement Flow

### Click behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Instant placement | Click a hex → stone appears immediately | ✓ |
| Click to preview, click again to confirm | Two-step placement | |
| You decide | Claude picks | |

**User's choice:** Instant placement

### Occupied hex
| Option | Description | Selected |
|--------|-------------|----------|
| Nothing — silent ignore | No feedback | |
| Brief visual rejection | Quick shake or flash | ✓ |
| You decide | Claude picks | |

**User's choice:** Brief visual rejection

### Between placements
| Option | Description | Selected |
|--------|-------------|----------|
| Seamless — just keep clicking | Counter updates, no pause | ✓ |
| Brief pause between | 200ms visual beat | |
| You decide | Claude picks | |

**User's choice:** Seamless

---

## Win Line Presentation

### Win highlight
| Option | Description | Selected |
|--------|-------------|----------|
| Glow or thicker outline | Winning stones get bright glow/bold border | ✓ |
| Dim everything else | Non-winning stones fade out | |
| Connected line through stones | Draw a path connecting the 6 | |
| You decide | Claude picks | |

**User's choice:** Glow or thicker outline

### Board after win
| Option | Description | Selected |
|--------|-------------|----------|
| Yes, fully interactive | Pan/zoom still work | |
| Frozen | Board locks in place | ✓ |
| You decide | Claude picks | |

**User's choice:** Frozen

---

## Game Over & Rematch UX

### Game over announcement
| Option | Description | Selected |
|--------|-------------|----------|
| Centered overlay | Semi-transparent overlay with winner text | ✓ |
| Top banner | Banner slides down | |
| Minimal inline | Update turn indicator area | |
| You decide | Claude picks | |

**User's choice:** Centered overlay

### Win text
| Option | Description | Selected |
|--------|-------------|----------|
| Player color wins | "Blue wins!" using accent colors | |
| X or O wins | "X wins!" keeping tic-tac-toe identity | ✓ |
| You decide | Claude picks | |

**User's choice:** X or O wins

### Overlay style
| Option | Description | Selected |
|--------|-------------|----------|
| Small centered card | Compact card, board mostly visible | |
| Full semi-transparent | Dimmed overlay covers whole board | ✓ |
| You decide | Claude picks | |

**User's choice:** Full semi-transparent

### Rematch & first player
**Notes:** User pointed out that "single button" vs "auto-rematch" and "loser goes first" vs "alternate X/O" are effectively identical in practice. Collapsed to: one Rematch button, loser goes first.

---

## Turn Indicator Design

### Position
| Option | Description | Selected |
|--------|-------------|----------|
| Top center | Centered above the board | ✓ |
| Bottom center | Below the board | |
| Corner overlay | Fixed to a corner | |
| You decide | Claude picks | |

**User's choice:** Top center

### Format
| Option | Description | Selected |
|--------|-------------|----------|
| Text: 'X — 1 of 2' | Whose turn + placement count as text | ✓ |
| Dots or pips | Visual circles that fill in | |
| You decide | Claude picks | |

**User's choice:** Text: 'X — 1 of 2'

### Move counter
| Option | Description | Selected |
|--------|-------------|----------|
| Next to turn indicator | Inline with turn info | |
| Separate subtle display | Small text in a corner | ✓ |
| You decide | Claude picks | |

**User's choice:** Separate subtle display

---

## Local Play Mode Switching

### Turn switching
| Option | Description | Selected |
|--------|-------------|----------|
| Hot-seat — just pass the device | No transition, turn indicator shows whose turn | ✓ |
| Turn transition screen | Brief splash between turns | |
| You decide | Claude picks | |

**User's choice:** Hot-seat

### Hover color
| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show current player's color | Blue (X) or red (O) preview | ✓ |
| Neutral hover color | Same color regardless of player | |
| You decide | Claude picks | |

**User's choice:** Current player's color

---

## Claude's Discretion

- Glow/outline style for winning stones
- Visual rejection animation (shake vs flash)
- Move counter corner position
- Game over overlay opacity/styling
- X and O mark drawing style
- Whether to auto-center on winning line

## Deferred Ideas

None
