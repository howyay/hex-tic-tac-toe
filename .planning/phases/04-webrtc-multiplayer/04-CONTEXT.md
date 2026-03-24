# Phase 4: WebRTC Multiplayer - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Two players on separate devices connect via a shared link and play a complete game over WebRTC. Includes: landing page with local/online mode selection, link creation/sharing, PeerJS connection, host-authoritative game state sync, connection status indicator. Requirements: NET-01 through NET-06.

</domain>

<decisions>
## Implementation Decisions

### Landing page / main menu
- **D-01:** Full landing page with: game title + tagline, visual hex grid preview in background, brief rules summary ("X places 1, then alternate 2. First to 6 in a row wins."), two buttons: "Local Game" and "Online Game"
- **D-02:** Theme toggle remains accessible on the landing page
- **D-03:** Guest links (URLs with hash ID) bypass the landing page and show a "Join Game" button

### Link sharing flow
- **D-04:** Hash-based game ID in URL: `example.com/#abc123` — no server routing needed, works on static site
- **D-05:** Game ID generated with nanoid (8 chars, URL-safe)
- **D-06:** Host clicks "Online Game" → game created, waiting overlay appears over the hex board with the shareable link + "Copy" button
- **D-07:** Guest opens link → sees "Join Game" button → clicks to connect and start
- **D-08:** Game starts as soon as guest clicks Join — no separate lobby or countdown

### Role assignment
- **D-09:** Host is always X (places 1 stone first turn), guest is always O
- **D-10:** On rematch, roles stay the same (host=X, guest=O) but loser goes first per existing Phase 2 logic

### Connection status
- **D-11:** Status indicator in top-left corner (opposite theme toggle)
- **D-12:** Three states with colored dot + text: green "Connected", yellow "Connecting...", red "Disconnected"

### Signaling
- **D-13:** PeerJS Cloud for signaling (free, zero config) — self-host later if needed
- **D-14:** Peer ID = nanoid game ID — host registers as this ID, guest connects to it

### Claude's Discretion
- Exact PeerJS configuration options
- Message protocol format (JSON structure for moves, game state sync)
- How host-authoritative validation works (reject + send current state, or just ignore)
- Landing page exact layout and styling
- Rules summary wording
- Whether to show the game ID visually or just as a copyable link
- Error handling for connection failures (PeerJS unavailable, invalid game ID)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### PeerJS
- PeerJS documentation at https://peerjs.com/ — API reference for Peer, DataConnection
- PeerJS npm: https://www.npmjs.com/package/peerjs — v1.5.x

### Game state (Phase 2 source of truth)
- `src/lib/game/rules.ts` — Pure game logic: applyMove, applyRematch, createInitialSnapshot, isValidMove, coordKey
- `src/lib/hex/types.ts` — GameSnapshot, Player, HexCoord types
- `src/lib/state/game-state.svelte.ts` — Reactive state wrapper, placeStone/rematch methods

### Project research
- `.planning/research/ARCHITECTURE.md` — Host-authoritative P2P model, state sync patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/game/rules.ts` — Pure functions (applyMove, isValidMove, createInitialSnapshot, applyRematch) are perfect for host-side validation
- `src/lib/state/game-state.svelte.ts` — `createGameState()` factory; needs to be extended or wrapped for network play
- `src/lib/hex/types.ts` — GameSnapshot is serializable (Map needs conversion to/from plain object for JSON)
- `src/components/HexCanvas.svelte` — Canvas component, works with any GameStateAPI
- All DOM overlay components (TurnIndicator, GameOverlay, MoveCounter) — work via props, network-agnostic

### Established Patterns
- Factory functions: `createGameState()`, `createThemeState()` — follow this for `createNetworkState()` or similar
- Svelte 5 runes: `$state`, `$derived` in `.svelte.ts` files
- GameSnapshot is immutable — applyMove returns new snapshot, never mutates

### Integration Points
- App.svelte currently hardcodes `createGameState()` — needs routing logic for local vs online mode
- `GameSnapshot.board` is a `Map<string, Player>` — must serialize to JSON for network transmission
- HexCanvas accepts `gameState: GameStateAPI` — network game state must conform to same interface
- Landing page is a new top-level view (App.svelte needs view/route state)

</code_context>

<specifics>
## Specific Ideas

- The landing page should feel welcoming and explain what the game is — someone receiving a link might not know
- "Join Game" button on the guest side gives the guest agency — they're not just auto-thrown into a game
- The shareable link should be prominent and easy to copy on the waiting screen
- nanoid for game IDs — short, URL-safe, easy to share verbally or via message

</specifics>

<deferred>
## Deferred Ideas

- Self-hosted PeerServer for production — backlog, use PeerJS Cloud for now
- TURN server for users behind symmetric NATs — backlog, ~85% of connections work with STUN alone
- Reconnection support (RES-01, RES-02, RES-03) — explicitly v2 requirements

</deferred>

---

*Phase: 04-webrtc-multiplayer*
*Context gathered: 2026-03-23*
