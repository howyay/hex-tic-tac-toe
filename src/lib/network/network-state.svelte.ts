export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
export type PlayerRole = 'host' | 'guest';

export function createNetworkState() {
  let status = $state<ConnectionStatus>('disconnected');
  let role = $state<PlayerRole | null>(null);
  let gameId = $state<string | null>(null);
  let error = $state<string | null>(null);

  return {
    get status() { return status; },
    set status(v: ConnectionStatus) { status = v; },
    get role() { return role; },
    set role(v: PlayerRole | null) { role = v; },
    get gameId() { return gameId; },
    set gameId(v: string | null) { gameId = v; },
    get error() { return error; },
    set error(v: string | null) { error = v; },
  };
}

export type NetworkStateAPI = ReturnType<typeof createNetworkState>;
