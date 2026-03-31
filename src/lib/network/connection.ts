import Peer from 'peerjs';
import type { DataConnection, PeerJSOption } from 'peerjs';
import { customAlphabet } from 'nanoid';
import type { GameMessage } from './protocol';

/** Generate game IDs: 8 chars, alphanumeric only */
export const generateGameId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const TURN_CREDENTIAL_URL = import.meta.env.VITE_TURN_CREDENTIAL_URL as string | undefined;

const RECONNECT_INTERVAL = 3000; // 3 seconds between attempts
const RECONNECT_MAX_ATTEMPTS = 20; // 60 seconds total
const RECONNECT_ATTEMPT_TIMEOUT = 8000; // 8 seconds before declaring a single attempt failed

const HEARTBEAT_INTERVAL = 2000; // send ping every 2s
const HEARTBEAT_TIMEOUT = 6000;  // declare dead after 6s of silence

/** Fetch ICE servers (STUN + TURN) from the credential worker. Falls back to STUN-only. */
async function getIceConfig(): Promise<PeerJSOption['config']> {
  if (!TURN_CREDENTIAL_URL) return undefined;
  try {
    const resp = await fetch(TURN_CREDENTIAL_URL);
    if (!resp.ok) return undefined;
    const data = await resp.json() as { iceServers: RTCIceServer[] };
    return { iceServers: data.iceServers };
  } catch {
    return undefined;
  }
}

/** Get the worker base URL for room registry */
function getWorkerBaseUrl(): string | undefined {
  return TURN_CREDENTIAL_URL;
}

/** Register or update a room in the KV registry */
export async function registerRoom(gameId: string, peerId: string): Promise<boolean> {
  const base = getWorkerBaseUrl();
  if (!base) return false;
  try {
    const resp = await fetch(`${base}/rooms/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peerId }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/** Look up the host's current PeerJS ID from the KV registry */
export async function lookupRoom(gameId: string): Promise<string | null> {
  const base = getWorkerBaseUrl();
  if (!base) return null;
  try {
    const resp = await fetch(`${base}/rooms/${gameId}`);
    if (!resp.ok) return null;
    const data = await resp.json() as { peerId: string };
    return data.peerId;
  } catch {
    return null;
  }
}

/** Build a shareable link for a game */
export function buildShareLink(gameId: string): string {
  return `${window.location.origin}${window.location.pathname}#${gameId}`;
}

/** Parse game ID from URL hash, returns null if invalid (< 6 chars) */
export function parseGameIdFromHash(): string | null {
  const hash = window.location.hash.slice(1);
  return hash.length >= 6 ? hash : null;
}

/** Callbacks for connection lifecycle events */
export interface ConnectionCallbacks {
  onOpen: (gameId: string) => void;
  onConnect: () => void;
  onData: (msg: GameMessage) => void;
  onClose: () => void;
  onError: (err: Error) => void;
}

/**
 * Combined disconnect detection: ICE state monitoring + application heartbeat.
 * Calls onDisconnect exactly once when either mechanism detects a dead peer.
 * Returns cleanup function and a messageReceived() callback for the heartbeat.
 */
function createDisconnectDetector(
  dataConn: DataConnection,
  sendPing: () => void,
  onDisconnect: () => void,
): { cleanup: () => void; messageReceived: () => void } {
  let fired = false;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let lastMessageAt = Date.now();

  function trigger() {
    if (fired) return;
    fired = true;
    cleanup();
    onDisconnect();
  }

  function messageReceived() {
    lastMessageAt = Date.now();
  }

  // ICE connection state monitoring
  const pc = dataConn.peerConnection;
  function onIceStateChange() {
    const state = pc?.iceConnectionState;
    if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      trigger();
    }
  }
  pc?.addEventListener('iceconnectionstatechange', onIceStateChange);

  // Application heartbeat
  heartbeatId = setInterval(() => {
    // Send ping
    try { sendPing(); } catch { /* connection may already be closing */ }

    // Check timeout
    if (Date.now() - lastMessageAt > HEARTBEAT_TIMEOUT) {
      trigger();
    }
  }, HEARTBEAT_INTERVAL);

  function cleanup() {
    if (heartbeatId !== null) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }
    pc?.removeEventListener('iceconnectionstatechange', onIceStateChange);
  }

  return { cleanup, messageReceived };
}

/**
 * Create a host peer that listens for a guest connection.
 * Game ID is stable (URL hash); PeerJS ID is ephemeral.
 * Registers gameId → peerId mapping in KV.
 */
export function createHost(callbacks: ConnectionCallbacks, gameId: string) {
  let conn: DataConnection | null = null;
  let currentPeer: Peer;
  let destroyed = false;
  let detector: ReturnType<typeof createDisconnectDetector> | null = null;

  getIceConfig().then((config) => {
    if (destroyed) return;
    currentPeer = initPeer(config);
  });

  function initPeer(config?: PeerJSOption['config']): Peer {
    const peer = new Peer(undefined as unknown as string, { debug: 0, config });

    peer.on('open', (peerId: string) => {
      registerRoom(gameId, peerId);
      callbacks.onOpen(gameId);
    });

    peer.on('connection', (dataConn: DataConnection) => {
      // Clean up previous detector if guest reconnected
      detector?.cleanup();
      conn = dataConn;

      dataConn.on('open', () => {
        // Start disconnect detection after connection is established
        detector = createDisconnectDetector(
          dataConn,
          () => { try { dataConn.send({ type: 'ping' }); } catch {} },
          () => { conn = null; callbacks.onClose(); },
        );
        callbacks.onConnect();
      });

      dataConn.on('data', (data: unknown) => {
        detector?.messageReceived();
        callbacks.onData(data as GameMessage);
      });

      dataConn.on('close', () => {
        detector?.cleanup();
        detector = null;
        conn = null;
        callbacks.onClose();
      });
    });

    peer.on('error', (err: Error & { type?: string }) => {
      callbacks.onError(err);
    });

    return peer;
  }

  return {
    get peer() { return currentPeer; },
    send: (msg: GameMessage) => { conn?.send(msg); },
    destroy: () => { destroyed = true; detector?.cleanup(); currentPeer?.destroy(); },
    get gameId() { return gameId; },
  };
}

/** Reconnection state for guest retry loop */
export interface ReconnectHandle {
  cancel: () => void;
}

/**
 * Join an existing game as a guest by looking up the host's PeerJS ID via KV.
 */
export async function joinGame(gameId: string, callbacks: ConnectionCallbacks) {
  let conn: DataConnection | null = null;
  let destroyed = false;
  let detector: ReturnType<typeof createDisconnectDetector> | null = null;

  const config = await getIceConfig();

  const hostPeerId = await lookupRoom(gameId);
  if (!hostPeerId) {
    callbacks.onError(new Error('Game not found. The host may have left.'));
    return {
      peer: null as unknown as Peer,
      send: () => {},
      destroy: () => { destroyed = true; },
    };
  }

  const peer = new Peer(undefined as unknown as string, { debug: 0, config });

  peer.on('open', () => {
    if (destroyed) return;
    const dataConn = peer.connect(hostPeerId, { reliable: true });
    conn = dataConn;

    dataConn.on('open', () => {
      detector = createDisconnectDetector(
        dataConn,
        () => { try { dataConn.send({ type: 'ping' }); } catch {} },
        () => { conn = null; callbacks.onClose(); },
      );
      callbacks.onConnect();
    });

    dataConn.on('data', (data: unknown) => {
      detector?.messageReceived();
      callbacks.onData(data as GameMessage);
    });

    dataConn.on('close', () => {
      detector?.cleanup();
      detector = null;
      conn = null;
      callbacks.onClose();
    });
  });

  peer.on('error', (err: Error & { type?: string }) => {
    callbacks.onError(err);
  });

  return {
    peer,
    send: (msg: GameMessage) => { conn?.send(msg); },
    destroy: () => { destroyed = true; detector?.cleanup(); peer.destroy(); },
  };
}

/**
 * Reconnection retry loop for guests.
 * Attempts to look up host's PeerJS ID from KV and connect every RECONNECT_INTERVAL ms.
 * Calls onAttempt with attempt number for UI updates.
 * Returns a handle to cancel the loop.
 */
export function startReconnectLoop(
  gameId: string,
  callbacks: ConnectionCallbacks & { onAttempt: (attempt: number) => void },
): ReconnectHandle {
  let cancelled = false;
  let attempt = 0;
  let currentPeer: Peer | null = null;
  let conn: DataConnection | null = null;
  let detector: ReturnType<typeof createDisconnectDetector> | null = null;
  let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let attemptTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let connected = false;

  function clearTimers() {
    if (retryTimeoutId) { clearTimeout(retryTimeoutId); retryTimeoutId = null; }
    if (attemptTimeoutId) { clearTimeout(attemptTimeoutId); attemptTimeoutId = null; }
  }

  function scheduleRetry() {
    if (!cancelled) {
      retryTimeoutId = setTimeout(tryConnect, RECONNECT_INTERVAL);
    }
  }

  async function tryConnect() {
    if (cancelled) return;
    clearTimers();
    attempt++;
    callbacks.onAttempt(attempt);

    if (attempt > RECONNECT_MAX_ATTEMPTS) {
      callbacks.onError(new Error('Reconnection timed out'));
      return;
    }

    const hostPeerId = await lookupRoom(gameId);
    if (cancelled) return;

    if (!hostPeerId) {
      scheduleRetry();
      return;
    }

    detector?.cleanup();
    currentPeer?.destroy();
    connected = false;

    const config = await getIceConfig();
    if (cancelled) return;

    currentPeer = new Peer(undefined as unknown as string, { debug: 0, config });

    attemptTimeoutId = setTimeout(() => {
      if (!connected && !cancelled) {
        currentPeer?.destroy();
        scheduleRetry();
      }
    }, RECONNECT_ATTEMPT_TIMEOUT);

    currentPeer.on('open', () => {
      if (cancelled || !currentPeer) return;
      const dataConn = currentPeer.connect(hostPeerId, { reliable: true });
      conn = dataConn;

      dataConn.on('open', () => {
        connected = true;
        clearTimers();
        detector = createDisconnectDetector(
          dataConn,
          () => { try { dataConn.send({ type: 'ping' }); } catch {} },
          () => { conn = null; callbacks.onClose(); },
        );
        callbacks.onConnect();
      });

      dataConn.on('data', (data: unknown) => {
        detector?.messageReceived();
        callbacks.onData(data as GameMessage);
      });

      dataConn.on('close', () => {
        detector?.cleanup();
        detector = null;
        conn = null;
        callbacks.onClose();
      });
    });

    currentPeer.on('error', () => {
      if (!cancelled && !connected) {
        clearTimers();
        scheduleRetry();
      }
    });
  }

  tryConnect();

  return {
    cancel() {
      cancelled = true;
      clearTimers();
      detector?.cleanup();
      currentPeer?.destroy();
    },
  };
}
