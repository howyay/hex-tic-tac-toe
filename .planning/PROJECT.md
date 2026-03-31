# Hex Tic-Tac-Toe

## What This Is

A peer-to-peer hexagonal tic-tac-toe game played on an infinite hex grid. Two players connect via shared link over WebRTC and take turns placing pieces — X places one on the first turn, then players alternate placing two pieces per turn. First to get 6 consecutive pieces along any hex axis wins. Essentially Connect6 on a hex grid.

## Core Value

Two players can connect via a shared link and play a complete game of hex Connect6 with correct rules and win detection.

## Status

**v2 complete** — all 40 requirements delivered across 5 phases and 15 plans.

- v1: Hex grid engine, game rules, theme/touch polish, WebRTC multiplayer, turn timer
- v2: Reconnection support, center-on-action, last-move highlight, placement animation, move list export

Production: https://howyay.github.io/hex-tic-tac-toe/

## Requirements

See [REQUIREMENTS.md](REQUIREMENTS.md) for the full checklist (32 v1 + 8 v2, all complete).

## Out of Scope

| Feature | Reason |
|---------|--------|
| AI/bot opponent | Connect6 AI on infinite hex grid is a research problem; multiplayer-only focus |
| User accounts or profiles | Anonymous play IS the differentiator; zero friction |
| Game history or replays | Requires persistent storage; P2P model is ephemeral |
| Spectator mode | Third peer complicates WebRTC topology for minimal value |
| In-game chat | Players communicate via channel used to share the link |
| Sound effects | Minimal aesthetic is deliberate |
| Undo/take-back | Complex P2P protocol; hover preview prevents misclicks |
| Mobile native app | Web only; touch-friendly responsive design instead |

## Context

- Connect6 variant adapted to a hexagonal grid (3 axes of alignment vs 4 in square grids)
- Infinite grid — no boundary-based strategy, pure placement tactics
- WebRTC P2P via PeerJS; TURN relay on Cloudflare Worker for NAT traversal
- Cloudflare KV for room registry (reconnection support)
- Svelte 5 + Vite + TypeScript; Canvas 2D for hex rendering
- Deployed as static site to GitHub Pages via Actions

## Constraints

- **Tech stack**: Svelte 5 + TypeScript + Vite, HTML5 Canvas for hex grid rendering
- **Networking**: WebRTC (PeerJS) for P2P game state sync; Cloudflare Worker for TURN credentials + room registry
- **Deployment**: GitHub Pages (static) + Cloudflare Worker (TURN/KV)
- **Browser support**: Modern browsers with WebRTC support

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Svelte 5 + Vite (no SvelteKit) | Single-page canvas game needs no SSR or routing | Validated — clean, fast builds |
| WebRTC P2P via PeerJS | Direct connection = low latency, no game server needed | Validated — works well for 2-player |
| Hex Connect6 rules (1-2-2-2...) | Balances first-mover advantage on hex grid | Validated — gameplay feels balanced |
| Configurable turn timer | Supports both casual and competitive play | Validated — 30s/60s/unlimited |
| Native Canvas 2D (no framework) | Hex rendering is simple geometry; frameworks add overhead | Validated — performant, simple |
| Cloudflare Worker for TURN | Free tier, KV for room registry, global edge network | Validated — reliable NAT traversal |
| Host-authoritative model | Prevents cheating; host validates all moves | Validated — clean separation |

---
*Last updated: 2026-03-29 — v2 complete*
