## Project

**Hex Tic-Tac-Toe** — v2 complete

A peer-to-peer hexagonal Connect6 game on an infinite hex grid. Two players connect via shared link over WebRTC and take turns placing pieces (1-2-2-2... pattern). First to get 6 consecutive pieces along any hex axis wins.

**Core Value:** Two players can connect via a shared link and play a complete game of hex Connect6 with correct rules and win detection.

**Production:** https://howyay.github.io/hex-tic-tac-toe/

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Svelte 5 (runes) | UI framework — `$state`, `$derived`, `$effect` for reactivity |
| Vite 8 | Build tool / dev server |
| TypeScript | Type safety for hex math and game logic |
| PeerJS | WebRTC abstraction with built-in signaling |
| HTML5 Canvas 2D | Hex grid rendering via `$effect`-driven render loops |
| Cloudflare Worker | TURN relay credentials + KV room registry for reconnection |
| GitHub Pages | Static site deployment via Actions |
| Vitest | Unit testing |

## Architecture

- **State**: Svelte 5 runes — `$state` for game state, `$derived` for computed values, `$effect` for canvas redraws
- **Rendering**: Native Canvas 2D with axial hex coordinates, viewport culling, pan/zoom
- **Networking**: PeerJS WebRTC data channels; host-authoritative model; JSON message protocol
- **Reconnection**: Cloudflare KV room registry, state serialization, heartbeat detection
- **No SvelteKit**: Single-page canvas game needs no SSR, routing, or server framework

## Constraints

- **Tech stack**: Svelte 5 + TypeScript + Vite, HTML5 Canvas
- **Networking**: WebRTC (PeerJS) P2P; Cloudflare Worker for TURN/KV
- **Deployment**: GitHub Pages (static) + Cloudflare Worker
- **Browser support**: Modern browsers with WebRTC support

## Commands

```bash
npm run dev       # Dev server
npm run build     # Production build
npm run check     # Type check (svelte-check + tsc)
npm run test      # Vitest run
```
