# Roadmap: Hex Tic-Tac-Toe

## Overview

This roadmap delivers a peer-to-peer hexagonal Connect6 game in five phases. The build order follows a strict dependency chain: hex grid engine first (foundation everything depends on), then game rules as a local two-player prototype (verifiable without networking), then UI polish and touch input (complete the local experience), then WebRTC multiplayer (the core differentiator), and finally the turn timer system (requires networking to be stable). Each phase produces a verifiable, working artifact.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Hex Grid Engine** - Canvas-rendered hex grid with axial coordinates, viewport culling, pan, and zoom
- [ ] **Phase 2: Game Rules and Local Play** - Complete Connect6 rules, win detection, game over, rematch as a local two-player game
- [ ] **Phase 3: Theme and Touch Polish** - Light/dark theme, touch input (tap-to-place vs drag-to-pan), minimal aesthetic
- [ ] **Phase 4: WebRTC Multiplayer** - P2P connection via shareable link, host-authoritative state sync, connection status
- [ ] **Phase 5: Turn Timer** - Configurable turn timer with synchronized countdown and auto-forfeit

## Phase Details

### Phase 1: Hex Grid Engine
**Goal**: A navigable infinite hex grid is rendered on screen -- users can see hexes, pan around, zoom in/out, and see hover feedback on the hex under their cursor
**Depends on**: Nothing (first phase)
**Requirements**: GRID-01, GRID-02, GRID-03, GRID-04, GRID-05, GRID-06
**Success Criteria** (what must be TRUE):
  1. User sees a hex grid rendered on canvas using flat-top or pointy-top hexes with correct geometry
  2. User can click-drag to pan the board in any direction with no visible boundary
  3. User can scroll-wheel to zoom in and out smoothly, with hexes scaling correctly
  4. Only hexes within the visible viewport are drawn (zooming out does not cause frame drops)
  5. Hovering over a hex highlights it with a preview color
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold project + hex math + camera math with TDD
- [x] 01-02-PLAN.md — Canvas renderer + HexCanvas component with pan/zoom
- [x] 01-03-PLAN.md — Hover/debug polish + visual verification checkpoint

### Phase 2: Game Rules and Local Play
**Goal**: Two players sharing one browser can play a complete game of hex Connect6 with correct rules, win detection, and rematch -- a fully playable local prototype
**Depends on**: Phase 1
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, GAME-08, GAME-09, UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. X places 1 stone on the first turn, then players alternate placing 2 stones per turn -- enforced, not just displayed
  2. When a player gets 6 consecutive stones along any of the 3 hex axes, the game immediately ends and the winning line is highlighted
  3. A game over screen shows the winner and both players can trigger a rematch (first player swaps on rematch)
  4. A turn indicator always shows whose turn it is (X or O) and how many placements remain this turn (e.g., "1 of 2")
  5. A move counter tracks total moves played in the current game
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — TDD game rules: types, pure logic functions, win detection with full test coverage
- [ ] 02-02-PLAN.md — Reactive game state, stone rendering, canvas click-to-place integration
- [ ] 02-03-PLAN.md — DOM overlays (turn indicator, move counter, game over) + App wiring + visual verification

### Phase 3: Theme and Touch Polish
**Goal**: The game looks clean and minimal with light/dark theme support, and is fully playable on touch devices with correct gesture handling
**Depends on**: Phase 2
**Requirements**: UI-04, UI-05, UI-06, UI-07, UI-08
**Success Criteria** (what must be TRUE):
  1. User can toggle between light and dark theme, and the preference persists across browser sessions
  2. On a touch device, tapping a hex places a stone -- distinct from dragging to pan
  3. On a touch device, pinch gesture zooms the board in and out smoothly
  4. The UI is minimal and clean -- board and status information only, no visual clutter
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: WebRTC Multiplayer
**Goal**: Two players on separate devices can connect via a shared link and play a complete game over a peer-to-peer WebRTC connection
**Depends on**: Phase 3
**Requirements**: NET-01, NET-02, NET-03, NET-04, NET-05, NET-06
**Success Criteria** (what must be TRUE):
  1. Host creates a game and gets a shareable link; guest opens the link and both players are connected within seconds
  2. Moves made by one player appear on the other player's board immediately (sub-second latency)
  3. The host validates all moves -- a tampered guest client cannot place illegal moves
  4. A connection status indicator shows whether the opponent is connected or disconnected
  5. A complete game (placement, win detection, game over, rematch) works identically to local play but across two browsers
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Turn Timer
**Goal**: Host can configure a turn timer before the game starts, and both players see a synchronized countdown that enforces time limits
**Depends on**: Phase 4
**Requirements**: NET-07, NET-08, NET-09
**Success Criteria** (what must be TRUE):
  1. Before starting a game, the host can select a turn timer setting: 30 seconds, 60 seconds, or unlimited
  2. During timed games, both players see the same countdown timer that ticks in sync
  3. When the timer expires, the current player's remaining placements are automatically forfeited and the turn passes
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Hex Grid Engine | 3/3 | Complete | - |
| 2. Game Rules and Local Play | 0/3 | Planning complete | - |
| 3. Theme and Touch Polish | 0/0 | Not started | - |
| 4. WebRTC Multiplayer | 0/0 | Not started | - |
| 5. Turn Timer | 0/0 | Not started | - |
