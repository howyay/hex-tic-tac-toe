# Hex Tic-Tac-Toe

A peer-to-peer hexagonal Connect6 game played on an infinite hex grid.

Two players connect via a shared link and take turns placing stones — X places one on the first turn, then players alternate placing two per turn. First to get 6 consecutive stones along any hex axis wins.

**Play now:** https://howyay.github.io/hex-tic-tac-toe/

## Features

- **Infinite hex grid** — canvas-rendered with pan, zoom, and viewport culling
- **Connect6 rules** — 1-2-2-2 placement pattern with win detection across all 3 hex axes
- **P2P multiplayer** — WebRTC via PeerJS, no game server required
- **Host-authoritative** — host validates all moves to prevent cheating
- **Turn timer** — configurable 30s, 60s, or unlimited
- **Reconnection** — rejoin via the same link if disconnected, game state preserved
- **Light/dark theme** — toggle with persisted preference
- **Touch support** — tap to place, drag to pan, pinch to zoom
- **Polish** — placement animations, last-move highlight, center-on-action, move list export

## Tech Stack

- [Svelte 5](https://svelte.dev/) + TypeScript + [Vite](https://vite.dev/)
- HTML5 Canvas 2D for hex rendering
- [PeerJS](https://peerjs.com/) for WebRTC
- [Cloudflare Worker](https://workers.cloudflare.com/) for TURN relay + room registry
- GitHub Pages for hosting

## Development

```bash
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run check     # Type check
npm run test      # Run tests
```

## How It Works

1. **Host** creates a game and gets a shareable link
2. **Guest** opens the link — WebRTC connection established via PeerJS
3. Players take turns placing stones on the hex grid
4. Game state syncs directly between peers (no server in the loop)
5. First to 6-in-a-row along any hex axis wins

## License

MIT
