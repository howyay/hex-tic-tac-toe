<!-- GSD:project-start source:PROJECT.md -->
## Project

**Hex Tic-Tac-Toe**

A peer-to-peer hexagonal tic-tac-toe game played on an infinite hex grid. Two players connect via shared link over WebRTC and take turns placing pieces — X places one on the first turn, then players alternate placing two pieces per turn. First to get 6 consecutive pieces along any hex axis wins. Essentially Connect6 on a hex grid.

**Core Value:** Two players can connect via a shared link and play a complete game of hex Connect6 with correct rules and win detection.

### Constraints

- **Tech stack**: Svelte frontend with HTML5 Canvas for hex grid rendering
- **Networking**: WebRTC for P2P game state sync; needs a signaling server or service for connection establishment
- **Deployment**: Static site + minimal signaling backend
- **Browser support**: Modern browsers with WebRTC support
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Svelte 5 | 5.54.x | UI framework | Project constraint. Runes ($state, $derived, $effect) are ideal for game state reactivity. $effect is perfect for driving canvas redraws on state changes. Lightweight runtime means fast load for a single-page game. |
| Vite | 8.x | Build tool / dev server | Standard Svelte build tool. v8 uses Rolldown for 10-30x faster builds. Scaffolded via `npm create vite@latest -- --template svelte-ts`. |
| TypeScript | 5.x | Type safety | Hex coordinate math (axial/cube systems) is error-prone without types. PeerJS and honeycomb-grid both ship TS types. |
| PeerJS | 1.5.x | WebRTC abstraction | Built-in signaling via PeerJS Cloud for dev, self-hostable PeerServer for production. Handles ICE negotiation, data channels, and reconnection. Simpler than raw WebRTC or simple-peer because signaling is included. |
| HTML5 Canvas (native) | N/A | Hex grid rendering | Project constraint. Direct Canvas 2D API via $effect-driven render loops. No canvas framework needed -- hex rendering is straightforward geometry. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| honeycomb-grid | 4.1.x | Hex grid math (coordinates, neighbors, traversal) | Coordinate conversion (axial <-> pixel), neighbor lookups, line-of-sight for win detection. Based on Red Blob Games algorithms. Avoids hand-rolling hex math. |
| peer (peerjs-server) | 1.0.x | Self-hosted signaling server | Production deployment. Run alongside static site on Fly.io or similar. Lightweight Node.js Express server. Use PeerJS Cloud (free) during development. |
| vitest | latest | Unit testing | Test game logic (win detection, turn rules, coordinate math) independently of UI. Ships with Vite integration. |
| @testing-library/svelte | latest | Component testing | Test Svelte components if needed. Secondary to unit tests on game logic. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| svelte-check | Type checking Svelte files | Run via `npx svelte-check` or as part of CI. Catches template type errors that tsc misses. |
| prettier + prettier-plugin-svelte | Code formatting | Standard Svelte formatting. Configure via `.prettierrc`. |
| eslint + eslint-plugin-svelte | Linting | Svelte-aware linting rules. |
## Why NOT SvelteKit
- **No SSR needed** -- this is a client-side-only game with canvas rendering
- **No routing needed** -- single page with game board, no multi-page navigation
- **No server needed in the framework** -- signaling is a separate concern (PeerJS server), not an API route
- **Adds complexity** -- adapters, load functions, server/client boundary concerns are all irrelevant overhead
- **Deployment is simpler** -- `vite build` produces static files, deploy to any CDN
## Installation
# Scaffold project
# Core dependencies
# Dev dependencies (most come with Vite template)
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| PeerJS | simple-peer | If you want lower-level control over signaling and already have a WebSocket server. simple-peer has no built-in signaling -- you must build or integrate your own. More work for no benefit here. |
| PeerJS | Trystero | If you want serverless signaling via BitTorrent/IPFS/Firebase. Clever but adds dependency on third-party infrastructure with less predictable reliability. |
| honeycomb-grid | Hand-rolled hex math | If you need only basic coordinate conversion. But honeycomb-grid is small, well-typed, and handles edge cases (traversals, rings, spirals) that you will eventually need. |
| honeycomb-grid | rot.js | If building a roguelike. rot.js includes hex grids but bundles FOV, pathfinding, map generation -- massive overkill for a board game. |
| Native Canvas 2D | Konva / svelte-konva | If you need hit detection on complex shapes, drag-and-drop, layering. Konva adds overhead and an abstraction layer that fights with custom hex rendering. For click-to-place on a hex grid, native canvas + math is simpler and faster. |
| Native Canvas 2D | PixiJS | If you need WebGL acceleration, sprite sheets, particle effects. Massive overkill for a board game with flat colored hexagons. |
| Vite (plain Svelte) | SvelteKit | If you later need SEO pages, server routes, or multi-page navigation. Not applicable to this game. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| SvelteKit | Adds SSR, routing, adapter complexity for zero benefit in a single-page canvas game | Plain Svelte + Vite |
| Socket.io | Server-mediated communication defeats the purpose of P2P. Requires always-on relay server. Higher latency. | PeerJS (WebRTC data channels) |
| Fabric.js / Konva | Object model overhead for what is fundamentally "draw hexagons and detect clicks." Canvas abstraction libraries fight with custom coordinate systems. | Native Canvas 2D API |
| Redux / Zustand / external state managers | Svelte 5 runes ($state, $derived) handle reactive state natively and elegantly. External state managers add indirection. | Svelte 5 runes |
| Firebase Realtime DB for game state | Adds a server dependency and latency. Game state should flow P2P. Only consider for signaling, and PeerJS already handles that. | PeerJS data channels |
| Phaser / Three.js | Full game engines / 3D renderers. Extreme overkill for 2D hex board. | Native Canvas 2D |
## Architecture Notes for Stack
### State Management Pattern
- `$state` for game state (board, turns, timer)
- `$derived` for computed values (whose turn, placements remaining, win status)
- `$effect` to drive canvas redraws when state changes
### Canvas Rendering Pattern
### PeerJS Integration Pattern
- Host creates a Peer with a generated ID, encodes it in a shareable URL
- Guest extracts peer ID from URL, connects via `peer.connect(hostId)`
- Both peers exchange game moves as JSON over data channel
- Reconnection: peer ID is deterministic from the game link, so reconnecting re-establishes the same channel
### Signaling Server Strategy
- **Development:** Use PeerJS Cloud (free, zero config) -- `new Peer()` with no server config
- **Production:** Self-host `peerjs-server` as a tiny Node.js process alongside static file hosting, or on Fly.io free tier
- The signaling server only brokers the initial connection (ICE candidates + SDP). All game data flows P2P after connection.
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| Svelte 5.54.x | Vite 8.x | Via @sveltejs/vite-plugin-svelte. Verify plugin version supports Vite 8 (Rolldown). |
| PeerJS 1.5.x | Modern browsers | Uses native RTCPeerConnection. No polyfills needed for Chrome, Firefox, Safari, Edge. |
| honeycomb-grid 4.1.x | TypeScript 5.x | Full TS support. Works in browser and Node. |
| Vite 8.x | Node >= 18 | Vite 8 requires Node 18+. |
## Confidence Assessment
| Decision | Confidence | Rationale |
|----------|------------|-----------|
| Svelte 5 + Vite (no SvelteKit) | HIGH | Project constraint + clear architectural fit. Single-page canvas game needs no SSR or routing. |
| PeerJS for WebRTC | HIGH | Most downloaded WebRTC abstraction with built-in signaling. 250K+ weekly npm downloads. Well-documented. Perfect fit for 2-player P2P. |
| honeycomb-grid for hex math | MEDIUM-HIGH | Most popular hex grid library (TypeScript, based on Red Blob Games). v4.1.x actively maintained. Only risk: if API doesn't fit the "infinite grid" model well, may need to hand-roll some coordinate math. |
| Native Canvas 2D (no framework) | HIGH | Hex rendering is simple geometry. Canvas frameworks add overhead without solving real problems for this use case. |
| Self-hosted PeerJS server for production | MEDIUM | Standard approach, but deployment details need validation during implementation. PeerJS Cloud works for dev/demo. |
| Vite 8 | MEDIUM | Brand new (released days ago). May have early bugs with Svelte plugin. Fallback: pin Vite 7.x if issues arise. |
## Sources
- [Svelte 5 Runes documentation](https://svelte.dev/blog/runes) -- runes API, $state/$derived/$effect
- [Svelte 5 releases](https://github.com/sveltejs/svelte/releases) -- v5.54.0 confirmed March 2026
- [PeerJS npm](https://www.npmjs.com/package/peerjs) -- v1.5.5, 250K weekly downloads
- [PeerJS documentation](https://peerjs.com/) -- API reference, cloud server docs
- [PeerJS Server GitHub](https://github.com/peers/peerjs-server) -- self-hosting guide
- [honeycomb-grid npm](https://www.npmjs.com/package/honeycomb-grid) -- v4.1.5, TypeScript hex grid library
- [honeycomb-grid docs](https://abbekeultjes.nl/honeycomb/) -- API reference
- [Red Blob Games: Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) -- canonical hex grid algorithms reference
- [Vite 8.0 announcement](https://vite.dev/blog/announcing-vite8) -- Rolldown integration, Node 18+ requirement
- [PkgPulse: simple-peer vs PeerJS vs mediasoup](https://www.pkgpulse.com/blog/simple-peer-vs-peerjs-vs-mediasoup-webrtc-libraries-nodejs-2026) -- WebRTC library comparison 2026
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
