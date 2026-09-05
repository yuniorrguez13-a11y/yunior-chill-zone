/* ═══════════════════════════════════════════════════════════════
   YUNIORS CHILL ZONE — Denarii, the site currency (shared client)

   One denarius, two denarii. This file is loaded by every page that
   has a Supabase client (chat, SFFG, VideoZone, Qmages) and gives them:

     YCZDenarii.plural(n)            "1 denarius" / "7 denarii"
     YCZDenarii.mount(sb, opts)      the live coin pill (opts.into = element,
                                     opts.onOpen = click handler; default
                                     sends you to the chat's Treasury)
     YCZDenarii.setUser(user)        call whenever the session changes
     YCZDenarii.refresh()            re-read the wallet from the server
     YCZDenarii.on('award', fn)      fn(ledgerRow) on every live earning
     YCZDenarii.on('wallet', fn)     fn(walletJson) after every refresh
     YCZDenarii.balance              current balance (number or null)
     YCZDenarii.NAME_COLORS          id → hex whitelist for name colours
     YCZDenarii.reasonLabel(reason)  translated label for a ledger reason

   The server owns every number: this file only reads ycz_wallet() and
   listens to its own rows of denarii_ledger over realtime, so a "+1"
   pops the moment the database awards it — from any page, for any reason.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Latin plural. The one place that spells it. */
  function plural(n) { n = n | 0; return n === 1 ? '1 denarius' : n + ' denarii'; }

  /* Name colours sold in the shop. Ids come from the database, the hex
     values live only here — a hostile row can never inject a style. */
  var NAME_COLORS = {
    color_gold: '#ffb020', color_cyan: '#00d4ff', color_lime: '#8ee94a',
    color_rose: '#ff5f8f', color_violet: '#b48cff', color_ember: '#ff7a3d'
  };

  /* i18n keys per ledger reason, with English fallbacks for pages that
     do not load ycz-i18n.js. */
  var REASON_KEYS = {
    daily_active: ['rDailyActive', 'First message of the day'],
    message: ['rMessage', 'Messages'],
    streak_bonus: ['rStreakBonus', 'Streak bonus'],
    publish_fighter: ['rPublishFighter', 'Publishing a fighter'],
    fighter_played: ['rFighterPlayed', 'Your fighters being played'],
    online_match: ['rOnlineMatch', 'Online matches'],
    upload_video: ['rUploadVideo', 'Uploading a video'],
    post_image: ['rPostImage', 'Posting an image'],
    purchase: ['rPurchase', 'Purchase'],
    grant: ['rGrant', 'Staff grant']
  };
  function reasonLabel(reason) {
    var k = REASON_KEYS[reason];
    if (!k) return reason || '';
    if (typeof window.t === 'function') { var s = window.t(k[0]); if (s && s !== k[0]) return s; }
    return k[1];
  }

  var CSS = [
    '.ycz-coin{position:relative;display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 8px;',
    '  border-radius:999px;border:1px solid rgba(255,176,32,.35);background:rgba(255,176,32,.10);color:#ffb020;',
    '  font:700 13px/1 "DM Sans",system-ui,sans-serif;cursor:pointer;flex:none;white-space:nowrap;transition:background .15s,transform .15s;}',
    '.ycz-coin:hover{background:rgba(255,176,32,.18);}',
    '.ycz-coin.bump{animation:ycz-coin-bump .45s cubic-bezier(.2,.9,.3,1.3);}',
    '.ycz-coin svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.ycz-coin .ycz-coin-n{font-variant-numeric:tabular-nums;}',
    '.ycz-coin .ycz-coin-pop{position:absolute;left:50%;top:-4px;transform:translate(-50%,0);opacity:0;pointer-events:none;',
    '  font-weight:800;font-size:13px;color:#ffb020;text-shadow:0 1px 6px rgba(0,0,0,.6);}',
    '.ycz-coin .ycz-coin-pop.go{animation:ycz-coin-rise 1.1s ease-out forwards;}',
    '.ycz-coin[hidden]{display:none;}',
    '@keyframes ycz-coin-bump{0%{transform:scale(1)}35%{transform:scale(1.14)}100%{transform:scale(1)}}',
    '@keyframes ycz-coin-rise{0%{opacity:0;transform:translate(-50%,6px)}15%{opacity:1}100%{opacity:0;transform:translate(-50%,-26px)}}',
    '.ycz-coin-toasts{position:fixed;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:6px;',
    '  z-index:9999;pointer-events:none;align-items:flex-end;}',
    '.ycz-coin-toast{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:#15131a;',
    '  border:1px solid rgba(255,176,32,.35);color:#eceef3;font:600 13px/1.2 "DM Sans",system-ui,sans-serif;',
    '  box-shadow:0 8px 24px rgba(0,0,0,.45);animation:ycz-toast-in .22s ease-out;}',
    '.ycz-coin-toast b{color:#ffb020;font-weight:800;}',
    '.ycz-coin-toast.out{animation:ycz-toast-out .3s ease-in forwards;}',
    '.ycz-coin-toast svg{width:14px;height:14px;stroke:#ffb020;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '@keyframes ycz-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '@keyframes ycz-toast-out{to{opacity:0;transform:translateY(6px)}}',
    'body.light .ycz-coin-toast{background:#fff;color:#111;}'
  ].join('\n');

  /* coin glyph: falls back to an inline drawing if ycz-icons.js is absent */
  function coinSvg(size) {
    size = size || 15;
    var body = (window.YCZ_ICONS && window.YCZ_ICONS.coin) ||
      '<circle cx="12" cy="12" r="9"/><path d="M9.5 8.5h3a3.5 3.5 0 0 1 0 7h-3z"/><path d="M8 12h1.5"/>';
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' + body + '</svg>';
  }

  var sb = null, uid = null, balance = null, chan = null, pill = null, numEl = null, popEl = null,
      toasts = null, opts = {}, listeners = { award: [], wallet: [] }, lastWallet = null, styled = false;

  function ensureStyle() {
    if (styled) return; styled = true;
    var st = document.createElement('style'); st.id = 'ycz-denarii-css'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function emit(ev, payload) {
    listeners[ev].forEach(function (fn) { try { fn(payload); } catch (e) { console.warn('[denarii]', e); } });
  }
  function on(ev, fn) { if (listeners[ev] && typeof fn === 'function') listeners[ev].push(fn); }

  function paint() {
    if (!pill) return;
    if (uid == null) { pill.hidden = true; return; }
    pill.hidden = false;
    numEl.textContent = balance == null ? '…' : String(balance);
    pill.title = balance == null ? 'Denarii' : plural(balance);
    pill.setAttribute('aria-label', pill.title);
  }
  function bump(text) {
    if (!pill) return;
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    if (text) {
      popEl.textContent = text; popEl.classList.remove('go'); void popEl.offsetWidth; popEl.classList.add('go');
    }
  }
  function toast(row) {
    ensureStyle();
    if (!toasts) { toasts = document.createElement('div'); toasts.className = 'ycz-coin-toasts'; document.body.appendChild(toasts); }
    var el = document.createElement('div'); el.className = 'ycz-coin-toast';
    var amt = document.createElement('b'); amt.textContent = (row.delta > 0 ? '+' : '') + plural(row.delta);
    var why = document.createElement('span'); why.textContent = ' · ' + reasonLabel(row.reason);
    el.innerHTML = coinSvg(14); el.appendChild(amt); el.appendChild(why);
    toasts.appendChild(el);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { el.remove(); }, 320); }, 2600);
  }

  function onLedger(row) {
    if (!row || typeof row.delta !== 'number') return;
    if (balance == null) balance = 0;
    balance += row.delta;
    paint();
    if (row.delta > 0) { bump('+' + row.delta); toast(row); }
    emit('award', row);
  }

  function unsubscribe() {
    if (chan && sb) { try { sb.removeChannel(chan); } catch (e) {} }
    chan = null;
  }
  function subscribe() {
    if (!sb || !uid || typeof sb.channel !== 'function') return;
    unsubscribe();
    try {
      chan = sb.channel('denarii:' + uid)
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'denarii_ledger', filter: 'user_id=eq.' + uid },
            function (p) { onLedger(p && p.new); })
        .subscribe();
    } catch (e) { console.warn('[denarii] realtime unavailable', e); chan = null; }
  }

  var refreshing = null;
  function refresh() {
    if (!sb || !uid) return Promise.resolve(null);
    if (refreshing) return refreshing;
    refreshing = Promise.resolve()
      .then(function () { return sb.rpc('ycz_wallet'); })
      .then(function (r) {
        var w = r && r.data;
        if (r.error || !w || w.error) { balance = null; lastWallet = null; }
        else { balance = w.balance | 0; lastWallet = w; }
        paint(); emit('wallet', lastWallet); return lastWallet;
      })
      .catch(function () { balance = null; paint(); return null; })
      .then(function (w) { refreshing = null; return w; });
    return refreshing;
  }

  function mount(client, o) {
    sb = client; opts = o || {};
    ensureStyle();
    if (!pill) {
      pill = document.createElement('button'); pill.type = 'button'; pill.className = 'ycz-coin'; pill.hidden = true;
      pill.innerHTML = coinSvg(15) + '<b class="ycz-coin-n">…</b><span class="ycz-coin-pop"></span>';
      numEl = pill.querySelector('.ycz-coin-n'); popEl = pill.querySelector('.ycz-coin-pop');
      pill.addEventListener('click', function () {
        if (typeof opts.onOpen === 'function') opts.onOpen();
        else location.href = (opts.treasuryUrl || 'index.html#denarii');
      });
    }
    var into = opts.into || document.body;
    if (pill.parentNode !== into) into.appendChild(pill);
    /* the tab coming back after a while may have missed events */
    document.addEventListener('visibilitychange', function () { if (!document.hidden && uid) refresh(); });
    paint();
    return pill;
  }

  function setUser(user) {
    var next = user && user.id ? user.id : null;
    if (next === uid) { if (uid) refresh(); return; }
    uid = next; balance = null; lastWallet = null;
    unsubscribe(); paint();
    if (uid) { refresh(); subscribe(); }
    else emit('wallet', null);
  }

  window.YCZDenarii = {
    plural: plural, mount: mount, setUser: setUser, refresh: refresh, on: on,
    reasonLabel: reasonLabel, NAME_COLORS: NAME_COLORS, coinSvg: coinSvg,
    get balance() { return balance; },
    get wallet() { return lastWallet; }
  };
})();
