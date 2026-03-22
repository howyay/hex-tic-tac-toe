# Architecture Research

**Domain:** P2P hex grid board game (Connect6 variant)
**Researched:** 2026-03-21
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Presentation Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  HexCanvas   │  │   Game UI    │  │   Connection UI      │   │
│  │  (renderer)  │  │  (HUD/turns) │  │  (lobby/link share)  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
├─────────┴─────────────────┴──────────────────────┴───────────────┤
│                      Game Logic Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  HexGrid     │  │  GameRules   │  │   WinDetector        │   │
│  │  (coords +   │  │  (turns,     │  │   (6-in-a-row on     │   │
│  │   storage)   │  │   placement) │  │    3 hex axes)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                     Networking Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Connection   │  │  StateSync   │  │   Signaling          │   │
│  │  Manager     │  │  (game msg   │  │   (PeerJS cloud or   │   │
│  │  (WebRTC)    │  │   protocol)  │  │    self-hosted)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
├───────────────────────────────────────────────────────────────────┤
│                      State Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  GameStore   │  │  BoardStore  │  │   ConnectionStore    │   │
│  │  (turn, cfg) │  │  (pieces)   │  │   (peer status)      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| HexCanvas | Render hex grid on canvas, handle pan/zoom, map pixel clicks to hex coords | Svelte component wrapping HTML5 Canvas with requestAnimationFrame loop |
| Game UI | Display turn indicator, placement counter, timer, game-over overlay | Svelte components reading from GameStore |
| Connection UI | Lobby creation, link sharing, connection status display | Svelte components driving ConnectionManager |
| HexGrid | Axial coordinate math, neighbor lookup, coordinate conversion | Pure TypeScript module, no framework dependency |
| GameRules | Validate moves, manage turn state (1-2-2-2 pattern), enforce timer | Pure TypeScript module, operates on GameStore |
| WinDetector | Check for 6 consecutive pieces along any of 3 hex axes after each placement | Pure TypeScript module scanning from last-placed piece outward |
| ConnectionManager | Establish/maintain WebRTC data channel, handle reconnection | PeerJS wrapper with reconnection logic |
| StateSync | Serialize/deserialize game messages, resolve state conflicts | Message protocol layer on top of data channel |
| Signaling | Exchange connection metadata to establish P2P link | PeerJS cloud server (free tier) or self-hosted PeerServer |
| GameStore | Authoritative game state: whose turn, placements remaining, config, winner | Svelte 5 runes ($state) in .svelte.ts file |
| BoardStore | Sparse map of placed pieces keyed by axial coordinates | Svelte 5 runes wrapping a Map<string, Player> |
| ConnectionStore | Peer connection status, role (host/guest), peer ID | Svelte 5 runes in .svelte.ts file |

## Recommended Project Structure

```
src/
├── lib/
│   ├── game/               # Pure game logic (no Svelte dependency)
│   │   ├── hex.ts          # Axial coordinate system, conversions, neighbors
│   │   ├── rules.ts        # Turn validation, placement rules (1-2-2-2)
│   │   ├── win-detector.ts # 6-in-a-row check along 3 hex axes
│   │   └── types.ts        # Game types: Player, Move, GameState, GameConfig
│   ├── network/            # WebRTC networking
│   │   ├── connection.ts   # PeerJS wrapper, connection lifecycle
│   │   ├── protocol.ts     # Message types and serialization
│   │   └── sync.ts         # State sync logic, reconnection recovery
│   ├── stores/             # Svelte 5 reactive state
│   │   ├── game.svelte.ts  # GameStore: turn, config, phase
│   │   ├── board.svelte.ts # BoardStore: piece positions (sparse map)
│   │   └── connection.svelte.ts # ConnectionStore: peer status, role
│   └── canvas/             # Canvas rendering
│       ├── renderer.ts     # Hex grid drawing, piece rendering
│       ├── camera.ts       # Pan and zoom state, transforms
│       └── interaction.ts  # Click-to-hex mapping, input handling
├── routes/                 # SvelteKit routes (or single page)
│   ├── +page.svelte        # Main game page
│   └── +layout.svelte      # Theme (light/dark), global styles
├── components/             # Svelte UI components
│   ├── Board.svelte        # Canvas element + interaction wiring
│   ├── HUD.svelte          # Turn indicator, timer, placement count
│   ├── Lobby.svelte        # Create/join game, share link
│   └── GameOver.svelte     # Winner display, rematch button
└── app.css                 # Global styles, theme variables
```

### Structure Rationale

- **lib/game/:** Pure TypeScript with zero framework imports. This is the most testable code in the project. HexGrid math, rules, and win detection can be unit tested independently of rendering or networking.
- **lib/network/:** Isolated WebRTC concerns. The connection module wraps PeerJS, protocol defines the wire format, sync handles state recovery. Keeping this separate means you can swap PeerJS for raw WebRTC or another library without touching game logic.
- **lib/stores/:** Svelte 5 runes in `.svelte.ts` files provide reactive state accessible from any component. These are the single source of truth. Network messages and game logic both write to stores; UI reads from stores.
- **lib/canvas/:** Rendering is separated from interaction handling. The renderer draws based on store state. The camera manages viewport transforms. Interaction maps pixel events to hex coordinates and dispatches actions.
- **components/:** Thin Svelte components that compose stores, canvas, and UI. Minimal logic here -- delegate to lib modules.

## Architectural Patterns

### Pattern 1: Host-Authoritative State with Optimistic Local Apply

**What:** One peer (the game creator) is the authority on game state. Both peers apply moves locally for responsiveness, but the host's state is canonical. On reconnection, the guest receives the full state from the host.

**When to use:** Always in this project. Turn-based games with two players are a perfect fit -- the host validates moves and the guest trusts the host.

**Trade-offs:**
- Pro: Simple conflict resolution (host wins), straightforward reconnection (guest gets full state dump)
- Pro: No need for consensus algorithms or CRDTs
- Con: If host disconnects, game pauses until host reconnects (acceptable for 2-player casual game)
- Con: Host could theoretically cheat (acceptable -- this is a casual game between friends)

**Example:**
```typescript
// On guest: send move to host, apply locally
function placePiece(q: number, r: number) {
  const move = { type: 'place', q, r, player: localPlayer };
  // Optimistic local apply
  boardStore.set(q, r, localPlayer);
  gameStore.consumePlacement();
  // Send to host for validation
  connection.send(move);
}

// On host: validate and broadcast confirmation
function handleRemoteMove(move: Move) {
  if (rules.isValidMove(gameState, move)) {
    boardStore.set(move.q, move.r, move.player);
    gameStore.consumePlacement();
    connection.send({ type: 'move-accepted', ...move });
  } else {
    // Reject: send current state to resync
    connection.send({ type: 'full-state', state: getFullState() });
  }
}
```

### Pattern 2: Sparse Map for Infinite Board

**What:** Store placed pieces in a Map keyed by coordinate string (e.g., `"3,-1"`) rather than a 2D array. The board has no boundaries -- only occupied cells exist in memory.

**When to use:** Always. An infinite hex grid cannot use a fixed-size array.

**Trade-offs:**
- Pro: O(1) lookup, insertion, and deletion. Memory proportional to number of pieces, not board size.
- Pro: No boundary checks needed. Any axial coordinate is valid.
- Con: Iteration over "nearby" cells requires explicit neighbor enumeration (trivial with axial coords).

**Example:**
```typescript
type CellKey = `${number},${number}`;
type Player = 'X' | 'O';

// Sparse board storage
const pieces = new Map<CellKey, Player>();

function toKey(q: number, r: number): CellKey {
  return `${q},${r}`;
}

function getCell(q: number, r: number): Player | undefined {
  return pieces.get(toKey(q, r));
}

function setCell(q: number, r: number, player: Player): void {
  pieces.set(toKey(q, r), player);
}
```

### Pattern 3: Axial Coordinates with Cube Math

**What:** Store and transmit hex positions as axial (q, r) coordinates. Derive the third cube coordinate s = -q - r when needed for algorithms. Use cube coordinates for neighbor finding, distance, and line detection.

**When to use:** Always. This is the established standard for hex grid games per Red Blob Games.

**Trade-offs:**
- Pro: Two coordinates for storage/transmission, three for algorithms. Best of both worlds.
- Pro: Uniform neighbor offsets (no odd/even row special cases like offset coordinates).
- Pro: Distance formula is trivial: `max(abs(q1-q2), abs(r1-r2), abs(s1-s2))`.
- Con: Less intuitive than offset coords for people new to hex grids (mitigated by well-documented pattern).

**Neighbor directions in axial:**
```typescript
const HEX_DIRECTIONS = [
  { q: +1, r:  0 }, // East
  { q: -1, r:  0 }, // West
  { q:  0, r: +1 }, // Southeast
  { q:  0, r: -1 }, // Northwest
  { q: +1, r: -1 }, // Northeast
  { q: -1, r: +1 }, // Southwest
] as const;
```

### Pattern 4: Directional Win Scan from Last Placement

**What:** After each piece is placed, only scan outward from that piece along the 3 hex axes (6 directions, paired into 3 lines). Count consecutive same-color pieces in each direction pair. If any reaches 6, declare winner.

**When to use:** Every placement. No need to scan the full board.

**Trade-offs:**
- Pro: O(k) where k is at most 5 in each direction (max 30 cells checked per scan). Effectively O(1).
- Pro: Works on infinite board since it only looks outward from the placed piece.
- Con: None significant. This is the standard approach.

**Example:**
```typescript
function checkWin(q: number, r: number, player: Player): boolean {
  // 3 axes, each defined by a pair of opposite directions
  const axes = [
    [{ q: +1, r: 0 }, { q: -1, r: 0 }],   // East-West
    [{ q: 0, r: +1 }, { q: 0, r: -1 }],     // SE-NW
    [{ q: +1, r: -1 }, { q: -1, r: +1 }],   // NE-SW
  ];

  for (const [dir1, dir2] of axes) {
    let count = 1; // the placed piece itself
    count += countInDirection(q, r, dir1, player);
    count += countInDirection(q, r, dir2, player);
    if (count >= 6) return true;
  }
  return false;
}

function countInDirection(
  q: number, r: number, dir: { q: number; r: number }, player: Player
): number {
  let count = 0;
  let cq = q + dir.q;
  let cr = r + dir.r;
  while (getCell(cq, cr) === player) {
    count++;
    if (count >= 5) break; // Can't need more than 5 in one direction
    cq += dir.q;
    cr += dir.r;
  }
  return count;
}
```

## Data Flow

### Game Turn Flow

```
Player clicks canvas
    |
    v
Interaction.ts: pixel-to-hex conversion (camera transform inverse + axial rounding)
    |
    v
Rules.ts: validate placement (correct player, cell empty, placements remaining)
    |
    v
BoardStore: place piece at (q, r)
GameStore: decrement placements remaining
    |
    v
WinDetector: scan from (q, r) along 3 axes
    |
    +---> Win found? --> GameStore: set winner, game over
    |
    v
GameStore: placements remaining == 0? --> advance turn, reset placements
    |
    v
StateSync: serialize move --> ConnectionManager: send via data channel
    |
    v
Remote peer receives --> validate (if host) or apply (if guest)
    |
    v
Renderer: reads BoardStore + GameStore --> draws updated board on next frame
```

### Connection Establishment Flow

```
Host clicks "Create Game"
    |
    v
ConnectionManager: new Peer(hostId) via PeerJS
    |
    v
Signaling: register with PeerJS cloud server
    |
    v
UI: generate shareable link containing hostId
    |
    v
Guest opens link --> ConnectionManager: new Peer() then peer.connect(hostId)
    |
    v
PeerJS signaling server: exchange SDP offers/answers + ICE candidates
    |
    v
WebRTC data channel established (direct P2P)
    |
    v
Host sends: { type: 'game-config', timer, ... }
Guest sends: { type: 'player-ready' }
    |
    v
Host sends: { type: 'game-start', state }
    |
    v
Game begins
```

### Reconnection Flow

```
Peer disconnects (network drop, tab close)
    |
    v
ConnectionStore: status = 'disconnected', game paused
    |
    v
Disconnected peer reopens link (same hostId in URL)
    |
    v
ConnectionManager: reconnect to same hostId
    |
    v
Host sends: { type: 'full-state', state: currentGameState }
    |
    v
Guest applies full state --> game resumes
```

### State Management

```
                    Svelte 5 Runes (.svelte.ts files)
                    ┌──────────────────────────┐
 Network msgs -->   │  GameStore   BoardStore  │ <-- Local UI actions
                    │  ConnectionStore         │
                    └──────────┬───────────────┘
                               | $state / $derived
                               v
                    ┌──────────────────────────┐
                    │  Svelte Components       │
                    │  (reactive re-render)    │
                    └──────────────────────────┘
                               |
                               v
                    ┌──────────────────────────┐
                    │  Canvas Renderer         │
                    │  (reads stores per frame)│
                    └──────────────────────────┘
```

### Key Data Flows

1. **Local move:** Click -> pixel-to-hex -> validate -> update stores -> render + send to peer
2. **Remote move:** Data channel message -> deserialize -> validate (host) or apply (guest) -> update stores -> render
3. **Reconnection:** Peer reconnects -> host sends full state dump -> guest replaces all stores -> render
4. **Timer tick:** setInterval on host -> decrement timer -> broadcast tick -> both peers update GameStore -> UI re-renders

## Message Protocol

The wire protocol between peers should be a simple JSON-based message system:

| Message Type | Direction | Payload | Purpose |
|-------------|-----------|---------|---------|
| `game-config` | Host -> Guest | `{ timer, hostColor }` | Initial game configuration |
| `game-start` | Host -> Guest | `{ fullState }` | Game begins with initial state |
| `place` | Either -> Host | `{ q, r }` | Piece placement request |
| `move-accepted` | Host -> Guest | `{ q, r, player, turnState }` | Confirmed placement |
| `full-state` | Host -> Guest | `{ board, turn, placements, timer, winner }` | State recovery on reconnect |
| `timer-sync` | Host -> Guest | `{ remaining }` | Periodic timer synchronization |
| `rematch` | Either -> Either | `{}` | Request rematch |
| `rematch-accept` | Either -> Either | `{}` | Accept rematch |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-100 concurrent games | PeerJS free cloud server for signaling. No infrastructure needed beyond static hosting. |
| 100-1000 concurrent games | Self-host PeerServer (single Node.js process). PeerJS cloud may rate-limit. |
| 1000+ concurrent games | Multiple PeerServer instances behind load balancer. Add TURN server for peers behind strict NATs. |

### Scaling Priorities

1. **First bottleneck: Signaling server.** PeerJS cloud is free but not guaranteed. Self-host a PeerServer instance on a cheap VPS or serverless function. This is trivial -- PeerServer is ~10 lines of setup.
2. **Second bottleneck: NAT traversal.** About 10-15% of peers may fail to establish direct connections due to symmetric NATs. A TURN relay server resolves this but costs bandwidth. Use free TURN services initially (Google provides public STUN; Metered.ca offers free TURN tier).

## Anti-Patterns

### Anti-Pattern 1: Offset Coordinates for Hex Grid

**What people do:** Use offset coordinates (col, row with odd/even offsets) because they feel familiar from square grids.
**Why it's wrong:** Neighbor calculation requires branching on odd/even row. Distance calculation is complex. Algorithms that work trivially with axial coords become error-prone. Every operation on the grid needs special-case code.
**Do this instead:** Use axial coordinates (q, r) everywhere. Derive cube coordinate s = -q-r when needed. All neighbors are uniform offsets. Distance is a single formula.

### Anti-Pattern 2: Full Board Sync on Every Move

**What people do:** Serialize and send the entire board state after every move.
**Why it's wrong:** Board grows over time. Wastes bandwidth and adds latency. Unnecessary for a turn-based game where moves are atomic.
**Do this instead:** Send individual moves (`{ type: 'place', q, r }`). Reserve full-state sync for reconnection recovery only.

### Anti-Pattern 3: Canvas Re-render on Every State Change

**What people do:** Re-draw the entire canvas whenever any piece of state changes (new piece, timer tick, etc.).
**Why it's wrong:** Drawing hundreds of hexagons every frame is wasteful. On large boards with many pieces, this causes jank.
**Do this instead:** Use a dirty-flag approach: only re-render when the viewport changes (pan/zoom) or a piece is placed. Cache the board to an offscreen canvas and only draw the delta. Timer and HUD updates should be in DOM elements outside the canvas, not drawn on it.

### Anti-Pattern 4: Storing Game State Only in Components

**What people do:** Keep game state in component-local variables, pass via props, and manage through event dispatch.
**Why it's wrong:** Game state needs to be accessible from both UI components and the network layer. Component-local state creates coupling between rendering and logic. Makes testing impossible without mounting components.
**Do this instead:** Use Svelte 5 runes in `.svelte.ts` files as externalized stores. Components subscribe reactively. Network layer writes directly to stores. Game logic modules read/write stores. Everything is decoupled.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PeerJS Cloud | PeerJS client library connects automatically | Free, no setup. Fallback: self-host PeerServer. |
| STUN Server | Configured in PeerJS/RTCPeerConnection ICE config | Google public STUN (`stun:stun.l.google.com:19302`) is free and reliable. |
| TURN Server | Configured in ICE config, used when direct P2P fails | Only needed for ~10-15% of connections. Metered.ca free tier or self-hosted coturn. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Canvas <-> Stores | Stores are read-only from renderer's perspective; renderer pulls state each frame | Renderer never modifies game state. One-way data flow. |
| Game Logic <-> Stores | Game logic functions accept state params and return new state or mutations | Pure functions where possible. Stores apply mutations. |
| Network <-> Stores | Network layer writes to stores on incoming messages; reads stores for outgoing | Network module imports stores directly. No event bus needed for 2-peer game. |
| UI Components <-> Stores | Components use $derived for display values, call action functions for mutations | Components are thin wrappers. Logic lives in lib modules. |

## Build Order (Dependency Graph)

This ordering reflects what depends on what. Each layer can be built and tested independently before integrating with the next.

```
Phase 1: lib/game/hex.ts + lib/game/types.ts
    |     (axial coords, conversions, neighbors -- foundation for everything)
    v
Phase 2: lib/canvas/renderer.ts + lib/canvas/camera.ts + lib/canvas/interaction.ts
    |     (render hex grid, pan/zoom, click-to-hex -- requires hex module)
    v
Phase 3: lib/game/rules.ts + lib/game/win-detector.ts + lib/stores/*.svelte.ts
    |     (game logic + reactive state -- requires hex + types)
    v
Phase 4: components/Board.svelte + components/HUD.svelte
    |     (wire canvas + stores + UI -- requires all above)
    v
Phase 5: lib/network/connection.ts + lib/network/protocol.ts + lib/network/sync.ts
    |     (WebRTC P2P -- requires stores for state sync)
    v
Phase 6: components/Lobby.svelte + components/GameOver.svelte + reconnection
          (multiplayer UX -- requires network layer)
```

**Rationale:** Build the pure game engine first (hex math, rules, win detection) so it can be tested in isolation. Add rendering second so you can visually verify the grid. Add game state and UI third for a playable local prototype. Add networking last -- it is the most complex and benefits from a stable game layer beneath it.

## Sources

- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) -- definitive reference for hex coordinate systems, algorithms, and rendering (HIGH confidence)
- [PeerJS Documentation](https://peerjs.com/) -- WebRTC abstraction library with built-in signaling (HIGH confidence)
- [PlayPeerJS](https://github.com/therealPaulPlay/PlayPeerJS) -- game-focused PeerJS wrapper with reconnection and state sync (MEDIUM confidence -- newer library, less battle-tested)
- [WebRTC Data Channels - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels) -- authoritative reference on data channel capabilities (HIGH confidence)
- [Taming WebRTC with PeerJS (Toptal)](https://www.toptal.com/webrtc/taming-webrtc-with-peerjs) -- practical P2P game architecture walkthrough (MEDIUM confidence)
- [Svelte 5 Runes and Global State](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) -- patterns for shared state in Svelte 5 (HIGH confidence)

---
*Architecture research for: P2P hex grid board game (Connect6 variant)*
*Researched: 2026-03-21*
