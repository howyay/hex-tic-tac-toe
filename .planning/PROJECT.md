# Hex Tic-Tac-Toe

## What This Is

A peer-to-peer hexagonal tic-tac-toe game played on an infinite hex grid. Two players connect via shared link over WebRTC and take turns placing pieces — X places one on the first turn, then players alternate placing two pieces per turn. First to get 6 consecutive pieces along any hex axis wins. Essentially Connect6 on a hex grid.

## Core Value

Two players can connect via a shared link and play a complete game of hex Connect6 with correct rules and win detection.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Infinite hexagonal grid rendered on canvas with pan and zoom navigation
- [ ] Correct game rules: X places 1 first turn, then players alternate placing 2 per turn
- [ ] Win detection: 6 consecutive pieces along any of the 3 hex axes
- [ ] WebRTC peer-to-peer connection via shareable link
- [ ] Configurable turn timer (host sets: 30s, 60s, unlimited)
- [ ] Reconnection support — player can rejoin via same link if disconnected, game state preserved
- [ ] Minimal, clean UI — light/dark, focus on the board
- [ ] Visual indication of whose turn it is and how many placements remain this turn
- [ ] Game over screen showing winner and option to rematch

### Out of Scope

- AI/bot opponent — multiplayer only for v1
- User accounts or persistent profiles — anonymous play via link
- Mobile-native app — web only, though should be touch-friendly
- Game history or replays — live play only
- Spectator mode — two players only
- Chat system — players communicate outside the app
- Sound effects or animations beyond basic feedback — minimal clean aesthetic

## Context

- This is a variant of Connect6, a well-studied combinatorial game, adapted to a hexagonal grid
- Hex grids have 3 axes of alignment (horizontal, and two diagonals) vs 4 in square grids
- The infinite grid means no boundary-based strategy — pure placement tactics
- WebRTC requires a signaling mechanism; a lightweight signaling server or service is needed to establish the P2P connection, but game state flows directly between peers
- Svelte chosen as frontend framework with canvas rendering for the hex grid
- Pan + zoom navigation for exploring the infinite board

## Constraints

- **Tech stack**: Svelte frontend with HTML5 Canvas for hex grid rendering
- **Networking**: WebRTC for P2P game state sync; needs a signaling server or service for connection establishment
- **Deployment**: Static site + minimal signaling backend
- **Browser support**: Modern browsers with WebRTC support

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Svelte + Canvas | User preference; Svelte is lightweight, Canvas handles infinite grid well | — Pending |
| WebRTC P2P | Direct connection = low latency, no game server needed | — Pending |
| Hex Connect6 rules (1-2-2-2...) | Balances first-mover advantage while keeping hex grid strategy | — Pending |
| Configurable turn timer | Supports both casual and competitive play styles | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after initialization*
