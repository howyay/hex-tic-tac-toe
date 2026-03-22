# Feature Research

**Domain:** Peer-to-peer abstract strategy browser game (hex grid Connect6 variant)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Correct game rules and win detection | The game IS the rules. Wrong detection = unplayable. Connect6 1-2-2-2 placement with 6-in-a-row on 3 hex axes. | HIGH | Win detection on an infinite hex grid with 3 axes requires careful algorithm design. No boundary shortcuts. |
| Instant link-sharing to start a game | This is the "skribbl.io model" -- share link, opponent clicks, game starts. Zero friction is the entire onboarding. No accounts, no lobbies. | MEDIUM | Requires signaling server for WebRTC handshake. Link encodes room/session ID. |
| Responsive hex grid with pan and zoom | Infinite board demands navigation. Users expect drag-to-pan, scroll/pinch-to-zoom, smooth and performant. | HIGH | Canvas rendering with transform matrices. Must feel like a map app (Google Maps-tier smoothness). Touch support is critical even though mobile-native is out of scope. |
| Clear turn indicator | Players must always know: whose turn, how many stones left this turn (1 or 2). Confusion here ruins the game. | LOW | UI overlay or status bar. Simple but must be unambiguous. |
| Visual feedback on placement | Click/tap a hex, see your stone appear immediately. Hover preview showing where stone will go. Last-move highlight. | LOW | Standard canvas interaction. Hover state on hex cells, click to place, highlight last move(s). |
| Game over detection and display | When someone wins, show it clearly -- winning line highlighted, winner announced, game stops accepting moves. | MEDIUM | Must visually trace the winning 6-in-a-row. Natural endpoint that feels satisfying. |
| Rematch option | After game ends, "Play again" without regenerating a link. Both players stay connected. | LOW | Reset game state, keep WebRTC connection alive. Swap who goes first. |
| Connection status indicator | P2P connections can drop. Players need to know if opponent is connected, disconnected, or reconnecting. | LOW | WebRTC connection state events mapped to UI indicator. |
| Light/dark theme | Modern web app baseline. Users expect it, especially for a game they might play at night. | LOW | CSS custom properties or Svelte store toggle. Apply to both UI chrome and board colors. |
| Mobile-friendly touch controls | Even without a native app, players will share links via phone. Touch drag for pan, pinch for zoom, tap to place. | MEDIUM | Touch event handling on canvas. Distinguish between pan gesture and placement tap. Pinch-to-zoom. |

### Differentiators (Competitive Advantage)

Features that set this apart from Board Game Arena's Connect6 or generic implementations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zero-friction P2P (no account, no server dependency for gameplay) | Board Game Arena requires accounts. This is "click link, play immediately" -- the iMessage game model. Game state lives between the two peers, not on a server. | HIGH | WebRTC data channel for game state. Signaling server only for connection establishment. Core differentiator vs BGA. |
| Infinite hex grid (no board boundaries) | Standard Connect6 uses a 19x19 Go board. Infinite grid changes strategy fundamentally -- no edge-based tactics, pure open-field placement. Unique variant. | HIGH | Virtual rendering (only draw visible hexes). Coordinate system must handle arbitrary positions. |
| Configurable turn timer | Supports casual (unlimited) and competitive (30s, 60s) play. Host chooses before game starts. BGA has timers but this is a first-class, prominent setting. | LOW | Countdown timer synced between peers. Host sets pre-game. Visual countdown on board. |
| Reconnection support | Player disconnects (phone locks, wifi drops), rejoins via same link, game resumes. P2P games usually just die on disconnect -- this is a meaningful upgrade. | HIGH | Game state must be serialized and recoverable. Signaling server may need to facilitate re-handshake. Need to handle state reconciliation. |
| Minimal, distraction-free aesthetic | Lichess proves that minimalism wins for strategy games. No ads, no clutter, no gamification chrome. Board + stones + status. The game speaks for itself. | LOW | Design discipline more than code complexity. Resist feature creep. |
| "Center on action" button | On an infinite board, players can get lost. One-tap button to snap view to the area where stones have been placed (bounding box of all moves). | LOW | Calculate bounding box of placed stones, animate camera to center on it with appropriate zoom level. |
| Move counter / placement tracker | Show move number and which placement (1st or 2nd) within current turn. Helps players track game progression on a board with no natural boundaries. | LOW | Simple counter incremented on each placement. Display in status area. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this specific project.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| In-game chat | Players want to communicate | Moderation nightmare for anonymous play. Adds complexity. Players already have the channel they used to share the link (Discord, iMessage, etc). | Explicitly out of scope. Players communicate via their existing channel. |
| AI/bot opponent | "What if nobody's online?" | Significant complexity (Connect6 AI on hex grid is non-trivial). Dilutes the P2P multiplayer identity. Solving AI for an infinite board variant is a research problem. | Single-player is explicitly v2+ if ever. Focus on the human-vs-human experience. |
| User accounts and profiles | Tracking stats, history, ELO | Server infrastructure, auth, database, privacy concerns. Contradicts the "zero friction" identity. Board Game Arena already serves the "account + stats" crowd. | Anonymous play is the feature. No accounts IS the differentiator. |
| Game history and replays | "I want to review my games" | Requires persistent storage (server or client-side). Scope creep. Move data is ephemeral in P2P model. | Could export move list as text (copy to clipboard) as a lightweight alternative in v1.x. |
| Spectator mode | Friends want to watch | Third peer complicates WebRTC topology (mesh vs SFU). Two-player game means spectating adds little value for the complexity cost. | Out of scope. If demand emerges, consider one-way stream in v2+. |
| Sound effects and animations | "Make it feel polished" | Scope creep for v1. Subjective. Can alienate users who prefer quiet. Minimal aesthetic is a deliberate choice. | Subtle visual feedback only (hover states, placement confirmation, winning line highlight). Sound is v1.x at earliest, off by default. |
| Undo/take-back requests | "I misclicked" | Complex to implement in P2P (requires opponent approval protocol). Opens griefing vector. On an infinite board, misclicks are less costly than on a bounded board. | Confirm placement UI (show preview before committing) prevents the need for undo. |
| Multiple board sizes / variants | "Let me play Connect5 or Connect7 too" | Premature generalization. Each variant needs its own balancing and testing. Dilutes the core experience. | Ship one great variant (Connect6 on hex). Variants are a v2+ conversation. |
| Leaderboards / ranking system | Competitive players want ELO | Requires accounts, persistent server, anti-cheat. Contradicts anonymous model. | The game is its own reward. Competitive players can self-organize tournaments externally. |
| Internationalization / i18n | Broader audience | Very little text in the UI (it's a board game). Engineering overhead disproportionate to value. | Minimal text, use universal symbols/icons where possible. Defer i18n unless demand proves it. |

## Feature Dependencies

```
[WebRTC Signaling & P2P Connection]
    |
    +--requires--> [Link Sharing / Room System]
    |
    +--enables---> [Game State Sync]
    |                  |
    |                  +--enables---> [Turn Management (1-2-2-2 rule)]
    |                  |                   |
    |                  |                   +--enables---> [Win Detection (6-in-a-row)]
    |                  |                   |                   |
    |                  |                   |                   +--enables---> [Game Over Screen + Rematch]
    |                  |                   |
    |                  |                   +--enables---> [Turn Timer]
    |                  |
    |                  +--enables---> [Reconnection Support]
    |
    +--enables---> [Connection Status Indicator]

[Hex Grid Rendering (Canvas)]
    |
    +--requires--> [Hex Coordinate System]
    |
    +--enables---> [Pan & Zoom Navigation]
    |                  |
    |                  +--enables---> [Touch Controls]
    |                  |
    |                  +--enables---> ["Center on Action" Button]
    |
    +--enables---> [Stone Placement & Visual Feedback]
    |
    +--enables---> [Winning Line Highlight]

[Light/Dark Theme] -- independent, no dependencies

[Turn Indicator + Move Counter] -- requires [Turn Management]
```

### Dependency Notes

- **Game State Sync requires WebRTC P2P Connection:** All gameplay flows through the data channel. No connection = no game.
- **Win Detection requires Turn Management:** Must know the full board state after each placement to check for 6-in-a-row.
- **Reconnection requires both Game State Sync and Signaling:** Need serializable state AND ability to re-establish the P2P connection.
- **Pan/Zoom requires Hex Grid Rendering:** Navigation is meaningless without the rendered board.
- **Touch Controls enhance Pan/Zoom:** Same gestures, different input events. Must be designed together.
- **Center on Action enhances Pan/Zoom:** Depends on knowing both the camera system and the bounding box of placed stones.
- **Turn Timer enhances Turn Management:** Timer is an overlay on the existing turn system, not a prerequisite.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what's needed to validate the concept.

- [ ] Hex grid rendering on canvas with pan and zoom -- the board must exist and be navigable
- [ ] Hex coordinate system supporting arbitrary (infinite) positions -- no artificial bounds
- [ ] Stone placement with hover preview and click/tap to confirm -- core interaction
- [ ] Correct Connect6 rules: 1st turn 1 stone, then alternating 2 stones per turn -- the game
- [ ] Win detection across all 3 hex axes -- game must be completable
- [ ] WebRTC P2P connection via shareable link -- the multiplayer
- [ ] Turn indicator showing whose turn and placements remaining -- essential clarity
- [ ] Game over screen with winner display and rematch button -- complete game loop
- [ ] Connection status indicator -- players must know if opponent is present
- [ ] Light/dark theme -- modern baseline
- [ ] Basic touch support (tap to place, drag to pan) -- links will be shared on phones

### Add After Validation (v1.x)

Features to add once core is working and people are playing.

- [ ] Configurable turn timer (30s, 60s, unlimited) -- add when competitive players want pressure
- [ ] Reconnection support -- add when players report frustration from drops
- [ ] "Center on action" camera button -- add when players report getting lost on infinite board
- [ ] Move counter display -- add when players want to track game length
- [ ] Pinch-to-zoom on mobile -- add after basic touch works
- [ ] Last-move highlight (show which hexes were just placed) -- quality of life
- [ ] Copy move list to clipboard -- lightweight "replay" without server storage

### Future Consideration (v2+)

Features to defer until the core game has proven its value.

- [ ] AI/bot opponent -- only if solo demand is overwhelming, and even then it's a separate project
- [ ] Sound effects (stone placement click, timer warning) -- only off-by-default, only if aesthetic supports it
- [ ] Game variants (different win lengths, board constraints) -- only after hex Connect6 is polished
- [ ] Spectator mode -- only if tournament/streaming use case emerges
- [ ] Move export/import (portable game notation) -- only if community wants analysis tools

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Hex grid rendering + pan/zoom | HIGH | HIGH | P1 |
| Stone placement + visual feedback | HIGH | MEDIUM | P1 |
| Connect6 rules (1-2-2-2) | HIGH | MEDIUM | P1 |
| Win detection (3 hex axes) | HIGH | HIGH | P1 |
| WebRTC P2P via link | HIGH | HIGH | P1 |
| Turn indicator | HIGH | LOW | P1 |
| Game over + rematch | HIGH | LOW | P1 |
| Connection status | MEDIUM | LOW | P1 |
| Light/dark theme | MEDIUM | LOW | P1 |
| Basic touch support | MEDIUM | MEDIUM | P1 |
| Turn timer (configurable) | MEDIUM | LOW | P2 |
| Reconnection support | HIGH | HIGH | P2 |
| Center on action button | MEDIUM | LOW | P2 |
| Last-move highlight | MEDIUM | LOW | P2 |
| Move counter | LOW | LOW | P2 |
| Pinch-to-zoom | MEDIUM | MEDIUM | P2 |
| Move list export | LOW | LOW | P3 |
| Sound effects | LOW | LOW | P3 |
| AI opponent | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- the game is not shippable without these
- P2: Should have, add when possible -- improves experience significantly
- P3: Nice to have, future consideration -- does not block core value

## Competitor Feature Analysis

| Feature | Board Game Arena (Connect6) | Lichess (abstract strategy model) | This Project |
|---------|----------------------------|-----------------------------------|--------------|
| Account required | Yes (free + premium) | Optional (anonymous games exist) | No -- zero friction, link only |
| Board type | Fixed 19x19 Go board | Fixed 8x8 chess board | Infinite hex grid (unique) |
| Game variant | Standard Connect6 on square grid | Multiple chess variants | Connect6 adapted to hex grid (unique) |
| Matchmaking | Yes (lobby, ELO) | Yes (pool, rating) | No -- direct link sharing only |
| Turn timer | Platform-managed | Multiple time controls | Host-configurable (30s/60s/unlimited) |
| Analysis tools | Basic move review | Deep engine analysis, opening explorer | None (out of scope) |
| Reconnection | Platform-managed (server-side state) | Platform-managed | P2P reconnection via signaling re-handshake |
| Mobile support | Responsive web | Dedicated apps + responsive | Touch-friendly web, no native app |
| Theme/customization | Board Game Arena chrome | Extensive (themes, boards, pieces) | Light/dark only -- minimal by design |
| Social features | Friends, karma, chat | Teams, forums, messaging | None -- external communication |
| Cost | Free (premium for some features) | Completely free, open source | Completely free, no premium tier |

### Competitive Positioning

This project does NOT compete with Board Game Arena or Lichess head-on. It occupies a different niche:

- **BGA** serves the "I want a platform with many games, accounts, and community" user.
- **Lichess** serves the "I want deep analysis and competitive ranking" user.
- **This project** serves the "I want to send a friend a link and play RIGHT NOW" user.

The closest comparison model is games like skribbl.io, Gartic Phone, or codenames.game -- instant, link-based, anonymous, zero-setup multiplayer experiences. The hex grid Connect6 variant provides the unique gameplay; the delivery model provides the convenience.

## Sources

- [Board Game Arena - Connect6](https://en.boardgamearena.com/gamepanel?game=connectsix) -- feature reference for existing Connect6 implementation
- [Lichess Features](https://lichess.org/features) -- model for minimalist, free, strategy game platform
- [Connect6 - Wikipedia](https://en.wikipedia.org/wiki/Connect6) -- game rules and history
- [Board Game Arena FAQ](https://en.boardgamearena.com/faq) -- platform feature expectations
- [NetplayJS - P2P WebRTC game framework](https://github.com/rameshvarun/netplayjs) -- technical patterns for P2P browser games
- [WebRTC for browser multiplayer games](https://dev.to/bornfightcompany/using-webtrc-for-a-browser-multiplayer-game-in-theory-59dk) -- reconnection and data channel patterns
- [Infinite Canvas with zoom and pan](https://www.sandromaglione.com/articles/infinite-canvas-html-with-zoom-and-pan) -- UX patterns for infinite canvas navigation
- [Bloob.io](https://bloob.io/) -- zero-friction browser multiplayer reference

---
*Feature research for: Hex Connect6 P2P browser game*
*Researched: 2026-03-21*
