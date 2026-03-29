# Reconnection Support — Design Spec

**Date:** 2026-03-29
**Requirements:** RES-01 (rejoin via link), RES-02 (auto-reconnect), RES-03 (state serialization)

## Overview

Add reconnection support to the P2P multiplayer game so that either player can recover from a page refresh, tab close, or network interruption without losing the game. Uses a Cloudflare KV room registry to decouple the stable game ID from ephemeral PeerJS peer IDs.

## 1. KV Room Registry

The existing Cloudflare Worker (`worker/src/index.ts`) gains a KV namespace (`GAME_ROOMS`) and two new routes:

| Method | Route | Body | Response | Purpose |
|--------|-------|------|----------|---------|
| POST/PUT | `/rooms/:gameId` | `{ peerId: string }` | 200 OK | Host registers/updates PeerJS ID |
| GET | `/rooms/:gameId` | — | `{ peerId: string }` or 404 | Guest looks up host's current PeerJS ID |

**KV entry:** Key = `gameId`, Value = `peerId`, TTL = 3600s (1 hour).

No authentication — the 8-char random alphanumeric game ID is unguessable, matching the existing share link security model. CORS rules are the same as the existing TURN endpoint.

**Worker `wrangler.toml` change:** Add `[[kv_namespaces]]` binding for `GAME_ROOMS`.

## 2. Connection Layer Changes

### Host Flow

1. Generate a **stable game ID** (the URL hash identifier — unchanged from current behavior)
2. Create a new PeerJS peer with a **fresh random PeerJS ID** (no longer using game ID as peer ID)
3. Register `gameId → peerId` in KV via POST `/rooms/:gameId`
4. Listen for guest connections as before
5. On guest connect: send `reconnect-state` with current snapshot + timer state
6. On guest disconnect: pause timer, set status to "waiting for reconnection"
7. On guest reconnect: send `reconnect-state`, resume timer

### Guest Flow

1. Read `gameId` from URL hash
2. GET `/rooms/:gameId` to discover host's current PeerJS ID
3. Connect to host's PeerJS ID
4. On disconnect: enter reconnection loop
   - Every 3 seconds: GET `/rooms/:gameId`, attempt connection to returned peerId
   - Max 20 attempts (60 seconds total)
   - On success: receive `reconnect-state` from host, replace local state
   - On timeout: show "Could not reconnect" with "Back to menu" button

### Host Refresh Recovery

1. On page load, `detectInitialView` reads `hex-game-role=host` + URL hash
2. Restore snapshot from `hex-game-snapshot` in sessionStorage
3. Create new PeerJS peer with fresh ID
4. PUT `/rooms/:gameId` with new peerId (overwrites stale entry)
5. Wait for guest to discover new peerId via KV lookup

### Guest Refresh Recovery

1. On page load, `detectInitialView` reads `hex-game-role=guest` + URL hash
2. Restore snapshot from sessionStorage for immediate display
3. GET `/rooms/:gameId` to find host's peerId
4. Connect and receive authoritative state from host (overwrites local restore)

### New Protocol Message

```typescript
{ type: 'reconnect-state'; snapshot: SerializedSnapshot; timerMode: TimerMode; timerRemaining: number }
```

Sent by host on any reconnection. Bundles everything the guest needs in one message.

## 3. State Persistence

### What Gets Persisted (sessionStorage)

| Key | Value | Purpose |
|-----|-------|---------|
| `hex-game-snapshot` | `SerializedSnapshot` (JSON) | Full game state |
| `hex-role` | `"host"` or `"guest"` | Player role (already exists) |
| `hex-game-id` | string | Stable room ID from URL hash |
| `hex-timer-mode` | `0 \| 30 \| 60` | Timer configuration |

### When Persistence Happens

- After every `applyMove`, `forfeitTurn`, `applyRematch` — any snapshot mutation
- On receiving `game-start`, `state-update`, `rematch-accept`, `reconnect-state` — any snapshot from network

### Authoritative State

Host is always authoritative. Guest persists state only for display during reconnection — once reconnected, host's state overwrites the guest's local copy.

## 4. Reconnection UX

### ReconnectOverlay Component

Semi-transparent dimmed overlay (same pattern as WaitingOverlay/JoinOverlay):

- **Reconnecting state:** "Connection lost — reconnecting..." with attempt counter ("Attempt 3 of 20"), animated pulsing indicator, and "Cancel" button
- **Failed state:** "Could not reconnect" with "Back to menu" button
- **Cancel confirmation:** Modal with "Leave game? Your progress will be lost." and "Leave" / "Stay" buttons

### State Transitions

```
Connected → onClose → Reconnecting (overlay shown, timer paused, board visible but not interactive)
Reconnecting → success → Connected (overlay dismissed, timer resumes)
Reconnecting → 60s timeout → Failed (text changes, "Back to menu" button)
Reconnecting → Cancel → Confirmation modal → Leave (landing) or Stay (continue reconnecting)
```

### Timer Behavior During Disconnect

- Host pauses countdown interval on `onClose`
- Host stores remaining seconds at time of disconnect
- On reconnect: host resumes timer with stored remaining value, sends `timer-sync` to guest
- If timer was already expired before disconnect, no change needed

### Board During Reconnection

- Canvas visible underneath overlay, showing last known game state
- Pointer events disabled (no placing stones while disconnected)

## 5. Network State Changes

`ConnectionStatus` type gains a new value:

```typescript
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
```

The `reconnecting` status drives the ReconnectOverlay visibility and disables game input.

## 6. Files Changed

| File | Change |
|------|--------|
| `worker/src/index.ts` | Add `/rooms/:gameId` GET/POST/PUT routes |
| `worker/wrangler.toml` | Add KV namespace binding |
| `src/lib/network/protocol.ts` | Add `reconnect-state` message type |
| `src/lib/network/connection.ts` | Decouple gameId from peerId, add KV registration, reconnection retry loop |
| `src/lib/network/network-state.svelte.ts` | Add `reconnecting` status |
| `src/lib/state/online-game-state.svelte.ts` | State persistence, timer pause/resume on disconnect, reconnection handling |
| `src/components/ReconnectOverlay.svelte` | New component: reconnection UI with cancel + confirmation |
| `src/App.svelte` | Wire ReconnectOverlay, update detectInitialView for full state restore |

## 7. Testing Strategy

- **Unit tests:** State serialization roundtrip, forfeitTurn with paused timer, reconnect-state message shape
- **Integration tests:** sessionStorage persistence on state changes, KV lookup mock
- **Manual/browser tests:** Host refresh, guest refresh, network drop simulation, timer pause/resume across reconnection, cancel button flow, 60s timeout
