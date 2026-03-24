# Phase 4: WebRTC Multiplayer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-23
**Phase:** 04-webrtc-multiplayer
**Areas discussed:** Link sharing flow, Connection status UX, Game lobby / pre-game, Signaling server

---

## Link Sharing Flow

### Link format
| Option | Description | Selected |
|--------|-------------|----------|
| Hash-based ID | example.com/#abc123 | ✓ |
| Path-based ID | example.com/game/abc123 | |
| You decide | Claude picks | |

### Copy mechanism
| Option | Description | Selected |
|--------|-------------|----------|
| Copy button + display | Show link text with Copy button | ✓ |
| Auto-copy to clipboard | Auto-copy on creation | |
| You decide | Claude picks | |

### Host waiting state
| Option | Description | Selected |
|--------|-------------|----------|
| Full screen waiting | Centered message only | |
| Board visible + overlay | Hex board background with waiting overlay | ✓ |
| You decide | Claude picks | |

### Guest join experience
| Option | Description | Selected |
|--------|-------------|----------|
| Auto-connect, show board | Immediately starts connecting | |
| Join button first | Landing page with Join Game button | ✓ |
| You decide | Claude picks | |

### Main menu
**User requested:** Need menu to choose between hot-seat and WebRTC game modes.

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal centered menu | Title + two buttons on grid background | |
| Full landing page | Title, description, options, visual preview | ✓ |

### Landing page elements (multi-select)
- [x] Game title + tagline
- [x] Visual board preview
- [x] Rules summary
- [x] Theme toggle on landing

---

## Connection Status UX

### Position
| Option | Description | Selected |
|--------|-------------|----------|
| Next to turn indicator | Inline with top-center pill | |
| Top-left corner | Separate, opposite theme toggle | ✓ |
| You decide | Claude picks | |

### States
| Option | Description | Selected |
|--------|-------------|----------|
| Simple dot (green/red) | Minimal | |
| Dot + text label | Green Connected / Yellow Connecting / Red Disconnected | ✓ |
| You decide | Claude picks | |

---

## Game Lobby / Pre-game

### Start trigger
**User clarified:** Guest "Join Game" button serves as the start signal. No separate lobby.

### Role assignment
| Option | Description | Selected |
|--------|-------------|----------|
| Host is always X | Host goes first | ✓ |
| Random assignment | Random X/O | |
| You decide | Claude picks | |

---

## Signaling Server

### Approach
| Option | Description | Selected |
|--------|-------------|----------|
| PeerJS Cloud (Recommended) | Free, zero config | ✓ |
| Self-hosted PeerServer | More control, more setup | |
| You decide | Claude picks | |

### Game ID generation
**User asked:** "Is nanoid a good option here?"
**Answer:** Yes — small, URL-safe, customizable length. nanoid(8) gives collision-resistant short IDs.

---

## Claude's Discretion

- PeerJS configuration
- Message protocol format
- Host-authoritative validation approach
- Landing page layout/styling
- Error handling for connection failures

## Deferred Ideas

- Self-hosted PeerServer for production
- TURN server for symmetric NAT users
- Reconnection support (v2)
