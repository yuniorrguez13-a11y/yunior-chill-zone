// ═══════════════════════════════════════════════════════════════════════════
//  Yuniors Chill Zone — the Worker in front of the static site.
//
//  The whole site is still "serve the folder" (Cloudflare's static assets do
//  that, see wrangler.jsonc). This script exists for ONE route:
//
//      /gif/<action>/<id>.gif   →   https://nekos.best/api/v2/<action>/<id>.gif
//
//  The bots' anime GIFs come from nekos.best, and nekos.best answers browsers
//  with a header that forbids embedding its files on other sites — the chat
//  showed ERR_BLOCKED_BY_RESPONSE.NotSameOrigin and a broken picture. Fetched
//  from here, the same bytes arrive under our own origin with our own headers,
//  and Cloudflare caches them at the edge for a week so nekos.best is asked
//  once per GIF, not once per viewer.
//
//  Only nekos.best, only the actions the bot knows, only a UUID filename. This
//  is not a general proxy.
// ═══════════════════════════════════════════════════════════════════════════

// mirror of public.ycz_bot_gif_actions() in the database
const ACTIONS = new Set([
  "hug", "pat", "cuddle", "kiss", "slap", "poke", "highfive", "tickle", "bonk", "bite", "handhold", "feed",
  "wave", "wink", "stare", "blowkiss",
  "dance", "cry", "blush", "smile", "laugh", "happy", "yawn", "facepalm", "sleep", "pout", "nod", "shocked",
  "think", "thumbsup", "clap", "angry",
]);
const WEEK = 7 * 24 * 3600;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/gif\/([a-z]+)\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.(gif|png)$/);
    if (!m) return env.ASSETS.fetch(req);                       // everything else is the folder
    if (!ACTIONS.has(m[1])) return new Response("not a thing", { status: 404 });
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("get only", { status: 405 });

    const cache = caches.default;
    const key = new Request(url.origin + url.pathname, { method: "GET" });
    let res = await cache.match(key);
    if (!res) {
      const up = await fetch(`https://nekos.best/api/v2/${m[1]}/${m[2]}.${m[3]}`, {
        headers: { "User-Agent": "yuniorschillzone.xyz gif relay" },
        cf: { cacheTtl: WEEK, cacheEverything: true },
      });
      if (!up.ok) return new Response("gone", { status: 404, headers: { "Cache-Control": "public, max-age=300" } });
      const h = new Headers();
      h.set("Content-Type", m[3] === "png" ? "image/png" : "image/gif");
      h.set("Cache-Control", `public, max-age=${WEEK}, immutable`);
      h.set("X-Content-Type-Options", "nosniff");
      res = new Response(up.body, { status: 200, headers: h });
      ctx.waitUntil(cache.put(key, res.clone()));
    }
    return req.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
  },
};
