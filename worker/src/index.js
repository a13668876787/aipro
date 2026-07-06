const json = (data, init = {}) => new Response(JSON.stringify(data), {
  ...init,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    ...(init.headers || {}),
  },
});

const corsHeaders = (request, env) => {
  const origin = request.headers.get('origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean);
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '*';
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-key',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
};

const dayInShanghai = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(date);

const maskIp = (ip) => {
  if (!ip) return 'unknown';
  if (ip.includes(':')) return `${ip.split(':').slice(0, 3).join(':')}:****`;
  const parts = ip.split('.');
  return parts.length === 4 ? `${parts[0]}.${parts[1]}.xxx.xxx` : 'unknown';
};

const hashIp = async (ip, salt) => {
  const data = new TextEncoder().encode(`${salt || 'ai-radar-pro'}:${ip || 'unknown'}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const hasOwnerIp = (env, ipHash) => (env.OWNER_IP_HASHES || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .includes(ipHash);

const parseDevice = (ua = '') => {
  const lower = ua.toLowerCase();
  const os = lower.includes('iphone') ? 'iPhone'
    : lower.includes('android') ? 'Android'
      : lower.includes('macintosh') ? 'Mac'
        : lower.includes('windows') ? 'Windows'
          : 'Other';
  const browser = lower.includes('edg/') ? 'Edge'
    : lower.includes('chrome/') ? 'Chrome'
      : lower.includes('safari/') ? 'Safari'
        : lower.includes('firefox/') ? 'Firefox'
          : 'Browser';
  return `${os} / ${browser}`;
};

const requireAdmin = (request, env) => {
  const key = request.headers.get('x-admin-key') || '';
  return Boolean(env.ADMIN_KEY && key && key === env.ADMIN_KEY);
};

const withCors = (response, request, env) => {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const readBody = async (request) => {
  try {
    return await request.json();
  } catch (_error) {
    return {};
  }
};

async function track(request, env) {
  const body = await readBody(request);
  const now = new Date();
  const ip = request.headers.get('cf-connecting-ip') || '';
  const ipHash = await hashIp(ip, env.IP_HASH_SALT);
  const cf = request.cf || {};
  const ua = request.headers.get('user-agent') || '';
  const isOwner = Boolean((env.OWNER_TOKEN && body.ownerToken === env.OWNER_TOKEN) || hasOwnerIp(env, ipHash));
  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO events (
      id, created_at, day, type, path, title, referrer, visitor_id, session_id,
      ip_hash, ip_masked, ip_full, country, region, city, user_agent, device, is_owner, detail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    now.toISOString(),
    dayInShanghai(now),
    String(body.type || 'event').slice(0, 40),
    String(body.path || '/').slice(0, 300),
    String(body.title || '').slice(0, 300),
    String(body.referrer || '').slice(0, 500),
    String(body.visitorId || '').slice(0, 120),
    String(body.sessionId || '').slice(0, 120),
    ipHash,
    maskIp(ip),
    ip,
    cf.country || '',
    cf.region || '',
    cf.city || '',
    ua.slice(0, 500),
    parseDevice(ua),
    isOwner ? 1 : 0,
    JSON.stringify(body.detail || {}).slice(0, 2000),
  ).run();

  return json({ ok: true });
}

async function owner(request, env) {
  if (!requireAdmin(request, env)) return json({ error: 'unauthorized' }, { status: 401 });
  if (!env.OWNER_TOKEN) return json({ error: 'OWNER_TOKEN is not configured' }, { status: 500 });
  return json({ ownerToken: env.OWNER_TOKEN });
}

async function summary(request, env) {
  if (!requireAdmin(request, env)) return json({ error: 'unauthorized' }, { status: 401 });
  const day = new URL(request.url).searchParams.get('day') || dayInShanghai();

  const metrics = await env.DB.prepare(`
    SELECT
      SUM(CASE WHEN type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      COUNT(DISTINCT visitor_id) AS visitors,
      COUNT(DISTINCT CASE WHEN is_owner = 0 THEN visitor_id END) AS outsiders,
      SUM(CASE WHEN is_owner = 1 THEN 1 ELSE 0 END) AS ownerVisits
    FROM events
    WHERE day = ?
  `).bind(day).first();

  const events = await env.DB.prepare(`
    SELECT created_at AS createdAt, type, path, ip_masked AS ipMasked, ip_full AS ipFull, country, region, city, device, is_owner AS isOwner
    FROM events
    WHERE day = ?
    ORDER BY created_at DESC
    LIMIT 80
  `).bind(day).all();

  const pages = await env.DB.prepare(`
    SELECT path AS label, COUNT(*) AS count
    FROM events
    WHERE day = ? AND type = 'pageview'
    GROUP BY path
    ORDER BY count DESC
    LIMIT 10
  `).bind(day).all();

  const clicks = await env.DB.prepare(`
    SELECT COALESCE(json_extract(detail, '$.action'), type) AS label, COUNT(*) AS count
    FROM events
    WHERE day = ? AND type = 'click'
    GROUP BY label
    ORDER BY count DESC
    LIMIT 10
  `).bind(day).all();

  return json({
    day,
    metrics: {
      pageviews: metrics?.pageviews || 0,
      visitors: metrics?.visitors || 0,
      outsiders: metrics?.outsiders || 0,
      ownerVisits: metrics?.ownerVisits || 0,
    },
    events: events.results || [],
    pages: pages.results || [],
    clicks: clicks.results || [],
  });
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }), request, env);
    const url = new URL(request.url);
    let response;

    if (url.pathname === '/api/track' && request.method === 'POST') response = await track(request, env);
    else if (url.pathname === '/api/admin/summary' && request.method === 'GET') response = await summary(request, env);
    else if (url.pathname === '/api/admin/owner' && request.method === 'POST') response = await owner(request, env);
    else response = json({ error: 'not_found' }, { status: 404 });

    return withCors(response, request, env);
  },
};
