# Project Research Summary

**Project:** Hex Tic-Tac-Toe (P2P Hexagonal Connect6)
**Domain:** Real-time P2P abstract strategy browser game on an infinite hex grid
**Researched:** 2026-03-21
**Confidence:** HIGH

## Executive Summary

Hex Tic-Tac-Toe is a browser-based, two-player implementation of Connect6 played on an infinite hexagonal grid, delivered entirely peer-to-peer via WebRTC. The closest analogues are instant link-sharing multiplayer web games (skribbl.io, Gartic Phone) — not established board game platforms like Board Game Arena. The recommended stack is plain Svelte 5 + Vite (no SvelteKit), PeerJS for WebRTC signaling and data channels, honeycomb-grid for hex coordinate math, and native HTML5 Canvas for rendering. This combination builds to a fully static bundle deployable to any CDN, with a separate lightweight PeerJS signaling server for production.

Two foundational decisions carry the most risk if deferred: the hex coordinate system and the host-authoritative networking model. Using axial coordinates (q, r) from day one is mandatory — offset coordinates produce a class of subtle bugs across neighbor detection, distance calculation, and win scanning that are extremely costly to fix mid-project. Similarly, designating one peer as the canonical authority for game state must be decided before any networking code is written; retrofitting it later touches every networking path. All other risks (NAT traversal, canvas performance, reconnection) are well-understood with clear mitigation paths.

The build order dictated by architecture is: hex math and types first, then canvas rendering (so the grid is verifiable visually), then game rules and win detection (enabling a playable local prototype), then reactive state stores, then WebRTC networking. This ordering means each layer can be unit-tested in isolation before the next is added, and the game is playable as a local two-player experience before any networking complexity is introduced.

## Key Findings

### Recommended Stack

The stack is a focused, minimal set. Plain Svelte 5 + Vite is the correct choice over SvelteKit — there is no SSR, no routing, and no server-side boundary; SvelteKit would add adapters and load function complexity for zero benefit. Svelte 5 runes (`$state`, `$derived`, `$effect`) provide all the reactivity needed to drive canvas redraws from game state changes without any external state management library.

PeerJS 1.5.x is the correct WebRTC abstraction: it includes built-in signaling via PeerJS Cloud (free, zero config for development) and a self-hostable PeerServer for production. honeycomb-grid 4.1.x provides TypeScript-typed hex coordinate math based on the canonical Red Blob Games algorithms, eliminating the need to hand-roll axial/cube conversions. Vite 8 brings Rolldown-based builds but is brand-new as of this research; pinning to Vite 7 is a valid fallback if plugin compatibility issues arise.

**Core technologies:**
- Svelte 5 (5.54.x): UI framework — runes are ideal for game state reactivity; `$effect` drives canvas redraws
- Vite 8.x: Build tool — produces static files; no server required; 10-30x faster builds via Rolldown
- TypeScript 5.x: Type safety — hex coordinate math and PeerJS integration are error-prone without types
- PeerJS 1.5.x: WebRTC abstraction — built-in signaling, ICE negotiation, data channels; 250K+ weekly downloads
- HTML5 Canvas (native): Hex grid rendering — straightforward geometry; no canvas framework needed or beneficial
- honeycomb-grid 4.1.x: Hex grid math — axial coordinates, neighbor lookup, coordinate conversion; avoids hand-rolled hex math

### Expected Features

The MVP for this game is well-defined. The zero-friction link-sharing model is the primary differentiator versus Board Game Arena (which requires accounts). The infinite hex grid is a secondary differentiator versus standard Connect6 on a 19x19 board. Both must be present in v1 to validate the concept.

**Must have (table stakes):**
- Hex grid rendering with pan and zoom — the board must exist and be navigable; missing this = unusable
- Correct Connect6 rules (1-2-2-2 placement pattern) — wrong rules = unplayable
- Win detection across all 3 hex axes — game must be completable; the third diagonal axis is commonly missed
- WebRTC P2P connection via shareable link — the entire multiplayer delivery model
- Turn indicator showing whose turn and placements remaining — essential to prevent confusion
- Stone placement with hover preview — core interaction; visual feedback is baseline expectation
- Game over screen with winner display and rematch — complete game loop
- Connection status indicator — players must know if opponent is present or dropped
- Light/dark theme — modern web baseline
- Basic touch support (tap to place, drag to pan) — links will be shared on phones

**Should have (v1.x — add after core validation):**
- Configurable turn timer (30s / 60s / unlimited) — competitive play; low complexity
- Reconnection support — high value; high complexity; address when players report drop frustration
- "Center on action" camera button — players will get lost on infinite board
- Last-move highlight — quality of life; low complexity
- Pinch-to-zoom on mobile — after basic touch works
- Move counter display — tracking game progression on unbounded board

**Defer (v2+):**
- AI/bot opponent — non-trivial on infinite hex grid; dilutes P2P identity
- Sound effects — minimal aesthetic is deliberate; off-by-default at earliest
- Game variants (different win lengths, bounded boards) — premature generalization
- Spectator mode — complicates WebRTC topology from 2-peer to mesh/SFU
- User accounts, ELO, leaderboards — contradicts zero-friction identity

### Architecture Approach

The architecture is cleanly layered: a pure TypeScript game logic layer (hex math, rules, win detection) with zero framework imports; a canvas rendering layer (renderer, camera, interaction mapping) driven by store state; a Svelte 5 reactive state layer using `.svelte.ts` rune files as externalized stores; and a WebRTC networking layer (PeerJS wrapper, wire protocol, state sync) that reads and writes stores. Components are thin Svelte wrappers that compose these layers. The critical invariant is one-way data flow: network messages and UI actions write to stores; canvas renderer reads from stores; game logic operates as pure functions on state.

**Major components:**
1. `lib/game/` (hex.ts, rules.ts, win-detector.ts, types.ts) — pure TypeScript game logic; zero framework dependency; fully unit-testable
2. `lib/canvas/` (renderer.ts, camera.ts, interaction.ts) — canvas rendering pipeline with viewport culling; camera transform management; pixel-to-hex input mapping
3. `lib/stores/` (game.svelte.ts, board.svelte.ts, connection.svelte.ts) — Svelte 5 rune-based reactive stores; single source of truth for all state
4. `lib/network/` (connection.ts, protocol.ts, sync.ts) — PeerJS wrapper; JSON wire protocol; state sync and reconnection recovery
5. `components/` (Board.svelte, HUD.svelte, Lobby.svelte, GameOver.svelte) — thin UI composition layer

**Key patterns to follow:**
- Host-authoritative state: host validates all moves; guest sends requests, not mutations; host broadcasts confirmed state
- Sparse Map for infinite board: `Map<"q,r", Player>` — no artificial bounds; O(1) lookup
- Axial coordinates everywhere: q, r storage; derive s = -q-r for algorithms; convert to pixels only at render boundary
- Directional win scan from last placement: walk both directions on all 3 hex axes; O(1) effective; works on infinite grid
- Dirty-flag rendering: re-render only on viewport change or new piece placed; HUD in DOM, not on canvas

### Critical Pitfalls

1. **Offset hex coordinates** — Use axial (q, r) from the start. Offset coordinates produce neighbor-lookup branching on parity, break with negative coordinates, and infect every algorithm. Recovery cost: HIGH (essentially a full grid layer rewrite). Prevention: commit to axial on day one; follow Red Blob Games as canonical reference.

2. **Missing host-authoritative model** — Without designating one peer as the state authority, desync bugs appear under reconnection and race conditions. Both peers will silently see different boards. Recovery cost: HIGH (refactor touches every networking path). Prevention: define the authority model before writing any networking code; implement periodic state checksums.

3. **No TURN relay server** — STUN-only ICE configuration fails for 10-20% of users behind symmetric NATs, corporate firewalls, and some mobile carriers. Users see "connecting..." forever. Recovery cost: LOW (add TURN credentials to ICE config; no architecture changes). Prevention: include TURN from the start; test from a mobile hotspot and behind a VPN before any user testing.

4. **Incomplete win detection (missing third hex axis)** — The third hex axis in axial coordinates is (1,-1)/(-1,1), non-obvious and commonly omitted. Also: win check must run after each individual placement within a two-placement turn, not at turn end. Recovery cost: LOW-MEDIUM (fix direction vectors and add tests; low if game logic is pure). Prevention: unit test all 3 axes explicitly, including negative coordinates and mid-turn wins.

5. **Canvas rendering without viewport culling** — Drawing all hexes every frame causes frame rate collapse as players zoom out. Recovery cost: MEDIUM (refactoring render loop; easier if rendering was already separated from game state). Prevention: implement viewport bounds calculation and culling in the initial renderer; never iterate all pieces without a bounds check.

## Implications for Roadmap

Based on the dependency graph from ARCHITECTURE.md and the phase mappings from PITFALLS.md, the natural build order is six phases. The architecture explicitly describes this as a dependency-ordered build: game logic first, rendering second, game loop third, multiplayer last.

### Phase 1: Project Foundation and Hex Grid Engine

**Rationale:** Everything depends on the hex coordinate system and the canvas renderer. Getting this wrong is the highest-cost mistake in the project (axial vs. offset). Must be established and tested before any other work begins.
**Delivers:** Working hex grid rendered on canvas with pan and zoom; correct axial coordinate math with full unit test coverage; pixel-to-hex input mapping
**Addresses:** Hex grid rendering (table stakes), pan/zoom navigation (table stakes), touch pan support
**Avoids:** Offset coordinate pitfall (Pitfall 1), canvas performance pitfall (Pitfall 6 — culling from day one)
**Stack used:** Svelte 5, Vite, TypeScript, HTML5 Canvas, honeycomb-grid

### Phase 2: Game Logic and Local Play

**Rationale:** Win detection and turn rules are pure functions with no dependencies on networking. Building and testing them in isolation (as a local two-player game on one device) produces a verifiable, playable prototype before networking complexity is introduced.
**Delivers:** Correct Connect6 rules (1-2-2-2 placement), win detection on all 3 hex axes, game over state, rematch flow — all working in local two-player mode on one browser tab
**Addresses:** Connect6 rules (table stakes), win detection (table stakes), turn indicator (table stakes), game over + rematch (table stakes)
**Avoids:** Win detection incompleteness pitfall (Pitfall 5 — unit tests for all 3 axes, negative coordinates, mid-turn wins)
**Stack used:** TypeScript (pure functions), Svelte 5 runes (stores), vitest

### Phase 3: UI Polish and Theme

**Rationale:** UI chrome (HUD, status bar, theme, connection placeholders) should be built on top of working local game logic. Separating UI from networking prevents the common mistake of coupling visual state to connection state.
**Delivers:** Light/dark theme, turn indicator HUD, placement counter, visual stone feedback, game over overlay, "waiting for opponent" placeholder
**Addresses:** Light/dark theme (table stakes), clear turn indicator (table stakes), visual feedback (table stakes), connection status indicator (table stakes — placeholder wired up)
**Avoids:** State-in-components anti-pattern (stores drive all UI, not component-local state)

### Phase 4: WebRTC Networking and P2P Connection

**Rationale:** Networking is the most complex layer and benefits from a stable, tested game engine beneath it. The authority model and wire protocol must be designed together from the start of this phase.
**Delivers:** Shareable link game creation, PeerJS-based P2P connection, host-authoritative move validation, game state sync over data channel, connection status wired to UI
**Addresses:** Zero-friction P2P link sharing (primary differentiator), WebRTC P2P connection (table stakes)
**Avoids:** State desync pitfall (Pitfall 2 — host-authoritative model from day one), NAT traversal failures (Pitfall 3 — TURN server configured at setup), reconnection state loss (Pitfall 4 — game state stored in stores, not connection objects)
**Stack used:** PeerJS 1.5.x, peerjs-server, STUN + TURN ICE config

### Phase 5: Mobile and Touch Polish

**Rationale:** Touch controls interact with pan/zoom in ways that require careful input model design. Building this after the canvas and networking are stable avoids coupling touch handling to other concerns.
**Delivers:** Touch-friendly tap-to-place, drag-to-pan (no gesture conflict), pinch-to-zoom, correct pointer event handling with `touch-action: none`
**Addresses:** Mobile touch support (table stakes), pinch-to-zoom (v1.x)
**Avoids:** Pan-vs-placement gesture conflict UX pitfall; pointer event vs. mouse/touch divergence integration gotcha

### Phase 6: Resilience and v1.x Features

**Rationale:** Reconnection support and configurable timer are high-value but build on a stable v1. Reconnection in particular requires the game state to already be serializable (established in Phase 2) and the networking layer to be stable (Phase 4).
**Delivers:** Reconnection support (survive 30s network drop and resume), configurable turn timer (host-set, wall-clock-based, synced to guest), "center on action" camera button, last-move highlight, move counter
**Addresses:** Reconnection (v1.x differentiator), turn timer (v1.x differentiator), center on action (v1.x), last-move highlight (v1.x)
**Avoids:** Timer drift from `setInterval` in background tabs (use `Date.now()` delta for authoritative timing)

### Phase Ordering Rationale

- **Game logic before networking:** The game engine (hex math, rules, win detection) must be correct before multiplayer is added. Bugs discovered after networking is integrated are much harder to isolate.
- **Local play as intermediate milestone:** Phase 2 produces a playable two-player game on one device. This is a meaningful checkpoint that validates rules and UI before any networking risk.
- **Networking after state architecture:** Svelte 5 rune-based stores (established in Phase 2-3) give the networking layer clean read/write targets. This is what makes host-authoritative state sync straightforward rather than tangled.
- **Touch after core stability:** Touch input conflicts with pan/zoom are easier to resolve when the gesture system is the last thing being designed, not an afterthought retrofitted into existing event handlers.
- **Reconnection last:** Reconnection depends on serializable game state (Phase 2), a stable P2P connection (Phase 4), and a session ID in the shareable link (Phase 4). All dependencies must exist first.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (WebRTC Networking):** TURN server provider selection, PeerJS Cloud rate limits, ICE restart vs. full re-signaling tradeoffs, and session ID design for reconnection all need concrete decisions. The PlayPeerJS library is noted as a game-focused PeerJS wrapper but is described as less battle-tested — evaluate during phase planning.
- **Phase 5 (Mobile Touch):** Pointer event behavior varies across iOS Safari and Android Chrome for canvas elements. Touch-action CSS behavior on canvas requires validation testing on real devices.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Hex Grid Engine):** Red Blob Games is the canonical reference and honeycomb-grid implements its algorithms directly. Axial coordinate math is fully documented; no unknowns.
- **Phase 2 (Game Logic):** Connect6 rules are unambiguous (Wikipedia + BGA reference). Win detection algorithm is O(1) and fully specified in ARCHITECTURE.md. Standard vitest unit testing applies.
- **Phase 3 (UI Polish):** Svelte 5 runes + CSS custom properties for theming is well-documented. No novel patterns.
- **Phase 6 (Resilience):** Wall-clock timer sync pattern is documented. Reconnection pattern (full state dump from host) is the standard approach for turn-based P2P games.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Svelte 5, PeerJS, honeycomb-grid are all confirmed active and well-documented. Vite 8 is brand-new (released ~March 2026) — potential early plugin compatibility issues with @sveltejs/vite-plugin-svelte; Vite 7 is a safe fallback. |
| Features | HIGH | Feature set is well-established by comparison to BGA Connect6 and Lichess. MVP scope is clear. Anti-features are well-argued. |
| Architecture | HIGH | Red Blob Games hex grid reference is the canonical source. PeerJS P2P architecture is well-documented. Svelte 5 runes state pattern is confirmed via official sources. |
| Pitfalls | HIGH | Domain has extensive post-mortems (WebRTC NAT traversal, hex coordinate bugs, desync issues are all well-documented failure modes). Prevention strategies are concrete and actionable. |

**Overall confidence:** HIGH

### Gaps to Address

- **Vite 8 plugin compatibility:** Confirm `@sveltejs/vite-plugin-svelte` supports Vite 8 (Rolldown) before committing to Vite 8. If not confirmed, pin to Vite 7.x at project initialization.
- **TURN server selection:** Budget and provider for TURN relay (Metered.ca free tier, Cloudflare Calls, or self-hosted coturn) needs a concrete decision during Phase 4 planning. Do not defer to after user testing.
- **PeerJS Cloud rate limits:** PeerJS Cloud is free and zero-config for development but has undocumented rate limits. Document the threshold where self-hosted PeerServer becomes necessary. Likely not a concern until 100+ concurrent games.
- **honeycomb-grid v4 infinite grid suitability:** The library is described as MEDIUM-HIGH confidence specifically because it's unclear whether the API handles arbitrary unbounded coordinate ranges without artificial grid size parameters. Validate this during Phase 1 implementation; hand-roll the relevant math if the library requires a defined grid size.
- **iOS Safari WebRTC DataChannel:** Some iOS Safari versions have historically had DataChannel reliability quirks. Validate PeerJS 1.5.x behavior on iOS Safari during Phase 4.

## Sources

### Primary (HIGH confidence)
- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) — canonical hex coordinate system, algorithms, neighbor finding, distance, win detection directions
- [PeerJS Documentation](https://peerjs.com/) — WebRTC abstraction API, signaling server, ICE configuration
- [Svelte 5 Runes documentation](https://svelte.dev/blog/runes) — runes API, $state/$derived/$effect, global state in .svelte.ts files
- [WebRTC Data Channels - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/WebRTC_data_channels) — DataChannel capabilities and configuration
- [RTCPeerConnection: restartIce() - MDN](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/restartIce) — ICE restart API for reconnection

### Secondary (MEDIUM confidence)
- [PeerJS npm](https://www.npmjs.com/package/peerjs) — v1.5.5, 250K weekly downloads confirmed
- [honeycomb-grid npm](https://www.npmjs.com/package/honeycomb-grid) — v4.1.5, TypeScript hex grid library
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) — Rolldown integration, Node 18+ requirement
- [Svelte 5 Global State (Mainmatter)](https://mainmatter.com/blog/2025/03/11/global-state-in-svelte-5/) — .svelte.ts rune store patterns
- [Taming WebRTC with PeerJS (Toptal)](https://www.toptal.com/webrtc/taming-webrtc-with-peerjs) — P2P game architecture walkthrough
- [Get Over It: WebRTC Isn't Peer-to-Peer (bloggeek.me)](https://bloggeek.me/webrtc-not-p2p/) — NAT traversal and TURN requirements
- [Handling WebRTC Session Disconnections (bloggeek.me)](https://bloggeek.me/handling-session-disconnections-in-webrtc/) — WebRTC reconnection lifecycle

### Tertiary (reference / cross-check)
- [Board Game Arena Connect6](https://en.boardgamearena.com/gamepanel?game=connectsix) — competitor feature reference
- [Connect6 - Wikipedia](https://en.wikipedia.org/wiki/Connect6) — game rules and 1-2-2-2 placement rule confirmation
- [Lichess Features](https://lichess.org/features) — minimalist strategy game platform model
- [PlayPeerJS](https://github.com/therealPaulPlay/PlayPeerJS) — game-focused PeerJS wrapper (newer, less battle-tested; evaluate vs. rolling own wrapper)
- [Optimising HTML5 Canvas Rendering](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) — canvas performance techniques (culling, offscreen canvas)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
