import Peer from 'peerjs';
import type { DataConnection, PeerJSOption } from 'peerjs';
import { customAlphabet } from 'nanoid';
import type { GameMessage } from './protocol';

/** Generate PeerJS-safe game IDs: 8 chars, alphanumeric only (per D-05, Pitfall 1) */
export const generateGameId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

const TURN_CREDENTIAL_URL = import.meta.env.VITE_TURN_CREDENTIAL_URL as string | undefined;

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

const MAX_ID_RETRIES = 3;

/**
 * Create a host peer that listens for a guest connection.
 * Generates a unique game ID and registers with PeerJS signaling server.
 */
export function createHost(callbacks: ConnectionCallbacks, existingGameId?: string) {
  let conn: DataConnection | null = null;
  let retryCount = 0;
  let gameId = existingGameId ?? generateGameId();
  let currentPeer: Peer;

  // Fetch ICE config then init — peer creation is async now
  getIceConfig().then((config) => { currentPeer = initPeer(gameId, config); });

  function initPeer(id: string, config?: PeerJSOption['config']): Peer {
    const peer = new Peer(id, { debug: 0, config });

    peer.on('open', (openedId: string) => {
      gameId = openedId;
      callbacks.onOpen(openedId);
    });

    peer.on('connection', (dataConn: DataConnection) => {
      conn = dataConn;

      dataConn.on('open', () => {
        callbacks.onConnect();
      });

      dataConn.on('data', (data: unknown) => {
        callbacks.onData(data as GameMessage);
      });

      dataConn.on('close', () => {
        conn = null;
        callbacks.onClose();
      });
    });

    peer.on('error', (err: Error & { type?: string }) => {
      if (err.type === 'unavailable-id' && retryCount < MAX_ID_RETRIES) {
        retryCount++;
        peer.destroy();
        const newId = generateGameId();
        gameId = newId;
        currentPeer = initPeer(newId, config);
        return;
      }
      callbacks.onError(err);
    });

    return peer;
  }

  return {
    get peer() { return currentPeer; },
    send: (msg: GameMessage) => { conn?.send(msg); },
    destroy: () => { currentPeer.destroy(); },
    get gameId() { return gameId; },
  };
}

/**
 * Join an existing game as a guest by connecting to the host's peer ID.
 */
export async function joinGame(gameId: string, callbacks: ConnectionCallbacks) {
  let conn: DataConnection | null = null;
  const config = await getIceConfig();
  const peer = new Peer(undefined as unknown as string, { debug: 0, config });

  peer.on('open', () => {
    const dataConn = peer.connect(gameId, { reliable: true });
    conn = dataConn;

    dataConn.on('open', () => {
      callbacks.onConnect();
    });

    dataConn.on('data', (data: unknown) => {
      callbacks.onData(data as GameMessage);
    });

    dataConn.on('close', () => {
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
    destroy: () => { peer.destroy(); },
  };
}
