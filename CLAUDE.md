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
| `ycz-icons.js` | SVG icon set (~47). `icon('hash')` in JS, `<i data-ic="hash">` in markup. |
| `ycz-scores.js` | Records + playtime, kept in `localStorage` under `ycz-games`. `yczScore(id,n)` for a high score, `yczTally(id)` for a running count, `yczPlay(id,ms)` for time, `yczData()` to read. Loaded by the games that keep score and by the console. |
| `video.html` | VideoZone. Own app, shares session + theme. |
| `qmages.html` | Image board. Own app, shares session + theme. |
| `piano.html` | Multiplayer piano. |
| `music.html` | Static link page, themed via `ycz-theme.css`. |
| `gaming.html` | The console. A Steam-Big-Picture launcher: wide hero for the selected game, upright capsules for the rest, games open in an iframe here rather than redirecting. Edit the `GAMES` array at the top of its `<script>` to add or remove one — nothing else in the file needs touching. |
| `fight.html` | **SFFG** (Stupidly Funny Fighting Game for Dummies). The fighting game: deterministic 60fps engine, official roster, community fighters, local/CPU/arcade/training/online. See its own section below. |
| `create.html` | SFFG's no-code fighter creator. Sliders, move editor with a to-scale hitbox overlay, sprite frame upload that chroma-keys/trims/aligns and builds sheets in the browser, live validation, publish to Supabase. |
| `modding.html` | SFFG's "how to code a fighter" tutorial — the JSON format, limits, sprite contract, validation rules, worked example. |
| `sffg-mods.js` | The community fighter format (v3, the Freedom Update): security bounds, `validateMod()`, `hashMod()`. Shared by `fight.html` and `create.html` so the game and the creator enforce identical rules. |
| `wrangler.jsonc` · `_headers` · `.assetsignore` | Cloudflare hosting config, cache rules, and what stays unpublished. |

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
- Push notifications only fire when the tab is open in the background — real push needs a
  service worker + VAPID keys
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
**Strive-style restyle of `fight.html` only**: warm dusty palette (near-black +
`#e10600`), diagonal hairline texture, left-aligned menu with a red block cursor,
angular clip-path corners, roster art painted big behind the menu (`paintMenuArt`),
warmed in-game stage. The rest of the site keeps the Discord-style theme on purpose.
**`art/menu-break/lineup/whistle.png` belong to `suds.html` (Suds of Doom) — never
delete them; they look like stale SFFG assets but are not.**

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
