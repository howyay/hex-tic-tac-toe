# Phase 4: WebRTC Multiplayer - Research

**Researched:** 2026-03-23
**Domain:** PeerJS WebRTC data channels, host-authoritative P2P game state sync, Svelte 5 view routing
**Confidence:** HIGH

## Summary

Phase 4 adds online multiplayer via PeerJS WebRTC data channels. The host creates a game with a nanoid-based ID embedded in the URL hash, the guest opens the link and connects peer-to-peer. The host is authoritative -- it validates all moves and sends confirmations or full-state corrections. The existing pure game logic (`rules.ts`) is perfectly suited for host-side validation since `isValidMove` and `applyMove` are stateless pure functions operating on `GameSnapshot`.

The main architectural challenge is introducing view routing (landing page vs game board) and wrapping the existing `GameStateAPI` with a network-aware layer that intercepts moves for P2P transmission while maintaining the same interface for all existing UI components. The `GameSnapshot` uses `Map<string, Player>` which requires serialization to/from plain objects for JSON transmission over the data channel.

**Primary recommendation:** Use PeerJS 1.5.x with JSON serialization (default), nanoid for game IDs, hash-based routing in App.svelte with simple `$state` view management (no router library needed). Create a `NetworkGameState` wrapper that conforms to `GameStateAPI` and delegates to PeerJS for move transmission.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Full landing page with: game title + tagline, visual hex grid preview in background, brief rules summary, two buttons: "Local Game" and "Online Game"
- **D-02:** Theme toggle remains accessible on the landing page
- **D-03:** Guest links (URLs with hash ID) bypass the landing page and show a "Join Game" button
- **D-04:** Hash-based game ID in URL: `example.com/#abc123` -- no server routing needed, works on static site
- **D-05:** Game ID generated with nanoid (8 chars, URL-safe)
- **D-06:** Host clicks "Online Game" -> game created, waiting overlay appears over the hex board with the shareable link + "Copy" button
- **D-07:** Guest opens link -> sees "Join Game" button -> clicks to connect and start
- **D-08:** Game starts as soon as guest clicks Join -- no separate lobby or countdown
- **D-09:** Host is always X (places 1 stone first turn), guest is always O
- **D-10:** On rematch, roles stay the same (host=X, guest=O) but loser goes first per existing Phase 2 logic
- **D-11:** Status indicator in top-left corner (opposite theme toggle)
- **D-12:** Three states with colored dot + text: green "Connected", yellow "Connecting...", red "Disconnected"
- **D-13:** PeerJS Cloud for signaling (free, zero config) -- self-host later if needed
- **D-14:** Peer ID = nanoid game ID -- host registers as this ID, guest connects to it

### Claude's Discretion
- Exact PeerJS configuration options
- Message protocol format (JSON structure for moves, game state sync)
- How host-authoritative validation works (reject + send current state, or just ignore)
- Landing page exact layout and styling
- Rules summary wording
- Whether to show the game ID visually or just as a copyable link
- Error handling for connection failures (PeerJS unavailable, invalid game ID)

### Deferred Ideas (OUT OF SCOPE)
- Self-hosted PeerServer for production -- backlog, use PeerJS Cloud for now
- TURN server for users behind symmetric NATs -- backlog
- Reconnection support (RES-01, RES-02, RES-03) -- explicitly v2 requirements
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| NET-01 | Host creates a game and receives a shareable link | PeerJS `new Peer(gameId)` with nanoid-generated ID; URL constructed as `location.origin + '/#' + gameId` |
| NET-02 | Guest joins by opening the shared link in their browser | Parse `location.hash` on load; show "Join Game" UI; `peer.connect(gameId)` on click |
| NET-03 | Connection established via WebRTC data channel using PeerJS | PeerJS DataConnection with JSON serialization; `peer.on('connection')` on host, `peer.connect()` on guest |
| NET-04 | Game state synchronized directly between peers (no game server) | Host-authoritative model: guest sends move requests, host validates via `isValidMove`/`applyMove` and sends confirmed state |
| NET-05 | Host validates all moves (host-authoritative model) | Host runs `isValidMove()` on received moves; rejects invalid moves by sending full GameSnapshot |
| NET-06 | Connection status indicator shows connected/disconnected state | PeerJS events: `open`, `close`, `error`, `disconnected` drive a reactive `$state` connection status |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| peerjs | 1.5.5 | WebRTC data channel abstraction with built-in signaling | Project constraint. 250K+ weekly npm downloads. Handles ICE negotiation, signaling via PeerJS Cloud. |
| nanoid | 5.1.7 | URL-safe game ID generation (8 chars) | User decision D-05. Tiny (130 bytes), no dependencies, URL-safe alphabet by default. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none additional) | - | - | Svelte 5 runes handle all state management; no router needed for 2-view app |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nanoid | crypto.randomUUID() | UUID is 36 chars, too long for shareable links. nanoid's 8 chars are ideal for verbal/text sharing. |
| Hash-based routing | svelte-routing / page.js | Extreme overkill for 2 views (landing page, game). Simple `$state` view + `hashchange` listener is sufficient. |
| PeerJS JSON serialization | MessagePack / protobuf | Unnecessary optimization for a turn-based game sending tiny JSON payloads (<1KB). JSON is debuggable and built-in. |

**Installation:**
```bash
npm install peerjs nanoid
```

**Version verification:** peerjs 1.5.5 and nanoid 5.1.7 confirmed current via npm registry on 2026-03-23.

## Architecture Patterns

### Recommended Project Structure (new files for Phase 4)
```
src/
├── lib/
│   ├── network/
│   │   ├── connection.ts        # PeerJS wrapper: create/join game, send/receive
│   │   ├── protocol.ts          # Message type definitions and serialization
│   │   └── network-state.svelte.ts  # Reactive connection status, role, game ID
│   ├── state/
│   │   ├── game-state.svelte.ts     # (existing) local game state
│   │   └── online-game-state.svelte.ts  # Network-aware game state wrapper
│   └── game/
│       └── rules.ts             # (existing) pure validation functions
├── components/
│   ├── LandingPage.svelte       # Main menu with Local/Online buttons
│   ├── WaitingOverlay.svelte    # Host waiting for guest + share link
│   ├── JoinOverlay.svelte       # Guest "Join Game" button
│   ├── ConnectionStatus.svelte  # Green/yellow/red dot + text
│   └── (existing components)    # HexCanvas, TurnIndicator, etc. unchanged
└── App.svelte                   # View routing: landing vs game
```

### Pattern 1: View Routing via $state (No Router)
**What:** App.svelte uses a `$state` variable to track the current view (`'landing' | 'local-game' | 'online-host' | 'online-guest'`). Hash changes on page load determine the initial view.
**When to use:** Always -- only 2-3 views, no URL history management needed.
**Example:**
```typescript
// In App.svelte
type AppView = 'landing' | 'local-game' | 'online-host' | 'online-guest';

let view = $state<AppView>('landing');
let gameId = $state<string | null>(null);

// On mount: check hash for guest link (D-03)
$effect(() => {
  const hash = window.location.hash.slice(1);
  if (hash && hash.length >= 6) {
    gameId = hash;
    view = 'online-guest';
  }
});
```

### Pattern 2: Network Game State Wrapping GameStateAPI
**What:** Create a `createOnlineGameState()` factory that conforms to the same `GameStateAPI` interface but intercepts `placeStone()` to send moves over PeerJS instead of (or in addition to) applying locally.
**When to use:** For online games. Local games continue using `createGameState()` directly.
**Why:** All existing UI components (HexCanvas, TurnIndicator, MoveCounter, GameOverlay) accept `GameStateAPI` -- they work unchanged with either local or network state.
**Example:**
```typescript
// Host: validate + apply + broadcast
function placeStone(hex: HexCoord): void {
  if (role === 'host') {
    // Host applies locally (authoritative) and sends confirmation
    if (!isValidMove(snapshot, hex)) { /* rejection flash */ return; }
    snapshot = applyMove(snapshot, hex);
    connection.send({ type: 'move-confirmed', snapshot: serializeSnapshot(snapshot) });
  } else {
    // Guest: send request to host, do NOT apply locally yet
    connection.send({ type: 'move-request', q: hex.q, r: hex.r });
  }
}
```

### Pattern 3: Host-Authoritative with Guest Optimistic Apply
**What:** Guest sends move requests. Host validates and either confirms (sends updated snapshot) or rejects (sends current snapshot). Guest applies confirmed state.
**When to use:** Always for online games per NET-05.
**Recommendation:** Do NOT use optimistic local apply for the guest. Keep it simple -- guest sends request, waits for host confirmation. With sub-second WebRTC latency, the delay is imperceptible for a turn-based game. This avoids rollback complexity entirely.
**Example:**
```typescript
// Host receives move request from guest
function handleGuestMove(msg: MoveRequest): void {
  const hex = { q: msg.q, r: msg.r };
  if (isValidMove(snapshot, hex)) {
    snapshot = applyMove(snapshot, hex);
    sendToGuest({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
  } else {
    // Reject: send current state to resync
    sendToGuest({ type: 'state-update', snapshot: serializeSnapshot(snapshot) });
  }
}
```

### Pattern 4: GameSnapshot Serialization
**What:** `GameSnapshot.board` is a `Map<string, Player>` which JSON.stringify cannot handle. Convert to/from a plain object for wire transmission.
**When to use:** Every message containing game state.
**Example:**
```typescript
interface SerializedSnapshot {
  board: Record<string, Player>;  // Map entries as plain object
  currentPlayer: Player;
  placementsThisTurn: number;
  isFirstTurn: boolean;
  totalMoves: number;
  status: GameStatus;
  winner: Player | null;
  winningLine: HexCoord[];
  startingPlayer: Player;
}

function serializeSnapshot(s: GameSnapshot): SerializedSnapshot {
  return {
    ...s,
    board: Object.fromEntries(s.board),
  };
}

function deserializeSnapshot(s: SerializedSnapshot): GameSnapshot {
  return {
    ...s,
    board: new Map(Object.entries(s.board)),
  };
}
```

### Pattern 5: Message Protocol
**What:** Typed discriminated union for all P2P messages.
**Example:**
```typescript
type GameMessage =
  | { type: 'move-request'; q: number; r: number }        // Guest -> Host
  | { type: 'state-update'; snapshot: SerializedSnapshot } // Host -> Guest
  | { type: 'game-start'; snapshot: SerializedSnapshot }   // Host -> Guest
  | { type: 'rematch-request' }                            // Either -> Either
  | { type: 'rematch-accept'; snapshot: SerializedSnapshot } // Host -> Guest
  | { type: 'ping' }                                       // Either (keepalive)
  | { type: 'pong' };                                      // Either (keepalive)
```

### Anti-Patterns to Avoid
- **Bidirectional state authority:** Never let the guest modify game state independently. All state changes flow through the host. The guest only has a read-only copy updated by host messages.
- **Optimistic apply with rollback on guest:** Adds complexity for zero perceived benefit in a turn-based game with <100ms latency. Keep it simple: guest waits for host confirmation.
- **Full state sync on every move:** Only the host sends state updates. Use full snapshot (not deltas) since the snapshot is small (<2KB even with 100+ moves). Deltas add complexity without meaningful bandwidth savings.
- **Storing PeerJS Peer object in $state:** PeerJS objects are not serializable and have internal state. Store the Peer instance in a plain `let` variable, expose only reactive status/connection info via `$state`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebRTC signaling | Custom WebSocket signaling server | PeerJS Cloud (built-in) | Signaling is the hardest part of WebRTC. PeerJS handles SDP exchange, ICE candidates, STUN. |
| URL-safe random IDs | Math.random or crypto.randomUUID | nanoid | Configurable length, URL-safe alphabet, collision-resistant. UUID is too long for sharing. |
| Game state validation | Separate validation for network vs local | Existing `isValidMove()` + `applyMove()` | These pure functions work identically for both local and network play. |
| Connection status tracking | Manual WebRTC event handling | PeerJS connection events -> $state | PeerJS normalizes connection lifecycle events across browsers. |

**Key insight:** The existing pure game logic in `rules.ts` is the foundation. Do not create separate "network rules" -- the same `isValidMove()` and `applyMove()` functions serve both local and host-authoritative network play.

## Common Pitfalls

### Pitfall 1: PeerJS Custom ID Character Restrictions
**What goes wrong:** PeerJS peer IDs must start and end with alphanumeric characters. nanoid's default alphabet includes `-` and `_` which are fine in the middle but could appear at start/end.
**Why it happens:** nanoid uses `A-Za-z0-9_-` by default.
**How to avoid:** Use `nanoid`'s custom alphabet to restrict to alphanumeric only, OR use the default but validate/regenerate if the first/last char is non-alphanumeric. Simplest approach: use a custom alphabet of `0123456789abcdefghijklmnopqrstuvwxyz` which is always PeerJS-safe and still gives ~2.8 trillion combinations at 8 chars.
**Warning signs:** "Invalid peer id" error from PeerJS on connection.

### Pitfall 2: PeerJS Cloud Availability
**What goes wrong:** PeerJS Cloud (`0.peerjs.com`) is a free community service. It may be slow, rate-limited, or temporarily down.
**Why it happens:** Free tier, no SLA.
**How to avoid:** Handle the `error` event on the Peer object gracefully. Show a user-friendly message ("Could not connect to game server. Please try again."). Consider a retry with exponential backoff (1s, 2s, 4s).
**Warning signs:** `peer.on('error')` fires with type `'server-error'` or `'network'`.

### Pitfall 3: Map Serialization Gotcha
**What goes wrong:** `JSON.stringify(gameSnapshot)` silently converts `Map` to `{}`, losing all board data.
**Why it happens:** JSON.stringify does not know how to serialize Map objects.
**How to avoid:** Always use the `serializeSnapshot`/`deserializeSnapshot` helpers. Never send raw GameSnapshot over the wire.
**Warning signs:** Guest receives empty board after state sync.

### Pitfall 4: Hash Routing and Page Reload
**What goes wrong:** Setting `window.location.hash` causes a hashchange event which could re-trigger view routing logic.
**Why it happens:** The hashchange listener fires whenever the hash changes, including programmatic changes.
**How to avoid:** Use a flag to distinguish programmatic hash changes from user navigation, OR only read the hash once on initial load and ignore subsequent changes.
**Warning signs:** View flickers or resets when creating a game.

### Pitfall 5: PeerJS Connection Race Condition
**What goes wrong:** Host's `peer.on('connection')` may fire before the host's own `peer.on('open')` completes, or the guest may try to connect before the host has registered.
**Why it happens:** PeerJS registration is async. If the guest opens the link very quickly (automated testing, fast link sharing), the host peer ID may not be registered yet.
**How to avoid:** Guest should handle `peer-unavailable` error and retry after a short delay. Host should only show the shareable link after `peer.on('open')` fires.
**Warning signs:** Guest gets "Could not connect to peer" error on first attempt.

### Pitfall 6: Data Channel Closing on Tab Visibility
**What goes wrong:** Some browsers throttle or close WebRTC data channels when a tab is in the background.
**Why it happens:** Browser power-saving features.
**How to avoid:** Not critical for v1 (reconnection is deferred to v2). For now, if the connection drops, show "Disconnected" status. Users can refresh to reconnect manually.
**Warning signs:** Connection drops after opponent switches tabs for extended period.

### Pitfall 7: Rematch State Sync
**What goes wrong:** Both players click rematch, but roles and starting player get out of sync.
**Why it happens:** Rematch involves resetting state on both peers. If not coordinated through the host, they may compute different starting states.
**How to avoid:** Follow the host-authoritative pattern for rematch too. Either player can request rematch. Host computes the new `GameSnapshot` via `applyRematch()` and sends it to the guest as a `game-start` message. Guest never calls `applyRematch()` locally -- it always receives the new state from the host.
**Warning signs:** Players see different "whose turn" indicators after rematch.

## Code Examples

### PeerJS Host Setup
```typescript
// Source: PeerJS docs (https://peerjs.com/docs/) + verified API
import Peer from 'peerjs';
import { nanoid, customAlphabet } from 'nanoid';

const generateGameId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

function createHost() {
  const gameId = generateGameId();
  const peer = new Peer(gameId, {
    debug: 0, // Errors only
  });

  peer.on('open', (id) => {
    // Safe to share link now
    const link = `${window.location.origin}${window.location.pathname}#${id}`;
    // Update UI with shareable link
  });

  peer.on('connection', (conn) => {
    conn.on('open', () => {
      // Guest connected, send initial game state
      conn.send({ type: 'game-start', snapshot: serializeSnapshot(snapshot) });
    });

    conn.on('data', (data) => {
      handleGuestMessage(data as GameMessage);
    });

    conn.on('close', () => {
      // Update connection status to 'disconnected'
    });
  });

  peer.on('error', (err) => {
    console.error('PeerJS error:', err.type, err.message);
    // Show user-friendly error
  });

  return { peer, gameId };
}
```

### PeerJS Guest Setup
```typescript
function joinGame(gameId: string) {
  const peer = new Peer(); // Random ID for guest

  peer.on('open', () => {
    const conn = peer.connect(gameId, {
      reliable: true,
    });

    conn.on('open', () => {
      // Connected to host
    });

    conn.on('data', (data) => {
      handleHostMessage(data as GameMessage);
    });

    conn.on('close', () => {
      // Host disconnected
    });
  });

  peer.on('error', (err) => {
    if (err.type === 'peer-unavailable') {
      // Game not found or host not ready -- retry or show error
    }
  });

  return peer;
}
```

### Connection Status Indicator (Svelte 5)
```svelte
<script lang="ts">
  type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';
  let { status }: { status: ConnectionStatus } = $props();

  const statusConfig = {
    connected:    { color: '#22c55e', text: 'Connected' },
    connecting:   { color: '#eab308', text: 'Connecting...' },
    disconnected: { color: '#ef4444', text: 'Disconnected' },
  };

  const config = $derived(statusConfig[status]);
</script>

<div class="connection-status">
  <span class="dot" style:background-color={config.color}></span>
  <span class="text">{config.text}</span>
</div>
```

### Clipboard Copy (for shareable link)
```typescript
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers or non-HTTPS
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PeerJS with callbacks only | PeerJS 1.5.x supports both callbacks and Promise patterns | 2024 | Cleaner async code possible |
| nanoid v3 (CommonJS) | nanoid v5 (ESM-only) | 2023 | Must use ESM imports; `import { nanoid } from 'nanoid'` |
| Manual ICE server config | PeerJS Cloud includes default STUN | Always | No ICE config needed for dev; ~85% of connections work without TURN |

**Deprecated/outdated:**
- PeerJS `serialization: 'binary'` option: Still works but JSON is simpler for structured game messages and adds negligible overhead for tiny payloads.

## Open Questions

1. **PeerJS peer ID uniqueness**
   - What we know: nanoid with 8 alphanumeric chars gives ~2.8 trillion combinations. Collision probability is negligible for casual use.
   - What's unclear: PeerJS Cloud may have stale peer IDs from crashed sessions that haven't timed out. A new game could theoretically get an ID collision with a zombie peer.
   - Recommendation: Handle `'unavailable-id'` error from PeerJS. If the ID is taken, generate a new one and retry (max 3 attempts).

2. **Guest move input blocking**
   - What we know: Guest sends move request and waits for host confirmation before state updates.
   - What's unclear: Should the guest's UI block further clicks while waiting for confirmation?
   - Recommendation: Yes, disable input on the guest side after sending a move request. Re-enable when `state-update` arrives. With <100ms latency this is imperceptible but prevents double-click issues.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.x |
| Config file | Inline in vite.config.ts (Vite plugin handles it) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NET-01 | Host creates game with shareable link | unit | `npx vitest run src/lib/network/connection.test.ts -t "host"` | Wave 0 |
| NET-02 | Guest joins via shared link | unit | `npx vitest run src/lib/network/connection.test.ts -t "guest"` | Wave 0 |
| NET-03 | WebRTC data channel via PeerJS | manual-only | Manual: open two browser tabs | N/A (requires real PeerJS) |
| NET-04 | Game state synced between peers | unit | `npx vitest run src/lib/network/protocol.test.ts` | Wave 0 |
| NET-05 | Host validates all moves | unit | `npx vitest run src/lib/network/protocol.test.ts -t "validation"` | Wave 0 |
| NET-06 | Connection status indicator | manual-only | Manual: verify UI shows status changes | N/A (UI component) |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/network/protocol.test.ts` -- covers NET-04, NET-05 (serialization, message handling, host validation logic)
- [ ] `src/lib/network/connection.test.ts` -- covers NET-01, NET-02 (game ID generation, URL construction, hash parsing)

Note: NET-03 and NET-06 are manual-only. PeerJS requires a real signaling server and browser WebRTC stack; unit tests would need extensive mocking with diminishing returns. The protocol and validation logic (pure functions) are thoroughly testable.

## Sources

### Primary (HIGH confidence)
- PeerJS documentation (https://peerjs.com/docs/) -- Peer constructor, DataConnection API, events
- PeerJS GitHub (https://github.com/peers/peerjs) -- source code, PeerOptions interface, ID validation rules
- nanoid npm registry -- v5.1.7 confirmed, ESM-only, customAlphabet API
- Existing codebase -- `rules.ts`, `game-state.svelte.ts`, `types.ts` patterns directly inform network layer design

### Secondary (MEDIUM confidence)
- `.planning/research/ARCHITECTURE.md` -- host-authoritative pattern, message protocol design, connection flow diagrams
- MDN WebRTC Data Channels (https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels) -- reliable vs unreliable channels

### Tertiary (LOW confidence)
- PeerJS Cloud availability/reliability -- no SLA documentation found; assumed acceptable for v1 based on community usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PeerJS and nanoid are project constraints/user decisions, versions verified against npm registry
- Architecture: HIGH - Host-authoritative pattern well-documented in ARCHITECTURE.md, pure game logic functions confirmed suitable for network validation
- Pitfalls: HIGH - PeerJS ID restrictions verified from source code, Map serialization issue confirmed by inspecting GameSnapshot type
- Protocol design: MEDIUM - Based on ARCHITECTURE.md patterns and PeerJS capabilities, but specific message flow untested

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable libraries, no fast-moving concerns)
