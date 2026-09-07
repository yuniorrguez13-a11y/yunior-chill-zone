# Yuniors Chill Zone

`yuniorschillzone.xyz` — a Discord-style community site. Plain HTML/CSS/JS, no build
step, no framework. Supabase for auth, database, realtime and storage. Cloudflare for
DNS, TURN **and hosting**.

**Hosting: Cloudflare Workers static assets, deployed from `main`.** Moved off GitHub
Pages on 17 Aug 2026 after a multi-hour GitHub outage blocked three deploys in a row
(build fine every time, the Pages deployment API answered 503). Config lives in
`wrangler.jsonc` (just "serve this folder" — there is no build command), caching rules
in `_headers`, and `.assetsignore` keeps `CLAUDE.md`, `.git` and any stray `.sql` out
of what gets published — GitHub Pages had been serving this file at `/CLAUDE.md`.
Every push to `main` redeploys in about 80 seconds. GitHub is now only where the code
lives; Pages was switched off in the repo settings on 18 Aug 2026. Cloudflare also
gives unmetered bandwidth, which matters: the site ships ~90 MB of art.

`workers_dev` and `preview_urls` are both **false**, so the site answers only on
`yuniorschillzone.xyz` — no `*.workers.dev` mirror, and no fresh public URL minted per
deploy. Don't turn them back on to "test something"; use `python3 -m http.server`
locally instead. The two custom domains are declared in `wrangler.jsonc` under `routes`
so a redeploy restores them if the dashboard ever loses them.

**DNS, and the trap that cost us an outage.** Deploying the Worker does *not* move the
domain to it. The zone kept GitHub Pages' four proxied `A` records (`185.199.10x.153`)
plus a `www` CNAME to `yuniorrguez13-a11y.github.io`, so Cloudflare went on fetching the
site *from GitHub* and everything looked fine — right up until Pages was switched off and
the domain started serving GitHub's 404. Attaching a Worker custom domain then fails with
*"already has externally managed DNS records"* until those five records are deleted.
Order matters: **delete the old web records first, then attach the custom domain.**
When touching this zone, only `A`/`AAAA`/`CNAME` for the site itself are ever in play.
Leave alone: the three Zoho `MX`, the SPF / DKIM (`zoho._domainkey`) / `zoho-verification`
/ `google-site-verification` / `_discord` TXT records, and — easy to miss —
`movies.yuniorschillzone.xyz`, a **Cloudflare Tunnel to a Jellyfin box** that has nothing
to do with the website. Deleting any of those breaks email, mail reputation, or his media
server. `_dmarc` is still absent (see Known gaps).

**The owner is not a professional developer.** Explain changes plainly, one step at a
time, and don't dump large amounts of technical material at once. He tests on
`localhost:3000` and on the live domain.

---

## Files

| File | What it is |
|---|---|
| `index.html` | The main app. ~2,600 lines, everything inline. Chat, servers, channels, voice, DMs, friends, profiles, bots, notifications. |
| `ycz-theme.css` | Shared stylesheet. Loaded **after** each page's own `<style>` so it wins the cascade. |
| `ycz-i18n.js` | Translation engine + dictionaries (en/es/fr/pt). `t('key')` in JS, `data-i18n="key"` in markup. |
| `ycz-icons.js` | Two icon families. **Stroke set** (~49 inline SVGs, Discord-like): `icon('hash')` / `<i data-ic="hash">`. **Bold set** (Sep 2026): chunky filled glyphs from Itcherpro's free game-asset pack, 36 white PNGs trimmed to 160px squares in `art/icons-bold/`, rendered as CSS masks so they take `currentColor`: `icon('b:gift')` / `<i data-ic="b:gift">`, names whitelisted in `YCZ_BOLD`. Used where a game-UI feel fits: SFFG menu, the Treasury (tabs, shop tiers, leaderboard medals), the landing feature cards (this killed the landing emoji). The pack's brand logos (Steam/Twitch/YouTube/Apple/Facebook) were **left out** — trademarks. The zip carried no licence text; the owner confirmed (7 Sep 2026) that what he supplies is free of copyright, recorded in `art/icons-bold/LICENSE.txt`. |
| `ycz-scores.js` | Records + playtime, kept in `localStorage` under `ycz-games`. `yczScore(id,n)` for a high score, `yczTally(id)` for a running count, `yczPlay(id,ms)` for time, `yczData()` to read. Loaded by the games that keep score and by the console. |
| `video.html` | VideoZone. Own app, shares session + theme. |
| `qmages.html` | Image board. Own app, shares session + theme. |
| `piano.html` | Multiplayer piano. |
| `music.html` | Static link page, themed via `ycz-theme.css`. |
| `lite.html` | **YCZ Lite** — the museum edition for PS Vita (with iTLS-Enso homebrew) and other ancient browsers. Pure ES5 + 2010 CSS, XHR polling every 5s against the Supabase REST API, login + read + send in the classic channels. Rule of the file: keep it dumb forever — no modern syntax, no fetch, no realtime, no heavy assets. Not linked from the main UI; shared by URL. |
| `gaming.html` | The console. A Steam-Big-Picture launcher: wide hero for the selected game, upright capsules for the rest, games open in an iframe here rather than redirecting. Edit the `GAMES` array at the top of its `<script>` to add or remove one — nothing else in the file needs touching. |
| `fight.html` | **SFFG** (Stupidly Funny Fighting Game for Dummies). The fighting game: deterministic 60fps engine, official roster, community fighters, local/CPU/arcade/training/online. See its own section below. |
| `create.html` | SFFG's no-code fighter creator. Sliders, move editor with a to-scale hitbox overlay, sprite frame upload that chroma-keys/trims/aligns and builds sheets in the browser, live validation, publish to Supabase. |
| `modding.html` | SFFG's "how to code a fighter" tutorial — the JSON format, limits, sprite contract, validation rules, worked example. |
| `sffg-mods.js` | The community fighter format (v3, the Freedom Update): security bounds, `validateMod()`, `hashMod()`. Shared by `fight.html` and `create.html` so the game and the creator enforce identical rules. |
| `manifest.json` · `sw.js` | The PWA: installable app (icons in `art/icons/`, generated from the favicon). `sw.js` is deliberately **network-first, cache as offline fallback only** — never let it get in the way of the 80-second deploy freshness. Every main page links the manifest and registers the worker. The five pages that created their Supabase client unguarded now polyfill a chainable no-op client when the CDN is unreachable, so offline shells paint instead of crashing. |
| `wrangler.jsonc` · `_headers` · `.assetsignore` | Cloudflare hosting config, cache rules, and what stays unpublished. |
| `ycz-denarii.js` | Shared Denarii client: `YCZDenarii.plural(n)`, the live **coin pill** (`mount(sb,{into,onOpen})`, `setUser(user)`), a realtime subscription to the user's own `denarii_ledger` rows that bumps the pill, floats a `+N` and toasts the reason, `on('award'|'wallet')`, `reasonLabel()`, and `NAME_COLORS` (the id → hex whitelist for bought name colours). Loaded by `index.html`, `fight.html`, `video.html`, `qmages.html`; injects its own CSS. |
| `denarii.html` | The public guide to **Denarii**, the site currency: where it lives, the plural rule, how you earn, streaks, the leaderboard, the catalog, troubleshooting, FAQ. Static, no scripts (its CSP has `script-src 'none'`). Linked from the Treasury, the settings row and the landing card. |
| `overwork.html` | **Overwork**, the delivery game (Sep 2026): 3D, Three.js from `vendor/`, hand-rolled physics, clay characters, an apartment with a PC, a casino, host-authoritative multiplayer. See its own section below. |
| `ow-net.js` | Overwork's wire: signalling over Supabase realtime broadcast (or a `BroadcastChannel` with `?signal=local` for two tabs on one machine) and one WebRTC connection per peer with two data channels (`rel` ordered for events, `fast` lossy for snapshots). Knows nothing about the game. |
| `ow-os.js` | **MirrorOS**, the operating system on the PC in the courier's apartment: a 2009-glass-look desktop (own name, own icons, no trademarks) with draggable windows, taskbar, start orb, and the apps: Overwork Online (host/join/rooms/chat), Lucky Loaf Casino (slots + 21 + roulette, the flat edition of the real tables — same state objects, handed over in `api.games`), notes, locker shortcut, a Pitty Striker shortcut that crashes on purpose, a recycle bin. Takes an `api` object from the game; touches only its own DOM. **All of its CSS is scoped under `#s-pc`** — a bare `.card` rule in here once shrank the game's work-order card to a playing card. Desktop icons open on a single click. |
| `ow-piano.js` | **The piano** (Sep 2026). Every musical sound in Overwork: a sampled grand piano (18 notes every third semitone A1–C6, `art/overwork/piano/`, CC BY 3.0 via tonejs-instruments, ~1 MB), a generative lo-fi background tune that is never the same twice, and the *cues* the game used to synthesise (delivery, la peace, mystery box, dog, horn) played like a silent-film accompanist. Felt lowpass + small-room convolution + limiter. `createPiano(ac, base)` → `load()`, `cue(name)`, `music.start/stop/pause`, `setVolume`, `setMuffled`, `until(t)` (also drives an `OfflineAudioContext` render in the harness). **No oscillators anywhere in Overwork** — owner's rule, see the sound section below. |
| `ow-striker.js` · `ow-striker-data.js` | **Pitty Striker** (Sep 2026), the shooter on the apartment PC — the courier's *own* game, nothing about the job inside it (owner's correction, see its section). `ow-striker.js` is the machine (launcher in the MirrorOS window, loot-case reel, inventory, stats, settings, the match: own WebGLRenderer inside `#pc-frame`, cylinder-vs-AABB solver, five real-world guns, spring-driven viewmodels, bots with a state machine on a node graph, DOM HUD, pointer lock, touch layer, foley routing). `ow-striker-data.js` is pure data: the "sandstone" map table (rows = geometry AND colliders — the name is historical, it is a sunny city block now), the deco and its `LIGHTS`, nodes and edge hints, WEAPONS, SKINS + CASES + RARITY, BOTS, DIFF, every line of copy (LINES), the sound table (SFX), the `CITY`/`CITY_FIT` placement table for the buildings outside the walls, `validatePS`/`psSig`/`rollCase`. Lazy-loaded by `overwork.html` on the first click of the desktop icon. |
| `ow-casino.js` | The rules of the Lucky Loaf Casino with no pixels attached: `createSlots/createBlackjack/createRoulette(bank)` are small state machines over a `{cash(), add(n)}` bank. The 3D tables in `overwork.html` and the MirrorOS window both render the *same* instances, so what the felt shows is what the window shows. Spins/deals decide the result up front (`spin()` returns the pending outcome, the renderer animates and calls `settle()`). |
| `art/overwork/guns/` · `art/overwork/sfx-guns/` · `art/overwork/city/` · `art/overwork/chars/` | Pitty Striker's assets, all owner-supplied: five weapon models, eighteen gun recordings, twenty-eight city models, one rigged soldier. Each folder has a LICENSE.txt naming the source, listing the original filename of every file, and saying what the game falls back to if the folder ever has to come out. |
| `vendor/` | Third-party libraries served from our own origin (no CDN dependency, CSP `'self'`). `three.module.min.js` (r169, MIT) and `supabase-2.115.0.min.js` (UMD, MIT), licences alongside. `_headers` caches `/vendor/*` for a year as immutable, so **rename the file when upgrading**. |
| `promo/` | Promo-video production material — brief (`BRIEF.md`), smooth 1080p gameplay clips, original synth music, English TTS narration, the frame-stepped capture script. Excluded from publishing via `.assetsignore`. Read `promo/BRIEF.md` before touching video work: three cloud-made videos were rejected; the owner produces videos in a **local** session with his own editing tools. |

### Supabase Edge Functions
| Function | Purpose | Notes |
|---|---|---|
| `smart-function` | Mints Cloudflare TURN credentials for voice. **Named wrong** — the app tries `turn-credentials` first, fails, then falls back. Renaming would clear a recurring CORS error. | JWT verification off; verifies the user itself. |
| `bot-post` | Bots POST here with their token to send messages. | JWT verification off; bots authenticate with their own token. |

---

## Critical gotchas — read before changing anything

**1. Two different profile tables, both live.**
- `user_profiles` — used by `index.html` (the chat app)
- `profiles` — used by `video.html` and `qmages.html`

They are **not** the same table and neither is dead. `qmages_images.user_id` and the
videos table both have foreign keys to `profiles`. A trigger (`ycz_on_auth_user_created`)
creates a `profiles` row on signup — without it, new users get
`violates foreign key constraint` the moment they upload anything.

**2. Shared session across pages.** Every page must create its Supabase client with
`storageKey:'ycz-auth'`. That's what makes one login cover the whole site. Omit it and
that page gets its own isolated session. Has bitten us twice.

**3. Channels use `room_key`, not channel id.** `messages.room_id` points at
`channels.room_key`. Original rooms kept readable keys (`global`, `announce`, `gaming`,
`music`, `random`, `offtopic`); new channels get a UUID. Never assume `room_id` is a
channel UUID.

**4. `messages.is_owner` is NOT NULL.** Always send a boolean. `gRole==='owner'||null`
throws a constraint violation for everyone who isn't the owner. Shipped as a bug once.

**5. `crypto.randomUUID()` only exists in secure contexts.** Use the `uid()` helper in
`index.html`, which falls back. Channel creation broke over plain http because of this.

**6. RLS insert policies need `WITH CHECK`, not just `USING`** — for `FOR INSERT`
policies. Note: a `FOR ALL` policy with only `USING` *does* apply that expression to
writes (verified empirically), but splitting read/insert is clearer.

**7. Auth events fire on tab focus.** `onAuthStateChange` emits `SIGNED_IN` when the tab
regains focus. `applySession` no-ops when the user id hasn't changed;
`TOKEN_REFRESHED`/`USER_UPDATED` are ignored.

**8. Voice needs TURN.** STUN alone fails on mobile data and CGNAT. Watch the console for
`TURN relay: YES ✓`. `yczVoiceTest()` forces relay-only mode to prove it works.

**9. Cloudflare's `generate-ice-servers` returns `iceServers` as either an object or an
array** depending on version. Always normalise to an array.

**10. Don't hardcode colours in `ycz-theme.css`.** It loads after each page's styles and
uses `!important`, so a literal colour there overrides both themes and breaks light mode.
Everything goes through a variable defined in **both** the dark and light blocks.

**11. `.page` is a shared class.** Music/Gaming use a bare `<div class="page">`; VideoZone
and Qmages use `.page` with an id per screen. The dark-wash rule in the compat block is
scoped `.page:not([id])` for exactly this reason.

---

## Database (Supabase, project ref `heohcnhgclcnmssjklom`)

- `user_profiles` — user_id, username, handle (unique, lowercased), pfp_url, pfp_frame,
  bg_url, updated_at (doubles as "last seen"). **Chat app only.**
- `profiles` — id, username (NOT NULL), avatar_url, banner_url, bio, created_at.
  **VideoZone + Qmages only.** See gotcha 1.
- `user_roles` — site-wide roles (owner/admin/mod). Separate from server roles.
- `messages` — text, image_url, username, pfp_url, pfp_frame, room_id, user_id, is_owner,
  is_bot, bot_id, role, reply_to, edited_at, created_at.
- `servers` — name, icon (emoji), icon_url, owner_id, invite_code.
- `server_members` — server_id, user_id, role (owner/admin/mod/member), muted_until
  (timeouts, added by the admin-tools migration).
- `channels` — server_id, name, type (text/voice), room_key, position, slowmode (seconds,
  0 = off), locked (both added by the admin-tools migration).
- `server_audit_log` — server_id (text), actor_id, actor_name, action, target, detail,
  created_at. Written client-side on every mod action; RLS makes entries unforgeable
  (actor must be you, must be a mod of that server) and immutable (no UPDATE policy;
  DELETE only by the server owner, used when deleting a whole server). Read by
  owner/admin/mod. Actions: role, kick, ban, unban, timeout, untimeout, purge, lock,
  unlock, slowmode, channel_create/rename/delete, invite, transfer, server_update,
  bot_create/delete. Viewer lives in server settings; lines are i18n (`aud_*` keys).
- `friendships`, `notifications`, `reactions`, `bots`, `bot_commands`, `server_bans`
- `fighter_mods` — SFFG community fighters. id (text, the mod id), owner_id, owner_name,
  name, tagline, `data` (jsonb — the whole validated fighter, format v2), has_sprites,
  status ('live' / 'removed'), plays, created_at, updated_at. RLS: anyone (signed in or
  not) reads rows with `status='live'`; insert/update/delete only by `owner_id`.
  Moderation is done by setting `status='removed'`. `sffg_mod_played(mod_id)` is a
  security-definer RPC that bumps `plays` — the client can't write that column directly.
  Sprite sheets are **not** in this table: they live in the `avatars` bucket under
  `<uid>/sffg-mods/<id>/<anim>.png`. Migration run 18 Aug 2026.
- `pinned_messages` — message_id (text, no FK on purpose — id types are mixed), room_id,
  pinned_by, created_at. Created by `features-update.sql`. RLS: everyone reads; only room
  moderators (or the two DM participants) insert/delete, via the `ycz_can_pin(text)`
  security-definer helper. The app cleans up pins whose message was deleted.
- `user_profiles.bio` — added by `features-update.sql`. `saveProfile()` in `index.html`
  retries without `bio` if the column doesn't exist yet, so the app works either way.
- `videos` (VideoZone: has `is_short`), `qmages_*` (image board)

**Id column types are inconsistent** — some are `uuid`, some `text`. SQL touching ids
should cast both sides to `::text` unless you've checked the specific columns.

Dead tables, safe to drop after checking: `room_signals`, `room_participants`,
`direct_messages`. DMs live in `messages` under `dm_<idA>_<idB>` keys; old history was
never migrated. **`profiles` is NOT dead** — see gotcha 1.

Realtime publication: `messages`, `notifications`, `reactions`, `bot_commands`.

Storage: one public bucket, `avatars` — profile pictures, frames, banners, server icons,
chat images. Writes restricted to `<user-id>/...` paths by RLS.

### RLS
Audited and fixed; the admin-tools migration rebuilt the policies on `servers`,
`server_members`, `server_bans` and the `messages` INSERT policy. Current intent:
- `messages` SELECT — authenticated only; DMs limited to the two participants
- `messages` INSERT — `user_id` must be you, you must be in the DM, and
  `ycz_can_post(room_id)` must pass (channel not locked, you're not timed out,
  slowmode window elapsed — moderators exempt; DMs and non-channel rooms always pass)
- `messages` DELETE — author, server owner, or admin/mod of that server
- `server_members` — no self-service UPDATE. Owner changes any role; **admins can set
  mods/members to mod/member** (not themselves, not admins, can't grant admin). Kick:
  owner anyone, admins only mods/members, anyone can remove themself. INSERT: only your
  own row, as `member` (or `owner` when you created the server), **blocked if you're in
  `server_bans`** — bans are enforced by the database, not just the UI.
- `server_bans` — owner/admins ban (not the owner, admins can't ban admins, `banned_by`
  must be you); the banned user can read their own ban (the app uses that to say
  "You are banned" on a failed join).
- `servers` — UPDATE by owner or admin, but a trigger (`ycz_server_owner_guard`) blocks
  `owner_id` changes by anyone but the current owner; DELETE owner-only.

Known remaining hole: `servers_read` is `USING (true)`, so any logged-in user can read
every server's `invite_code` and join uninvited. Fixing it properly needs server SELECT
restricted plus a security-definer `join_server(code)` RPC and a matching change in
`index.html`. Not done yet.

Helper functions in the DB: `ycz_is_dm(text)`, `ycz_in_dm(text)`, `ycz_pick_username(jsonb,text)`,
`ycz_create_profile()` (trigger fn), `ycz_can_pin(text)`, and from the admin-tools
migration: `ycz_sv_role(text)` (your role in a server, 'owner' if you own it),
`ycz_site_owner()`, `ycz_is_banned(text)`, `ycz_can_post(text)`,
`ycz_guard_server_owner()` (trigger fn). All security definer.

---

## Email / auth

- Login is **email + password** (`signInWithPassword`). There is no OTP or
  verification-code flow anywhere in the codebase, despite the Supabase settings page
  showing OTP options.
- The only email Supabase sends is the **signup confirmation**.
- SMTP is **Zoho Mail** (`smtp.zoho.com:465`, sender `yuni@yuniorschillzone.xyz`) on the
  **Mail Free** plan. SMTP does work on that plan here — don't repeat the claim that free
  Zoho blocks SMTP.
- DNS: SPF `v=spf1 include:zohomail.com ~all` and DKIM (`zoho._domainkey`, 2048-bit) are
  live and verified. **DMARC was still missing** as of the last check — the record to add
  is `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:yuni@yuniorschillzone.xyz`.
- Deliverability to **iCloud** is the sensitive case; it junks or silently drops unsigned
  mail from young domains.
- Check **Authentication → URL Configuration**; if Site URL is `localhost:3000`,
  confirmation links are broken for everyone else. The code never sets `emailRedirectTo`,
  so it relies entirely on that setting.

---

## Conventions

- **This is not a template project.** It used to be pitched as open-source-to-fork, with
  a `personalize.html` site builder and a `nosaving.html` Ctrl+S trap — all removed
  Aug 2026 at the owner's request. Don't reintroduce template framing anywhere
  (README, pages, comments).

- No build step. Edit the HTML directly.
- Shared behaviour goes in `ycz-theme.css` / `ycz-i18n.js` / `ycz-icons.js`, never
  duplicated per page.
- New UI strings get a `data-i18n` key and an entry in all four languages.
- New icons go in `ycz-icons.js` — **never add emoji to the interface**.
- SQL is written idempotent (safe to re-run) with a verification `select` at the end,
  and is **never committed to the repo** — always hand it to the owner in chat so he can
  paste it into the Supabase SQL editor himself. This is an explicit owner rule.
- **Assets the owner supplies are free of copyright — he said so (7 Sep 2026) and that
  is why his packs never carry licence text. Don't ask him again.** What we still do
  every time: put a LICENSE.txt in the folder naming the pack, listing the original
  filename of every file kept, saying what was changed, and saying what the game falls
  back to if the folder ever has to come out. That record is for us, not for him.
  Two exceptions carry *real* third-party terms and those are honoured on their own
  merits: `art/overwork/piano/` (CC BY 3.0, attribution required) and `art/sfx/`
  (Chequered Ink, free for commercial use, not resellable as assets).
- **Trademarks are a separate question from copyright and the answer there is still no.**
  Brand logos come out of every pack regardless of its terms: the icon pack's
  Steam/Twitch/YouTube/Apple/Facebook glyphs were dropped, and the skibidi Lamborghini
  was left out of the repo entirely because of the badge on its nose.

- The Supabase anon/publishable key is in the client on purpose — that's what it's for.
  Security comes from RLS. **Never** put a service-role key or the Cloudflare TURN token
  in client code.

---

## SFFG — the fighting game (`fight.html`)

Built Aug 2026. A real fighting game, not a toy: **deterministic** 60fps simulation
(integers only, no `Math.random`/`Date`/floats inside `step()` and friends) so that
netplay works and rollback stays possible later. Floats live only in the renderer.

- **Roster** — Regular Guy, Truck, Sir Twig, Sarge, Parasoul. `OFFICIAL_COUNT` pins
  them: community fighters only ever append after that index, and the select screen
  slices on it so officials always sit on top whatever the sorting says.
- **Mechanics** — lows/overheads, unblockable throws, dashes with backdash i-frames,
  super meter that carries across rounds, juggle cap of 4, combo damage scaling,
  armor and armor-break, per-character counters (`weakTo`, official roster only),
  data-driven projectiles and passives (regen / defense% / meter%).
- **Modes** — Local Versus (keyboard vs controller), Solo vs CPU, Arcade (5 fights,
  rising skill, `OMNIPOTENT <NAME>` boss), Training (dummy behaviours, hitbox and
  hurtbox overlay, live frame data and real frame advantage, infinite hp/meter),
  and Online.
- **CPU** — one brain that plays *any* fighter by reading its data: reach from each
  hitbox, threat from each startup, anti-airs from whatever launches. Four levels
  named after the tier ladder. Seeded xorshift, so scripted tests replay exactly.
- **Online** — Supabase realtime for signalling only, then a raw unordered WebRTC
  datachannel peer-to-peer, delay-based lockstep, FNV-1a checksum exchange as a
  desync tripwire. Character picks travel as *refs* (official index, or mod id +
  content hash) because local roster indexes differ once mods load.
- **Sprites** — per-animation strips with per-anim cell geometry (`cw/ch/cx/fy`),
  optional keys (`walkback`, `dash`, `backdash`, `block`, `getup`, `crouch`), and
  `move.anim` / `move.impact` to point a move at its own sheet and say which drawing
  is the hit. Sheets load with a `?v=` cache-buster — **always bump `sprite.v` when
  re-cutting strips**, or browsers pair new geometry with old images.
- **Sprite-cutting gotcha, learned the hard way:** source packs often record the
  character *travelling across the canvas*. Cropping a fixed box makes the sprite
  slide inside its cell while the fighter stands still. Movement/stance/reaction
  strips are anchored per frame (each frame centred on its own silhouette, feet on
  its own baseline); attack strips keep shared-canvas alignment so hit geometry
  stays true.

### Community fighters (the Mods Update → the Freedom Update)
A community fighter is **pure data** — that is the sandbox, no mod code is ever
executed. `sffg-mods.js` whitelists every field, strips markup and unknown keys, and
removes matchup fields (`weakTo` is official-only). Browsing and playing need no
account; **publishing requires sign-in**. Sprite sheets go to the existing `avatars`
bucket under `<uid>/sffg-mods/<id>/`, so the existing path RLS covers them.

**Format v3 (Freedom Update, Aug 2026), at the owner's explicit request: no balance
limits.** Numbers are clamped only into wide *security* ranges (integer safety for
the deterministic sim, hitstop ≤ 60, grav ≥ 1 so nobody floats forever, 32 moves /
40 anims / 150 KB JSON / 16384px sheets as browser limits). One-touch-kill data is
legal — the tier formula just labels it. v3 also exposed everything the engine could
already do plus new mechanics: chain moves (`nextA/nextB/nextC`, Parasoul-style),
custom move slots reached via chains, a per-fighter `burst` (engine checks
`c.moves.burst` generically), `inv` on any move, `chip` (% damage through block, can
KO), `lifesteal` passive, `projMax` (up to 6 live), and projectiles with `vy`/`grav`
(arcs), `bounce` and `pierce` (multi-hit with a 14-frame re-hit gap). v2 mods
validate unchanged under v3. The checksum now mixes projectile vy/hitsLeft/cd —
irrelevant across clients because HTML/JS is served with `max-age=0`.
**The owner explicitly does NOT want a moderation queue** — moderation stays
`status='removed'`.

**Art rule, non-negotiable:** original or CC0 art only. Ripped, traced or repainted
sprites from commercial games do not go in the repo — recoloring or redrawing over
someone's frames still starts from their frames. Two packs were rejected on these
grounds during development; one itch.io pack was rejected because the uploader had
wrapped a MUGEN rip in a licence he had no right to write.

## Security posture (audited Aug 2026, pre-launch)

A full adversarial audit ran before the site was promoted publicly. **The rule that
governs every finding: the UI is not a boundary — assume the attacker makes direct
REST/RPC calls with the public anon key. Only RLS, triggers and edge-function checks
stop anything.**

Fixed in the client and shipped:
- **Stored XSS in `video.html`** (critical, proven exploitable): titles, usernames,
  comment bodies and `avatar_url` were concatenated raw into `innerHTML`, so a video
  title executed for every visitor to the front page. Same class in `qmages.html`
  (URL columns into `src="…"`) and a `javascript:` href via `qmages_images.source_url`.
  Both files now have `esc()` + `safeUrl()` (http(s)-only) applied at every sink.
  A Playwright harness feeds a hostile row through the real render path; before the
  fix `window.__PWNED` was set, after it the payload is inert text.
- **Presence-status injection in `index.html`** (critical): the realtime presence
  payload is client-written and landed unescaped inside a `class` attribute in the
  member list and user card. `statusOf()` now whitelists online/idle/dnd.
- `_headers` gained a **CSP** on the session-holding pages (`/` and `/index.html` both
  need rules — Cloudflare matches exact paths) plus HSTS. `connect-src` is the point:
  it stops an injected script shipping the session token off-origin. `'unsafe-inline'`
  stays until the inline JS moves out. Third-party game bundles are deliberately left
  without CSP (they talk to their own servers).
- `index.html` was otherwise clean: `esc()` everywhere and `isUrl()` gating; the
  `renderText → md(linkify())` markdown pipeline was traced and is **not** injectable.
  SFFG's mod pipeline is genuinely a whitelist — mod data reaches no script/style/URL
  sink; "pure data, no mod code executed" holds.

Server-side state as of the live dump (**every table has RLS enabled**; `user_roles`
has no write policy at all, so nobody can self-promote to owner — that fear is closed;
DMs are correctly scoped by `ycz_in_dm`; `push_subs` is correctly pinned to `auth.uid()`):
- Identity guard triggers now live on `messages` and `notifications`
  (`ycz_msg_identity_guard`, `ycz_notif_guard`): the client used to decide `is_owner`,
  `role`, `is_bot`, `username` and `pfp_url`, and the renderer trusted them, so any
  account could post as the Owner. The DB now overwrites those columns with the truth
  (service_role bypasses, so the bot-post edge function still works).
- Storage: **7 buckets, not 1** (`avatars`, `files`, `banners`, `thumbnails`, `videos`,
  `qmages-*`). Only `avatars` had been audited. The qmages delete policies allowed **any
  logged-in user to delete anyone's images**; several upload policies checked only the
  bucket, not the `<uid>/` folder; banners/thumbnails/videos had no delete policy at all
  (moderation impossible) and no size/MIME limit.
- Still open, needs a coordinated client change: `servers_read USING (true)` leaks every
  invite code and `server_members` INSERT is self-service, so "join any server" remains
  possible — which also weakens the new message-read policy. Fixing it needs a
  `join_server(code)` RPC plus an `index.html` change, in lockstep.
- `channels.room_key` is client-chosen; without a unique index an attacker can create a
  shadow channel carrying someone else's room_key and defeat membership checks.
- **Regression found Sep 2026 while testing Denarii on a local Postgres:** the
  hardening version of `ycz_guard_message_identity` did `new.is_owner := (real_role =
  'owner')`, and `ycz_true_site_role()` returns NULL for anyone without a `user_roles`
  row — i.e. every normal member. NULL into the NOT NULL `messages.is_owner` column means
  **non-staff users could not post at all** after `hardening.sql`. The Denarii migration
  re-creates the function with `coalesce(real_role = 'owner', false)`. Lesson: a local
  Postgres 16 exists in the sandbox (`pg_ctlcluster 16 main start`, then `su postgres`);
  build a skeleton of the touched tables and **run every migration there** before
  handing it over (`scratchpad/denarii/skeleton.sql` + `behaviour.sql` show the pattern).
- **Lesson for future RLS work:** policies are OR'ed — dropping one loose policy does
  nothing if another still permits. Never reference a table inside a policy expression
  without a `security definer` helper, or the policy breaks the day that table is locked
  down (that is why `ycz_can_read_room` / `ycz_can_notify` / `ycz_is_staff` exist).

## Denarii — the site currency (Sep 2026, the Denarii Update)

**Name: Denarius. Plural: denarii.** `1 denarius`, `2 denarii`, `0 denarii` —
`YCZDenarii.plural(n)` in `ycz-denarii.js` is the only place that spells it, and the
small note under the balance ("One denarius, two denarii. It's Latin. Yes, really.") is
the i18n key `denariiPlural`. Not real money, can't be bought, can't be transferred
between accounts (deliberately — transfers are what make alt-account farming pay).
Cosmetics only: **titles** (amber label next to the name) and **name colours**.
**All code and SQL for this feature is English** — the owner asked for that explicitly
after earlier Spanish comments confused him.

**This is meant to be a headline feature, not a settings-page extra** — the owner's
words after v1 ("this is supposed to be the next big thing on the website, not just
some stupid feature you can access only via the profile"). Where it shows:
- The **coin pill** (`#coin-slot`) in the chat topbar, on the SFFG menu under the user
  chip, and in the VideoZone/Qmages topbars. Live balance; every award bumps it, floats
  `+N` and toasts "+5 denarii · Online matches" bottom-right — on whatever page the
  person is on, because the pill listens to realtime inserts on `denarii_ledger`.
- The **Treasury** (`#tr-ov` in `index.html`): a full overlay with three tabs —
  Overview (balance, lifetime, day **streak** with flame, the plural note, today's
  earnings as progress bars against each cap, recent ledger), Shop, Leaderboard
  (`ycz_leaderboard`, top 20 by lifetime, bold medals for the top three, own row
  highlighted, own rank underneath, rows open the user card).
  The **shop is a card grid** (`shopCard()`): every card carries a live preview — a fake
  chat line with *your* avatar, *your* name in the colour being sold (or your current
  one) and the title being sold (or your current one) — so people see the item on
  themselves before buying. Rarity tiers are pure flavour derived from price
  (`tierOf`: <100 common, <250 rare, <600 epic, else legendary) and tint the card via
  `--tier`; equipped cards get a gold star; unaffordable ones show a lock + "N more".
  Filter chips: All / Can afford / Owned (`shopFilter`). Buttons still carry
  `data-buy` / `data-equip` / `data-unequip` + `data-kind`. Reached from the
  pill, the gold rail item `#r-coin`, `/denarii` `/wallet` `/treasury` `/shop`, the
  "Open the Treasury" row in Settings, and `index.html#denarii` (what the pill on the
  other pages links to).
- A Denarii card on the logged-out landing grid (`.lc-coin`, SVG coin, not emoji).
- **Name colours** render through the client whitelist `YCZDenarii.NAME_COLORS` only:
  `color_id` → hex → `style="--nc:…"` + class `nc` on `.m-nm` / `.mem-nm` / `#uc-nm`.
  Unknown ids do nothing (Playwright-verified with a hostile id). **Role colours win**:
  a message with a role class never gets the `nc` class, so admins stay cyan and the
  owner stays red.

**Security model — the database owns every number.** The client never writes to
`shop_items`, `user_wallets`, `denarii_ledger` or `user_items`: those tables have
SELECT policies only (own rows; the catalog is public). Earning happens in
`security definer` AFTER triggers that award `auth.uid()` (never an id from the row),
spending in RPCs that `FOR UPDATE` the wallet row, and every reason has a
**per-UTC-day cap** checked against the ledger, so a script posting all night earns
the same as one hello. `ycz_award(...)` is the internal primitive; EXECUTE is revoked
from `anon`/`authenticated`. Service-role writes (bots, edge functions) have no
`auth.uid()` and earn nothing.

| reason | amount | cap/day | fires on |
|---|---|---|---|
| `daily_active` | 10 | 1 | first message of the day (`messages` INSERT) |
| `message` | 1 | 20 | every message |
| `streak_bonus` | 50 | 1 | inside the message trigger, when `daily_active` just paid and `ycz_streak()` is a multiple of 7 |
| `publish_fighter` | 25 | 3 | `fighter_mods` INSERT |
| `fighter_played` | 1 | 30 | `fighter_mods.plays` goes up, awarded to the *owner*, skipped when the player is the owner (anonymous plays do count) |
| `online_match` | 5 | 6 | `fighter_matches` INSERT |
| `upload_video` | 15 | 2 | `videos` INSERT |
| `post_image` | 5 | 5 | `qmages_images` INSERT |
| `grant` | any | — | `ycz_grant(user, amount, reason)`, staff only via `ycz_is_staff()`, negative clamps at zero |

The match/video/image triggers are attached inside `do` blocks only if the table exists,
so the migration never fails on a missing table. Scores from the arcade games are
**never** rewarded — they live in `localStorage`, the server can't verify them.

- Tables: `shop_items` (id text, kind 'title'|'color', name, description, price, sort,
  active), `user_wallets` (user_id, balance ≥ 0, lifetime_earned), `denarii_ledger`
  (append-only, delta/reason/ref; **in the `supabase_realtime` publication** so the pill
  can listen — RLS scopes it to own rows), `user_items` (user_id, item_id). Plus four
  columns: `user_profiles.title_id` / `color_id` (equipped) and `messages.title` /
  `color_id` (stamped at post time — old messages keep what you wore then, by design).
- RPCs: `ycz_wallet()` → `{balance, lifetime, streak, today:{reason:count}, caps,
  amounts}`; `ycz_buy_item(p_item)` → `{ok, balance}` or `{ok:false, error: not_found |
  already_owned | not_enough (+price, balance) | not_signed_in}`;
  `ycz_equip_item(p_item, p_kind)` (null item = unequip that kind; errors `not_owned`,
  `bad_kind`) with `ycz_equip_title(p_item)` kept as a v1 wrapper;
  `ycz_leaderboard(p_limit)` → `{top:[{user_id, username, pfp_url, title, color_id,
  lifetime}], me:{rank, lifetime}|null}`; `ycz_streak(uid)` (consecutive UTC days with a
  `daily_active` row, anchored on today or, if you haven't posted yet, yesterday —
  **unless `user_wallets.streak_anchor` is set**, in which case the streak is simply days
  since that date and never breaks. That column is the owner's perk, set by hand in SQL
  to the site's birthday, 2026-08-08; nobody else has it and nothing in the client can
  set it). The owner also holds the integer-max balance (2,147,483,647) by request —
  `balance`/`delta` are `integer`, so "a trillion" would need a `bigint` migration plus
  client formatting changes (`|0` truncation in `index.html` / `ycz-denarii.js`).
- Guards: `ycz_guard_cosmetics` (BEFORE INSERT/UPDATE on `user_profiles`, replaces v1's
  `ycz_guard_title`) nulls both ids on insert and silently reverts any update to an item
  the user doesn't own *of that kind* (`ycz_owns_item`). The message identity guard
  stamps `new.title` (from `shop_items.name`) and `new.color_id` (only if it is an owned,
  active colour); whatever the client sends in those columns is discarded.
- Client (`index.html`): `SHOP`, `WALLET`, `ownedItems`, `myTitleId`, `myColorId`,
  `HISTORY`, `LEADER`, `trTab`; `openTreasury(tab)` → `loadTreasury()` (one
  `Promise.all`: wallet via `YCZDenarii.refresh()`, own `user_items`, last 25 ledger rows,
  leaderboard) → `renderTreasury()` → `renderOverview/renderShop/renderBoard`. Buttons
  carry `data-buy` / `data-equip` / `data-unequip` + `data-kind`. `YCZDenarii.on('award')`
  patches `WALLET`/`HISTORY` and re-renders if the overlay is open. Settings keeps only a
  compact row (`paintWalletRow`) with the plural note and an "Open the Treasury" button.
  `loadMembers` selects `title_id,color_id` and retries without them until the migration
  is run. Everything is `esc()`-ed.
- **The migration (`denarii-migration.sql`, v2 — a superset that replaces v1) was
  handed to the owner in chat, never committed** (owner rule). It was run against a local
  Postgres 16 skeleton with a behaviour test (streak bonus, caps, colour ownership,
  leaderboard, RLS blocking direct writes) before hand-off. Until he runs it the pill
  hides and the Treasury shows "Couldn't load your wallet"; the rest of the app is
  unaffected.
- The i18n keys are `denarii*`, `fDenarii*` and `r*` reason labels in all four
  languages; the currency name itself is never translated. Icons added: `coin`, `flame`.

## Overwork — the delivery game (`overwork.html`, Sep 2026 prototype)

The owner's pitch: a goofy "friendslop" life-sim where you deliver packages on a shift to
earn money for cosmetic skins in an in-game shooter called **Pitty Striker** (real-world
inspired guns, skins are looks only, never stats), played on the PC in your apartment
after clocking out. This first cut is **the delivery shift only**: warehouse dock, six
packages, a van, eight houses with doormats, a 4-minute timer, pay per package scaled by
its condition, an on-time bonus, and one or two random events per shift (rain = slippery
+ darker sky, a loose dog that knocks the box out of your hands, a FRAGILE package that
takes ×3 damage, an OVERSIZED one that is slow and heavy, and Dispatch swapping an
address mid-shift). Cash and best shift save to `localStorage` under `overwork-save`;
the console shows the best pay via `yczScore('overwork', pay)`.

**Design rules, from the owner, non-negotiable:**
- **No keyframed animation anywhere.** The walk is *not* an animation: the feet decide
  where to step (a planted foot that falls too far behind the hip flies to a spot ahead
  along an arc, alternating with the other foot). Body lean, bob, squash, hip twist and
  the **bobblehead** (the head hangs off the neck on a lazy spring) are springs excited
  by velocity and acceleration. Arms are lazy velocity springs towards a target
  (hanging, or holding the box overhead). If you add a new motion, add a spring, not a
  clip.
- **Limbs are jelly, not tubes** (owner feedback on v1: "solo parecen tubos
  estirándose"). The `Limb` class sweeps rings along a cubic curve root → c1 → c2 → tip
  into a preallocated `BufferGeometry` every frame, with three things that make it read
  as gelatin: **volume preservation** (shorter than rest length → fatter, longer →
  thinner), a **radius profile** (`LEG_PROFILE`: thick thigh, waist at the knee, calf
  bulge, thin ankle), and a **travelling ripple** whose amplitude is a spring kicked by
  every landing/throw/pickup (`limb.kick(v)`). c1 bows forward, c2 bows back, so the leg
  is an S, not an arc. Ring winding is `(a, a+1, b)` — the other order faces inward and
  the whole limb renders as its black outline.
- **Look:** cel-shaded (`MeshToonMaterial` with a 3-step ramp) plus inverted-hull black
  outlines (`outlined()`), flat Lambert only on the ground. Character is a bean with a
  vest, name tag, big nose, wide eyes, worried eyebrows when the box is heavy, a red cap
  with an "O", sausage shoes. Lollipop trees, houses with windows/chimney/mailbox/porch
  light, doormats that say things ("GO AWAY", "NOT YOU AGAIN"), drifting clouds.
- **Typography and voice** (owner feedback on v1: "el texto está muy serio, usa fonts
  que todo el mundo ha visto, se nota que está hecho por IA"): headings/HUD numbers in
  the hand-drawn Colorfiction Sketch (`CF Sketch`, already in `fonts/`), body copy in
  Patrick Hand (Google Fonts), panels styled as taped paper with wonky hand-drawn
  borders and slight rotations. **Copy is written in the voice of a tired coworker**:
  lowercase, short, specific, a bit mean ("dropped it. classic.", "wrong house. the
  label says 11 Birch Rd. the label."). Never explain the game like a manual, never
  "Your job is to…", no exclamation-mark cheer. Toasts pick from small pools so they
  don't repeat verbatim.
- **Physics is hand-rolled and simple on purpose** (no Rapier/cannon): a static AABB
  world (`colliders`, with low `stepables` you can step onto), a cylinder-vs-AABB solver
  shared by the courier, the van, the dog and the boxes, boxes that fall/bounce/stack and
  take damage from impulses, an arcade kinematic van. Keep it that way until a real need
  (networked ragdolls) forces a library.
- **Three.js is vendored**, imported as an ES module from `./vendor/`. The page has its
  own CSP (`script-src 'self'`), no CDN.
- Art is primitives + canvas-texture labels, all original. Style: flat Lambert
  materials, low-poly blocks, soft shadows.
- Debug/test handle: `window.__ow = {courier, boxes, van, world, houses, props,
  customers, casino, solidAt, colliders, startShift, interact, honk, camState, input, …}` — the Playwright harness
  (`scratchpad/test-overwork.js`, Chromium with `--use-angle=swiftshader`) drives a whole
  shift through it; `ow-scenic.js` frames the neighbourhood and exercises the trampoline,
  a gnome kick, the honk and a customer reaction. Under swiftshader the sim runs slower
  than wall-clock (dt is capped), so poll state instead of sleeping fixed times.

**v3 — the neighbourhood pass (owner: "haz los modelos 3d mejor, especialmente el barrio,
la camioneta y pues todo, y hazlo más funny").** Geometry helpers: `sideProfile()` (a
[z,y] silhouette extruded sideways — the van cab, car cabins), `roundedBox()` (rounded
rect + bevel; the contour is an *explicit polygon*, because Path arc/line joints leave
duplicate points that make the extrude bevel fold), `gable()` (triangular prism roof).
**Outline hull gotcha:** `outlined()` scales about the mesh origin, so geometry must be
centred on its bounding box or the hull pokes through neighbours (that is why
`sideProfile`/`gable` recentre). Where a bevelled body dips under another part (the van's
cargo box under the cab roof) the hull shows as a black crease — hide the seam with a
covering part (the van's collar) rather than fighting the scale.
- **Houses** (`house(i,x,z)`, four styles by `i % 4`: front gable + TV antenna, tall hip
  roof with dormer + dish, side gable + garage/driveway/parked car with a bumper sticker,
  flat roof with parapet/AC/two dishes) at x = ±17 so there is a real front yard: picket
  fences (0.5 high, stepable = hop-over), flower beds, hedge at the back, porch railings,
  path to the sidewalk, doorbell, house number, a FOR SALE sign on #7. Doormat labels
  read the right way up from the street (`rotation.z = facing>0 ? π/2 : -π/2`).
- **Props** (`class Prop`, kickable): gnomes, flamingos, trash cans, a soccer ball,
  the dock cones. Pushed by the courier and the van (`shove()`), they fall, bounce, tip
  over (`tipped`) and each kind has a toast pool (`PROP_LINES`). `reset()` on every
  shift. The dog chases a moving ball and kicks it.
- **Yard hazards:** trampoline (stepable 0.45 collider; landing on it launches the
  courier `vel.y = 15 − weight·1.5`, boxes bounce at 0.8), sprinkler (rotating water
  arcs; `wetAt()` makes the courier as slippery as rain inside its radius), kiddie pool
  with a duck (also wet), potholes (`potholeAt()`: the van jumps and the cargo takes
  damage, the courier trips at speed). Once-per-shift toasts via `tr.hint` /
  `world.wetToast`.
- **Street:** crosswalk, manholes, curbs, STOP (ish) sign, hydrant, bus stop ("BUS ·
  eventually."), the PITTY STRIKER billboard, hills on the horizon, pines and a dead
  tree, a forklift parked on the sidewalk (never on the road — it was, once).
  Warehouse signs: "DAYS WITHOUT INCIDENT: 0", "EMPLOYEE OF THE MONTH: the van",
  a vending machine that is out of order.
- **The van:** rounded cargo box + one sloped cab silhouette, round headlights, grille,
  mirrors, sliding-door seams, roof ladder, rack feet, antenna with a "hi" flag that
  flutters with speed, exhaust puffs while accelerating (`puffs` pool), plate
  `0V3RW0RK`, sticker "HOW'S MY DRIVING? don't.", `H` honks (`honk()`: sad two-tone
  sawtooth, scatters the birds, spooks the dog, a nearby customer comes out to say "?").
- **Customers** (`class Customer`, one per house, hidden inside): on delivery they walk
  out, look at the box, say something (a camera-facing sprite bubble, `makeBubble()`,
  from `REACT[kind]` where kind = fine/meh/bad/big/mystery by damage), pose with their
  arms (up / crossed / on hips), then carry the box indoors (the box stays visible until
  `hidden`). Wrong house → they come out and say "not mine." Linger on a lawn for 1.5s →
  "off the grass." (`lawnPatrol`). Five hair styles, glasses on every third one.
- **Mystery box** event (`???`, purple): trembles, squeaks when you are near, jitters
  your hips while carried, pays 35, its customer says "is it still... moving. good."
- **Sky:** a sun with a bored half-lidded face that blinks (`makeSun`, hidden in rain),
  two flocks of birds circling (`class Flock`), the old clouds.
- Sounds added to `sfx()`: `honk`, `squeak`, `door`.
- **The locker** (`#s-locker`, "the locker" button on the work order): basic
  customisation with a live preview — the screen has no blur (`.screen.clear`), the card
  sits left and the courier stands to the right, turning slowly (`world.locker` adds yaw
  each tick; the feet shuffle after it, no clip). Options: head (cap / cap backwards /
  beanie / no hat = hair), hat colour, hair, vest, skin, shoes, glasses, name tag (≤8,
  drawn on the chest tag and used in the pay stub "shift's over, NAME."), van flag (≤4).
  Saved as `save.look` inside `overwork-save`. The courier has its own materials (`C.*`)
  so recolouring never touches customers/gnomes; `applyLook()` sets colours, toggles the
  headwear groups (`capG/beanie/hair/glasses`) and re-renders the label textures
  (`retex`). Stored values are whitelisted against `PALETTE`/`CAP_STYLES` on load and
  the swatch markup only ever uses palette strings — the name/flag reach the DOM via
  `.value` and canvas text only. Test: `scratchpad/ow-locker.js` (also feeds hostile
  localStorage).

**v4 — the big one (Sep 2026; owner: multiplayer, bugs, a casino, real hitboxes, a house with a PC
"para que la gente pueda unirse", plasticine characters, la peace).**
- **Characters are plasticine now** (reference: a TABG-style faceless figure). `clay(hex)` is a
  `MeshStandardMaterial` (rough, a faint procedural bump, a touch of emissive so shade doesn't go muddy)
  — the *only* non-toon material family; figures read as clay in a cardboard world on purpose. The
  courier is an **egg head with no face** (worry became posture: the head droops), a capsule jumpsuit
  (`suit`) with `sleeve`-coloured jelly arms, jumpsuit-coloured jelly legs, boots, a chest tag and a
  **floating name sprite** (`nameTex`, white with an ink outline, always facing the camera). Every
  `Courier` owns its materials (`c.mat`), so `applyLookTo(c, look)` dresses any courier — yours or a
  remote player's. The class is split into `simulate()` (physics) and `animate()` (feet, springs,
  limbs); remote players skip simulate and run `netStep()` + `animate()` from wire position/velocity.
  Animation fixes: arms swing against the gait (`gait` phase), hands are clamped to 1.1× arm length
  (jelly stretches, it never becomes a rope), idle breathing through the squash spring, `teleport()`
  moves feet and hands too — including a foot's in-flight `from/to/t`, otherwise a mid-step foot kept
  lerping to its old target and one leg stretched across the street. Customers use the same clay and
  are faceless too (verdict in the neck: sour tilts down, happy tilts up).
- **Real hitboxes.** `circles` (round static colliders: trampoline, pool — `step` ones can be stood
  on), `obbs` (oriented boxes that move: the van is `hw 1.2 × hd 3.4`, so it has a long side and a
  short side), `collideVan()` probes five points (four corners and the middle) against walls, and
  `pushOut()` uses *relative* velocity so the moving van flings props and boxes (`onHit(v, nx, nz)`).
  A van at speed knocks a courier over (`onBodyHit`: stun, launch, dropped box, a toast for both).
  Lamp posts have colliders. **The camera stops at walls, roofs and ceilings** (`solidAt` + a march
  from the head towards the wanted spot) and **snaps after a teleport** (`world.camSnap`).
- **Three modes.** `world.running` (a shift), `world.roam` (free roam: the world runs, the clock
  doesn't — home, casino, waiting for friends), neither (menu/locker). `enterRoam()/leaveRoam()`.
  "go home" on the work order drops you at the PC. Esc walks back one layer (PC → roam → menu).
- **Your apartment** (`buildHome`, APT 3B at x 15 z 30, across the road from the dock): one room with
  a door gap, a ceiling collider (so the camera stays inside), desk + PC (`world.pcSpot`, E = sit),
  chair, bed, fridge ("buy milk"), rug, pizza boxes, a PITTY STRIKER poster, a lamp (`PointLight`).
  Sitting opens **MirrorOS** (`openPC(app)` / `closePC()`, `world.pcOpen` silences game input).
- **Lucky Loaf Casino** (`buildCasino`, `CZ = {X:-32, Z:-15.4, W:16, D:12}` — a walk-in room between
  house #3's garage and house #5's fence, purple + gold, marquee, neon bulbs, a die on the roof, a bar
  nobody buys water at, chandeliers as `PointLight`s, a red carpet to the sidewalk). Owner's second
  brief: "un mapa de verdad con juegos de casino de verdad adentro … literalmente te sientas en una
  mesa con un dealer". Inside: a **blackjack** half-moon table, a **roulette** table (wheel on a
  cylinder whose top cap carries the pocket texture, a marker cone on your side, a ball that orbits
  and drops) and three **LOAF-O-MATIC** slot cabinets, each with a **seat** (`casino.seats`, E within
  1.7 → `sitAt`, E/Esc → `leaveSeat`; `world.seat` silences movement). Seated, the camera goes
  **over your right shoulder** (the `world.seat` branch in `updateCamera`: target on the felt, camera
  1.3 back / 1.8 right / 3.5 up so the courier sits bottom-left and the felt is clear) and the
  `#cz` paper panel bottom-right carries the buttons (bet chips, deal/hit/stand/double, red/black/zero,
  spin, pull). Progress is on the table in real time (`updateCasino`): cards fly from the shoe
  (`makeCardMesh`, canvas faces, the dealer's hole card face-down), chip stacks for your bet, your
  bets per zone and your whole drawer (`chipStack`, 1 chip = $5 / $10), the wheel spins to the
  winning pocket, the reels flicker and stop one by one, a sprite label over the table says the
  score, and the **dealer** (`makeDealer`: clay, vest, bow tie, one arm deals, head nods, speech
  bubbles) comments. Rules live in `ow-casino.js`; the MirrorOS window is the 2D view of the same
  state. **Wheel gotcha:** `CylinderGeometry`'s cap UVs map canvas angle = −world angle, so pocket
  `idx` sits under the −z marker when `wheel.rotation.y = idx·step + π` (verified by screenshot).
  Sprites (`depthTest:false`) show through walls — table labels and dealer bubbles are hidden unless
  the courier is inside the room, and only the nearest table's label shows. All on `save.cash`, the
  sock drawer. Nothing is real money.
- **Multiplayer** (`ow-net.js` + the ONLINE section in `overwork.html`). Host-authoritative: the host
  runs boxes, van cargo, dog, props, deliveries, the clock, and broadcasts a snapshot at 15 Hz on the
  lossy channel (numbers rounded to 2 decimals, box states as small ints, only kicked props). Every
  player simulates **their own courier** and sends position/velocity/yaw at 20 Hz; the host relays.
  E / throw / honk are **requests** (`netAct`) carrying the position you pressed them at; the host
  runs `interact(who)` for that courier and the result comes back in the snapshot. **Whoever drives
  simulates the van** and the host relays it; non-drivers `vanNetStep()`. Toasts for one person go
  through `say(who, …)` (`netSay` to their peer); world-wide things are `netEvent({k})`: start (the
  whole shift spec — events, boxes with deterministic sizes, spawns, lapis spot), end (the pay stub,
  shared: everyone's sock drawer gets the same total), deliver, swap, react, lapis, emote, join/leave,
  look, chat, kick. Boxes scale with players (`6 + 2·extra`, max 12, houses repeat). Room codes are
  five letters; the lobby is a Supabase presence channel `ow:lobby` (hosts track `{code, n, name}`),
  the room is `ow:<code>` broadcast for SDP/ICE; TURN comes from the same edge function as SFFG when
  signed in, STUN otherwise, with a 3.5 s timeout so a hanging TURN request never blocks a join.
  `overwork.html?join=ABCDE` joins straight away. Max 8 players. **Testing without Supabase:**
  `?signal=local` swaps the signaller for a `BroadcastChannel` (two tabs in one browser);
  `scratchpad/ow-mp.js` drives host + client end to end (join, walk, start, pick up through the host,
  throw, la peace on both screens, leave). Gotcha: `RTCSessionDescription` is not structured-cloneable
  — the local signaller JSON-round-trips messages like the real wire does.
- **La peace.** The meme (Kai Cenat telling IShowSpeed "that's lapis" — sounds like "la peace" —
  when Speed thought he found diamonds; edits turned Kai into a serene monk). A **blue rock that looks
  like a diamond** spawns at a random `LAPIS_SPOTS` entry each shift; E on it shouts `<you> DIAMOND!`
  four times into a block-game-style chat (`#mcchat`, `mcLine`, also used for join/leave), "the monk
  joined the game", a **clay monk** (blue robe, orange sash, white beard, a book, one finger raised,
  golden light) rises out of the ground and says "that's la peace." in a bubble, then 16 s of
  **peace**: warm sky, boxes take no damage, nobody trips, +$5 ("lapis. $5. that's la peace.").
  Press **L** for the emote (finger up, "la peace." bubble), networked. The chat also shows other
  players' messages from the Online app.
- Menu card scrolls if the viewport is short (`.card{max-height}`); right-drag steers the camera
  (contextmenu suppressed), keys release on blur, game keys are ignored inside inputs.
- **Wearables are the owner's GLB models** (`art/overwork/{cap,frog,glasses,headphones}.glb`, loaded
  once by the vendored `GLTFLoader`, baked to world space, centred per mesh, cloned per courier via
  `fitAcc(name)` with the measured `ACC_FIT` offsets — the cap's crown centroid and brim direction were
  measured with a probe page, don't eyeball them). Licence: owner-supplied and free of copyright by his
  confirmation, recorded in `art/overwork/LICENSE.txt`. **Outline gotcha for imported models:** `outlined()` (a scaled inverted hull) breaks on
  them — they are thin shells with inner faces, and scaling about the centre pushes the inner faces
  out through the crown as black polygon patches ("una cosa rara arriba de la cabeza"). Their hull is
  built in `loadAcc` instead: `mergeVertices` → smooth normals → vertices pushed along the normal by a
  fixed thickness. Same idea for the head under a hat: the egg's full hull poked through the crown, so
  the courier swaps to a bowl-shaped hull (`headHullLow`, top cut off) whenever anything is worn, and
  the hair fringe hides under hats.
- MirrorOS gotcha: `wins` is a `Map` keyed by app name; "is this window still open" is
  `wins.get(W.key) === W`, not `wins.has(W)` (that bug left the casino window stale after a spin).

**v5 — the "everything is the wrong size" pass (Sep 2026; owner's list: sidewalk through the road at the
intersection, trees on the cross street, the warehouse dock in the road, a van light that "only yellow
things react to", the apartment door off its hinges, wheels in the ground, the character too big to
enter any house, a van that is more than "press E", friends riding along, feet inside the legs when
jumping, houses with no outlines, porch steps the residents clipped through).**
- **Scale.** The courier was 3 units tall against 2.3 doors and 2.2 customers. `CS = 0.72` scales the
  figure (group scale, hip height, limb radii/rest lengths, foot and hand meshes, foot offsets,
  stride, name sprite, camera target). World distances (speeds, interaction radii) stay in world units.
- **Houses are rooms now** (`house()` + `interior()`): walls with a 1.6 door gap, a ceiling slab (the
  camera respects thin overhead colliders: `solidAt` counts anything with `min.y > 2`), a **raised
  floor at porch-landing height** (`fl = 0.32 · steps`, a stepable box) so the door is level with the
  landing, a door leaf on a hinge swung 86° inward, a frame, rug, couch, TV, table, lamp + a warm
  `PointLight`, pictures. Every wall is `inkBox`-outlined (`inkBox(m, t)`: an inverted hull with a
  fixed world thickness, because a % scale is invisible on a 9-wide box and huge on a 0.3 one).
  **Residents live in the room**: state `in` = visible on the couch spot, facing the TV; they walk out
  along `floorHeight` (`this.y`), so they go *down the steps* instead of through them.
- **The van is a place.** High-roof cargo box (`roundedBox(..., noLids)` — extrude group 0 is the lids,
  1 the walls; the rear lid is gone and the bay is lined inside), **two rear doors on hinges** that open
  when the van stops (`van.doorsOpen`), a walk-in **bay**: the van's obb carries `bay()` — a 2-wide lane
  through the back where you collide with the bay walls instead of the van's outside, `floorHeight`
  knows the bay floor (0.45, a step up) and the roof (3.0, `top: true`), and anyone standing in the bay
  or on the roof gets `body.ride = van` and is moved by `carryRiders()` (position, feet, hands, yaw and
  camera yaw all turn with it) — riders on the client side move with their own copy of the van.
  Boxes that land in the bay become cargo at once (`bayLoad`: state `van` + `local` coords in the van's
  frame; the wire sends locals for them), you pick them up from inside (E: nearest box), set them down
  inside (E), and carry at chest height in there (the roof is right above). The old rear shortcuts
  (shove it in / grab one out) still exist. The body (`van.body`) carries pitch/roll/bob; the wheels
  stay in the yaw-only group, so they never sink. The hazard light has its own material — it used to
  blink the shared `M.hazard`, i.e. every yellow thing in town.
- **Map:** sidewalks and curbs stop at the cross street; trees skip the cross street band; the
  warehouse sits 6 further west (`WX`) so the dock is on the sidewalk and the van parks in the west
  lane; the apartment door leaf hangs on the frame post (centre = post + R·(0,0,−0.85)).
- **Feet:** the shoe pivots at its heel (`ax/ay` from `f.roll`) so toes-down in the air keeps the leg
  ending at the heel.

**v6 — phones, voices, and the walk (Sep 2026; owner: "añade soporte móvil", a real Gaming Zone
screenshot, drop the two-finger exit, then voice chat, a chat line, legs clipping out of the shoes,
arms going back while carrying, the body leaning too far ahead of the feet).**
- **Touch** (`#touch`, shown via `body.has-touch` = `(pointer:coarse)` while in game, `.in-game` on
  body): a **stick appears where the left thumb lands** on the canvas (left 45%; `stick.id` tracks that
  pointer, `stickSet()` writes *fractions* into `input.f/b/l/r` — the sim and the van take analog now:
  `mz -= input.f` etc., `acc = 9·f − 6·b`, `steer = l − r`), the right thumb drags the camera
  (`camPointer`, 1.6× sensitivity), a tap never throws (only a mouse click does). Paper buttons: **E**,
  **jump / throw / honk** (`spaceKey()`), **peace / bail**, **talk** (hold), **chat**, **menu**
  (`escapeKey()`); labels update in `updateTouch()`. `setPointerCapture` is wrapped in try/catch (synthetic
  pointers in the harness have no capture). `scratchpad/ow-touch.js` drives it with dispatched
  `PointerEvent`s in an `isMobile + hasTouch` context.
- **Gaming Zone**: the two-finger hold that opened the guide fired in the middle of every two-thumb game
  and is gone; on coarse pointers a small `#gz-menu-btn` sits in the corner of `#gz-play` instead
  (`gz_holdHint` strings updated ×4). Overwork's hero/capsule art are real renders (`scratchpad/ow-art.js`
  frames them: the van's nose, the courier with a box on the "GO AWAY" mat, the resident at the door).
- **Chat line** (`#chatbar`): Enter or T opens it over the block-game chat (`#hud.chat` lifts
  `#mcchat`), Enter sends through `sendChat` (host relays), Esc/blur closes; alone, the first two
  messages get a dry reply. Touch: the chat button.
- **Voice** — the wire already had perfect negotiation, but it isn't needed: `ow-net.js` adds **one
  `sendrecv` audio transceiver per connection at connect time** (the answerer flips its direction to
  `sendrecv` before answering), `pc.ontrack → emit('track', peer, track)`, and `net.audioSender(peer)`.
  A mic is then `sender.replaceTrack()` away, no renegotiation. Topology follows the star: clients send
  their mic to the host; the **host mixes per client** with WebAudio (`hostMixFor`: host mic + every
  other client → a `MediaStreamDestination` track on that client's line) and plays everything it hears;
  a client sends one stream and gets one back. **Push to talk: V** (or hold the talk button);
  `voiceToggleOpen()` (the "mic: open" button in the Online window) keeps the track enabled. Mic access
  is asked on the first V press (`voiceEnable`, a user gesture — also resumes the shared `ac`). Chrome
  quirk: a remote track only flows into WebAudio once an `Audio` element plays it (muted is fine).
  **Who's talking**: the host reads an `AnalyserNode` per incoming line, everyone reads their own mic;
  the flag rides in the snapshot (`pl[9]`) and tints the name sprite green (`updateVoice`). Nothing is
  recorded, nothing leaves the peer connections. `scratchpad/ow-voice.js` proves both directions with
  `--use-fake-device-for-media-stream` plus an oscillator swapped in for the (near-silent) fake mic.
- **Walk/carry**: the leg ends at an **ankle point inside the shoe** (`_f`, 0.06 forward, 0.12 up) and
  the shoe pivots there; lean coefficients halved (`fwdLean` 0.026·v + 0.012·a); steps trigger as soon as
  a foot falls behind the hip (`stride·0.15`), fly faster at speed (`stepDur` 0.30 − 0.03·v, min 0.1)
  with a short cooldown, and land 0.9 stride ahead — the planted foot no longer trails a metre.
  **Boxes ride in front at the chest** (hands at the box's sides, `0.3 + size.y/2` up, `0.5 + size.z/2`
  forward); only the oversized one goes overhead, and never in the bay.

- **Settings** (`#s-settings`, from the work order's "settings" button and the MirrorOS Settings app;
  Esc closes): `save.cfg` — quality `auto|low|medium|high` (`QUALITY` presets: pixel ratio cap, shadows
  + shadow map size, ink outlines, fog distance; auto = low on coarse pointers, high elsewhere),
  shadows/outlines `preset|on|off` overrides, sound volume + mute (every `sfx()` goes through one
  `master` gain; voice is untouched), camera sensitivity 3–20 (÷10) + invert, block-chat shown/hidden.
  `applyCfg()` applies live: toggling `renderer.shadowMap.enabled` needs `material.needsUpdate` on
  everything, changing the map size needs `sun.shadow.map.dispose()`, and outlines switch off in one go
  because every hull shares the `OUTLINE` material. An fps readout sits on the card while it is open.
- **Cheats.** `window.__ow` (the harness handle) exists **only on localhost / 127.0.0.1 / [::1]** — on
  the site there is nothing to grab from the console (the script is a module, nothing else leaks). The
  save carries a signature (`saveSig`: FNV-1a over cash|best|shifts|salt, stored as `sig`); a save
  whose money lines don't match is loaded with cash/best/shifts = 0 and a toast ("the sock drawer had
  a hole in it"). This stops the localStorage edit, not a determined person — the salt is in the page
  and always will be; the money is local and cosmetic, so that is the right amount of effort. Online,
  money and boxes are decided by the host already; positions are self-reported (no speed check).

**v7 — the horizon and the piano (Sep 2026; owner: "en la intersección hay 2 streetlights, las streetlights mismas se
ven terribles, añade cosas en el background como un molino … y si vas a poner música o sound effects ni SE TE OCURRA
poner esos estúpidos pixel sound effects y tus estúpidos synths … tiene que sonar como piano").**
- **Street lamps** are `lampPost(x, z, dx, dz, banner)`: plinth, tapered pole, a swan-neck quarter-torus arm over the road,
  a hexagonal lantern with a pointed cap. The ironwork is **one merged geometry shared by every post** (`merged()` +
  `mergeGeometries`) with a fixed-thickness hull (`inkHull(geo, t)`: vertices pushed along smooth normals — a % scale
  hull shifts the top of a 6-high pole sideways, because it scales about the origin). Three draw calls per post. The
  old `z = -60..40 step 20` loop put a pair in the middle of the cross street; posts now stand at z ∈ {−60, −26, −8, 10,
  28} on both sidewalks plus four pairs along the cross-street sidewalks (z −34.8 / −45.2), none in a road. Four carry
  two-sided paper **banners** (`BANNERS`: "hiring. always.", "FALL FESTIVAL (cancelled)", "ADOPT A POTHOLE", "lost cat").
- **The horizon** (`buildScenery()` / `updateScenery(dt)`, the `scenery` object): a **windmill** on a mound at (52, −74)
  whose sails turn (`scenery.sails`, 0.42 rad/s, four lattice sails in one merged geometry), a **farm** beside it (crop rows,
  fence, hay, three clay cows, a barn, a silo), a **water tower** behind the warehouse ("WATER · probably"), a red-and-white
  **radio mast** with guy wires and a hut ("KOWR 88.1 · static, mostly"), **power lines** down the east side (poles at x 27,
  catenary wires as one `LineSegments`), an elevated **highway** at z −118 with ten looping cars and an exit sign, a
  **factory** with a smoking chimney ("BOX CO. — we make the boxes."; seven recycled puffs), a **city** skyline in the fog
  at x ≈ 172 (one shared lit-window texture), and a **hot-air balloon** ("we deliver. mostly.") circling at y 46. Blinking
  lights use `M.beacon`, their own material (nothing else blinks with them). Trees now retry placement and skip the farm,
  the power line and the cross street. Scenery is not solid (except lamp posts and power poles). ~+150 draw calls.
- **Sound, the owner's rule (absolute): no pixel/8-bit effects, no synths; music must sound like a piano.** So there is no
  `createOscillator` left in Overwork. Impacts are recordings from the Chequered Ink pack already in `art/sfx/`, table-driven
  in `FOLEY` (file, playback-rate range, level, lowpass, start offset, hard stop): thud = hit1 pitched to cardboard, crash =
  ko.wav past its swell, door = block.wav low and short, step = hit2 pitched way down and cut at 130 ms, card = block.wav
  high and short (the casino: cards, chips, the wheel's ticks). Everything musical is the piano (`ow-piano.js`): `ding`
  (fifth + octave), `peace` (rolled maj7add9), `squeak` (a trill at the top), `bark` (two low clusters), `honk` (a sour
  chord that sags a semitone), plus `start`/`win`/`lose` for later. `sfx(kind)` routes: `FOLEY[kind]` → sample, else →
  `piano.cue(kind)`. Adding a real recording later is one `FOLEY` line.
- **Music**: starts on the first pointerdown/keydown (`armMusic`: resumes the context, loads the samples, starts if
  `cfg.music > 0` and not muted). Generative: a key (A2–E3), a tempo (56–66), one of eight seventh-chord progressions
  (diatonic plus ♭VI/♭VII/IVm colours), a style per song (`arp` broken chords in eighths, or `block` chords with air), a
  four-note motif transposed to what fits each chord (chord tones weighted, avoid notes skipped), rolled voicings, humanised
  timing and velocity, a heat curve over the song, a 5–9 s breath between songs. Rain muffles it (`setMuffled`). The tab
  going hidden pauses the music bus, never the voice chat (they share `ac`). Settings row **music** (`cfg.music`, default
  55) beside sound/mute; `mute` stops the music too. `scratchpad/ow-audio.js` checks the whole chain in headless Chromium
  (real click → samples decoded → notes scheduled → RMS on the piano bus > 0 → foley buffers decode → settings interplay)
  and **renders 30 s of music plus the cues offline to WAV** so a human can listen before shipping — do that when touching
  the generator; the sandbox has no ears.

**v8 — Pitty Striker v1 (Sep 2026).** The game inside the game finally runs. **The owner's rule, learned the hard way: it is
NOT a parody of the delivery job** — a first design (a depot map, "the stapler", coworker bots, HR kill feed) was rejected:
"it would make no sense to have a delivery guy play a game mocking his own job". Pitty Striker is the courier's own separate
game: **real-world gun names and silhouettes** (knife, Glock, AR, AK-47, AWP — the owner asked for them by name; no brand
logos are ever painted into a texture), **skins come out of loot cases** bought with the sock-drawer cash (not a shop), a
CS-flavoured desert-town arena ("sandstone"), gamer-named bots (toaster, ph4ntom, zero_ping, capybara…) that type "gg"
and "lag" into the feed, plain game copy ("x killed y (headshot)", triple / rampage / unstoppable / godlike). Grep the two
modules for box/van/depot/deliver/shift/coworker/hr before adding copy — `scratchpad/ps-lint.js` does exactly that.
- **Where it lives.** MirrorOS `openApp('pitty')` makes a maximised window and calls `api.pitty.open(W)`; `overwork.html`
  lazy-imports `ow-striker.js` on that first click (the delivery game never pays for the shooter's download) through a small
  proxy `striker` (`active`, `inMatch`, `open/close/escape`, `__test`); if the import fails the window shows the old crash
  dialog and nothing else breaks. The launcher renders in the window body; a match mounts `#ps` over the whole monitor frame
  with its own renderer, and `world.psOpen` makes the outer `frame()` skip its render and gates Overwork's keys (`striker.active`
  early-returns in keydown; `escapeKey()` asks `striker.escape()` first; `closePC()` closes the shooter too). The shooter gets
  `strikerApi`: frame, save/persist/salt, cash/addCash (the casino's `bank`), name, isTouch, cfg, `audio` (ctx, master,
  `loadBuffer`, piano), `musicDuck` (halves + muffles the piano for the match), toast, onActive, ycz scores, debug.
- **The guns are the owner's models** (`art/overwork/guns/{knife,glock,ar,ak,awp}.glb`, five picked out of an "Ultimate Guns
  Pack" he supplied — see the LICENSE.txt beside them). They carry no textures but every
  surface is a *named material* (Wood, DarkWood, Metal, DarkMetal, LightMetal, Black, Grey, Green, Main/MainDark/MainLight,
  Glass), so `GUN_ROLE` maps each name to a role and a skin repaints them — base, a darker shade of base, wood/accent, metal,
  glass — instead of painting a texture. `prepGunModel()` bakes each file once into game space: merge by material, then
  rotate (**the pack points its barrel along +x with +y up; the game wants +z forward**), scale to the length the primitive
  model had, and translate so the grip sits at the origin (`WEAPONS[id].glb = {file, len, grip:[alongLength, fromBottom]}` —
  the grip fractions were measured from the primitive models, don't eyeball them). Clones after that are free: geometry is
  shared, only materials are per-instance. **The primitive gun models are still in the data and still build** — if a `.glb`
  fails to load, `buildGun` falls back to `buildGunPrims`, so the shooter never depends on the download. One consequence:
  the models are one piece, so there is no separate magazine to drop — the reload spring tips the whole gun instead
  (`vm.gun.model`).
- **Sound stays inside the rule:** every shot is layers of the six recordings (a high crack + a low body; the AWP is `ko.wav`
  past its swell), the knife is `whoosh` + `hit1`, ticks/reveals/countdown/end use the piano cues (`count`, `start`, `kill`,
  `streak`, `win`/`lose`/`ding`). Nothing synthesized.
- **Springs, not sines, for the bots too:** the aim wander used to be two sine waves on `M.time` and the post-kill strafe a
  square wave — both are now springs kicked in `think()` (`errX`/`errY`) and a sign that flips on a per-bot timer. Fixed with
  them, from the review: bots kept **spawn protection while shooting** (firing now drops it for everyone, and a bot that
  walks 1.5 m off its spawn loses it like the player does), dying mid-reload left the gun hanging low for the rest of the
  life (`mountViewmodel` resets `magT`), the end screen inherited the death grey and the ducked sound bus, `close()` blanked
  the MirrorOS window instead of closing it (the taskbar kept a blank maximised one), and the lazy import could mount into a
  PC that had already been closed. Map palette: **the ground is deliberately much darker than the walls** — at the same tan
  the arena read as one flat mass.
- **Save:** `save.ps` (v2) — owned case skins, scrap, cases opened, equipped per weapon, loadout, difficulty, bots, cfg,
  lifetime stats — validated on load by `validatePS`; its own `sig` (FNV-1a over sorted owned + scrap + salt) is independent of
  the cash signature, so a tampered inventory resets to stock without touching the drawer. Cases cost $80; duplicates give
  scrap, 8 scrap recycle into a free case; matches pay nothing (cash comes from deliveries, by design).
- **Testing:** `scratchpad/ps-flow.js` (launcher, case with a deterministic roll, persistence across reload, pre-v1 save fixture,
  tamper, a match through `__test`: countdown, move, shoot, knife, pause, Esc chain, back to the courier), `ps-bots.js` (7 hard
  bots, 300 s of sim: everyone moves, someone reaches a balcony, no unsticks), `ps-touch.js` (stick, look, fire, portrait card),
  `ps-lint.js` (copy: no '!', no emoji, no theme words, no createOscillator). Pointer lock cannot be exercised headless; the
  flow uses `__test.startMatch` which skips the lock prompt. **`ps-bots.js` is stochastic** — "nobody reached a balcony" in a
  single 300 s run is a coin toss, not a regression; re-run before believing it.

**v9 — the look, and the guns you can hear (Sep 2026; owner: "se ve ultra cozy el shooter y odio eso", plus a City Pack, two
Snake's Authentic Gun Sounds packs and an Announcer Pack).**
- **Why it looked cozy, and what actually fixed it.** The shooter had inherited Overwork's design language wholesale: cel
  shading on a three-step ramp, ink outlines on every box, clay figures, a taped-paper HUD in a hand-drawn font, a warm tan
  desert town. Right for a game about a tired courier, wrong for the game he plays to stop thinking about it. **Two wrong
  turns before the right one, both worth remembering: a night map is not un-cozy, it is frightening ("eso en vez de hacerlo
  menos cozy solo lo hace aterrador"), and a grey overcast one is just miserable ("no tiene un puto moody day que un emo
  implementaría"). The reference is Counter-Strike: those maps are bright, warm, blue-skied and sunny, and nothing about them
  is cosy — because what makes a shooter read as a shooter is the geometry, the guns, the HUD and the sound, never a
  desaturated palette.** So Pitty Striker is a normal sunny afternoon.
- **The map is a city block, on the same blockout.** Every MAP collider, the 69-node graph, the spawns and the bot behaviour
  are untouched; only the dressing changed. Concrete, asphalt and painted steel instead of sandstone and sand; a street lamp
  where each palm stood, a wheelie-bin row over the barrel colliders, a shuttered kiosk instead of the market stall, cables
  with bulbs instead of washing lines, windows and air conditioners and a fire ladder on the perimeter walls, cones and bins
  on the kerb, wooden crates. The ground paint is a service yard: turning circle, bays, drains, oil. Callouts (A, B, NO
  PARKING, LOADING BAY) are sprayed stencil caps from the same atlas, never a hand-drawn face.
- **`MATS` key names are historical.** They still say `sandstone` and `palmLeaf` because the MAP rows were written against
  them; read them as concrete, pavement, kerb, steel crate, shop shutter, street tree, dumpster, concrete planter. Changing
  the names means touching all 104 map rows for nothing.
- **Materials: `MeshStandardMaterial`, no toon ramp, no ink hull anywhere in the shooter.** The one trap: **metalness above
  ~0.3 with no environment map renders black** (a metal has no diffuse, and there is no reflection to stand in for it) — the
  viewmodel was a silhouette until every gun and world metal came down to ~0.25 and read as painted steel.
- **Lighting** is a warm high sun, a blue sky bounce and enough ambient that no corner is unreadable. `LIGHTS` (20 sodium
  lamps declared in the data) and `opts.lightBudget` still exist and are set to 0: a night variant is one number away.
- **The city outside** (`CITY`, `CITY_FIT`, `buildCity`) is 28 models from the owner's City Pack, in `art/overwork/city/`.
  **None of it is solid and none of it is in the play space** — buildings and parked cars beyond the walls, AC units and roof
  exits and billboards on top of them, manholes and litter flat on the floor. That is what keeps the colliders and the nav
  graph untouched. It loads *after* the match starts (nobody waits on 2 MB) and is skipped on touch. Placing thirty buildings
  as thirty scene graphs would be ~300 draw calls, so nothing is added as a model: every mesh is baked to world space, fitted
  to a target size (`CITY_FIT` — the pack's scales are wild, a building arrives 3.5 units tall and a hydrant 232) and merged
  by material, where two materials match when name, colour and texture agree. 53 meshes, 112k tris, ~82 draw calls all in.
- **The clip choice is the whole thing, not the attachment.** The first cut anchored the weapon to the hand
  and played the pack's plain `Run` and `Walk`, which are a jog with the arms swinging at the sides. The owner's
  verdict: *"en la animación el tipo solo está corriendo, lo que estás haciendo solo es poner la pistola flotando
  en frente de él"* — and he was right, no amount of attachment maths fixes a pose whose hands are nowhere near
  the weapon. The pack ships rifle-carry clips and those are the ones a shooter uses: `Run_Shoot` for any
  movement (slowed with `setEffectiveTimeScale` for a walk rather than switching to a second clip),
  `Idle_Gun` at rest, `Idle_Gun_Pointing` while engaging, `Idle_Sword`/`Run` for the knife. The weapon hangs off
  the **palm** (`Middle1.R`), not the wrist, because a weapon model's origin is its grip and the grip is where
  the fingers close.
- **Name tags are depth-tested AND line-of-sight gated.** They shipped once with `depthTest:false`, which in a
  shooter is a wallhack: every bot's name floated over every wall, so you always knew where all seven were.
  Depth testing alone is not enough either — a sprite is a flat card at head height and still peeks over a
  parapet the body is behind — so `animate()` runs the same `segmentClear` the bots use, from the player's eye
  to the bot's chest, and hides the tag when the line is blocked or past 40 m.
- **Nothing decorative goes on the floor of the play space.** Two `road-bits` models (six metres of painted
  crosswalk and lane markings) were dropped in the middle of the courtyard and read exactly like a piece of
  street left lying in an arena. They live on the road outside now. What is left on the pit floor is two drain
  covers and one scrap of litter, and that is the ceiling for it.
- **The bots wear the owner's soldier, rigged at load time.** He supplied `art/overwork/chars/soldier-owner.glb`
  — helmet, goggles, balaclava, plate carrier, knee pads — and it is **one static mesh with no skeleton and no
  clips**, so on its own it can only slide around like a statue. `autoSkin()` fixes that: envelope skinning,
  every vertex weighted to the nearest bone SEGMENTS of the donor model's skeleton, then bound as a SkinnedMesh
  that plays the donor's clips. The donor (`soldier.glb`, the City Pack's Adventurer) is present for its bones
  and animations only and its own meshes are hidden. One mesh, one material, so a bot is one draw call instead
  of fifteen. Three things this cost, all of them load-bearing:
    - **The donor's skinned geometry lives in a space 100× smaller than the world** (scale 100 on the mesh node,
      the matching factor baked into the inverse bind matrices). Bind a metres-space mesh to that skeleton and
      every vertex lands a hundred times too far from its bone: the figure tears into flat sheets across the sky.
      So the order is fixed — normalise into the donor's WORLD space, weight there (that is where the bones are),
      then push the geometry down through `donor.matrixWorld.invert()` and give the new mesh the donor's own
      transform and bind matrix.
    - **Weights are locked to one side of the body.** Without it a foot mid-stride picks up the other leg's shin
      and smears across the gap. Bones ending in L or R only accept vertices on their own side of the midline.
    - **Finger, toe and `*_end` bones are excluded from the candidate set**, or the knuckle bones capture the
      thigh a hand hangs beside and the leg tears open on the first step.
- **This is the one place in the codebase where keyframed animation is correct.** That rule is about Overwork's
  courier, whose walk is the point of that game; here the whole value of the donor is its 24 clips. `makeSoldier()`
  crossfades between them by speed; the springs stay for what the clips do not
  cover — lean, bob, recoil kick and the aim pitch (applied to the `Chest` bone *after* `mixer.update`, because the mixer
  rewrites the skeleton every frame). Three traps, all paid for: **a SkinnedMesh cannot be cloned** (the clone keeps pointing
  at the original's bones and every soldier shares one pose) and SkeletonUtils is not vendored, so the buffer is fetched once
  and `GLTFLoader.parse`d per bot; **GLTFLoader sanitises node names**, so `Wrist.R` arrives as `WristR` and the bone lookup
  matches on shape; and **the gun is not parented to the hand bone** — the bone carries the armature's own scale and
  rotation, which made the rifle twenty times too big and pointing at the sky, so `gunG` stays a child of `body` and is moved
  to the hand's world position each frame. `frustumCulled = false` on the skinned meshes, or a stale skinned bounding box
  culls the figure at the wrong moment. The capsule figure is still built underneath and merely hidden, so every reference in
  the class stays valid and a bot whose model failed to load looks like v1 instead of vanishing. Their `color` tints the
  model's Green / LightGreen materials — saturated on purpose, it is the only thing that reads at 30 m.
- **Bug worth remembering:** a `//` comment left mid-line inside the `MAT` object literal swallowed four material definitions
  (`botGun`, `casing`, `crumb`, `lid`). The bots' guns silently fell back to Three's default material, and `disposeMats()`
  threw on `undefined.map` *inside `close()`* — which left the MirrorOS window gone but the shooter still marked active, so
  the courier could not move afterwards. The dispose list is `.filter(Boolean)` now, but the real lesson is that a thrown
  error inside a teardown path leaves the app in a state no test name describes.
- **The HUD** is thin rules, micro caps, tabular numbers and a notched-corner slab. No paper, no tape, no rotation, no cursive.
- **Punch**: `class Fx` — a muzzle flash (a canvas flash shape, not a white card; the player's own is drawn at half size just
  past the barrel or it fills a quarter of the screen and clips through the gun), a tracer (**started 2 m out for your own
  gun**, or it lies across the viewmodel as a white bar), impact sparks off the face that was hit (the normal comes from
  whichever bound the point is nearest), a short muzzle light, and a camera flinch per shot. Three instanced draw calls, no
  allocation during a match.
- **Sound**: the owner's two Snake's packs (F8 Studios), 18 clips at 208 kB in `art/overwork/sfx-guns/`. One real recording
  per gun event — 9mm, 5.56, 7.62x39 and 7.62x54R for the four guns, each gun's own magazine and bolt on the reload's
  `magOut`/`magIn`/`bolt` marks (which were **retimed to where each recording actually starts**, so the parts play end to end),
  and a real dry fire. `SFX` has two families now: `Y(...)` is the old six-file foley, `Z(...)` is a gun recording played
  nearly straight. Licences: see the LICENSE.txt in each folder.
- **New harnesses:** `ps-fx.js` (one shot produces a flash, a tracer, sparks and the muzzle light — read in the same evaluate
  so no rAF frame slips in), `ps-audio.js` (every file in `SFX` decodes with a healthy peak, every weapon sfx key resolves),
  `ps-look.js` (five vantage points), `ps-flash.js` (cancels the rAF, fires, renders one frame, then screenshots — the only
  reliable way to catch a 75 ms effect under swiftshader), `ow-pace.js` (measured courier and van speeds).
- **The Announcer Pack is not wired.** The two mp3s split cleanly into 29 + 31 spoken lines, but the sandbox has no speech
  recognition (the vosk model host is blocked) and no TTS, so nothing can label them. The owner has to say what the lines are.

Not done yet: Pitty Striker multiplayer (the WebRTC wire exists), more Overwork jobs, spectating a full room, a host-side speed
check on self-reported positions.
Performance: Overwork's world is ~1.5k draw calls with outlines; fine on desktop GPUs, heavy under
swiftshader (the harnesses poll for conditions instead of sleeping fixed times for that reason). Pitty Striker is ~82.

## Known gaps / next up

- **No DMARC record.** `_dmarc` TXT `v=DMARC1; p=none; rua=mailto:yuni@yuniorschillzone.xyz`
  — one record in the Cloudflare DNS panel. SPF and DKIM are both live and verified, so
  this is the last piece; without it iCloud in particular junks or silently drops the
  signup confirmation mail.
- `servers_read` invite-code exposure (above)
- SFFG: no rollback netcode yet (delay-based lockstep; the engine was built
  deterministic and rewindable specifically so this can be added)
- SFFG: moderation of community fighters is `status='removed'` only — and that's
  final: **the owner explicitly rejected a preview-and-approve queue** (Aug 2026).
  Don't propose it again.
- SFFG: Truck's sprite is drawn much larger than his hurtbox (`scale:1.85` against
  `w:68`); training mode's hitbox overlay makes the mismatch obvious.
- **Both Aug 2026 migrations must each be run once** in the Supabase SQL editor — the
  features migration (pinned messages + `user_profiles.bio`) is done; the **admin-tools
  migration** (audit log, slowmode/lock columns, timeouts, rebuilt RLS) lives in chat
  with the owner, not in the repo (owner rule: SQL is never committed). The app degrades
  gracefully until it's run: no audit entries, lock/slowmode/timeout invisible,
  role-change buttons error for admins, bans stay client-side-only.
- Emoji still in the interface: landing-page feature cards (`💬 🔊 🎮 …`, arguably
  content), the `🌙`/`☀️` theme buttons on VideoZone/Qmages, and misc toast checkmarks.
  The chat-app chrome (`🏠`, `🟢`, `👤`, `📷`, `🔇`, `📣`, notification icons) is now SVG.
- Music page *content* is still English (only chrome is translated). The Gaming
  Zone is fully translated now.
- Minecraft and Subway Surfers use placeholder capsule/hero art (generated, in
  `art/games/`) — the owner is supplying the real images.
- Muting a game from the console's settings is best-effort: it stops
  `<audio>`/`<video>` and suspends any Web Audio context opened *after* the
  game loads. A context opened during load keeps playing.
- No screen share
- Real web push is wired client-side: `sw.js` has push/notificationclick handlers, the
  chat settings has a per-device toggle that subscribes with the VAPID public key
  (embedded in `index.html` — public on purpose) and upserts to `push_subs`. The server
  side lives in Supabase and was handed to the owner in chat (owner rule): `push_subs`
  table SQL, a `push-notify` edge function (needs secrets `VAPID_PRIVATE_KEY` and
  `PUSH_HOOK_SECRET`), and a Database Webhook on `notifications` INSERT that calls the
  function with the secret header. Until he runs those, the toggle subscribes but
  nothing sends.
- Voice is mesh — degrades past ~8 people
- Not submitted to Google Search Console

### Shipped in the Aug 2026 SFFG update wave (after the Freedom Update)
Community fighter cards now load their own idle sheet for the preview (no more
clicking a fighter to see it); slow portraits get 18s instead of 6. A **live lobby**
on the online screen (Supabase presence channel `fight:lobby`): open rooms appear
with a one-click Join, matches in progress show "A vs B" deduplicated — pure
presence, nothing stored. Real impact sounds from Chequered Ink's 400 Sounds Pack
(`art/sfx/`, licensed free-for-commercial, credited in its LICENSE.txt) with the
synth as fallback; bell/super stay synthesized. Touch controls: floating stick on
the left half, L/H/S + THROW/SUPER/DASH buttons (both small ones together =
Burst), pause button — drives P1, OR-ed into both the local and online input
paths, shown via `body.has-touch` only on coarse-pointer devices. Tier badges use the hand-drawn
Colorfiction Sketch font (SIL OFL, `fonts/COLORFICTION-OFL.txt`). And a
**Strive-style restyle of `fight.html` only**, refined after owner feedback
("the red palette doesn't fit our characters"): the rule is **color belongs to the
characters and the stage, the chrome stays neutral ink** (`#0d0c11` family). Red
`#e10600` is reserved for interaction — the menu's block cursor, primary buttons, P1.
Diagonal hairline texture, left-aligned menu, angular clip-path corners. The menu
paints the roster as **flat silhouettes tinted per character** (`paintMenuArt` —
silhouettes unify the mixed pixel/HD/stick-figure art styles that looked uncanny
in full color). In-game stage is a dusk gradient (violet→ember) with a low sun,
skyline and warm windows so every fighter palette reads; P2's health bar is cyan
(per-player identity, matches the pick badges). Select cards carry a spine tinted
with each fighter's own color (`--spine`). The rest of the site keeps the
Discord-style theme on purpose.
**`art/menu-break/lineup/whistle.png` belong to `suds.html` (Suds of Doom) — never
delete them; they look like stale SFFG assets but are not.**

### Shipped in the Aug 2026 mobile pass
The owner reported the phone experience was clunky: iOS kept zooming in (Safari
auto-zooms any field under 16px and stays zoomed) and things clipped. Fixes, all
CSS-first: **every text field is ≥16px on phones** — a global `@media(max-width:760px)`
rule in `ycz-theme.css` (covers VideoZone/Qmages/Gaming/Music) plus per-page rules in
`index.html`, `fight.html`, `create.html` and `lite.html`, which don't load the theme.
Watch the specificity: several pages size inputs via id/descendant selectors, so the
mobile rule must name them (`#cm-q`, `.tr-row select`, `.field input[type=text]`…).
Chat got safe-area padding (`env(safe-area-inset-*)` on `#main`, `#comp`, `#me-bar`,
drawers, toast — the viewport is `viewport-fit=cover`, so without it the composer sat
under the iPhone home bar), `#t-mem` hidden ≤900px (the member list it toggles is
already hidden there), hover tooltips hidden on touch, and **tap-to-open message
actions**: on coarse pointers, tapping a message body toggles `.acts-open` which shows
`.m-acts` (hover-only before = unreachable on phones; wired at the end of the `#msgs`
click handler). **VideoZone had no mobile layout at all** — the fixed 220px sidebar +
`min-width` topbar logo forced the page to 540px wide (browser zoomed out, everything
clipped); ≤760px the sidebar becomes a horizontal scroll strip under the topbar, the
logo text hides (span `.tb-name`), and `.ycz-back` is forced back to bottom-left
(`!important`, because the theme's mobile rule tops it and lands on the fixed topbar).
`modding.html` tables scroll inside `display:block` boxes instead of widening the page;
SFFG's focused menu item (translateX) no longer pushes the page wider
(`#s-menu{overflow-x:hidden}`). Verified with Playwright iPhone-emulation screenshots +
an overflow/font-size scanner (scratchpad `mobile-audit/`): every page now reports
`scrollWidth === 390` and zero sub-16px visible fields.
Round 2 (owner sent screenshots of the logged-in UI, which the first pass couldn't
reach — the sandbox can't sign in to Supabase): topbar dropdowns (search `.tdrop`,
pins, notifications `#ndrop`) hung off their buttons with fixed 330–340px widths and
ran off the left screen edge — on phones they're `position:fixed`, full width, 10px
margins; the composer placeholder drops the "· / for commands" tail ≤760px (it wrapped
and clipped). Round 3, found by force-opening every overlay with worst-case content
(`mobile-audit/stress.js` — injects fake messages/long names/full server settings and
scans 22 states at 390px and 320px): long unbroken usernames/handles now wrap
(`overflow-wrap:anywhere` on `.m-nm`, `#uc-nm`, `#uc-hd`, `.ni-t`) or truncate
(`.m-reply .rn`, `#reply-bar b`, `.ac-n`, `#typing`), and VideoZone's
`.profile-header`/`.channel-info-row` wrap ≤760px instead of forcing the page wider.
**Lesson: the logged-in UI can't be audited logged-out — stress.js is the tool for
that; keep it updated when new overlays are added.**

### Shipped in the Aug 2026 admin-tools update
Server audit log (viewer in server settings, `aud_*` i18n keys), admins can now manage
roles/kick/ban for mods and members (owner still needed for admin grants — mirrored in
RLS), member timeouts (5m/1h/24h, `muted_until`), per-channel slowmode
(5/10/30/60/300s) and channel lock (buttons in server settings' channel list; lock icon
in the sidebar), purge-user's-messages button on the mod card, members manager panel
with search in server settings, invite-code regenerate, transfer ownership (member rows
first, then `servers.owner_id` — the RLS order matters), delete server
(type-the-name confirm, children cleaned up first), bans now enforced by RLS on join
with a "You are banned" message client-side, lock/slowmode/timeouts enforced
server-side via `ycz_can_post` with a polite client-side pre-check
(`lastSent` map + composer states).

### Shipped in the Aug 2026 polish pass
Notifications now clear themselves when you open the room they point at
(`clearRoomNotifs`, filtered on `data->>room_key`), and a notification for the room
you're actively viewing (tab visible) is marked read immediately — no toast/ping.
Discord-style red mention counters on the server icons in the rail
(`paintSvBadges`, driven by unread notifications' `data.server_id`). Member-list
status bubbles were being clipped: `.mem-av` had `overflow:hidden`, which cut its own
`::after` dot — the overflow moved to the `img` (border-radius) instead; don't put it
back. VideoZone views fixed server-side: `bump_view(vid text)` security-definer RPC
(SQL delivered in chat, never committed) — the client already called it, the function
was missing/blocked by RLS.

### Shipped in the Aug 2026 features update
Message search (topbar, searches the server's text channels), pinned messages,
light/dark toggle in the chat app (localStorage `ycz-theme`, shared with VideoZone and
Qmages, which now persist it too), online/away/do-not-disturb status (via presence
payload), profile bios, notification sounds (WebAudio blip, toggle in settings),
jump-to-latest pill with new-message counter, DM unread badge on the rail, server
mods/admins can delete messages client-side (RLS already allowed it), bot tokens now
use `crypto.getRandomValues`, Esc closes modals. Also fixed: language change no longer
overwrites the signed-in username in the user bar (`data-i18n` stomp in `paintMe`).

---

## Testing notes

The sandbox can't reach `yuniorschillzone.xyz` or the Supabase CDN, and its Chromium has
no H.264 decoder — so video playback can't be verified here, only layout and wiring.
Serve the repo with `python3 -m http.server` and drive it with Playwright
(`executablePath:'/opt/pw-browsers/chromium'`), stubbing `window.supabase` via
`addInitScript` to test app logic. DNS lookups do work (raw UDP to 1.1.1.1), which is how
the SPF/DKIM/DMARC checks were done.
