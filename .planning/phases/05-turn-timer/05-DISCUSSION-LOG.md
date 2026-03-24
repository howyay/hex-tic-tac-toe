# Phase 5: Turn Timer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 05-turn-timer
**Areas discussed:** Timer display, Timer selection UI, Expiry behavior

---

## Timer Display

### Position
| Option | Description | Selected |
|--------|-------------|----------|
| Inside turn indicator | Extend existing pill with countdown | ✓ |
| Separate display | Own element near turn indicator | |
| You decide | Claude picks | |

**User's choice:** Integrated into turn indicator
**Notes:** Also requested wording change from "1 of 2" to "2 remaining"

### Low time
| Option | Description | Selected |
|--------|-------------|----------|
| Color change at 10s | Timer text turns red/warning | ✓ |
| Color change + pulse | Red text with pulsing | |
| No change | Same appearance | |
| You decide | Claude picks | |

**User's choice:** Color change at 10s

---

## Timer Selection UI

### When
| Option | Description | Selected |
|--------|-------------|----------|
| On the waiting screen | Selector on WaitingOverlay | |
| Before creating game | Prompt after Online Game click | ✓ |
| You decide | Claude picks | |

**User's choice:** Before creating game

### Format
| Option | Description | Selected |
|--------|-------------|----------|
| Segmented buttons | 30s / 60s / ∞ inline | ✓ |
| Dropdown | Select element | |
| You decide | Claude picks | |

**User's choice:** Segmented buttons

### Default
| Option | Description | Selected |
|--------|-------------|----------|
| Unlimited | No time pressure | |
| 60 seconds | Moderate time pressure | ✓ |
| You decide | Claude picks | |

**User's choice:** 60 seconds

---

## Expiry Behavior

### Forfeit timing
| Option | Description | Selected |
|--------|-------------|----------|
| Instant forfeit | Skip immediately at 0 | |
| Brief warning then forfeit | Flash/shake ~1s, then forfeit | ✓ |
| You decide | Claude picks | |

**User's choice:** Brief warning then forfeit

### Visual
**User's choice:** Timer turns red and the screen shakes at expiry

---

## Claude's Discretion

- Timer sync mechanism (wall-clock vs relative)
- Timer resets per-turn (expected) vs per-placement
- Shake animation details
- Local game timer availability
- Timer selector styling
- "Unlimited" display in turn indicator

## Deferred Ideas

None
