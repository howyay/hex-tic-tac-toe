# Pitfalls Research

**Domain:** P2P browser-based hexagonal board game (Connect6 variant on infinite hex grid)
**Researched:** 2026-03-21
**Confidence:** HIGH (well-documented domain with extensive community post-mortems)

## Critical Pitfalls

### Pitfall 1: Using Offset Coordinates for the Hex Grid

**What goes wrong:**
Offset coordinates (the intuitive row/column system) break nearly every hex grid algorithm. You cannot safely add or subtract offset coordinates because the adjustment depends on whether the row/column is odd or even. Neighbor lookup requires two separate direction tables based on parity. Distance calculation, line drawing, and rotation all become error-prone special cases. On an infinite grid where coordinates go negative, the parity check via modulo (`%`) fails with negative numbers (must use bitwise AND `&` instead), introducing subtle bugs that only appear when players pan into negative-coordinate territory.

**Why it happens:**
Offset coordinates feel natural because they map to rectangular arrays. Developers reach for them first because they "look right" on screen. The problems only surface when implementing algorithms, by which point the coordinate system is woven throughout the codebase.

**How to avoid:**
Use axial coordinates (q, r) from the start. Axial is equivalent to cube coordinates (q, r, s) with s = -q - r computed on demand. Axial supports addition, subtraction, distance, neighbors, line drawing, and rotation with clean, uniform formulas. Store all game state in axial coordinates. Convert to pixel coordinates only at the rendering boundary. Follow the Red Blob Games hex grid guide as the canonical reference.

**Warning signs:**
- Neighbor tables with odd/even branching logic
- Off-by-one bugs that only appear in certain grid regions
- Win detection returning false positives/negatives depending on board position
- Different behavior when pieces are placed in negative vs. positive coordinates

**Phase to address:**
Phase 1 (hex grid foundation). The coordinate system is the first decision and the hardest to change later. Every subsequent feature depends on it.

---

### Pitfall 2: Game State Desynchronization Between Peers

**What goes wrong:**
In P2P games without a central server, both clients maintain their own copy of game state. If the state update logic has any non-determinism or if messages are processed in different orders, the two clients diverge silently. Players see different boards. One player thinks they won while the other sees a different outcome. In a turn-based game this seems unlikely, but it happens through: race conditions when both clients process a move at slightly different times, reconnection logic that reconstructs state incorrectly, or browser differences in JavaScript execution producing different floating-point results during coordinate conversions.

**Why it happens:**
Turn-based games feel "safe" from desync because there is no real-time simulation. Developers skip state validation, assuming sequential moves cannot diverge. But edge cases around reconnection, rapid clicking, and network message ordering create gaps.

**How to avoid:**
Designate one peer as the authoritative "host." The host validates all moves and broadcasts the canonical state. The guest sends move requests; the host confirms or rejects them. Implement periodic state checksums -- after each move, both peers compute a hash of the board state and exchange it. If checksums disagree, the guest re-syncs from the host. Keep game state as a simple, serializable structure (a Map of axial coordinates to player symbols) so it can be transmitted in full during reconnection.

**Warning signs:**
- Players reporting "I placed there but it showed somewhere else"
- Win detection triggering for one player but not the other
- Reconnection producing a different board than the opponent sees
- No state validation layer between network messages and game state mutations

**Phase to address:**
Phase 2 (networking/WebRTC). The authority model must be decided before any game state sync code is written. Checksums should be part of the protocol from day one, not bolted on after bugs appear.

---

### Pitfall 3: WebRTC Connection Fails for ~20% of Users (NAT/Firewall)

**What goes wrong:**
WebRTC relies on NAT traversal via STUN servers to establish direct P2P connections. This works for most residential networks but fails behind symmetric NATs, corporate firewalls, and some mobile carriers. Without a TURN relay fallback, approximately 10-20% of connection attempts silently fail. The user sees "connecting..." forever with no useful error message. The game appears broken.

**Why it happens:**
Developers test on their own network (or localhost) where connections always succeed. They use free Google STUN servers, which handle STUN but not TURN. TURN relay servers cost money and bandwidth, so they get deferred or skipped entirely.

**How to avoid:**
Budget for TURN relay from the start. Use a service like Metered.ca, Twilio, or Cloudflare Calls that provides both STUN and TURN. Configure the RTCPeerConnection ICE servers list to include TURN credentials. Implement a connection timeout (10-15 seconds) with a clear error message and retry option. For a hobby project, Cloudflare Calls or a self-hosted coturn server on a cheap VPS are cost-effective options. Test the connection flow from a mobile hotspot and behind a VPN to simulate restrictive networks.

**Warning signs:**
- "Works on my machine" but friends cannot connect
- No TURN server in ICE configuration
- No connection timeout or error handling in the join flow
- Testing only on localhost or same LAN

**Phase to address:**
Phase 2 (networking). TURN configuration is part of the initial WebRTC setup, not an optimization to add later. The signaling server and ICE configuration should be built and tested together.

---

### Pitfall 4: WebRTC Reconnection Destroys Game State

**What goes wrong:**
When a WebRTC DataChannel disconnects (network blip, laptop sleep, tab backgrounding), the RTCPeerConnection transitions through "disconnected" then "failed" states. Naive implementations tear down the entire connection and create a new one, losing the game state. The player returns to a "create new game" screen instead of resuming. Even when developers handle reconnection, they often conflate the "disconnected" state (temporary, may self-heal) with the "failed" state (requires ICE restart or new connection), causing premature teardowns.

**Why it happens:**
WebRTC connection lifecycle has multiple states (new, connecting, connected, disconnected, failed, closed) with non-obvious semantics. The spec says "disconnected" is temporary and may recover, but many implementations treat it as terminal. Additionally, RTCDataChannel objects do not survive across ICE restarts -- you need to re-create them, which means the reconnection flow must re-establish the data channel and re-sync game state.

**How to avoid:**
Separate game state from connection state completely. Game state lives in its own store, never inside the WebRTC connection object. On "disconnected," wait 5-10 seconds for self-recovery via ICE. On "failed," use `restartIce()` for a first attempt, then fall back to full re-signaling via the signaling server. After any reconnection, transmit the full game state from the host to the rejoining peer. The shareable game link should encode a room/session ID that persists across reconnections, allowing the signaling server to match reconnecting peers.

**Warning signs:**
- Game state stored inside the connection handler or peer object
- No distinction between "disconnected" and "failed" handling
- Reconnection flow that starts a new game instead of resuming
- No session ID concept in the shareable link

**Phase to address:**
Phase 2 (networking), but requires Phase 1 game state to be designed for serialization. The game state store must be independently testable and serializable before networking is added.

---

### Pitfall 5: Win Detection on Infinite Grid is Incorrect or Incomplete

**What goes wrong:**
Connect6 win detection on a hex grid requires checking 3 axes (not 4 like a square grid) for 6 consecutive pieces. On an infinite grid with no bounds, a naive "scan the whole board" approach is both slow and error-prone. Common bugs: checking only 2 axes (forgetting the third hex diagonal), off-by-one in the consecutive count (detecting 5 or 7 instead of 6), only checking from the last-placed piece in one direction instead of both directions along each axis, and failing to check win conditions for pieces placed in the same turn (since players place 2 per turn, the second piece might complete a line through the first).

**Why it happens:**
Square grid tic-tac-toe win detection is a solved, simple problem. Developers port that mental model to hex grids without fully accounting for hex coordinate geometry. The three hex axes in axial coordinates are: (1,0), (0,1), and (1,-1) directions -- the third axis is non-obvious and easily missed. The "two pieces per turn" rule adds complexity because both placements in a single turn can contribute to a win.

**How to avoid:**
Check win only from newly placed pieces (not the whole board). For each placed piece, walk in both directions along all 3 hex axes, counting consecutive same-color pieces. The 3 direction pairs in axial coordinates are: [(1,0)/(-1,0)], [(0,1)/(0,-1)], [(1,-1)/(-1,1)]. If total consecutive count (including the piece itself) reaches 6 on any axis, that player wins. Check after each individual piece placement within a turn -- do not wait until the turn ends. Write explicit unit tests for all 3 axes, including cases that cross the origin and extend into negative coordinates.

**Warning signs:**
- Win detection logic with only 2 direction pairs
- No unit tests for wins along the third hex axis (the 1,-1 diagonal)
- Win check that only runs at end of turn, not after each placement
- No tests for wins involving negative coordinates

**Phase to address:**
Phase 1 (game logic). Win detection is core game logic that must be correct before any UI or networking is added. It should be a pure function with exhaustive unit tests.

---

### Pitfall 6: Canvas Rendering Performance Degrades on Large/Zoomed-Out Boards

**What goes wrong:**
As the game progresses and players pan/zoom out to survey the board, the renderer attempts to draw hundreds or thousands of hex cells that are either off-screen or sub-pixel in size. Without culling (skipping off-screen hexes) and level-of-detail adjustment (simplifying tiny hexes), frame rates drop from 60fps to single digits. The pan/zoom interaction becomes laggy, making the game feel broken even though the logic is correct.

**How to avoid:**
Implement viewport culling from the start: calculate which axial coordinates are visible at the current pan offset and zoom level, and only draw those hexes. For the grid lines, draw a procedural repeating pattern based on the viewport rather than iterating all hexes in the game state. Clear the canvas with a full transform reset before each frame (forgetting this causes artifacts during zoom). Use `requestAnimationFrame` for rendering but only re-render when the viewport or game state actually changes (dirty flag pattern). Consider rendering the grid to an off-screen canvas and only redrawing pieces on the main canvas.

**Warning signs:**
- Frame rate drops when zooming out
- Drawing loop iterates over all pieces/cells regardless of viewport
- Canvas clear produces artifacts during zoom transitions
- Rendering fires on every mouse move event instead of batched in requestAnimationFrame

**Phase to address:**
Phase 1 (rendering). Viewport culling must be part of the initial canvas rendering architecture. Retrofitting culling into a "draw everything" renderer requires significant refactoring.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing game state as a 2D array instead of a sparse Map | Familiar data structure | Cannot represent infinite grid; forces artificial bounds; wastes memory for sparse boards | Never -- use a Map keyed by "q,r" string from the start |
| Hardcoding STUN-only ICE config | No server costs | 10-20% of users cannot connect; no fallback path | Early prototyping only; add TURN before any user testing |
| Skipping the host/guest authority model | Simpler networking; both peers mutate state directly | Desync bugs surface under reconnection and race conditions | Never for a game with shared mutable state |
| Using `setInterval` for turn timer | Simple implementation | Drifts from real time; tabs throttle setInterval to 1/sec when backgrounded | Only if timer is purely cosmetic; use `Date.now()` delta for authoritative time |
| Coupling rendering to game state updates | Fewer abstractions | Cannot test game logic without canvas; cannot change renderers; complicates networking | Never -- game state should be a plain data structure |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| WebRTC Signaling | Building a complex signaling server with room management, auth, presence | Start with the minimum: exchange SDP offer/answer and ICE candidates. A simple WebSocket server or even a serverless function (Cloudflare Workers) suffices for 2-player games |
| STUN/TURN Services | Using only `stun:stun.l.google.com:19302` | Include at least one TURN server. Google STUN is fine for STUN but provides no TURN relay. Metered.ca free tier or self-hosted coturn covers hobby use |
| WebRTC DataChannel | Opening multiple channels for different message types before the connection is stable | Open a single reliable ordered DataChannel for turn-based game state. Multiple channels add complexity with no benefit for a low-frequency turn-based game |
| Canvas Touch Events | Using click events and assuming mouse input | Use pointer events (`pointerdown`, `pointermove`, `pointerup`) which unify mouse and touch. Implement `touch-action: none` CSS to prevent browser gestures from interfering with pan/zoom |
| Svelte Reactivity + Canvas | Trying to use Svelte reactive statements to drive canvas rendering directly | Canvas is imperative. Use Svelte for UI overlays (turn indicator, timer, menus) and a separate imperative rendering loop for the canvas. Connect them via a shared game state store |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Drawing all hexes on every frame | Smooth at start, laggy after 50+ moves | Viewport culling + dirty flag rendering | ~100 visible hexes at zoomed-out view |
| JSON.stringify for every WebRTC message | Imperceptible for first moves | Use a compact message format (e.g., `{t:"move",q:3,r:-2}`) | Not a real concern for turn-based with <1 msg/sec, but good practice |
| Recomputing pixel positions on every render | Subtle frame drops during pan | Cache hex-to-pixel conversions; only recompute on zoom change | >200 pieces on board |
| Full state retransmission on every move | Works fine for 10 pieces | Send only the move delta; transmit full state only on reconnection | >500 pieces (unlikely in practice for Connect6 but good architecture) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting the guest peer's move messages without validation | Opponent can place pieces on occupied cells, place during wrong turn, place more pieces than allowed, or claim a win falsely | Host validates every move: correct player, correct turn phase (1st piece or 2nd), cell is empty, then broadcasts the validated state |
| Exposing signaling server without rate limiting | Signaling server can be flooded with connection requests, exhausting WebSocket connections | Rate limit by IP on the signaling server; use short-lived room IDs that expire after connection establishment |
| Storing room/session secrets in the URL hash only | URL sharing via messaging apps may log the URL, allowing third parties to attempt connection | Room IDs should be unguessable (UUIDs) but not treated as secrets; the signaling server should only allow 2 peers per room and reject further connections |
| No validation of DataChannel message format | Malformed messages can crash the game or produce unexpected state | Parse and validate all incoming messages against a schema before processing; reject malformed messages silently |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading/connection state feedback | User shares link, friend clicks it, nothing visible happens for 5-10 seconds during ICE negotiation | Show explicit connection states: "Waiting for opponent...", "Connecting...", "Connected!" with a progress indicator |
| Hex cell click target too small | User clicks between hexes or on the wrong hex, especially on mobile | Make the click target the full hex area; highlight the hex under the cursor/finger before placement; add a confirm step or undo for the first placement in a two-placement turn |
| No indication of remaining placements in a turn | User places one piece and thinks their turn is over (or doesn't realize they get two) | Show "Place piece 1 of 2" / "Place piece 2 of 2" prominently; highlight that it is still the same player's turn |
| Pan gesture conflicts with piece placement on mobile | Touch-to-place and touch-to-pan are the same gesture | Use a mode toggle (pan mode vs. place mode), or require a longer press to pan, or use two-finger pan exclusively for navigation |
| Zoom level makes board unreadable | User zooms out too far and hexes become indistinguishable dots | Set minimum and maximum zoom bounds; at extreme zoom-out, show a minimap or overview indicator of where pieces are clustered |

## "Looks Done But Isn't" Checklist

- [ ] **Win detection:** Works on all 3 hex axes, not just the obvious 2. Test with a diagonal win along the (1,-1) axis specifically
- [ ] **First-turn rule:** First player places only 1 piece. Easy to forget this special case and let them place 2
- [ ] **Reconnection:** Both peers can survive a 30-second network dropout and resume the same game. Not just "reconnect" but "reconnect and see the correct board"
- [ ] **Turn timer:** Still accurate after the browser tab is backgrounded for 30 seconds (setInterval is throttled in background tabs). Use wall-clock time, not accumulated intervals
- [ ] **Mobile touch:** Pan, zoom, and piece placement all work on a phone without conflicting gestures
- [ ] **Negative coordinates:** Game works correctly when all pieces are in negative-coordinate space (tests the parity/modulo bug in offset coords, or validates axial coords work uniformly)
- [ ] **Link sharing:** The shareable link actually works when opened in a different browser/device, not just a second tab in the same browser (which bypasses real NAT traversal)
- [ ] **Game end state:** After a win, both peers see the same winner and neither can place additional pieces
- [ ] **Draw condition:** Addressed or explicitly deferred. On an infinite grid, draws are theoretically impossible, but turn timers and disconnection need defined outcomes

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong coordinate system (offset instead of axial) | HIGH | Rewrite all coordinate storage, rendering, neighbor/distance calculations, and win detection. Essentially a rewrite of the grid layer |
| No TURN server | LOW | Add TURN credentials to ICE config; deploy coturn or sign up for Metered.ca. No code architecture changes needed |
| Desync bugs from missing authority model | HIGH | Refactor to host-authoritative model; add move validation on host; change guest to send requests instead of mutations. Touches every networking path |
| Canvas performance from no culling | MEDIUM | Add viewport bounds calculation and filter the render loop. Architecture stays the same if rendering is already separated from game state |
| Win detection bugs | LOW-MEDIUM | Fix the direction vectors and add unit tests. Low cost if game logic is a pure function; medium cost if tangled with rendering or networking |
| Touch/gesture conflicts on mobile | MEDIUM | Requires rethinking the input model. Easier if input handling is a separate layer; harder if click handlers are mixed into the canvas rendering code |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Wrong hex coordinate system | Phase 1: Grid Foundation | Unit tests for neighbor finding, distance, and coordinate conversion all pass, including negative coordinates |
| Game state desync | Phase 2: Networking | Checksum comparison after each move; automated test where both peers log state after each turn and states match |
| NAT/firewall connection failures | Phase 2: Networking | Test connection from mobile hotspot and VPN; TURN candidates appear in ICE candidate list |
| Reconnection destroys state | Phase 2: Networking | Test: disconnect one peer for 15 seconds, reconnect, verify board state matches |
| Incomplete win detection | Phase 1: Game Logic | Unit tests covering all 3 axes, negative coordinates, two-piece turn wins, and edge cases at count boundaries (5 and 7 should not win) |
| Canvas rendering performance | Phase 1: Rendering | Maintain 60fps with 200 pieces on board at minimum zoom level; verified with browser performance profiler |
| Turn timer drift in background tabs | Phase 1 or 2: Game Logic/Networking | Background the tab for 30 seconds, foreground it, timer shows correct remaining time |
| Touch/gesture conflicts | Phase 1: Rendering/Input | Manual test on a real phone: can pan, zoom, and place pieces without accidental actions |
| Cheating via unvalidated moves | Phase 2: Networking | Automated test: send an illegal move from guest, verify host rejects it and state is unchanged |

## Sources

- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) -- canonical hex grid coordinate reference
- [Synchronous RTS Engines and a Tale of Desyncs](https://www.forrestthewoods.com/blog/synchronous_rts_engines_and_a_tale_of_desyncs/) -- game state desync post-mortem
- [Handling WebRTC Session Disconnections](https://bloggeek.me/handling-session-disconnections-in-webrtc/) -- WebRTC reconnection lifecycle
- [Get Over It: WebRTC Isn't Peer-to-Peer](https://bloggeek.me/webrtc-not-p2p/) -- NAT traversal and TURN requirements
- [What is WebRTC and How to Avoid Its 3 Deadliest Pitfalls](https://www.mindk.com/blog/what-is-webrtc-and-how-to-avoid-its-3-deadliest-pitfalls/) -- WebRTC deployment pitfalls
- [RTCPeerConnection: restartIce() Method - MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/restartIce) -- ICE restart API
- [WebRTC DataChannel Reliability](https://jameshfisher.com/2017/01/17/webrtc-datachannel-reliability/) -- DataChannel ordered/reliable modes
- [RTCDataChannel Guide: File Transfer, Game Sync & Message Size Limits](https://webrtc.link/en/articles/rtcdatachannel-usage-and-message-size-limits/) -- DataChannel configuration for games
- [Game Networking: Time, Tick, Clock Synchronisation](https://daposto.medium.com/game-networking-2-time-tick-clock-synchronisation-9a0e76101fe5) -- timer synchronization in P2P games
- [Taming WebRTC with PeerJS: Making a Simple P2P Web Game](https://www.toptal.com/webrtc/taming-webrtc-with-peerjs) -- practical WebRTC game implementation
- [Connect6 - Wikipedia](https://en.wikipedia.org/wiki/Connect6) -- Connect6 game rules and properties
- [Infinite HTML Canvas with Zoom and Pan](https://www.sandromaglione.com/articles/infinite-canvas-html-with-zoom-and-pan) -- canvas rendering patterns
- [Optimising HTML5 Canvas Rendering](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) -- canvas performance techniques

---
*Pitfalls research for: P2P browser-based hexagonal board game (Connect6 variant)*
*Researched: 2026-03-21*
