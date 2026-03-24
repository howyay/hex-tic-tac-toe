import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { customAlphabet } from 'nanoid';
import type { GameMessage } from './protocol';

/** Generate PeerJS-safe game IDs: 8 chars, alphanumeric only (per D-05, Pitfall 1) */
export const generateGameId = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

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
export function createHost(callbacks: ConnectionCallbacks) {
  let conn: DataConnection | null = null;
  let retryCount = 0;
  let gameId = generateGameId();

  function initPeer(id: string): Peer {
    const peer = new Peer(id, { debug: 0 });

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
        currentPeer = initPeer(newId);
        return;
      }
      callbacks.onError(err);
    });

    return peer;
  }

  let currentPeer = initPeer(gameId);

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
export function joinGame(gameId: string, callbacks: ConnectionCallbacks) {
  let conn: DataConnection | null = null;
  const peer = new Peer(undefined as unknown as string, { debug: 0 });

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
