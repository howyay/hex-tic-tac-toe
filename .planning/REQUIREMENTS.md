# Requirements: Hex Tic-Tac-Toe

**Defined:** 2026-03-21
**Core Value:** Two players can connect via a shared link and play a complete game of hex Connect6 with correct rules and win detection.

## v1 Requirements

### Grid & Board

- [ ] **GRID-01**: Hex grid rendered on HTML5 Canvas using axial coordinates (q, r)
- [ ] **GRID-02**: Grid is unbounded — pieces can be placed at any hex position
- [ ] **GRID-03**: Only hexes within the visible viewport are rendered (viewport culling)
- [ ] **GRID-04**: User can pan the board by click-dragging (desktop) or touch-dragging (mobile)
- [ ] **GRID-05**: User can zoom in/out via scroll wheel (desktop) or pinch gesture (mobile)
- [ ] **GRID-06**: Hex under cursor/finger shows hover preview of current player's stone color

### Game Logic

- [ ] **GAME-01**: X places 1 stone on the first turn
- [ ] **GAME-02**: After the first turn, players alternate placing 2 stones per turn
- [ ] **GAME-03**: A player wins when they have 6 consecutive stones along any of the 3 hex axes
- [ ] **GAME-04**: Win detection checks all 3 hex axes: horizontal (q-axis), and both diagonals (r-axis, s-axis)
- [ ] **GAME-05**: Game ends immediately when a win is detected — no further placements accepted
- [ ] **GAME-06**: Winning line of 6 stones is visually highlighted on the board
- [ ] **GAME-07**: Game over screen displays the winner (X or O)
- [ ] **GAME-08**: Both players can trigger a rematch without generating a new link
- [ ] **GAME-09**: On rematch, first player alternates (loser goes first, or swap)

### Multiplayer

- [ ] **NET-01**: Host creates a game and receives a shareable link
- [ ] **NET-02**: Guest joins by opening the shared link in their browser
- [ ] **NET-03**: Connection established via WebRTC data channel using PeerJS
- [ ] **NET-04**: Game state is synchronized directly between peers (no game server)
- [ ] **NET-05**: Host validates all moves (host-authoritative model)
- [ ] **NET-06**: Connection status indicator shows connected/disconnected state
- [ ] **NET-07**: Host can set turn timer before game starts (30s, 60s, or unlimited)
- [ ] **NET-08**: Timer countdown visible to both players during timed games
- [ ] **NET-09**: Turn automatically forfeits remaining placements when timer expires

### UI/UX

- [ ] **UI-01**: Turn indicator shows whose turn it is (X or O)
- [ ] **UI-02**: Placement counter shows how many stones remain this turn (e.g., "2 of 2")
- [ ] **UI-03**: Move counter tracks total moves played
- [ ] **UI-04**: Light and dark theme toggle
- [ ] **UI-05**: Theme preference persisted in localStorage
- [ ] **UI-06**: Touch-friendly: tap to place stone on mobile
- [ ] **UI-07**: Touch gestures: drag to pan, pinch to zoom — distinct from tap-to-place
- [ ] **UI-08**: Minimal, clean aesthetic — board and status only, no clutter

## v2 Requirements

### Resilience

- **RES-01**: Player can rejoin via same link if disconnected, game state preserved
- **RES-02**: Automatic reconnection attempt on connection drop
- **RES-03**: Game state serialization for reconnection recovery

### Navigation

- **NAV-01**: "Center on action" button snaps view to bounding box of placed stones
- **NAV-02**: Animated camera transitions when centering

### Polish

- **POL-01**: Last-move highlight showing most recently placed stones
- **POL-02**: Subtle placement animation when stone is placed
- **POL-03**: Export move list to clipboard (lightweight replay)

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI/bot opponent | Connect6 AI on infinite hex grid is a research problem; multiplayer-only focus |
| User accounts or profiles | Anonymous play IS the differentiator; zero friction |
| Game history or replays | Requires persistent storage; P2P model is ephemeral |
| Spectator mode | Third peer complicates WebRTC topology for minimal value |
| In-game chat | Players communicate via channel used to share the link |
| Sound effects | Minimal aesthetic is deliberate; v1.x at earliest, off by default |
| Undo/take-back | Complex P2P protocol; hover preview prevents misclicks |
| Multiple variants | Ship one great variant; premature generalization |
| Leaderboards/ranking | Requires accounts, server, anti-cheat; contradicts anonymous model |
| Mobile native app | Web only; touch-friendly responsive design instead |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| GRID-01 | — | Pending |
| GRID-02 | — | Pending |
| GRID-03 | — | Pending |
| GRID-04 | — | Pending |
| GRID-05 | — | Pending |
| GRID-06 | — | Pending |
| GAME-01 | — | Pending |
| GAME-02 | — | Pending |
| GAME-03 | — | Pending |
| GAME-04 | — | Pending |
| GAME-05 | — | Pending |
| GAME-06 | — | Pending |
| GAME-07 | — | Pending |
| GAME-08 | — | Pending |
| GAME-09 | — | Pending |
| NET-01 | — | Pending |
| NET-02 | — | Pending |
| NET-03 | — | Pending |
| NET-04 | — | Pending |
| NET-05 | — | Pending |
| NET-06 | — | Pending |
| NET-07 | — | Pending |
| NET-08 | — | Pending |
| NET-09 | — | Pending |
| UI-01 | — | Pending |
| UI-02 | — | Pending |
| UI-03 | — | Pending |
| UI-04 | — | Pending |
| UI-05 | — | Pending |
| UI-06 | — | Pending |
| UI-07 | — | Pending |
| UI-08 | — | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 0
- Unmapped: 32 ⚠️

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after initial definition*
