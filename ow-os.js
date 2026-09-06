/* ow-os.js — MirrorOS, the operating system on the PC in your apartment.
   It looks like a certain 2009 operating system with glass borders and a round start button, because that is
   what a courier's home PC looks like. Draggable windows, a taskbar, a start menu, and the apps that matter:
   Overwork Online (host / join a shift), the Lucky Loaf Casino (lose the sock drawer), notes, the locker,
   a Pitty Striker shortcut that does not work yet, and a recycle bin full of feelings.
   The game hands in an api object; this file only touches its own DOM (#s-pc). */

import { createSlots, createBlackjack, createRoulette, SLOT_SYMBOLS, BETS, WHEEL, colorOf, handValue, isRed } from './ow-casino.js';

const css = `
#s-pc{position:fixed;inset:0;display:none;z-index:6;font-family:'Segoe UI',Tahoma,'Trebuchet MS',Arial,sans-serif;font-size:14px;color:#111;user-select:none;}
#s-pc.on{display:block;}
#pc-frame{position:absolute;inset:4vh 4vw 3vh 4vw;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 14px #1a1a1f,0 0 0 16px #3a3a44;background:#1a1a1f;}
#pc-desk{position:absolute;inset:0;background:
  radial-gradient(ellipse at 20% 110%,rgba(255,255,255,.28),rgba(255,255,255,0) 45%),
  radial-gradient(ellipse at 75% 35%,rgba(120,220,255,.35),rgba(120,220,255,0) 55%),
  radial-gradient(ellipse at 40% 60%,rgba(20,90,200,.55),rgba(20,90,200,0) 60%),
  linear-gradient(160deg,#0b3e8f 0%,#1e73d8 45%,#59b8ff 100%);}
#pc-desk::after{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 60% 80%,rgba(255,255,255,.18),transparent 40%);pointer-events:none;}
#pc-icons{position:absolute;left:14px;top:14px;display:grid;grid-template-columns:repeat(2,86px);gap:8px 6px;}
.pc-ic{width:86px;padding:8px 4px 6px;border-radius:5px;text-align:center;color:#fff;cursor:pointer;border:1px solid transparent;}
.pc-ic:hover{background:rgba(255,255,255,.15);border-color:rgba(255,255,255,.35);}
.pc-ic .g{width:44px;height:44px;margin:0 auto 5px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:19px;color:#fff;box-shadow:inset 0 -14px 20px rgba(0,0,0,.25),0 2px 4px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.5);}
.pc-ic .g svg{width:28px;height:28px;fill:none;stroke:#fff;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;}
.pc-ic span{display:block;font-size:12px;line-height:1.15;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.8);}
#pc-bar{position:absolute;left:0;right:0;bottom:0;height:42px;background:linear-gradient(#3c5f8f,#1b3a66 40%,#132b4f);border-top:1px solid rgba(255,255,255,.35);display:flex;align-items:center;gap:4px;padding:0 6px 0 4px;box-shadow:0 -2px 8px rgba(0,0,0,.4);}
#pc-orb{width:44px;height:44px;border-radius:50%;margin-top:-6px;position:relative;cursor:pointer;flex:none;
  background:radial-gradient(circle at 50% 30%,#fff 0,#d9f7ff 12%,#2fa5ff 30%,#0b4fa8 60%,#08305f 100%);box-shadow:0 0 0 2px #0a2a55,0 0 14px rgba(120,200,255,.8),inset 0 -6px 10px rgba(0,0,0,.4);}
#pc-orb::after{content:'';position:absolute;left:11px;top:9px;width:22px;height:26px;border-radius:50% 50% 45% 45%;background:linear-gradient(135deg,rgba(255,255,255,.95),rgba(255,255,255,.15));box-shadow:inset 0 0 0 2px rgba(0,60,140,.35);transform:rotate(-12deg);}
#pc-orb:hover{filter:brightness(1.15);}
#pc-tasks{display:flex;gap:4px;flex:1;height:100%;align-items:center;padding-left:6px;}
.pc-task{height:32px;min-width:120px;max-width:180px;padding:0 10px;display:flex;align-items:center;gap:8px;color:#fff;font-size:13px;border-radius:4px;background:linear-gradient(rgba(255,255,255,.18),rgba(255,255,255,.06));border:1px solid rgba(255,255,255,.3);cursor:pointer;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
.pc-task.act{background:linear-gradient(rgba(255,255,255,.4),rgba(255,255,255,.12));box-shadow:inset 0 0 8px rgba(255,255,255,.4);}
.pc-task i{width:14px;height:14px;border-radius:3px;flex:none;}
#pc-tray{color:#fff;font-size:12px;text-align:center;line-height:1.2;padding:0 10px;border-left:1px solid rgba(255,255,255,.25);height:100%;display:flex;flex-direction:column;justify-content:center;text-shadow:0 1px 1px #000;}
#pc-tray small{opacity:.8;}
#pc-start{position:absolute;left:6px;bottom:46px;width:300px;background:linear-gradient(#e9f1fa,#cfe0f3);border:1px solid #7ea0c8;border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,.5);display:none;overflow:hidden;}
#pc-start.on{display:block;}
#pc-start .u{padding:12px 14px;background:linear-gradient(#5b8fd6,#2f5f9f);color:#fff;font-weight:600;display:flex;gap:10px;align-items:center;}
#pc-start .u b{display:block;font-size:15px;} #pc-start .u small{opacity:.85;font-weight:400;}
#pc-start .av{width:38px;height:38px;border-radius:6px;background:#ff7a1a;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3);}
#pc-start .it{padding:8px 14px;cursor:pointer;color:#123;display:flex;gap:10px;align-items:center;}
#pc-start .it:hover{background:rgba(60,120,200,.18);}
#pc-start .it i{width:22px;height:22px;border-radius:5px;flex:none;}
#pc-start .foot{padding:8px 14px;border-top:1px solid #a9c1de;display:flex;justify-content:flex-end;gap:6px;background:#dbe7f5;}
#s-pc .pc-btn{font:inherit;font-size:13px;padding:5px 14px;border-radius:4px;border:1px solid #6b7f99;background:linear-gradient(#fdfdfd,#dfe6ee 50%,#cfd8e3);color:#111;cursor:pointer;box-shadow:0 1px 1px rgba(0,0,0,.15);}
#s-pc .pc-btn:hover{background:linear-gradient(#f4fbff,#cfe7fb 50%,#b8dbf8);border-color:#3c7fb1;}
#s-pc .pc-btn:active{background:#c4d5e6;} #s-pc .pc-btn:disabled{opacity:.5;cursor:default;}
#s-pc .pc-btn.go{background:linear-gradient(#a8e08a,#4fae3a 55%,#3a8f2a);color:#fff;border-color:#2f6f22;text-shadow:0 1px 1px rgba(0,0,0,.4);}
#s-pc .pc-btn.red{background:linear-gradient(#f3a8a8,#d34545 55%,#a92c2c);color:#fff;border-color:#7a1c1c;}
#s-pc .pc-in{font:inherit;font-size:14px;padding:5px 8px;border:1px solid #7f9db9;border-radius:3px;background:#fff;color:#111;}
#s-pc .pc-in:focus{outline:none;border-color:#3c7fb1;box-shadow:0 0 4px rgba(60,127,177,.6);}
/* windows: glass frame, title, three buttons, white content */
.win{position:absolute;min-width:320px;border-radius:8px;padding:0 7px 7px;background:linear-gradient(rgba(190,215,240,.75),rgba(150,185,225,.75));backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.6);box-shadow:0 0 0 1px rgba(20,50,90,.6),0 12px 40px rgba(0,0,0,.45);display:flex;flex-direction:column;}
.win.act{background:linear-gradient(rgba(200,225,250,.9),rgba(160,195,235,.9));}
.win.min{display:none;}
.win .tb{height:30px;display:flex;align-items:center;gap:8px;padding:0 4px 0 6px;cursor:move;color:#0b2a4a;text-shadow:0 0 8px #fff,0 0 8px #fff;font-size:13px;}
.win .tb i{width:16px;height:16px;border-radius:4px;flex:none;} .win .tb b{flex:1;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.win .tb .bt{display:flex;gap:1px;}
.win .tb button{width:30px;height:20px;border:1px solid rgba(20,50,90,.6);background:linear-gradient(rgba(255,255,255,.7),rgba(200,220,240,.5));color:#123;font-size:12px;line-height:1;cursor:pointer;border-radius:3px;}
.win .tb button:first-child{border-radius:3px 0 0 3px;} .win .tb button:last-child{border-radius:0 3px 3px 0;}
.win .tb button.x{width:46px;background:linear-gradient(#f0a0a0,#c9302c 50%,#a4241f);color:#fff;font-weight:700;}
.win .tb button:hover{filter:brightness(1.12);}
.win .body{background:#fff;border:1px solid rgba(20,50,90,.5);flex:1;overflow:auto;padding:12px 14px;min-height:80px;line-height:1.4;}
.win.max{left:0!important;top:0!important;width:100%!important;height:calc(100% - 42px)!important;border-radius:0;}
.win h3{font-size:15px;margin:0 0 6px;font-weight:600;color:#123;} .win p{margin:0 0 8px;} .win .mut{color:#667;font-size:12.5px;}
.win .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0;}
.win .box{border:1px solid #c5d3e3;border-radius:5px;padding:8px 10px;margin:6px 0;background:#f6f9fd;}
.win .code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:30px;letter-spacing:.2em;font-weight:700;color:#0b3e8f;}
.win ul{margin:4px 0 4px 18px;padding:0;} .win li{margin:2px 0;}
.win .room{display:flex;justify-content:space-between;align-items:center;padding:5px 8px;border-bottom:1px solid #e3ebf3;} .win .room:last-child{border-bottom:0;}
.win .chat{height:110px;overflow:auto;background:#f6f9fd;border:1px solid #c5d3e3;border-radius:4px;padding:6px 8px;font-size:13px;margin-bottom:6px;} .win .chat div{margin:1px 0;} .win .chat .sys{color:#7a8a1e;}
.win textarea{width:100%;height:100%;min-height:220px;border:0;resize:none;font:13px/1.45 ui-monospace,Menlo,Consolas,monospace;outline:none;color:#111;background:#fff;}
/* casino */
#s-pc .cz-tabs{display:flex;gap:4px;border-bottom:1px solid #c5d3e3;margin-bottom:10px;} #s-pc .cz-tabs button{font:inherit;font-size:13px;padding:6px 14px;border:1px solid #c5d3e3;border-bottom:0;border-radius:5px 5px 0 0;background:#e9eff6;cursor:pointer;} #s-pc .cz-tabs button.on{background:#fff;font-weight:600;}
#s-pc .cz-cash{font-weight:700;font-size:18px;color:#1f7a2e;}
#s-pc .reels{display:flex;gap:10px;justify-content:center;margin:10px 0;}
#s-pc .reel{width:92px;height:92px;border:3px solid #7a5a10;border-radius:10px;background:linear-gradient(#fff,#e8e0c8);display:flex;align-items:center;justify-content:center;font-family:'CF Sketch','Patrick Hand',cursive;font-size:22px;color:#23212b;box-shadow:inset 0 6px 14px rgba(0,0,0,.15);text-align:center;line-height:1;}
#s-pc .reel.spin{color:#9a8a60;}
#s-pc .cz-msg{min-height:1.4em;font-family:'Patrick Hand',cursive;font-size:17px;margin:6px 0;}
#s-pc .pcards{display:flex;gap:6px;min-height:70px;flex-wrap:wrap;}
#s-pc .pcard{width:46px;height:64px;border:1px solid #889;border-radius:5px;background:#fff;display:flex;flex-direction:column;justify-content:space-between;padding:4px 5px;font-weight:700;font-size:15px;box-shadow:0 1px 3px rgba(0,0,0,.25);} #s-pc .pcard.r{color:#c9302c;} #s-pc .pcard.back{background:repeating-linear-gradient(45deg,#3a6fd8 0 6px,#2a4fa8 6px 12px);}
#s-pc .cz-hand{margin:8px 0;} #s-pc .cz-hand b{display:block;margin-bottom:4px;color:#123;}
#s-pc .dlg{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);}
@media(max-width:760px){#pc-frame{inset:2vh 1vw 1vh 1vw;} .win{min-width:0;width:min(96%,420px)!important;left:2%!important;} #pc-icons{grid-template-columns:repeat(3,76px);} .pc-ic{width:76px;}}
`;

const ICONS = {
  online: ['#2c8fd8', '<svg viewBox="0 0 24 24"><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M4 7.5h16M4 16.5h16"/></svg>'],
  casino: ['#b43a8a', '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2" fill="#fff"/><circle cx="15" cy="15" r="1.2" fill="#fff"/><circle cx="15" cy="9" r="1.2" fill="#fff"/><circle cx="9" cy="15" r="1.2" fill="#fff"/><circle cx="12" cy="12" r="1.2" fill="#fff"/></svg>'],
  pitty: ['#c9302c', '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 6v3M12 15v3M6 12h3M15 12h3"/></svg>'],
  notes: ['#e0c04a', '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7"/></svg>'],
  locker: ['#ff7a1a', '<svg viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M6 9h12M10 14h1"/></svg>'],
  bin: ['#7a8a99', '<svg viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"/></svg>'],
  shut: ['#c9302c', '<svg viewBox="0 0 24 24"><path d="M12 4v8"/><path d="M7 7a7 7 0 1 0 10 0"/></svg>'],
};

export function createOS(api) {
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const root = document.createElement('div'); root.id = 's-pc';
  root.innerHTML = `<div id="pc-frame"><div id="pc-desk">
    <div id="pc-icons"></div>
    <div id="pc-start"></div>
    <div id="pc-bar"><div id="pc-orb" title="start"></div><div id="pc-tasks"></div><div id="pc-tray"><span id="pc-clock">00:00</span><small id="pc-date"></small></div></div>
  </div></div>`;
  document.body.appendChild(root);
  const $ = sel => root.querySelector(sel);
  const desk = $('#pc-desk'), iconsEl = $('#pc-icons'), tasksEl = $('#pc-tasks'), startEl = $('#pc-start');
  const wins = new Map(); let z = 10, chatLog = [];

  /* ── apps ── */
  const APPS = {
    online: { title: 'Overwork Online', icon: 'online' },
    casino: { title: 'Lucky Loaf Casino', icon: 'casino' },
    pitty: { title: 'Pitty Striker', icon: 'pitty' },
    notes: { title: 'notes.txt - Notepad', icon: 'notes' },
    locker: { title: 'My Locker', icon: 'locker' },
    bin: { title: 'Recycle Bin', icon: 'bin' },
  };
  const iconHtml = k => `<div class="g" style="background:linear-gradient(160deg,${ICONS[k][0]},${shade(ICONS[k][0])})">${ICONS[k][1]}</div>`;
  function shade(hex) { const n = parseInt(hex.slice(1), 16); const r = Math.max(0, (n >> 16) - 60), g = Math.max(0, ((n >> 8) & 255) - 60), b = Math.max(0, (n & 255) - 60); return `rgb(${r},${g},${b})`; }
  for (const k of Object.keys(APPS)) {
    const el = document.createElement('div'); el.className = 'pc-ic'; el.innerHTML = iconHtml(k) + `<span>${APPS[k].title.replace(' - Notepad', '')}</span>`;
    el.onclick = () => openApp(k);                                                                  // one click. it's not 2009. it just looks like it
    iconsEl.appendChild(el);
  }
  startEl.innerHTML = `<div class="u"><div class="av"></div><div><b id="pc-user">new guy</b><small>courier · level 1 · tired</small></div></div>` +
    Object.keys(APPS).map(k => `<div class="it" data-app="${k}"><i style="background:${ICONS[k][0]}"></i>${APPS[k].title.replace(' - Notepad', '')}</div>`).join('') +
    `<div class="foot"><button class="pc-btn red" id="pc-shut">Shut down</button></div>`;
  startEl.onclick = e => { const it = e.target.closest('.it'); if (it) { openApp(it.dataset.app); startEl.classList.remove('on'); } };
  $('#pc-shut').onclick = () => { startEl.classList.remove('on'); api.close(); };
  $('#pc-orb').onclick = e => { e.stopPropagation(); startEl.classList.toggle('on'); };
  desk.addEventListener('pointerdown', e => { if (!e.target.closest('#pc-start') && !e.target.closest('#pc-orb')) startEl.classList.remove('on'); });
  const tick = () => { const d = new Date(); $('#pc-clock').textContent = d.toTimeString().slice(0, 5); $('#pc-date').textContent = d.toLocaleDateString(); }; tick(); setInterval(tick, 10000);

  /* ── windows ── */
  function makeWin(key, title, w, h, x, y) {
    if (wins.has(key)) { const W = wins.get(key); W.el.classList.remove('min'); focus(W); return W; }
    const el = document.createElement('div'); el.className = 'win'; el.style.cssText = `width:${w}px;height:${h}px;left:${x}px;top:${y}px;z-index:${++z}`;
    el.innerHTML = `<div class="tb"><i style="background:${ICONS[APPS[key] ? APPS[key].icon : 'notes'][0]}"></i><b>${title}</b><div class="bt"><button data-a="min" title="minimise">–</button><button data-a="max" title="maximise">▢</button><button class="x" data-a="x" title="close">✕</button></div></div><div class="body"></div>`;
    desk.appendChild(el);
    const W = { key, el, body: el.querySelector('.body'), title, task: null };
    el.querySelector('.tb').addEventListener('pointerdown', e => {
      if (e.target.tagName === 'BUTTON') return; focus(W);
      const r = el.getBoundingClientRect(), pr = desk.getBoundingClientRect(), ox = e.clientX - r.left, oy = e.clientY - r.top;
      const mv = ev => { if (el.classList.contains('max')) return; el.style.left = Math.max(-r.width + 60, Math.min(pr.width - 60, ev.clientX - pr.left - ox)) + 'px'; el.style.top = Math.max(0, Math.min(pr.height - 70, ev.clientY - pr.top - oy)) + 'px'; };
      const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); };
      addEventListener('pointermove', mv); addEventListener('pointerup', up);
    });
    el.addEventListener('pointerdown', () => focus(W));
    el.querySelector('.tb').onclick = e => { const a = e.target.dataset.a; if (a === 'x') closeWin(W); else if (a === 'min') { el.classList.add('min'); paintTasks(); } else if (a === 'max') el.classList.toggle('max'); };
    const t = document.createElement('div'); t.className = 'pc-task'; t.innerHTML = `<i style="background:${ICONS[APPS[key] ? APPS[key].icon : 'notes'][0]}"></i>${title}`; t.onclick = () => { if (el.classList.contains('min')) { el.classList.remove('min'); focus(W); } else if (el.classList.contains('act')) { el.classList.add('min'); paintTasks(); } else focus(W); };
    tasksEl.appendChild(t); W.task = t;
    wins.set(key, W); focus(W); return W;
  }
  function focus(W) { for (const o of wins.values()) o.el.classList.remove('act'); W.el.classList.add('act'); W.el.style.zIndex = ++z; paintTasks(); }
  function paintTasks() { for (const o of wins.values()) o.task.classList.toggle('act', o.el.classList.contains('act') && !o.el.classList.contains('min')); }
  function closeWin(W) { W.el.remove(); W.task.remove(); wins.delete(W.key); if (W.onclose) W.onclose(); }
  const pos = (() => { let n = 0; return () => { n = (n + 1) % 5; return [60 + n * 34 + 120, 30 + n * 26]; }; })();

  function openApp(k) {
    if (k === 'locker') { api.close(); api.openLocker(); return; }
    const [x, y] = pos();
    if (k === 'online') return paintOnline(makeWin(k, APPS[k].title, 520, 460, x, y));
    if (k === 'casino') return paintCasino(makeWin(k, APPS[k].title, 520, 470, x, y));
    if (k === 'notes') { const W = makeWin(k, APPS[k].title, 420, 320, x, y); W.body.style.padding = '0'; W.body.innerHTML = `<textarea spellcheck="false">${notesText()}</textarea>`; W.body.querySelector('textarea').oninput = e => api.saveNotes(e.target.value); return; }
    if (k === 'bin') { const W = makeWin(k, APPS[k].title, 380, 260, x, y); W.body.innerHTML = `<h3>Recycle Bin</h3><ul><li>motivation.txt</li><li>sleep_schedule.cfg</li><li>raise_request_v7_FINAL.docx</li><li>dignity (shortcut)</li></ul><div class="row"><button class="pc-btn" id="bin-r">Restore</button><button class="pc-btn" id="bin-e">Empty</button></div><p class="mut" id="bin-m"></p>`; W.body.querySelector('#bin-r').onclick = () => W.body.querySelector('#bin-m').textContent = "can't restore that. it's gone. it's been gone."; W.body.querySelector('#bin-e').onclick = () => W.body.querySelector('#bin-m').textContent = 'already empty inside. the bin, too.'; return; }
    if (k === 'pitty') { const W = makeWin(k, 'pitty_striker.exe', 380, 190, x + 80, y + 120); W.body.innerHTML = `<div class="row"><div class="g" style="width:36px;height:36px;border-radius:8px;background:#c9302c;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;">!</div><div><b>pitty_striker.exe has stopped working.</b><br><span class="mut">it never started. it's on the list. the list is long.</span></div></div><div class="row" style="justify-content:flex-end"><button class="pc-btn" id="pt-ok">Close program</button></div>`; W.body.querySelector('#pt-ok').onclick = () => closeWin(W); return; }
  }
  function notesText() { return api.loadNotes() || `todo\n- deliver boxes\n- don't throw boxes\n- buy milk\n- ask about the raise (don't)\n- fix the van's "hi" flag (it says hi. that's the fix.)\n- pitty striker when\n\nla peace.`; }

  /* ── Overwork Online ── */
  let onlineWin = null;
  function paintOnline(W) {
    onlineWin = W; W.onclose = () => { onlineWin = null; };
    const st = api.net.state();
    const rooms = api.net.rooms();
    W.body.innerHTML = `<h3>Overwork Online</h3>
      <p class="mut">you are <b>${esc(api.name())}</b>. change it in the locker. ${st.signedIn ? '' : 'not signed in to the chill zone: the connection may fail on some networks (no TURN).'}</p>
      ${st.on ? `
      <div class="box">
        <div class="row"><span>${st.host ? 'hosting a shift. code:' : 'in a room. code:'}</span><span class="code">${esc(st.code)}</span><button class="pc-btn" id="on-copy">copy</button></div>
        <div class="mut">${st.host ? 'friends open Overwork, sit at their pc, and type the code. or click your room in their list.' : 'the host clocks everyone in. you can walk around in the meantime.'}</div>
        <div style="margin-top:6px"><b>who's here</b><ul>${st.players.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
        <div class="chat" id="on-chat">${chatLog.map(l => `<div class="${l.sys ? 'sys' : ''}">${esc(l.t)}</div>`).join('')}</div>
        <div class="row"><input class="pc-in" id="on-msg" placeholder="say something" maxlength="80" style="flex:1"><button class="pc-btn" id="on-send">send</button></div>
        <div class="row" style="margin-top:8px">${st.host ? `<button class="pc-btn go" id="on-start">${st.running ? 'shift in progress' : 'clock everyone in'}</button>` : ''}<button class="pc-btn red" id="on-leave">leave room</button></div>
      </div>` : `
      <div class="box"><b>host a shift</b><div class="mut">you drive. they carry. everyone gets the same pay stub.</div><div class="row"><button class="pc-btn go" id="on-host">host</button><span id="on-st" class="mut">${esc(st.status || '')}</span></div></div>
      <div class="box"><b>join with a code</b><div class="row"><input class="pc-in" id="on-code" placeholder="ABCDE" maxlength="5" style="text-transform:uppercase;width:120px;font-family:ui-monospace,monospace;font-size:18px;letter-spacing:.15em"><button class="pc-btn" id="on-join">join</button></div></div>
      <div class="box"><b>open rooms</b> <span class="mut">(refreshes by itself)</span><div id="on-rooms">${rooms.length ? rooms.map(r => `<div class="room"><span>${esc(r.name || 'someone')}'s shift · ${r.n || 1} on</span><button class="pc-btn" data-join="${esc(r.code)}">join</button></div>`).join('') : '<div class="mut" style="padding:6px 0">nobody is hosting. be the problem.</div>'}</div></div>`}`;
    const q = s => W.body.querySelector(s);
    if (q('#on-host')) q('#on-host').onclick = async () => { q('#on-host').disabled = true; q('#on-st').textContent = 'opening a room…'; await api.net.host(); paintOnline(W); };
    if (q('#on-join')) q('#on-join').onclick = async () => { const c = q('#on-code').value.trim().toUpperCase(); if (c.length < 4) return; q('#on-join').disabled = true; await api.net.join(c); paintOnline(W); };
    if (q('#on-code')) q('#on-code').onkeydown = e => { if (e.key === 'Enter') q('#on-join').click(); };
    W.body.querySelectorAll('[data-join]').forEach(b => b.onclick = async () => { b.disabled = true; await api.net.join(b.dataset.join); paintOnline(W); });
    if (q('#on-leave')) q('#on-leave').onclick = () => { api.net.leave(); paintOnline(W); };
    if (q('#on-copy')) q('#on-copy').onclick = () => { try { navigator.clipboard.writeText(st.code); q('#on-copy').textContent = 'copied'; } catch (e) {} };
    if (q('#on-start')) q('#on-start').onclick = () => { api.startShift(); };
    if (q('#on-send')) { const send = () => { const v = q('#on-msg').value.trim(); if (!v) return; api.net.chat(v); q('#on-msg').value = ''; }; q('#on-send').onclick = send; q('#on-msg').onkeydown = e => { if (e.key === 'Enter') send(); }; }
    const ch = q('#on-chat'); if (ch) ch.scrollTop = 1e6;
  }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  /* ── Lucky Loaf Casino, flat edition: the same three games as the tables inside the casino, drawn as UI ── */
  const bank = { cash: () => api.cash(), add: n => api.addCash(n) };
  const games = api.games || { slots: createSlots(bank), bj: createBlackjack(bank), rl: createRoulette(bank) };   // the game hands over its tables so the window shows the same hand the felt does
  let czTab = 'slots', wheel = { ang: 0, ball: 0, anim: null };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function paintCasino(W) {
    W.body.innerHTML = `<div class="row" style="justify-content:space-between"><h3 style="margin:0">Lucky Loaf Casino</h3><span>sock drawer: <span class="cz-cash">$${api.cash()}</span></span></div>
      <div class="cz-tabs"><button class="${czTab === 'slots' ? 'on' : ''}" data-t="slots">slots</button><button class="${czTab === 'bj' ? 'on' : ''}" data-t="bj">21</button><button class="${czTab === 'rl' ? 'on' : ''}" data-t="rl">roulette</button></div><div id="pcz-body"></div>
      <p class="mut" style="margin-top:8px">the real tables are inside the casino on the street, with a dealer and everything. same odds. same van. nothing here is real money.</p>`;
    W.body.querySelectorAll('.cz-tabs button').forEach(b => b.onclick = () => { czTab = b.dataset.t; paintCasino(W); });
    if (czTab === 'slots') paintSlots(W); else if (czTab === 'bj') paintBJ(W); else paintRoulette(W);
  }
  const cashUp = W => { const c = W.body.querySelector('.cz-cash'); if (c) c.textContent = '$' + api.cash(); };
  const betRow = (cur, attr) => BETS.map(v => `<button class="pc-btn ${cur === v ? 'go' : ''}" data-${attr}="${v}">$${v}</button>`).join('');
  function paintSlots(W) {
    const g = games.slots, s = g.state, b = W.body.querySelector('#pcz-body');
    b.innerHTML = `<div class="reels">${s.reels.map((r, i) => `<div class="reel" id="r${i}">${r}</div>`).join('')}</div>
      <div class="row" style="justify-content:center">bet ${betRow(s.bet, 'bet')}</div>
      <div class="row" style="justify-content:center"><button class="pc-btn go" id="cz-spin" style="font-size:16px;padding:8px 26px" ${s.spinning ? 'disabled' : ''}>spin</button></div>
      <div class="cz-msg" id="cz-msg">${s.msg}</div>`;
    b.querySelectorAll('[data-bet]').forEach(x => x.onclick = () => { g.setBet(+x.dataset.bet); paintSlots(W); });
    b.querySelector('#cz-spin').onclick = () => {
      const r = g.spin(); if (!r) { b.querySelector('#cz-msg').textContent = s.msg; return; }
      cashUp(W); b.querySelector('#cz-spin').disabled = true;
      const reels = [0, 1, 2].map(i => b.querySelector('#r' + i)); reels.forEach(x => x.classList.add('spin'));
      let t = 0; const iv = setInterval(() => { t++; reels.forEach((x, i) => { if (t < 8 + i * 5) x.textContent = pick(SLOT_SYMBOLS)[0]; else { x.textContent = r.final[i]; x.classList.remove('spin'); } }); if (t >= 18) { clearInterval(iv); g.settle(); cashUp(W); if (wins.get(W.key) === W) paintSlots(W); } }, 90);
    };
  }
  const cardHtml = (c, hide) => hide ? '<div class="pcard back"></div>' : `<div class="pcard ${isRed(c) ? 'r' : ''}"><span>${c.r}</span><span style="text-align:right">${c.s}</span></div>`;
  function paintBJ(W) {
    const g = games.bj, s = g.state, b = W.body.querySelector('#pcz-body');
    if (s.phase === 'bet') {
      b.innerHTML = `<div class="row" style="justify-content:center">bet ${betRow(s.bet, 'bet')}</div><div class="row" style="justify-content:center"><button class="pc-btn go" id="bj-deal" style="font-size:16px;padding:8px 26px">deal</button></div><div class="cz-msg">${s.msg}</div>`;
      b.querySelectorAll('[data-bet]').forEach(x => x.onclick = () => { g.setBet(+x.dataset.bet); paintBJ(W); });
      b.querySelector('#bj-deal').onclick = () => { g.deal(); cashUp(W); paintBJ(W); };
      return;
    }
    const done = s.phase === 'done';
    b.innerHTML = `<div class="cz-hand"><b>dealer ${done ? '· ' + handValue(s.h) : ''}</b><div class="pcards">${s.h.map((c, i) => cardHtml(c, i === 1 && !done)).join('')}</div></div>
      <div class="cz-hand"><b>you · ${handValue(s.p)}</b><div class="pcards">${s.p.map(c => cardHtml(c)).join('')}</div></div>
      <div class="row">${done ? '<button class="pc-btn go" id="bj-again">again</button>' : `<button class="pc-btn" id="bj-hit">hit</button><button class="pc-btn" id="bj-stand">stand</button><button class="pc-btn" id="bj-double" ${g.canDouble() ? '' : 'disabled'}>double</button>`}</div>
      <div class="cz-msg">${s.msg}</div>`;
    const q = sel => b.querySelector(sel);
    if (q('#bj-hit')) q('#bj-hit').onclick = () => { g.hit(); cashUp(W); paintBJ(W); };
    if (q('#bj-stand')) q('#bj-stand').onclick = () => { g.stand(); cashUp(W); paintBJ(W); };
    if (q('#bj-double')) q('#bj-double').onclick = () => { g.double(); cashUp(W); paintBJ(W); };
    if (q('#bj-again')) q('#bj-again').onclick = () => { g.reset(); paintBJ(W); };
  }
  /* roulette: a wheel drawn on a canvas, spun by hand */
  function drawWheel(cv, ang, ballAng, ballR) {
    const g = cv.getContext('2d'), c = cv.width / 2, R = c - 4, step = Math.PI * 2 / WHEEL.length;
    g.clearRect(0, 0, cv.width, cv.height);
    g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fillStyle = '#6a3a1a'; g.fill();
    WHEEL.forEach((n, i) => { const a0 = ang + i * step - step / 2; g.beginPath(); g.moveTo(c, c); g.arc(c, c, R - 8, a0, a0 + step); g.closePath(); g.fillStyle = colorOf(n) === 'red' ? '#c9302c' : colorOf(n) === 'black' ? '#1a1a1f' : '#2e8b3a'; g.fill(); g.strokeStyle = '#e8c04a'; g.lineWidth = 1; g.stroke();
      g.save(); g.translate(c + Math.cos(a0 + step / 2) * (R - 22), c + Math.sin(a0 + step / 2) * (R - 22)); g.rotate(a0 + step / 2 + Math.PI / 2); g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center'; g.fillText(n, 0, 3); g.restore(); });
    g.beginPath(); g.arc(c, c, R * 0.45, 0, Math.PI * 2); g.fillStyle = '#e8c04a'; g.fill(); g.beginPath(); g.arc(c, c, R * 0.3, 0, Math.PI * 2); g.fillStyle = '#6a3a1a'; g.fill();
    g.beginPath(); g.arc(c + Math.cos(ballAng) * ballR * R, c + Math.sin(ballAng) * ballR * R, 6, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#333'; g.stroke();
    g.beginPath(); g.moveTo(c - 8, 2); g.lineTo(c + 8, 2); g.lineTo(c, 16); g.closePath(); g.fillStyle = '#ffd23f'; g.fill();               // the marker, top
  }
  function paintRoulette(W) {
    const g = games.rl, s = g.state, b = W.body.querySelector('#pcz-body');
    b.innerHTML = `<div class="row" style="align-items:flex-start;flex-wrap:nowrap"><canvas id="rl-cv" width="220" height="220" style="flex:none"></canvas>
      <div style="flex:1">
        <div class="row">chip ${betRow(s.chip, 'chip')}</div>
        <div class="row"><button class="pc-btn" data-z="red" style="background:#c9302c;color:#fff;border-color:#7a1c1c">red $${s.bets.red}</button><button class="pc-btn" data-z="black" style="background:#1a1a1f;color:#fff;border-color:#000">black $${s.bets.black}</button><button class="pc-btn" data-z="green" style="background:#2e8b3a;color:#fff;border-color:#1a5a24">0 $${s.bets.green}</button></div>
        <div class="row"><button class="pc-btn go" id="rl-spin" ${s.spinning ? 'disabled' : ''}>spin</button><button class="pc-btn" id="rl-clear" ${s.spinning ? 'disabled' : ''}>take chips back</button></div>
        <div class="mut">last: ${s.last.length ? s.last.map(n => `<span style="color:${colorOf(n) === 'red' ? '#c9302c' : colorOf(n) === 'green' ? '#2e8b3a' : '#111'};font-weight:700">${n}</span>`).join(' ') : '—'}</div>
      </div></div><div class="cz-msg" id="rl-msg">${s.msg}</div>`;
    const cv = b.querySelector('#rl-cv'); drawWheel(cv, wheel.ang, wheel.ball, 0.82);
    b.querySelectorAll('[data-chip]').forEach(x => x.onclick = () => { g.setChip(+x.dataset.chip); paintRoulette(W); });
    b.querySelectorAll('[data-z]').forEach(x => x.onclick = () => { g.place(x.dataset.z); cashUp(W); paintRoulette(W); });
    b.querySelector('#rl-clear').onclick = () => { g.clear(); cashUp(W); paintRoulette(W); };
    b.querySelector('#rl-spin').onclick = () => {
      const r = g.spin(); if (!r) { b.querySelector('#rl-msg').textContent = s.msg; return; }
      b.querySelector('#rl-spin').disabled = true; b.querySelector('#rl-clear').disabled = true;
      const step = Math.PI * 2 / WHEEL.length, idx = WHEEL.indexOf(r.n), dur = 3800, t0 = performance.now();
      // the pocket must end under the marker at the top (-π/2): final = -π/2 - idx*step, plus whole turns
      const start = wheel.ang, base = -Math.PI / 2 - idx * step, turns = 4; let end = base; while (end < start + turns * Math.PI * 2) end += Math.PI * 2;
      const frame = now => {
        const t = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - t, 3);
        wheel.ang = start + (end - start) * e; wheel.ball = -Math.PI / 2 - (1 - e) * 26; const cvn = W.body.querySelector('#rl-cv'); if (cvn) drawWheel(cvn, wheel.ang, t < 0.85 ? wheel.ball : -Math.PI / 2, 0.82 - Math.min(1, t / 0.85) * 0.12);
        if (t < 1 && wins.get(W.key) === W) requestAnimationFrame(frame); else { g.settle(); cashUp(W); if (wins.get(W.key) === W && czTab === 'rl') paintRoulette(W); }
      };
      requestAnimationFrame(frame);
    };
  }

  /* ── public surface ── */
  return {
    open(app) { root.classList.add('on'); $('#pc-user').textContent = api.name(); if (app) openApp(app); else if (!wins.size) openApp('online'); },
    close() { root.classList.remove('on'); startEl.classList.remove('on'); },
    refreshOnline() { if (onlineWin) paintOnline(onlineWin); },
    chat(line, sys) { chatLog.push({ t: line, sys }); if (chatLog.length > 40) chatLog.shift(); if (onlineWin) { const ch = onlineWin.body.querySelector('#on-chat'); if (ch) { const d = document.createElement('div'); if (sys) d.className = 'sys'; d.textContent = line; ch.appendChild(d); ch.scrollTop = 1e6; } } },
    isOpen: () => root.classList.contains('on'),
  };
}
