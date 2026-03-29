interface Env {
  TURN_KEY_ID: string;
  TURN_KEY_API_TOKEN: string;
  ALLOWED_ORIGINS: string; // comma-separated
  GAME_ROOMS: KVNamespace;
}

const ROOM_TTL = 3600; // 1 hour

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
    const isLocalhost = /^https?:\/\/localhost(:\d+)?$/.test(origin);
    const corsOrigin = allowed.includes(origin) || isLocalhost ? origin : allowed[0];

    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // Route: /rooms/:gameId
    if (pathParts[0] === 'rooms' && pathParts[1]) {
      return handleRooms(request, env, pathParts[1], corsHeaders);
    }

    // Default route: TURN credentials (GET /)
    if (request.method !== 'GET') {
      return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
    }

    return handleTurnCredentials(env, corsHeaders);
  },
};

async function handleRooms(
  request: Request,
  env: Env,
  gameId: string,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  if (request.method === 'GET') {
    const peerId = await env.GAME_ROOMS.get(gameId);
    if (!peerId) {
      return Response.json({ error: 'Room not found' }, { status: 404, headers: corsHeaders });
    }
    return Response.json({ peerId }, { headers: corsHeaders });
  }

  if (request.method === 'POST' || request.method === 'PUT') {
    const body = await request.json() as { peerId?: string };
    if (!body.peerId || typeof body.peerId !== 'string') {
      return Response.json({ error: 'Missing peerId' }, { status: 400, headers: corsHeaders });
    }
    await env.GAME_ROOMS.put(gameId, body.peerId, { expirationTtl: ROOM_TTL });
    return Response.json({ ok: true }, { headers: corsHeaders });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: corsHeaders });
}

async function handleTurnCredentials(
  env: Env,
  corsHeaders: Record<string, string>,
): Promise<Response> {
  const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl: 86400 }),
  });

  if (!resp.ok) {
    return Response.json(
      { error: 'Failed to generate TURN credentials' },
      { status: 502, headers: corsHeaders },
    );
  }

  const data = await resp.json();

  return Response.json(data, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
