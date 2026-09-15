// ═══════════════════════════════════════════════════════════════════════════
//  Yuniors Chill Zone — the Worker in front of the static site.
//
//  The whole site is still "serve the folder" (Cloudflare's static assets do
//  that, see wrangler.jsonc). This script exists for ONE route:
//
//      /gif/<id>.gif   →   our Supabase storage, bucket avatars, bot-gifs/<id>.gif
//
//  The bots' anime GIFs come from nekos.best, which forbids browsers from
//  embedding its files on other sites AND blocks Cloudflare Workers outright
//  ("Your IP address or IP range has been blocked by NEKOSBEST"). So the
//  bot-tools edge function downloads each GIF once and keeps a copy in our own
//  storage; this route serves that copy under our domain and caches it at the
//  edge for a week, so Supabase's metered egress is paid once per GIF, not
//  once per viewer.
//
//  Only a UUID filename, only from our bucket. This is not a general proxy.
// ═══════════════════════════════════════════════════════════════════════════

const STORE = "https://heohcnhgclcnmssjklom.supabase.co/storage/v1/object/public/avatars/bot-gifs/";
const WEEK = 7 * 24 * 3600;

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/gif\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\.(gif|png)$/);
    if (!m) return env.ASSETS.fetch(req);                       // everything else is the folder
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("get only", { status: 405 });

    const cache = caches.default;
    const key = new Request(url.origin + url.pathname, { method: "GET" });
    let res = await cache.match(key);
    if (!res) {
      const up = await fetch(STORE + m[1] + "." + m[2], { cf: { cacheTtl: WEEK, cacheEverything: true } });
      if (!up.ok) {
        return new Response("gone: upstream " + up.status, { status: 404, headers: { "Cache-Control": "no-store", "X-Upstream-Status": String(up.status) } });
      }
      const h = new Headers();
      h.set("Content-Type", m[2] === "png" ? "image/png" : "image/gif");
      h.set("Cache-Control", `public, max-age=${WEEK}, immutable`);
      h.set("X-Content-Type-Options", "nosniff");
      res = new Response(up.body, { status: 200, headers: h });
      ctx.waitUntil(cache.put(key, res.clone()));
    }
    return req.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
  },
};
