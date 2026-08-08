# Yuniors Chill Zone

`yuniorschillzone.xyz` — a Discord-style community site. Plain HTML/CSS/JS, no build
step, no framework. Supabase for auth, database, realtime and storage. Cloudflare for
DNS and TURN. Deployed by GitHub Pages from `main`.

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
| `ycz-icons.js` | SVG icon set (~41). `icon('hash')` in JS, `<i data-ic="hash">` in markup. |
| `video.html` | VideoZone. Own app, shares session + theme. |
| `qmages.html` | Image board. Own app, shares session + theme. |
| `piano.html` | Multiplayer piano. |
| `music.html`, `gaming.html` | Static link pages, themed via `ycz-theme.css`. |

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

## Known gaps / next up

- `servers_read` invite-code exposure (above)
- **Both Aug 2026 migrations must each be run once** in the Supabase SQL editor — the
  features migration (pinned messages + `user_profiles.bio`) is done; the **admin-tools
  migration** (audit log, slowmode/lock columns, timeouts, rebuilt RLS) lives in chat
  with the owner, not in the repo (owner rule: SQL is never committed). The app degrades
  gracefully until it's run: no audit entries, lock/slowmode/timeout invisible,
  role-change buttons error for admins, bans stay client-side-only.
- Emoji still in the interface: landing-page feature cards (`💬 🔊 🎮 …`, arguably
  content), the `🌙`/`☀️` theme buttons on VideoZone/Qmages, and misc toast checkmarks.
  The chat-app chrome (`🏠`, `🟢`, `👤`, `📷`, `🔇`, `📣`, notification icons) is now SVG.
- Music/Gaming page *content* is still English (only chrome is translated)
- No screen share
- Push notifications only fire when the tab is open in the background — real push needs a
  service worker + VAPID keys
- Voice is mesh — degrades past ~8 people
- `preview.png` (1200×630) for link previews doesn't exist
- Not submitted to Google Search Console

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
