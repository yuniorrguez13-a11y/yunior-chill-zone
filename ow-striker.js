/* ow-striker.js — Pitty Striker.
   The shooter on the apartment PC: a CS-flavoured free-for-all against gamer bots on one desert-town arena ("sandstone"),
   five real-world guns with painted skins that come out of loot cases, and nothing about the job — it is the player's own
   separate game, so the copy is plain game UI.
   Rules of the file (Overwork's): no keyframed animation — springs excited by events; no synthesized sound — the six recordings
   in art/sfx and the sampled piano, routed through api.audio; primitives + canvas textures only; red #e10600 is UI only; no
   shadow maps, pixel ratio ≤ 1.5, everything disposed on close. Data (map, weapons, skins, bots, copy, sound table) lives in
   ow-striker-data.js; this file is the machine.
   createStriker(api) → { open(win), close(), escape(), active, inMatch, __test } */

import * as THREE from './vendor/three.module.min.js';
import { mergeGeometries, mergeVertices } from './vendor/BufferGeometryUtils.js';
import * as D from './ow-striker-data.js';

/* the data module, read defensively: a missing export degrades to something empty instead of a link error */
const MATS = D.MATS || {}, MAP = D.MAP || [], DECO = D.DECO || [], SIGNS = D.SIGNS || [], GROUND = D.GROUND || { w: 44, d: 32, texW: 1024, texH: 768, paint: [] };
const NODES = D.NODES || [], EDGE_HINTS = D.EDGE_HINTS || [], AUTOLINK = D.AUTOLINK || { maxDist: 7.5, maxDy: 0.7, rayHeights: [0.3, 1.0, 1.5], lateral: 0.35 };
const SPAWNS = D.SPAWNS || [{ x: -18, y: 0, z: 12 }, { x: 18, y: 0, z: -12 }], CRATES = D.CRATES || [], BOUNDS = D.BOUNDS || { minX: -20, maxX: 20, minZ: -14, maxZ: 14 };
const WEAPONS = D.WEAPONS || {}, SKINS = D.SKINS || [], CASES = D.CASES || { pitty: { id: 'pitty', name: 'pitty case', price: 80, odds: { common: 0.55, uncommon: 0.25, rare: 0.13, legendary: 0.06, knife: 0.01 }, scrapPerCase: 8 } };
const RARITY = D.RARITY || { stock: { color: '#8b8f9c' }, common: { color: '#9aa3ad' }, uncommon: { color: '#4b8ef0' }, rare: { color: '#a44be0' }, legendary: { color: '#e8c04a' }, knife: { color: '#ffd23f', label: 'knife' } };
const BOTS = D.BOTS || [], DIFF = D.DIFF || {}, LINES = D.LINES || {}, SFX = D.SFX || {}, PS_DEFAULT = D.PS_DEFAULT || { v: 2, owned: [], scrap: 0, cases: 0, eq: {}, loadout: 'ar', diff: 'normal', bots: 5, cfg: {}, stats: { wk: {} }, sig: '' };
const psSig = D.psSig || ((owned, scrap, salt) => { let h = 2166136261; const s = owned.slice().sort().join(',') + '|' + (scrap | 0) + '|' + salt; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(36); });
const validatePS = D.validatePS || ((raw) => ({ ps: JSON.parse(JSON.stringify(Object.assign({}, PS_DEFAULT, raw || {}))), tampered: false }));
const rollCase = D.rollCase || (() => ({ skin: SKINS[0] && SKINS[0].id, rarity: 'common' }));

/* ── small helpers (Overwork's) ── */
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (s, o) => String(s).replace(/\$?\{(\w+)\}/g, (m, k) => (k in o ? o[k] : m));
const fmtTime = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function spring(k, d) { return { x: 0, v: 0, k, d }; }
function springTo(s, target, dt) { const a = (target - s.x) * s.k - s.v * s.d; s.v += a * dt; s.x += s.v * dt; return s.x; }
function angleDelta(a, b) { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; }
function xorshift(seed) { let s = (seed >>> 0) || 0x9e3779b9; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function hashStr(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
const hexNum = h => typeof h === 'number' ? h : parseInt(String(h || '#888888').replace('#', ''), 16);
const hexStr = h => typeof h === 'string' ? h : '#' + (h >>> 0).toString(16).padStart(6, '0');
function shade(hex, f) { const n = hexNum(hex), r = clamp(((n >> 16) & 255) * f | 0, 0, 255), g = clamp(((n >> 8) & 255) * f | 0, 0, 255), b = clamp((n & 255) * f | 0, 0, 255); return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0'); }

/* copy: every string comes from LINES; a key the data file does not have falls back to the plain default here */
function L(path, dflt) { let v = LINES; for (const k of path.split('.')) { if (v == null) return dflt; v = v[k]; } return typeof v === 'string' ? v : dflt; }
function LA(path, dflt) { let v = LINES; for (const k of path.split('.')) { if (v == null) return dflt; v = v[k]; } return Array.isArray(v) && v.length ? v : dflt; }
function flattenLines(o, out = []) { if (typeof o === 'string') out.push(o); else if (Array.isArray(o)) o.forEach(v => flattenLines(v, out)); else if (o && typeof o === 'object') Object.values(o).forEach(v => flattenLines(v, out)); return out; }
const rarColor = r => (RARITY[r] && RARITY[r].color) || '#9aa3ad';
const skinById = id => SKINS.find(s => s.id === id) || null;
const stockSkin = w => skinById('stock_' + w) || SKINS.find(s => s.weapon === w && s.rarity === 'stock') || { id: 'stock_' + w, name: 'stock', weapon: w, rarity: 'stock', look: { base: w === 'ak' ? '#a9773f' : '#3a3d45', accent: '#2a2a30', metal: '#4a4d55', pattern: w === 'ak' ? 'wood' : 'plain' } };
const weaponName = id => (WEAPONS[id] && WEAPONS[id].name) || id;
const PRIMARIES = ['ar', 'ak', 'awp'];
const STEP = 1 / 60, STEP_UP = 0.45, COYOTE = 0.08, JUMP_BUF = 0.10;

/* ── one stylesheet, scoped under #ps (the match) and #ps-launcher (the program in the window) ── */
const CSS = `
#ps-launcher{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(#2a2b31,#16171b 60%,#101114);color:#e6e4df;font-family:'Segoe UI',Tahoma,'Trebuchet MS',Arial,sans-serif;font-size:14px;user-select:none;-webkit-user-select:none;overflow:hidden;}
#ps-launcher .hd{display:flex;align-items:baseline;gap:10px;padding:8px 16px 5px;background:linear-gradient(rgba(255,255,255,.12),rgba(255,255,255,.02));border-bottom:1px solid rgba(255,255,255,.12);flex:none;}
#ps-launcher .wm{font-family:'CF Sketch','Patrick Hand',cursive;font-size:36px;line-height:1;color:#e10600;text-shadow:0 2px 0 rgba(0,0,0,.6),0 0 18px rgba(225,6,0,.35);letter-spacing:.02em;}
#ps-launcher .ver{color:#9a9aa3;font-size:12px;} #ps-launcher .cash{margin-left:auto;font-weight:600;color:#9be08a;font-size:15px;}
#ps-launcher .main{flex:1;display:flex;min-height:0;}
#ps-launcher nav{width:128px;flex:none;display:flex;flex-direction:column;padding:8px 0;border-right:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.18);}
#ps-launcher nav button{font:inherit;font-size:15px;text-align:left;padding:8px 16px;color:#c9c8c4;background:none;border:0;border-left:3px solid transparent;cursor:pointer;}
#ps-launcher nav button:hover{background:rgba(255,255,255,.06);color:#fff;}
#ps-launcher nav button.on{color:#fff;border-left-color:#e10600;background:linear-gradient(90deg,rgba(225,6,0,.28),rgba(225,6,0,0));}
#ps-launcher nav .sp{flex:1;}
#ps-launcher .pane{flex:1;overflow:auto;padding:12px 18px 16px;min-width:0;}
#ps-launcher h2{font-size:18px;font-weight:600;margin:0 0 8px;color:#fff;} #ps-launcher .mut{color:#9a9aa3;font-size:12.5px;} #ps-launcher p{margin:0 0 8px;}
#ps-launcher .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0;}
#ps-launcher .lbl{width:96px;color:#9a9aa3;flex:none;}
#ps-launcher .seg{display:inline-flex;border:1px solid rgba(255,255,255,.18);border-radius:4px;overflow:hidden;}
#ps-launcher .seg button{font:inherit;font-size:13px;padding:5px 12px;color:#ddd;background:rgba(255,255,255,.04);border:0;border-right:1px solid rgba(255,255,255,.12);cursor:pointer;} #ps-launcher .seg button:last-child{border-right:0;}
#ps-launcher .seg button.on{background:#e10600;color:#fff;}
#ps-launcher .panel{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:10px 12px;margin:8px 0;}
#ps-launcher .pbig{font-size:17px;padding:9px 30px;}
#ps-launcher .prev{width:260px;height:150px;background:radial-gradient(ellipse at 50% 60%,#3a3b42,#1a1b20);border:1px solid rgba(255,255,255,.12);border-radius:6px;flex:none;touch-action:none;cursor:grab;}
#ps-launcher .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;}
#ps-launcher .sk{--rar:#9aa3ad;background:linear-gradient(rgba(255,255,255,.06),rgba(0,0,0,.15));border:1px solid var(--rar);border-top-width:3px;border-radius:6px;padding:8px 10px;}
#ps-launcher .sk b{display:block;font-size:14px;} #ps-launcher .sk .r{color:var(--rar);font-size:11.5px;} #ps-launcher .sk .d{font-size:12px;color:#b0afaa;margin:4px 0 6px;min-height:2.4em;}
#ps-launcher .sk.eq{box-shadow:inset 0 0 0 1px var(--rar),0 0 14px rgba(255,255,255,.08);}
#ps-launcher .sw{width:100%;height:26px;border-radius:3px;margin-bottom:6px;border:1px solid rgba(0,0,0,.4);background-size:cover;}
#ps-launcher .creel{position:relative;height:118px;overflow:hidden;background:#0d0d10;border:1px solid rgba(255,255,255,.12);border-radius:6px;margin:8px 0;}
#ps-launcher .creel .strip{position:absolute;left:50%;top:9px;display:flex;gap:6px;will-change:transform;}
#ps-launcher .creel .rc{--rar:#9aa3ad;width:96px;height:100px;flex:none;border-radius:5px;border:1px solid var(--rar);border-bottom:4px solid var(--rar);background:linear-gradient(#2a2b31,#16171b);padding:8px;color:#eee;font-size:12px;line-height:1.2;overflow:hidden;}
#ps-launcher .creel .rc .sw{height:34px;margin-bottom:4px;} #ps-launcher .creel .rc small{color:var(--rar);}
#ps-launcher .creel .mk{position:absolute;left:50%;top:0;bottom:0;width:2px;margin-left:-1px;background:#e10600;box-shadow:0 0 8px #e10600;z-index:2;}
#ps-launcher .creel.land .rc.hit{box-shadow:0 0 22px var(--rar);}
#ps-launcher .res{display:flex;gap:14px;align-items:center;}
#ps-launcher table{border-collapse:collapse;width:100%;font-size:13px;} #ps-launcher td,#ps-launcher th{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;} #ps-launcher th{color:#9a9aa3;font-weight:500;}
#ps-launcher input[type=range]{width:170px;} #ps-launcher select{font:inherit;font-size:13px;background:#2a2b31;color:#eee;border:1px solid rgba(255,255,255,.2);border-radius:3px;padding:3px 6px;}
#ps-launcher .crash{position:absolute;inset:0;background:#2a3a55;display:flex;align-items:center;justify-content:center;}
#ps-launcher .cdlg{width:min(420px,90%);background:#f0f0f0;color:#111;border:1px solid #5a7aa0;border-radius:6px;box-shadow:0 10px 40px rgba(0,0,0,.5);font-size:13px;}
#ps-launcher .cdlg .t{padding:6px 10px;background:linear-gradient(#dfe9f5,#b9cde6);border-bottom:1px solid #8aa5c8;font-weight:600;} #ps-launcher .cdlg .b{padding:16px 14px;min-height:54px;} #ps-launcher .cdlg .f{padding:8px 12px;text-align:right;background:#e6e6e6;}
#ps-launcher .fade{opacity:0;transition:opacity .5s;} #ps-launcher .fade.on{opacity:1;}
#ps{position:absolute;inset:0;background:#000;overflow:hidden;font-family:'Patrick Hand','Segoe Print',cursive;color:#f3ecdc;--paper:#f3ecdc;--pen:#23212b;--red:#e10600;--hi:#ffd23f;user-select:none;-webkit-user-select:none;z-index:50;}
#ps canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:crosshair;}
#ps.dead canvas{filter:grayscale(.7);}
#ps .hud{position:absolute;inset:0;pointer-events:none;}
#ps .num{font-family:'CF Sketch','Patrick Hand',cursive;font-variant-numeric:tabular-nums;}
#ps #ps-xh{position:absolute;left:50%;top:50%;width:0;height:0;--g:8px;--l:9px;--xc:#e10600;} #ps #ps-xh.off{display:none;}
#ps #ps-xh i{position:absolute;background:var(--xc);box-shadow:0 0 2px rgba(0,0,0,.9);}
#ps #ps-xh .t{left:-1px;top:calc(-1 * var(--g) - var(--l));width:2px;height:var(--l);} #ps #ps-xh .b{left:-1px;top:var(--g);width:2px;height:var(--l);}
#ps #ps-xh .l{top:-1px;left:calc(-1 * var(--g) - var(--l));height:2px;width:var(--l);} #ps #ps-xh .r{top:-1px;left:var(--g);height:2px;width:var(--l);} #ps #ps-xh .c{left:-1px;top:-1px;width:2px;height:2px;}
#ps #ps-hm{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0;} #ps #ps-hm i{position:absolute;width:2px;height:10px;background:#fff;left:-1px;top:-5px;box-shadow:0 0 2px #000;}
#ps #ps-hm .a{transform:rotate(45deg) translateY(-15px);} #ps #ps-hm .b{transform:rotate(135deg) translateY(-15px);} #ps #ps-hm .c{transform:rotate(225deg) translateY(-15px);} #ps #ps-hm .d{transform:rotate(315deg) translateY(-15px);}
#ps #ps-hm.head i{background:var(--red);width:3px;}
#ps #ps-hp{position:absolute;left:18px;bottom:16px;text-shadow:0 2px 0 #000;} #ps #ps-hp .lab{font-size:15px;} #ps #ps-hp .bar{width:170px;height:12px;background:rgba(0,0,0,.5);border:2px solid var(--paper);margin:2px 0;} #ps #ps-hp .bar i{display:block;height:100%;background:var(--paper);width:100%;} #ps #ps-hp .n{font-size:40px;line-height:1;display:inline-block;} #ps #ps-hp.low .n{color:var(--red);} #ps #ps-hp.low .bar i{background:var(--red);}
#ps #ps-am{position:absolute;right:18px;bottom:16px;text-align:right;text-shadow:0 2px 0 #000;} #ps #ps-am .n{font-size:40px;line-height:1;} #ps #ps-am .n small{font-size:20px;color:#d8d0c0;} #ps #ps-am.empty .n{color:var(--red);} #ps #ps-am .w{font-size:17px;} #ps #ps-am .s{font-size:13px;color:#b8b0a0;} #ps #ps-am .rl{height:4px;width:140px;margin:4px 0 0 auto;background:rgba(255,255,255,.2);display:none;} #ps #ps-am .rl i{display:block;height:100%;background:var(--paper);width:0;} #ps #ps-am .msg{font-size:15px;color:var(--red);min-height:1.2em;}
#ps #ps-clk{position:absolute;left:18px;top:12px;text-shadow:0 2px 0 #000;} #ps #ps-clk .n{font-size:34px;line-height:1;} #ps #ps-clk.low .n{color:var(--red);} #ps #ps-clk .s{font-size:15px;}
#ps #ps-feed{position:absolute;right:14px;top:12px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;max-width:62%;} #ps #ps-feed div{font-size:15px;padding:2px 9px 1px;background:rgba(13,12,17,.72);color:#eee;border-radius:3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;} #ps #ps-feed div.me{border-left:3px solid var(--red);} #ps #ps-feed div.chat{color:#9be08a;} #ps #ps-feed div.sys{color:#b8b0a0;}
#ps #ps-ctr{position:absolute;left:50%;top:20%;transform:translateX(-50%);text-align:center;width:90%;} #ps #ps-ctr .cbig{font-size:64px;line-height:1;text-shadow:0 3px 0 #000;min-height:1em;} #ps #ps-ctr .t{font-size:24px;margin-top:6px;text-shadow:0 2px 0 #000;min-height:1.2em;}
#ps #ps-vig{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(225,6,0,0) 45%,rgba(225,6,0,.75) 100%);opacity:0;}
#ps #ps-arrow{position:absolute;left:50%;top:50%;width:0;height:0;opacity:0;} #ps #ps-arrow i{position:absolute;left:-9px;top:-112px;border-left:9px solid transparent;border-right:9px solid transparent;border-bottom:16px solid var(--paper);filter:drop-shadow(0 0 2px #000);}
#ps #ps-scope{position:absolute;inset:0;display:none;background:radial-gradient(circle at center,rgba(0,0,0,0) 0,rgba(0,0,0,0) 34vmin,rgba(0,0,0,.94) 35vmin);} #ps #ps-scope.on{display:block;}
#ps #ps-scope .h,#ps #ps-scope .v{position:absolute;left:50%;top:50%;background:var(--paper);} #ps #ps-scope .h{width:60vmin;height:1px;margin-left:-30vmin;} #ps #ps-scope .v{height:60vmin;width:1px;margin-top:-30vmin;} #ps #ps-scope .d{position:absolute;left:50%;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:var(--red);}
#ps .ps-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-.6deg);background:var(--paper);color:var(--pen);border:2.5px solid var(--pen);border-radius:255px 15px 225px 15px / 15px 225px 15px 255px;box-shadow:4px 5px 0 rgba(0,0,0,.45);padding:16px 24px 12px;text-align:center;pointer-events:auto;display:none;max-width:92%;max-height:92%;overflow:auto;min-width:240px;} #ps .ps-card.on{display:block;}
#ps .ps-card h3{font-family:'CF Sketch','Patrick Hand',cursive;font-size:30px;font-weight:400;margin:0 0 4px;line-height:1;} #ps .ps-card p{font-size:18px;margin:4px 0;} #ps .ps-card .mut{color:#5a5566;font-size:15px;} #ps .ps-card .rec{color:#2f6f22;font-size:17px;}
#ps .ps-btn{display:inline-flex;align-items:center;justify-content:center;padding:8px 18px 6px;font:inherit;font-size:19px;line-height:1;background:#e9dfc9;color:var(--pen);border:2.5px solid var(--pen);border-radius:255px 15px 225px 15px / 15px 225px 15px 255px;box-shadow:3px 3px 0 var(--pen);cursor:pointer;margin:6px 4px 0;} #ps .ps-btn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--pen);} #ps .ps-btn.primary{background:var(--hi);} #ps .ps-btn.red{background:var(--red);color:#fff;} #ps .ps-btn:disabled{opacity:.5;cursor:default;}
#ps table{border-collapse:collapse;margin:6px auto;font-size:16px;} #ps td,#ps th{padding:2px 9px;border-bottom:1px solid rgba(35,33,43,.2);text-align:left;white-space:nowrap;} #ps th{font-weight:400;color:#5a5566;font-size:14px;} #ps tr.me td{background:rgba(255,210,63,.45);} #ps td.r,#ps th.r{text-align:right;}
#ps #ps-death{top:62%;} #ps #ps-death .n{font-size:44px;line-height:1;}
#ps .touch{position:absolute;inset:0;pointer-events:none;display:none;font-size:14px;} #ps.has-touch .touch{display:block;} #ps.btn-s .touch{font-size:12px;} #ps.btn-l .touch{font-size:16px;}
#ps #ps-stick{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2.5px solid rgba(243,236,220,.55);background:rgba(13,12,17,.25);display:none;} #ps #ps-stick.on{display:block;} #ps #ps-stick i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:var(--paper);border:2.5px solid var(--pen);box-shadow:2px 2px 0 var(--pen);}
#ps .tb{position:absolute;pointer-events:auto;display:flex;align-items:center;justify-content:center;font-family:'CF Sketch','Patrick Hand',cursive;font-size:1.4em;line-height:1;color:var(--pen);background:var(--paper);border:2.5px solid var(--pen);border-radius:255px 15px 225px 15px / 15px 225px 15px 255px;box-shadow:3px 3px 0 var(--pen);touch-action:none;opacity:.92;width:var(--s,4em);height:var(--s,4em);}
#ps .tb.down,#ps .tb.on{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--pen);background:var(--hi);}
#ps .tb.fire{background:var(--red);color:#fff;--s:6em;right:1.4em;bottom:1.4em;font-size:1.5em;} #ps .tb.fire.down{background:#a00400;}
#ps .tb.jump{--s:4.3em;right:8em;bottom:1.2em;} #ps .tb.reload{--s:4em;right:8.4em;bottom:6.4em;} #ps .tb.reload.dim{opacity:.5;} #ps .tb.ads{--s:4em;right:2.2em;bottom:8.6em;} #ps .tb.swap{--s:3.7em;right:13.2em;bottom:4em;} #ps .tb.crouch{--s:3.7em;left:1.2em;top:8em;}
#ps .tb.score{width:4.6em;height:2.7em;left:1em;top:4.4em;font-size:1.15em;} #ps .tb.menu{width:4.3em;height:2.7em;right:1em;top:4.4em;font-size:1.15em;}
#ps.has-touch #ps-am{right:50%;transform:translateX(50%);text-align:center;bottom:8px;} #ps.has-touch #ps-am .rl{margin:4px auto 0;} #ps.has-touch #ps-hp{bottom:8px;} #ps.has-touch #ps-feed{max-width:44%;}
`;

/* ── materials: cel-shaded (Overwork's 3-step ramp) for the arena, clay for the figures, flat for the sand. lazy, so importing
   the module in Node (the harness lints it there) touches neither the GPU nor the DOM ── */
let MAT = null;
function mats() {
  if (MAT) return MAT;
  const ramp = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 150, 150, 150, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
  const toon = (hex, extra) => new THREE.MeshToonMaterial(Object.assign({ color: hexNum(hex), gradientMap: ramp }, extra || {}));
  const bc = document.createElement('canvas'); bc.width = bc.height = 128; const bg = bc.getContext('2d'), img = bg.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) { const v = 118 + Math.random() * 20 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  bg.putImageData(img, 0, 0); const clayBump = new THREE.CanvasTexture(bc); clayBump.wrapS = clayBump.wrapT = THREE.RepeatWrapping; clayBump.repeat.set(3, 3);
  const clay = hex => new THREE.MeshStandardMaterial({ color: hexNum(hex), emissive: hexNum(hex), emissiveIntensity: 0.14, roughness: 0.93, metalness: 0, bumpMap: clayBump, bumpScale: 0.01 });
  const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x14121a, side: THREE.BackSide });
  const cache = {};
  const world = (name, metal) => { const key = name + (metal ? '!m' : ''); if (!cache[key]) { const hex = MATS[name] || '#8a7a5a'; cache[key] = toon(metal ? shade(hex, 0.8) : hex); } return cache[key]; };
  const blobC = document.createElement('canvas'); blobC.width = blobC.height = 64; const g2 = blobC.getContext('2d'), grad = g2.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(20,16,10,.7)'); grad.addColorStop(1, 'rgba(20,16,10,0)'); g2.fillStyle = grad; g2.fillRect(0, 0, 64, 64);
  MAT = { ramp, toon, clay, OUTLINE, world, cache, clayBump,
    skin: clay('#f6c9a6'), jeans: clay('#3a4a6a'), sneaker: clay('#e8e8ea'), botGun: toon('#2a2a30'), casing: toon('#c9a54a'), crumb: toon('#c8b48a'), lid: toon(MATS.ammo || '#556b2f'),
    blob: new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(blobC), transparent: true, depthWrite: false }) };
  return MAT;
}
function disposeMats() {
  if (!MAT) return;
  for (const k of Object.keys(MAT.cache)) MAT.cache[k].dispose();
  for (const m of [MAT.skin, MAT.jeans, MAT.sneaker, MAT.botGun, MAT.casing, MAT.crumb, MAT.lid, MAT.blob, MAT.OUTLINE]) { if (m.map) m.map.dispose(); m.dispose(); }
  MAT.ramp.dispose(); MAT.clayBump.dispose(); MAT = null;
  for (const k of Object.keys(SKIN_TEX)) { SKIN_TEX[k].dispose(); delete SKIN_TEX[k]; }
}

/* ── skins are paint. one canvas per skin, patterned by name; the gun parts flagged skin:true wear it ── */
const SKIN_TEX = {};
function skinTexture(skin) {
  const key = skin.id; if (SKIN_TEX[key]) return SKIN_TEX[key];
  const look = skin.look || {}, base = look.base || '#3a3d45', acc = look.accent || '#8b8f9c', pat = look.pattern || 'plain';
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'), R = xorshift(hashStr(key + base + acc + pat)), W = 256, H = 128;
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  const lighter = shade(base, 1.25), darker = shade(base, 0.7);
  if (pat === 'camo') { for (let i = 0; i < 46; i++) { g.fillStyle = [acc, darker, lighter][i % 3]; g.beginPath(); g.ellipse(R() * W, R() * H, 12 + R() * 26, 8 + R() * 16, R() * Math.PI, 0, TAU); g.fill(); } }
  else if (pat === 'stripes') { g.fillStyle = acc; for (let x = -H; x < W + H; x += 30) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 14 - H * 0.6, H); g.lineTo(x - H * 0.6, H); g.closePath(); g.fill(); } }
  else if (pat === 'hex') { g.strokeStyle = acc; g.lineWidth = 2; const s = 14; for (let row = 0; row < 8; row++) for (let col = 0; col < 14; col++) { const cx = col * s * 1.5 + (row % 2 ? s * 0.75 : 0), cy = row * s * 0.87 * 1.5 + s; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + Math.PI / 6; g.lineTo(cx + Math.cos(a) * s * 0.6, cy + Math.sin(a) * s * 0.6); } g.closePath(); g.stroke(); } }
  else if (pat === 'marble') { g.strokeStyle = acc; g.lineWidth = 1.5; for (let i = 0; i < 12; i++) { g.beginPath(); let x = R() * W, y = R() * H; g.moveTo(x, y); for (let k = 0; k < 5; k++) { const nx = x + (R() - 0.5) * 90, ny = y + (R() - 0.5) * 60; g.quadraticCurveTo(x + (R() - 0.5) * 40, y + (R() - 0.5) * 40, nx, ny); x = nx; y = ny; } g.globalAlpha = 0.4 + R() * 0.6; g.stroke(); } g.globalAlpha = 1; }
  else if (pat === 'wood') { for (let y = 0; y < H; y += 5) { g.strokeStyle = R() < 0.5 ? darker : acc; g.lineWidth = 1 + R() * 2; g.globalAlpha = 0.35; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 32) g.lineTo(x, y + Math.sin(x * 0.05 + y) * 3 + (R() - 0.5) * 3); g.stroke(); } g.globalAlpha = 1; }
  else if (pat === 'carbon') { for (let y = 0; y < H; y += 8) for (let x = 0; x < W; x += 8) { const odd = ((x / 8 + y / 8) | 0) % 2; g.fillStyle = odd ? darker : shade(base, 1.1); g.fillRect(x, y, 8, 8); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + (odd ? 0 : 4), y, 4, 8); } }
  else if (pat === 'chrome' || pat === 'gold') { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(acc, 1.35)); gr.addColorStop(0.45, base); gr.addColorStop(0.5, shade(base, 0.55)); gr.addColorStop(0.55, base); gr.addColorStop(1, shade(acc, 1.15)); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 14, W, 6); }
  else if (pat === 'static') { const img = g.getImageData(0, 0, W, H); for (let i = 0; i < img.data.length; i += 4) { const v = R() * 255 | 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; } g.putImageData(img, 0, 0); g.fillStyle = base; g.globalAlpha = 0.45; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
  else if (pat === 'scales') { g.strokeStyle = acc; g.lineWidth = 2; for (let row = 0; row < 12; row++) for (let col = -1; col < 14; col++) { const cx = col * 20 + (row % 2 ? 10 : 0), cy = row * 12; g.beginPath(); g.arc(cx, cy, 11, 0, Math.PI); g.stroke(); } }
  else if (pat === 'damascus') { for (let y = -10; y < H + 10; y += 6) { g.strokeStyle = (y / 6 | 0) % 2 ? acc : lighter; g.lineWidth = 2.5; g.globalAlpha = 0.7; g.beginPath(); for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.07 + y * 0.3) * 6 + Math.sin(x * 0.021) * 8); g.stroke(); } g.globalAlpha = 1; }
  else { g.fillStyle = 'rgba(255,255,255,.07)'; for (let i = 0; i < 200; i++) g.fillRect(R() * W, R() * H, 2, 2); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 10; g.strokeRect(-2, -2, W + 4, H + 4);                             // worn edges
  g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, W, 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; return SKIN_TEX[key] = t;
}
/* a css background for the launcher cards: the same look, flattened to a gradient */
function skinCss(skin) { const l = skin.look || {}; return `linear-gradient(100deg, ${l.base || '#3a3d45'} 0 45%, ${l.accent || '#8b8f9c'} 46% 55%, ${l.base || '#3a3d45'} 56%)`; }

/* ── geometry helpers ── */
const G = {
  cube: (w, h, d) => new THREE.BoxGeometry(w, h, d), cyl: (rt, rb, h, n = 10) => new THREE.CylinderGeometry(rt, rb, h, n),
  sph: (r, a = 10, b = 8) => new THREE.SphereGeometry(r, a, b), torus: (r, t, a = 6, b = 14) => new THREE.TorusGeometry(r, t, a, b), cone: (r, h, n = 8) => new THREE.ConeGeometry(r, h, n),
};
function placed(g, x = 0, y = 0, z = 0, rot) { if (rot) { if (rot[0]) g.rotateX(rot[0]); if (rot[1]) g.rotateY(rot[1]); if (rot[2]) g.rotateZ(rot[2]); } g.translate(x, y, z); return g; }
function mergeAll(list) { list = list.filter(Boolean); if (!list.length) return null; const m = mergeGeometries(list, false); for (const g of list) g.dispose(); return m; }
/* an ink hull for a merged geometry: vertices pushed along a smooth normal by a fixed thickness (Overwork's inkHull) */
function inkHull(geo, t) { const h = mergeVertices(geo.clone()); h.computeVertexNormals(); const P = h.attributes.position, N = h.attributes.normal; for (let i = 0; i < P.count; i++) P.setXYZ(i, P.getX(i) + N.getX(i) * t, P.getY(i) + N.getY(i) * t, P.getZ(i) + N.getZ(i) * t); return h; }
/* a primitive from a data row (WEAPONS[].model and DECO share the vocabulary) */
function primGeo(p) {
  let g;
  if (p.kind === 'cyl') g = G.cyl(p.r || 0.02, p.r2 != null ? p.r2 : (p.r || 0.02), p.l != null ? p.l : (p.h || 0.1), p.n || 10);   // stands along y; the row's rot lays it down
  else if (p.kind === 'sphere') g = G.sph(p.r || 0.05, p.n || 10, 8);
  else if (p.kind === 'torus') g = G.torus(p.r || 0.05, p.r2 != null ? p.r2 : p.l != null ? p.l : (p.r || 0.05) * 0.2, 6, p.n || 14);   // r = ring radius, r2 (or l) = tube
  else if (p.kind === 'cone') g = G.cone(p.r || 0.1, p.h || 0.2, p.n || 8);
  else g = G.cube(p.w || 0.05, p.h || 0.05, p.d || 0.05);
  return placed(g, p.x || 0, p.y || 0, p.z || 0, p.rot);
}

/* ── guns: primitives from WEAPONS[id].model, merged by material. moving parts (slide, mag, bolt) stay their own meshes so
   the reload and the recoil can spring them. `low` builds the one-mesh copy the bots carry ── */
const METAL_PARTS = { slide: 1, bolt: 1, scope: 1, barrel: 1, sight: 1, guard: 1 };
function buildGun(id, skin, low) {
  const M = mats(), W = WEAPONS[id] || { model: [] }, look = (skin && skin.look) || {}, group = new THREE.Group(), out = { group, slide: null, mag: null, bolt: null, mats: [], geos: [] };
  if (low) { const geo = mergeAll((W.model || []).map(primGeo)); if (geo) { group.add(new THREE.Mesh(geo, M.botGun)); out.geos.push(geo); } return out; }
  const skinMat = new THREE.MeshToonMaterial({ map: skinTexture(skin || stockSkin(id)), gradientMap: M.ramp, emissive: look.emissive ? hexNum(look.emissive) : 0, emissiveIntensity: look.emissive ? 0.35 : 0 });
  const metal = M.toon(look.metal || '#4a4d55'), wood = M.toon(look.base && (look.pattern === 'wood') ? look.base : '#a9773f'), grip = M.toon('#26262c'), blade = M.toon(look.metal || '#c8ccd6');
  out.mats.push(skinMat, metal, wood, grip, blade);
  const matFor = p => p.skin ? skinMat : p.part === 'wood' ? wood : (p.part === 'grip' || p.part === 'handle' || p.part === 'stock') ? grip : p.part === 'blade' ? blade : metal;
  const buckets = new Map();                                                                                      // material → geometries, per moving group
  for (const p of W.model || []) {
    const key = (['slide', 'mag', 'bolt'].includes(p.part) ? p.part : 'body') + '|', m = matFor(p), k = key + out.mats.indexOf(m);
    if (!buckets.has(k)) buckets.set(k, { part: key.slice(0, -1), m, list: [] });
    buckets.get(k).list.push(primGeo(p));
  }
  for (const b of buckets.values()) {
    const geo = mergeAll(b.list); if (!geo) continue; out.geos.push(geo);
    const mesh = new THREE.Mesh(geo, b.m); group.add(mesh);
    if (b.part !== 'body') out[b.part] = mesh;
  }
  return out;
}
function disposeGun(gun) { if (!gun) return; for (const g of gun.geos) g.dispose(); for (const m of gun.mats) m.dispose(); if (gun.group.parent) gun.group.parent.remove(gun.group); }

/* ── canvases for the world: the sand, the label atlas, the sky ── */
function groundTexture() {
  const c = document.createElement('canvas'), tw = GROUND.texW || 1024, th = GROUND.texH || 768, gw = GROUND.w || 44, gd = GROUND.d || 32; c.width = tw; c.height = th;
  const g = c.getContext('2d'), R = xorshift(7), px = x => (x + gw / 2) / gw * tw, pz = z => (z + gd / 2) / gd * th, sx = m => m / gw * tw, sz = m => m / gd * th;
  g.fillStyle = MATS.sand || '#d9c69b'; g.fillRect(0, 0, tw, th);
  for (let i = 0; i < 4000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(90,70,40,.12)' : 'rgba(255,255,255,.12)'; g.fillRect(R() * tw, R() * th, 2, 2); }
  for (const p of GROUND.paint || []) {
    const col = p.color || '#8a7a5a'; g.fillStyle = col; g.strokeStyle = col; g.globalAlpha = p.alpha != null ? p.alpha : 1;
    const x = p.x != null ? p.x : p.cx || 0, z = p.z != null ? p.z : p.cz || 0;
    if (p.kind === 'line') { g.lineWidth = sx(p.width || 0.2); g.beginPath(); g.moveTo(px(p.x1 != null ? p.x1 : x), pz(p.z1 != null ? p.z1 : z)); g.lineTo(px(p.x2 != null ? p.x2 : x), pz(p.z2 != null ? p.z2 : z)); g.stroke(); }
    else if (p.kind === 'circle') { g.beginPath(); g.arc(px(x), pz(z), sx(p.r || 1), 0, TAU); if (p.ring) { g.lineWidth = sx(p.ring); g.stroke(); } else g.fill(); }
    else if (p.kind === 'stain') { const gr = g.createRadialGradient(px(x), pz(z), 0, px(x), pz(z), sx(p.r || 1)); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.globalAlpha = p.alpha != null ? p.alpha : 0.5; g.beginPath(); g.arc(px(x), pz(z), sx(p.r || 1), 0, TAU); g.fill(); }
    else { const w = p.w || 1, d = p.d || 1; g.save(); g.translate(px(x), pz(z)); if (p.rot) g.rotate(p.rot); g.fillRect(-sx(w) / 2, -sz(d) / 2, sx(w), sz(d));
      if (p.kind === 'rug') { g.strokeStyle = p.color2 || '#f2e6cc'; g.lineWidth = 3; g.strokeRect(-sx(w) / 2 + 6, -sz(d) / 2 + 6, sx(w) - 12, sz(d) - 12); g.fillStyle = p.color2 || '#f2e6cc'; for (let i = 0; i < 6; i++) g.fillRect(-sx(w) / 2 + 14 + i * (sx(w) - 28) / 5, 0, 4, 4); } g.restore(); }
    g.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
/* every painted word on a wall comes from one atlas: 4 × 16 cells of 256 × 64 */
function buildAtlas(items) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024; const g = c.getContext('2d'), n = Math.min(items.length, 64);
  for (let i = 0; i < n; i++) {
    const it = items[i], cx = (i % 4) * 256, cy = Math.floor(i / 4) * 64, font = it.font === 'hand' ? 'Patrick Hand' : 'CF Sketch';
    if (it.bg && it.bg !== 'none') { g.fillStyle = it.bg; g.fillRect(cx + 2, cy + 2, 252, 60); }
    let px = 44; g.font = `${px}px "${font}", "Patrick Hand", cursive`; while (px > 10 && g.measureText(it.text).width > 236) { px -= 2; g.font = `${px}px "${font}", "Patrick Hand", cursive`; }
    g.fillStyle = it.ink || '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(it.text, cx + 128, cy + 34);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return { tex: t, rect: i => [(i % 4) * 0.25, 1 - Math.floor(i / 4 + 1) * 0.0625, (i % 4) * 0.25 + 0.25, 1 - Math.floor(i / 4) * 0.0625] };
}
/* a quad on a wall face, uvs pointed at one atlas cell. face = the side the reader stands on */
function labelQuad(w, h, face, x, y, z, uv) {
  const g = new THREE.PlaneGeometry(w, h), U = g.attributes.uv;
  for (let i = 0; i < U.count; i++) U.setXY(i, lerp(uv[0], uv[2], U.getX(i)), lerp(uv[1], uv[3], U.getY(i)));
  const ry = face === '-z' ? Math.PI : face === '-x' ? -Math.PI / 2 : face === '+x' ? Math.PI / 2 : 0;
  const off = 0.012, ox = face === '-x' ? -off : face === '+x' ? off : 0, oz = face === '-z' ? -off : face === '+z' ? off : 0;
  return placed(g, x + ox, y, z + oz, [0, ry, 0]);
}
function skyDome() {
  const geo = new THREE.SphereGeometry(120, 16, 8), P = geo.attributes.position, col = new Float32Array(P.count * 3), lo = new THREE.Color(hexNum(MATS.skyLo || '#e8d6b0')), hi = new THREE.Color(hexNum(MATS.skyHi || '#7fb8e8')), c = new THREE.Color();
  for (let i = 0; i < P.count; i++) { c.copy(lo).lerp(hi, Math.pow(clamp(P.getY(i) / 120, 0, 1), 0.55)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
}

/* ── the world as numbers: a static AABB list, a cylinder solver with a step-up, rays. the same code moves the player and every bot ── */
function floorAt(cols, x, z, yRef, r) { let best = 0; for (const c of cols) if (x + r > c.min.x && x - r < c.max.x && z + r > c.min.z && z - r < c.max.z && c.max.y <= yRef + 0.01 && c.max.y > best) best = c.max.y; return best; }
function pushOut(b, nx, nz, depth) { b.pos.x += nx * depth; b.pos.z += nz * depth; const vn = b.vel.x * nx + b.vel.z * nz; if (vn < 0) { b.vel.x -= vn * nx; b.vel.z -= vn * nz; } }
function moveBody(cols, b, dt) {
  const r = b.radius, h = b.height, canStep = b.onGround || b.coyote > 0;
  b.pos.x += b.vel.x * dt; b.pos.z += b.vel.z * dt; b.wallHit = false;
  const feet = b.pos.y, head = feet + h;
  for (const c of cols) {
    if (head <= c.min.y || feet >= c.max.y - 0.01) continue;
    if (canStep && c.max.y - feet <= STEP_UP) continue;                                                         // low enough to step onto: the floor lifts us below
    const cx = clamp(b.pos.x, c.min.x, c.max.x), cz = clamp(b.pos.z, c.min.z, c.max.z), dx = b.pos.x - cx, dz = b.pos.z - cz, d = Math.hypot(dx, dz);
    if (d < r) { if (d > 1e-4) pushOut(b, dx / d, dz / d, r - d); else { const nx = b.pos.x < (c.min.x + c.max.x) / 2 ? -1 : 1; b.pos.x = nx < 0 ? c.min.x - r : c.max.x + r; pushOut(b, nx, 0, 0); } b.wallHit = true; }
  }
  b.pos.x = clamp(b.pos.x, BOUNDS.minX + r, BOUNDS.maxX - r); b.pos.z = clamp(b.pos.z, BOUNDS.minZ + r, BOUNDS.maxZ - r);
  const y0 = b.pos.y, vy0 = b.vel.y; b.pos.y += b.vel.y * dt;
  if (b.vel.y > 0) { const hn = b.pos.y + h; for (const c of cols) if (c.min.y >= y0 + h - 0.02 && c.min.y < hn && b.pos.x + r * 0.8 > c.min.x && b.pos.x - r * 0.8 < c.max.x && b.pos.z + r * 0.8 > c.min.z && b.pos.z - r * 0.8 < c.max.z) { b.pos.y = c.min.y - h; b.vel.y = 0; break; } }
  const fl = floorAt(cols, b.pos.x, b.pos.z, canStep ? y0 + STEP_UP : y0, r * 0.85);
  if (b.pos.y <= fl) { if (!b.onGround && b.onLand) b.onLand(-vy0); b.pos.y = fl; b.vel.y = 0; b.onGround = true; b.coyote = COYOTE; }
  else { if (b.onGround && b.pos.y > fl + 0.02) b.onGround = false; if (!b.onGround) b.coyote -= dt; }
  if (b.vel.y < -30) b.vel.y = -30;
}
function rayAABB(o, d, c, maxT) {
  let t0 = 0, t1 = maxT;
  for (const a of ['x', 'y', 'z']) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < c.min[a] || o[a] > c.max[a]) return -1; continue; }
    const inv = 1 / d[a]; let ta = (c.min[a] - o[a]) * inv, tb = (c.max[a] - o[a]) * inv; if (ta > tb) { const t = ta; ta = tb; tb = t; }
    if (ta > t0) t0 = ta; if (tb < t1) t1 = tb; if (t0 > t1) return -1;
  }
  return t0;
}
function rayWorld(cols, o, d, maxT) { let best = maxT, hit = null; for (const c of cols) { const t = rayAABB(o, d, c, best); if (t >= 0 && t < best) { best = t; hit = c; } } return hit ? { t: best, c: hit } : null; }
const _o = new THREE.Vector3(), _d = new THREE.Vector3(), _sa = new THREE.Vector3(), _sb = new THREE.Vector3();
function segmentClear(cols, a, b) { _d.copy(b).sub(a); const len = _d.length(); if (len < 1e-6) return true; _d.multiplyScalar(1 / len); return !rayWorld(cols, a, _d, len); }
/* hit shapes: a head sphere then a body cylinder; the head wins when both are hit */
function raySphere(o, d, cx, cy, cz, r, maxT) { const ox = o.x - cx, oy = o.y - cy, oz = o.z - cz, b = ox * d.x + oy * d.y + oz * d.z, c = ox * ox + oy * oy + oz * oz - r * r, disc = b * b - c; if (disc < 0) return -1; let t = -b - Math.sqrt(disc); if (t < 0) t = -b + Math.sqrt(disc); return t >= 0 && t <= maxT ? t : -1; }
function rayCyl(o, d, cx, cz, y0, y1, r, maxT) {
  const dx = o.x - cx, dz = o.z - cz, a = d.x * d.x + d.z * d.z, bq = 2 * (dx * d.x + dz * d.z), cq = dx * dx + dz * dz - r * r; let best = -1;
  if (a > 1e-9) { const disc = bq * bq - 4 * a * cq; if (disc >= 0) { const s = Math.sqrt(disc); for (const t of [(-bq - s) / (2 * a), (-bq + s) / (2 * a)]) { if (t < 0 || t > maxT) continue; const y = o.y + d.y * t; if (y >= y0 && y <= y1) { best = t; break; } } } }
  if (Math.abs(d.y) > 1e-9) for (const yc of [y1, y0]) { const t = (yc - o.y) / d.y; if (t < 0 || t > maxT || (best >= 0 && t > best)) continue; const x = o.x + d.x * t - cx, z = o.z + d.z * t - cz; if (x * x + z * z <= r * r) best = t; }
  return best;
}
function rayBody(o, d, b, maxT) {
  const hy = b.pos.y + (b.crouch ? 1.0 : 1.55), th = raySphere(o, d, b.pos.x, hy, b.pos.z, 0.22, maxT);
  if (th >= 0) return { t: th, head: true };
  const tb = rayCyl(o, d, b.pos.x, b.pos.z, b.pos.y, b.pos.y + (b.crouch ? 1.2 : 1.75), 0.4, maxT);
  return tb >= 0 ? { t: tb, head: false } : null;
}
/* a direction inside a cone: spread in degrees, rng in [0,1) */
function coneDir(dir, spreadDeg, rng) {
  if (spreadDeg <= 0) return dir.clone();
  const ang = Math.sqrt(rng()) * spreadDeg * DEG, rot = rng() * TAU, up = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const s = new THREE.Vector3().crossVectors(dir, up).normalize(), u = new THREE.Vector3().crossVectors(s, dir).normalize();
  return dir.clone().multiplyScalar(Math.cos(ang)).addScaledVector(s, Math.sin(ang) * Math.cos(rot)).addScaledVector(u, Math.sin(ang) * Math.sin(rot)).normalize();
}
const yawPitchDir = (yaw, pitch) => new THREE.Vector3(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));

/* ── the waypoint graph: NODES auto-linked by distance, height and three clear rays, plus the hand-listed ramp/jump/drop edges.
   Dijkstra on edge lengths; a node-to-node visibility table so bots pick strafe and cover nodes without live raycasts ── */
function buildNav(cols) {
  const nodes = NODES.map((n, i) => ({ id: n.id, i, x: n.x, y: n.y || 0, z: n.z, adj: [], hot: 0 })), byId = {}; nodes.forEach(n => { byId[n.id] = n; });
  const link = (a, b, kind, force) => { const e = a.adj.find(e => e.to === b.i); if (e) { if (force) e.kind = kind; return; } a.adj.push({ to: b.i, len: Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), kind }); };
  const A = new THREE.Vector3(), B = new THREE.Vector3(), heights = AUTOLINK.rayHeights || [0.3, 1.0, 1.5], lat = AUTOLINK.lateral || 0.35;
  /* a → b is linked only if a body can walk it: the bodies' own solver drives a virtual walker (r 0.4, 6 m/s) from a towards b for the
     time the walk should take plus a little. The rays above pass over a stair edge or a hop crate that the feet cannot climb, and a
     drop is fine forwards only — so this runs per direction, and what gets linked is walkable by construction */
  const walker = { pos: new THREE.Vector3(), vel: new THREE.Vector3(), radius: 0.4, height: 1.75, onGround: true, coyote: 0, wallHit: false };
  function walkAB(a, b) {
    const w = walker; w.pos.set(a.x, a.y, a.z); w.vel.set(0, 0, 0); w.onGround = true; w.coyote = 0;
    const len = Math.hypot(a.x - b.x, a.z - b.z), steps = Math.ceil((len / 6 + 0.6) / STEP);
    for (let i = 0; i < steps; i++) {
      const dx = b.x - w.pos.x, dz = b.z - w.pos.z, d = Math.hypot(dx, dz);
      if (d < 0.45 && Math.abs(w.pos.y - b.y) < 0.8) return true;
      w.vel.x = dx / d * 6; w.vel.z = dz / d * 6; w.vel.y -= 20 * STEP; moveBody(cols, w, STEP);
    }
    return false;
  }
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (d > (AUTOLINK.maxDist || 7.5) || Math.abs(a.y - b.y) > (AUTOLINK.maxDy || 0.7)) continue;
    const sx = -(b.z - a.z) / d * lat, sz = (b.x - a.x) / d * lat; let clear = true;
    for (let k = 0; k < heights.length && clear; k++) {
      const h = heights[k], offs = k === 1 ? [0, 1, -1] : [0];
      for (const o of offs) { A.set(a.x + sx * o, a.y + h, a.z + sz * o); B.set(b.x + sx * o, b.y + h, b.z + sz * o); if (!segmentClear(cols, A, B)) { clear = false; break; } }
    }
    if (!clear) continue;
    if (walkAB(a, b)) link(a, b, 'walk'); if (walkAB(b, a)) link(b, a, 'walk');
  }
  for (const e of EDGE_HINTS) { const a = byId[e.a], b = byId[e.b]; if (!a || !b) continue; link(a, b, e.kind || 'walk', true); if (e.both) link(b, a, e.kind || 'walk', true); }   // a hint's kind wins over an autolinked walk
  const n = nodes.length, vis = new Uint8Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) { A.set(nodes[i].x, nodes[i].y + 1.5, nodes[i].z); B.set(nodes[j].x, nodes[j].y + 1.5, nodes[j].z); const v = segmentClear(cols, A, B) ? 1 : 0; vis[i * n + j] = v; vis[j * n + i] = v; }
  function nearest(p, maxDy = 1.6) { let best = null, bd = 1e9; for (const q of nodes) { const dy = Math.abs(q.y - p.y); if (dy > maxDy) continue; const d = Math.hypot(q.x - p.x, q.z - p.z) + dy * 2; if (d < bd) { bd = d; best = q; } } return best || nodes[0]; }
  function path(from, to) {                                                                                     // Dijkstra, tiny graph, plain arrays
    const dist = new Float64Array(n).fill(1e9), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n); dist[from] = 0;
    for (let it = 0; it < n; it++) {
      let u = -1, bd = 1e9; for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
      if (u < 0 || u === to) break; done[u] = 1;
      for (const e of nodes[u].adj) { const nd = dist[u] + e.len; if (nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = u; } }
    }
    if (dist[to] >= 1e9) return null;
    const out = []; for (let c = to; c >= 0; c = prev[c]) out.unshift(c); return out;
  }
  const edge = (a, b) => nodes[a].adj.find(e => e.to === b) || null;
  return { nodes, n, vis: (i, j) => vis[i * n + j] === 1, nearest, path, edge, decay(dt) { const f = Math.pow(0.5, dt); for (const q of nodes) q.hot *= f; } };
}

/* ── pooled particles: brass casings and clay crumbs as one InstancedMesh each, gravity and one bounce ── */
class Pool {
  constructor(geo, mat, n, grav) {
    this.mesh = new THREE.InstancedMesh(geo, mat, n); this.mesh.frustumCulled = false; this.n = n; this.grav = grav; this.next = 0; this.o = new THREE.Object3D();
    this.p = []; for (let i = 0; i < n; i++) this.p.push({ x: 0, y: -9, z: 0, vx: 0, vy: 0, vz: 0, life: 0, floor: 0, s: 1, spin: 0 });
    this.o.scale.setScalar(0); for (let i = 0; i < n; i++) { this.o.updateMatrix(); this.mesh.setMatrixAt(i, this.o.matrix); }
  }
  spawn(x, y, z, vx, vy, vz, life, floor, s = 1) { const q = this.p[this.next++ % this.n]; q.x = x; q.y = y; q.z = z; q.vx = vx; q.vy = vy; q.vz = vz; q.life = life; q.floor = floor; q.s = s; q.spin = Math.random() * TAU; }
  step(dt) {
    let any = false;
    for (let i = 0; i < this.n; i++) {
      const q = this.p[i]; if (q.life <= 0) continue; any = true; q.life -= dt;
      q.vy -= this.grav * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.spin += dt * 9;
      if (q.y < q.floor + 0.02) { q.y = q.floor + 0.02; if (q.vy < -0.5) { q.vy = -q.vy * 0.3; q.vx *= 0.5; q.vz *= 0.5; } else { q.vy = 0; q.vx = q.vz = 0; } }
      this.o.position.set(q.x, q.y, q.z); this.o.rotation.set(q.spin, q.spin * 0.7, 0); this.o.scale.setScalar(q.life > 0.25 ? q.s : q.s * q.life * 4); this.o.updateMatrix(); this.mesh.setMatrixAt(i, this.o.matrix);
      if (q.life <= 0) { this.o.scale.setScalar(0); this.o.updateMatrix(); this.mesh.setMatrixAt(i, this.o.matrix); }
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
  dispose() { this.mesh.geometry.dispose(); if (this.mesh.parent) this.mesh.parent.remove(this.mesh); this.mesh.dispose(); }
}

/* ── the arena: MAP rows are geometry and colliders at once, merged by material; DECO merged by material; one ink hull; one
   atlas of painted words; the sand canvas; the sky; two ammo crates. ~20 draw calls before anyone moves ── */
function buildWorld(scene, opts) {
  const M = mats(), cols = [], geos = [], meshes = [], byMat = new Map(), hulls = [], labels = [];
  const push = (key, g) => { if (!byMat.has(key)) byMat.set(key, []); byMat.get(key).push(g); };
  for (const r of MAP) {
    const w = r.w || 1, h = r.h || 1, d = r.d || 1, y0 = r.y0 || 0;
    if (!r.hidden) push(r.mat + (r.metal ? '!m' : ''), placed(G.cube(w, h, d), r.x, y0 + h / 2, r.z));            // hidden: a collider whose look is drawn by DECO (the barrels)
    if (!r.deco) cols.push({ min: { x: r.x - w / 2, y: y0, z: r.z - d / 2 }, max: { x: r.x + w / 2, y: y0 + h, z: r.z + d / 2 }, metal: !!r.metal, step: !!r.step, id: r.id });
    if (opts.outlines && !r.hidden) { const g = G.cube(w, h, d); g.scale(1 + 0.06 / w, 1 + 0.06 / h, 1 + 0.06 / d); hulls.push(placed(g, r.x, y0 + h / 2, r.z)); }
    if (r.label) { const face = r.labelFace || '-z', along = (face === '-z' || face === '+z') ? w : d, lw = Math.min(along * 0.8, 6), lh = Math.min(lw / 4, h * 0.6);
      const x = face === '-x' ? r.x - w / 2 : face === '+x' ? r.x + w / 2 : r.x, z = face === '-z' ? r.z - d / 2 : face === '+z' ? r.z + d / 2 : r.z;
      labels.push({ text: r.label, font: 'sketch', ink: '#3a2a1a', bg: 'none', w: lw, h: lh, x, y: y0 + h * 0.62, z, face }); }
  }
  for (const p of DECO) push(p.mat, primGeo(p));                                                                  // `n` is the radial segment count (primGeo reads it), not a repeat
  for (const s of SIGNS) labels.push(Object.assign({ font: 'sketch', ink: '#3a2a1a', bg: 'none', w: 2, h: 0.6, face: '-z' }, s));
  for (const [key, list] of byMat) {
    const geo = mergeAll(list); if (!geo) continue; geos.push(geo);
    const name = key.replace('!m', ''), mesh = new THREE.Mesh(geo, M.world(name, key.endsWith('!m'))); scene.add(mesh); meshes.push(mesh);
  }
  if (hulls.length) { const geo = mergeAll(hulls); geos.push(geo); const hm = new THREE.Mesh(geo, M.OUTLINE); scene.add(hm); meshes.push(hm); }
  let atlas = null;
  if (labels.length) {
    atlas = buildAtlas(labels); const quads = labels.slice(0, 64).map((l, i) => labelQuad(l.w, l.h, l.face, l.x, l.y, l.z, atlas.rect(i)));
    const geo = mergeAll(quads); geos.push(geo); const lm = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: atlas.tex, transparent: true, depthWrite: false })); lm.renderOrder = 1; scene.add(lm); meshes.push(lm);
  }
  const groundGeo = new THREE.PlaneGeometry(GROUND.w || 44, GROUND.d || 32); groundGeo.rotateX(-Math.PI / 2); geos.push(groundGeo);
  const groundTex = groundTexture(), ground = new THREE.Mesh(groundGeo, new THREE.MeshLambertMaterial({ map: groundTex })); scene.add(ground); meshes.push(ground);
  const sky = skyDome(); scene.add(sky); meshes.push(sky); geos.push(sky.geometry);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.0); sun.position.set(30, 50, 20); scene.add(sun);
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a7a5a, 0.9); scene.add(hemi);
  // the two ammo crates: an olive metal chest with a lid on a spring
  const crates = CRATES.map(c => {
    const grp = new THREE.Group(); grp.position.set(c.x, c.y || 0, c.z);
    const baseGeo = G.cube(0.8, 0.44, 0.5), lidGeo = G.cube(0.82, 0.07, 0.52); geos.push(baseGeo, lidGeo);
    const base = new THREE.Mesh(baseGeo, M.world('ammo', true)); base.position.y = 0.22; grp.add(base);
    const lid = new THREE.Mesh(lidGeo, M.lid); lid.position.y = 0.475; grp.add(lid);
    if (opts.outlines) { const hb = new THREE.Mesh(baseGeo, M.OUTLINE); hb.scale.set(1 + 0.05 / 0.8, 1 + 0.05 / 0.44, 1 + 0.05 / 0.5); base.add(hb); const hl = new THREE.Mesh(lidGeo, M.OUTLINE); hl.scale.set(1.06, 1.6, 1.09); lid.add(hl); }
    scene.add(grp);
    return { x: c.x, y: c.y || 0, z: c.z, grp, lid, lidS: spring(90, 9), sink: spring(40, 7), gone: 0, floor: c.y || 0 };
  });
  // pools
  const casingGeo = G.cube(0.008, 0.008, 0.022), crumbGeo = G.sph(0.045, 5, 4); geos.push(casingGeo, crumbGeo);
  const casings = new Pool(casingGeo, M.casing, 64, 14), crumbs = new Pool(crumbGeo, M.crumb, 96, 18); scene.add(casings.mesh, crumbs.mesh);
  const nav = buildNav(cols);
  let debug = null;
  if (opts.debug) {                                                                                                // ?debug=colliders: wireframe AABBs and the graph
    const pts = [];
    for (const c of cols) { const e = [[0, 0, 0, 1, 0, 0], [1, 0, 0, 1, 0, 1], [1, 0, 1, 0, 0, 1], [0, 0, 1, 0, 0, 0], [0, 1, 0, 1, 1, 0], [1, 1, 0, 1, 1, 1], [1, 1, 1, 0, 1, 1], [0, 1, 1, 0, 1, 0], [0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0], [1, 0, 1, 1, 1, 1], [0, 0, 1, 0, 1, 1]];
      for (const s of e) pts.push(s[0] ? c.max.x : c.min.x, s[1] ? c.max.y : c.min.y, s[2] ? c.max.z : c.min.z, s[3] ? c.max.x : c.min.x, s[4] ? c.max.y : c.min.y, s[5] ? c.max.z : c.min.z); }
    const npts = []; for (const a of nav.nodes) for (const e of a.adj) { const b = nav.nodes[e.to]; npts.push(a.x, a.y + 0.3, a.z, b.x, b.y + 0.3, b.z); }
    const g1 = new THREE.BufferGeometry(); g1.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(npts, 3)); geos.push(g1, g2);
    debug = [new THREE.LineSegments(g1, new THREE.LineBasicMaterial({ color: 0x00ff88 })), new THREE.LineSegments(g2, new THREE.LineBasicMaterial({ color: 0xffd23f }))]; debug.forEach(m => scene.add(m));
  }
  return { cols, geos, meshes, crates, casings, crumbs, nav, sun, hemi, groundTex, atlas, debug,
    dispose() { for (const g of geos) g.dispose(); for (const m of meshes) { scene.remove(m); if (m.material && m.material !== M.OUTLINE && !M.cache[Object.keys(M.cache).find(k => M.cache[k] === m.material)]) { if (m.material.map) m.material.map.dispose(); m.material.dispose(); } }
      for (const c of crates) scene.remove(c.grp); casings.dispose(); crumbs.dispose(); if (atlas) atlas.tex.dispose(); groundTex.dispose(); if (debug) debug.forEach(m => { scene.remove(m); m.material.dispose(); }); } };
}

/* ── the figure the bots wear: shared geometries, clay per hoodie colour. cheap capsule limbs hinged at shoulder and hip ── */
let FIG = null;
function figGeo() {
  if (FIG) return FIG;
  const blob = new THREE.PlaneGeometry(1.1, 1.1); blob.rotateX(-Math.PI / 2);
  return FIG = { head: G.sph(0.22, 14, 10), torso: new THREE.CapsuleGeometry(0.30, 0.28, 4, 12), hood: G.torus(0.24, 0.08, 6, 16), leg: new THREE.CapsuleGeometry(0.11, 0.28, 3, 8), arm: new THREE.CapsuleGeometry(0.09, 0.27, 3, 8), shoe: G.cube(0.16, 0.12, 0.28), blob };
}
function disposeFig() { if (!FIG) return; for (const k of Object.keys(FIG)) FIG[k].dispose(); FIG = null; }
function nameTex(text, color = '#faf6ec') {
  const c = document.createElement('canvas'); c.width = 320; c.height = 80; const g = c.getContext('2d');
  let px = 44; g.font = `${px}px "Patrick Hand", cursive`; while (px > 14 && g.measureText(text).width > 300) { px -= 2; g.font = `${px}px "Patrick Hand", cursive`; }
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#14121a'; g.strokeText(text, 160, 42); g.fillStyle = color; g.fillText(text, 160, 42);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ═══════════════════════════════════════════════════════════════ */
export function createStriker(api) {
  const isTouch = !!api.isTouch, debugOn = !!api.debug;
  let styleEl = null, PS = null, win = null, launcher = null, M = null, tab = 'play', active = false;
  const drops = [];                                                                                             // the last five case drops, this session
  const ensureStyle = () => { if (!styleEl) { styleEl = document.createElement('style'); styleEl.textContent = CSS; document.head.appendChild(styleEl); } };

  /* ── sound: every playback is BufferSource → (lowpass) → gain → panner → api.audio.master(), through one bus so the dead time can
     duck it. per-key throttles keep seven bots from stacking; distance attenuates, muffles and pans ── */
  const THROTTLE = { ar_shot: 3, ak_shot: 3, glock_shot: 3, awp_shot: 2, hit: 2, headshot: 2, worldHit: 1, worldHitMetal: 1, step: 3, stepSprint: 3, stepCrouch: 2, stepStone: 3, crumb: 2, whiz: 1, reelTick: 3, empty: 2, hurt: 2 };
  const sound = { bus: null, times: {}, log: [], listener: null };
  function busNode() { const ctx = api.audio.ctx(), master = api.audio.master(); if (!sound.bus || sound.bus.context !== ctx) { sound.bus = ctx.createGain(); sound.bus.connect(master); } return sound.bus; }
  function psfx(key, o = {}) {
    const spec = SFX[key]; if (!spec || !active) return;
    const lim = THROTTLE[key] || (Array.isArray(spec) && spec[0] && spec[0].max ? Math.max(1, Math.ceil(spec[0].max / 10)) : 4);
    const now = performance.now(), tl = sound.times[key] || (sound.times[key] = []); while (tl.length && now - tl[0] > 100) tl.shift(); if (tl.length >= lim) return; tl.push(now);
    sound.log.push(key); if (sound.log.length > 300) sound.log.shift();
    let gm = o.gain == null ? 1 : o.gain, lpCap = 20000, pan = o.pan || 0;
    if (o.pos && sound.listener) {
      const l = sound.listener, dx = o.pos.x - l.pos.x, dz = o.pos.z - l.pos.z, d = Math.hypot(dx, o.pos.y - l.pos.y, dz); if (d > 45) return;
      gm *= clamp(1 - d / 45, 0, 1); lpCap = Math.max(400, 8000 - 160 * d); if (d > 0.5) pan = clamp((dx * Math.cos(l.yaw) - dz * Math.sin(l.yaw)) / d, -0.8, 0.8);
    }
    for (const ly of Array.isArray(spec) ? spec : [spec]) {
      if (ly.piano) { const cue = () => { if (!active) return; try { const p = api.audio.piano(); if (p) p.cue(ly.piano); } catch (e) {} }; if (ly.at) setTimeout(cue, ly.at * 1000); else cue(); continue; }
      if (!ly.f) continue;
      try {
        api.audio.buffer(ly.f).then(buf => {
          if (!buf || !active) return;
          const bus = busNode(), ctx = bus.context, at = ctx.currentTime + (ly.at || 0) + 0.004, src = ctx.createBufferSource(); src.buffer = buf;
          const rate = ly.rate ? rnd(ly.rate[0], ly.rate[1] != null ? ly.rate[1] : ly.rate[0]) : 1; src.playbackRate.value = rate * rnd(0.95, 1.05);
          let n = src; const lp = Math.min(ly.lp || 20000, lpCap); if (lp < 19000) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; n.connect(f); n = f; }
          const g = ctx.createGain(), vol = clamp((ly.gain != null ? ly.gain : 0.5) * gm, 0, 1.2), dur = ly.dur || (buf.duration - (ly.from || 0)) / src.playbackRate.value; n.connect(g);
          g.gain.setValueAtTime(vol, at); g.gain.setValueAtTime(vol, at + Math.max(0.01, dur - 0.03)); g.gain.linearRampToValueAtTime(0, at + dur);
          if (ctx.createStereoPanner) { const pn = ctx.createStereoPanner(); pn.pan.value = pan; g.connect(pn); pn.connect(bus); } else g.connect(bus);
          src.start(at, ly.from || 0); src.stop(at + dur + 0.02);
        }).catch(() => {});
      } catch (e) {}
    }
  }
  const duck = on => { try { const b = busNode(); b.gain.setTargetAtTime(on ? 0.3 : 1, b.context.currentTime, 0.05); } catch (e) {} };

  /* ── save.ps: validated on open, signed over the owned list + scrap, written through api.persist() ── */
  function loadPS() {
    const save = api.save(), res = validatePS(save.ps, api.salt), ps = res.ps || JSON.parse(JSON.stringify(PS_DEFAULT));
    ps.cfg = Object.assign({}, PS_DEFAULT.cfg, ps.cfg || {}); ps.stats = Object.assign({}, PS_DEFAULT.stats, ps.stats || {}); ps.stats.wk = Object.assign({ knife: 0, glock: 0, ar: 0, ak: 0, awp: 0 }, ps.stats.wk || {});
    ps.eq = Object.assign({ knife: null, glock: null, ar: null, ak: null, awp: null }, ps.eq || {}); if (!Array.isArray(ps.owned)) ps.owned = [];
    if (!PRIMARIES.includes(ps.loadout)) ps.loadout = 'ar'; if (!DIFF[ps.diff]) ps.diff = DIFF.normal ? 'normal' : Object.keys(DIFF)[0] || 'normal'; ps.bots = clamp(ps.bots | 0 || 5, 3, 7);
    save.ps = ps; PS = ps;
    if (res.tampered) { signPS(); api.toast(L('tampered', 'inventory signature mismatch. skins reset.'), 'bad'); }
    return ps;
  }
  function signPS() { if (!PS) return; PS.sig = psSig(PS.owned, PS.scrap | 0, api.salt); api.persist(); }
  const equipped = w => (PS && PS.eq && PS.eq[w] && skinById(PS.eq[w])) || stockSkin(w);
  const owns = id => /^stock_/.test(id) || (PS && PS.owned.includes(id));
  const diffK = () => Object.assign({ reaction: 0.4, e0: 3.5, T: 1.0, turn: 300, fireMul: 0.8, burstGap: 0.45, hear: 22, jumpChance: 0.2, headIntent: 0.2, ignore: 0.05, retreatHp: 35, weaponWeights: { ar: 0.45, ak: 0.3, awp: 0.25 } }, (M && DIFF[M.diff]) || {});

  /* ── weapons: one code path for the player and the bots. state per gun, data from WEAPONS ── */
  const wep = h => WEAPONS[h.cur] || {}, gunOf = h => h.guns[h.cur];
  function gunState(id) { const W = WEAPONS[id] || {}; return { id, mag: W.mag || 0, reserve: W.reserve || 0, cd: 0, spread: 0, shots: 0, drift: 1, reload: null, lock: false }; }
  function giveLoadout(h, primary) { h.guns = { knife: gunState('knife'), glock: gunState('glock') }; h.guns[primary] = gunState(primary); h.primary = primary; h.cur = primary; h.last = 'glock'; h.switching = null; h.scoped = false; h.melee = null; h.boltSfx = 0; }
  const eyeOf = h => new THREE.Vector3(h.pos.x, h.pos.y + (h.crouch ? 1.05 : 1.6), h.pos.z);
  const aimDirOf = h => yawPitchDir(h.yaw, h.pitch);
  function hitscan(o, d, shooter, maxT) {
    const w = rayWorld(M.cols, o, d, maxT); let best = w ? w.t : maxT, out = w ? { t: w.t, col: w.c, body: null } : null;
    for (const b of M.all) { if (b === shooter || b.dead) continue; const r = rayBody(o, d, b, best); if (r) { best = r.t; out = { t: r.t, body: b, head: r.head, col: null }; } }
    if (out) out.point = o.clone().addScaledVector(d, out.t);
    return out;
  }
  function tryFire(h, pressed) {
    const W = wep(h), s = gunOf(h); if (h.dead || h.switching || M.phase !== 'play') return false;
    if (W.melee) { if (pressed) meleeAttack(h, 'slash'); return false; }
    if (s.reload || s.cd > 0 || (!W.auto && !pressed)) return false;
    if (s.mag <= 0) { if (pressed) { psfx('empty', h.isPlayer ? {} : { pos: h.pos }); if (h.isPlayer) M.ammoMsg = L('emptyClick', 'reload'); } return false; }
    shoot(h); return true;
  }
  function shoot(h) {
    const W = wep(h), s = gunOf(h), R = W.recoil || {};
    s.mag--; s.shots++; s.cd = W.bolt ? W.bolt : 60 / (W.rpm || 600); if (W.bolt) h.boltSfx = 0.25;
    if (h.isPlayer) { PS.stats.shots++; M.mShots++; if (h.prot > 0) h.prot = 0; }
    if (h.sprint) { h.sprint = false; h.sprintBlock = 0.12; }
    const sp = h.scoped && W.scope ? (W.scope.spread || 0.05) : (W.spread ? W.spread.base : 0.5) + s.spread;
    if (W.spread) s.spread = Math.min(Math.max(0, W.spread.max - W.spread.base), s.spread + (W.spread.perShot || 0));
    const eye = eyeOf(h), dir = coneDir(aimDirOf(h), sp, M.rng), hit = hitscan(eye, dir, h, 120);
    if (hit && hit.body) { let dmg = W.dmg || 30; if (hit.head) dmg *= W.headMul || 2; if (W.falloff && hit.t > W.falloff.from) dmg *= W.falloff.mul; applyDamage(hit.body, dmg, h, { head: hit.head, weapon: h.cur }); }
    else if (hit) worldImpact(hit.point, hit.col);
    if (!h.isPlayer) nearMiss(eye, dir, hit ? hit.t : 120);
    if (h.isPlayer) {
      const first = R.firstShots == null ? 3 : R.firstShots, kp = s.shots <= first ? (R.pitch != null ? R.pitch : 0.006) : (R.pitchAfter != null ? R.pitchAfter : (R.pitch || 0.006)), ky = s.shots > first ? (R.yawDrift || 0) * s.drift : 0;
      h.pitch = clamp(h.pitch + kp * 0.35, -1.55, 1.55); h.yaw += ky * 0.35; M.rec.pitch.v += kp * 0.65 * 40; M.rec.yaw.v += ky * 0.65 * 40;   // 35% stays in the camera, 65% springs back
      const vm = M.vm; vm.rot.x.v += R.kickVis != null ? R.kickVis : 1.2; vm.rot.z.v += (M.vmAlt ? 1 : -1) * (R.roll != null ? R.roll : 0.01) * 30; M.vmAlt = !M.vmAlt;
      vm.pos.z.v += 1.4 * clamp((R.kickPos || 0.04) / 0.04, 0.5, 3); vm.pos.y.v += 0.4;
      if (h.cur === 'glock') M.slideS.v -= 1.2;
      if (h.scoped && W.scope && W.scope.unscopeOnShot !== false) { setScope(false); h.adsLatch = true; }                    // the shot unscopes; holding the button does not re-scope until it is released
    } else h.onShot();
    psfx((W.sfx && W.sfx.shot) || (h.cur + '_shot'), h.isPlayer ? {} : { pos: h.pos });
    casing(h, eye);
    heard(h);
    if (s.mag <= 0 && h.cur === 'glock') { s.lock = true; psfx('slideLock', h.isPlayer ? {} : { pos: h.pos }); }
  }
  function casing(h, eye) { const sn = Math.sin(h.yaw), cs = Math.cos(h.yaw), rx = cs, rz = -sn, x = eye.x - sn * 0.35 + rx * 0.18, z = eye.z - cs * 0.35 + rz * 0.18; M.world.casings.spawn(x, eye.y - 0.1, z, rx * 2.5 + M.rng() - 0.5, 2 + M.rng(), rz * 2.5 + M.rng() - 0.5, 1.2, floorAt(M.cols, x, z, eye.y, 0.05), 1); }
  function worldImpact(p, col) {
    const fl = floorAt(M.cols, p.x, p.z, p.y, 0.05); for (let i = 0; i < 3; i++) M.world.crumbs.spawn(p.x, p.y, p.z, (M.rng() - 0.5) * 3, 1 + M.rng() * 2, (M.rng() - 0.5) * 3, 0.7, fl, 0.7);
    if (M.P && p.distanceTo(M.P.pos) < 12) psfx(col && col.metal ? 'worldHitMetal' : 'worldHit', { pos: p });
  }
  function nearMiss(o, d, tHit) {                                                                                 // a bot's bullet passing within 1.5 m of the player's head
    const P = M.P; if (!P || P.dead) return; const hx = P.pos.x - o.x, hy = P.pos.y + 1.6 - o.y, hz = P.pos.z - o.z, t = hx * d.x + hy * d.y + hz * d.z; if (t < 0 || t > tHit) return;
    const cx = hx - d.x * t, cy = hy - d.y * t, cz = hz - d.z * t, dist = Math.hypot(cx, cy, cz); if (dist > 1.5 || dist < 0.45) return;
    psfx('whiz', { pan: clamp((cx * Math.cos(P.yaw) - cz * Math.sin(P.yaw)) / dist, -0.8, 0.8) * -1 });
  }
  function heard(h) { const K = diffK(); const n = M.nav.nearest(h.pos); if (n) n.hot += 1; for (const b of M.bots) if (b !== h && !b.dead && b.pos.distanceTo(h.pos) <= K.hear) b.hear(h); }
  function startReload(h) { const W = wep(h), s = gunOf(h); if (!W || W.melee || s.reload || s.mag >= (W.mag || 0) || s.reserve <= 0 || h.switching) return false; s.reload = { t: 0 }; if (h.isPlayer && h.scoped) setScope(false); return true; }
  function switchTo(h, id) {
    if (!h.guns[id] || id === h.cur || (h.switching && h.switching.to === id) || h.dead) return; const s = gunOf(h); if (s.reload) { s.reload = null; if (h.isPlayer) M.magT = 0; }
    if (h.isPlayer && h.scoped) setScope(false); h.melee = null; h.switching = { to: id, t: 0, dur: (WEAPONS[id] && WEAPONS[id].switchTime) || 0.4, done: false };
  }
  function cycleWeapon(h, dir) { const order = [h.primary, 'glock', 'knife'], i = order.indexOf((h.switching && h.switching.to) || h.cur); switchTo(h, order[(i + dir + 3) % 3]); }
  function stepGuns(h, dt) {
    for (const k in h.guns) {
      const s = h.guns[k], W = WEAPONS[k] || {}; s.cd -= dt; if (W.spread) s.spread = Math.max(0, s.spread - (W.spread.decay || 6) * dt);
      if (s.reload) {
        const r = s.reload, R = W.reload || { total: 2.2, magOut: 0.5, magIn: 1.5, bolt: 1.9 }, at = h.isPlayer ? {} : { pos: h.pos }; r.t += dt;
        if (!r.out && r.t >= R.magOut) { r.out = true; psfx((W.sfx && W.sfx.magOut) || 'magOut', at); if (h.isPlayer) M.magT = -0.35; }
        if (!r.in && r.t >= R.magIn) { r.in = true; psfx((W.sfx && W.sfx.magIn) || 'magIn', at); if (h.isPlayer) M.magT = 0; }
        if (!r.bolt && R.bolt != null && r.t >= R.bolt) { r.bolt = true; psfx((W.sfx && W.sfx.bolt) || 'bolt', at); if (h.isPlayer) M.boltS.v -= 1.6; s.lock = false; }
        if (r.t >= R.total) { const take = Math.min((W.mag || 0) - s.mag, s.reserve); s.mag += take; s.reserve -= take; s.reload = null; s.shots = 0; s.spread = 0; s.lock = false; s.drift = M.rng() < 0.5 ? -1 : 1; if (h.isPlayer) M.magT = 0; }
      }
    }
    if (h.switching) { const sw = h.switching; sw.t += dt; if (!sw.done && sw.t >= sw.dur * 0.5) { sw.done = true; h.last = h.cur; h.cur = sw.to; if (h.isPlayer) { mountViewmodel(); psfx('switch'); } else h.onSwitch(); } if (sw.t >= sw.dur) h.switching = null; }
    if (h.melee) { h.melee.t -= dt; if (h.melee.t <= 0) { meleeImpact(h, h.melee); h.melee = null; } }
    if (h.boltSfx > 0) { h.boltSfx -= dt; if (h.boltSfx <= 0) { psfx('awp_bolt', h.isPlayer ? {} : { pos: h.pos }); if (h.isPlayer) M.boltS.v -= 1.8; } }
  }
  function meleeAttack(h, kind) {
    const W = WEAPONS.knife || {}, s = h.guns.knife; if (!s || s.cd > 0 || h.switching || h.melee || h.cur !== 'knife' || h.dead || M.phase !== 'play') return;
    const mm = (W.melee && W.melee[kind]) || (kind === 'stab' ? { dmg: 65, time: 1.0 } : { dmg: 40, time: 0.45 }); s.cd = mm.time; h.melee = { kind, t: mm.time * 0.3, dmg: mm.dmg };
    psfx((W.sfx && W.sfx.swing) || 'knife_swing', h.isPlayer ? {} : { pos: h.pos });
    if (h.isPlayer) { M.vm.rot.x.v -= kind === 'stab' ? 5 : 7; M.vm.pos.z.v -= kind === 'stab' ? 4 : 2.5; M.vm.pos.x.v -= kind === 'stab' ? 0 : 1.2; M.vm.pos.y.v -= 1; if (h.prot > 0) h.prot = 0; }
  }
  function meleeImpact(h, m) {
    const W = WEAPONS.knife || {}, ml = W.melee || {}, reach = ml.reach || 1.6, half = (ml.arcDeg || 45) * DEG / 2, eye = eyeOf(h); let best = null, bd = 1e9;
    for (const b of M.all) {
      if (b === h || b.dead) continue; const dx = b.pos.x - h.pos.x, dz = b.pos.z - h.pos.z, d = Math.hypot(dx, dz) - 0.4; if (d > reach || b.pos.y > h.pos.y + 1.6 || b.pos.y + 1.75 < h.pos.y) continue;
      if (Math.abs(angleDelta(Math.atan2(-dx, -dz), h.yaw)) > half) continue; if (d < bd) { bd = d; best = b; }
    }
    if (!best || !segmentClear(M.cols, eye, new THREE.Vector3(best.pos.x, best.pos.y + 1.0, best.pos.z))) return;
    const back = Math.abs(angleDelta(best.yaw, h.yaw)) < (ml.backstabDeg || 60) * DEG;                            // its back is to us: we both face the same way
    psfx((W.sfx && (back ? W.sfx.backstab : W.sfx.hit)) || (back ? 'knife_backstab' : 'knife_hit'), h.isPlayer ? {} : { pos: h.pos });
    applyDamage(best, back ? 9999 : m.dmg, h, { weapon: 'knife', backstab: back });
  }
  function applyDamage(t, dmg, from, info) {
    if (t.dead || t.prot > 0 || M.phase !== 'play') return;
    t.hp -= dmg; t.regenT = 4; t.lastHit = { by: from, t: M.time };
    if (from.isPlayer) { PS.stats.hits++; M.mHits++; hitMarker(!!info.head); psfx(info.head ? 'headshot' : 'hit'); }
    if (t.isPlayer) playerHurt(from, dmg); else t.onHurt(from, dmg);
    if (t.hp <= 0) kill(t, from, info);
  }
  function kill(v, k, info) {
    v.dead = true; v.hp = 0; v.deadT = 3; v.deaths++; v.streak = 0; v.killedBy = k;
    k.kills++; k.streak++; k.bestStreak = Math.max(k.bestStreak, k.streak); k.wk[info.weapon] = (k.wk[info.weapon] || 0) + 1;
    feedLine(fmt(L('feed.kill', '{a} killed {b}'), { a: k.name, b: v.name }) + (info.head ? L('headTag', ' (headshot)') : '') + (info.weapon === 'knife' ? L('knifeTag', ' (knife)') : ''), k.isPlayer || v.isPlayer ? 'me' : '');
    if (k.isPlayer) {
      PS.stats.kills++; if (info.head) PS.stats.heads++; PS.stats.wk[info.weapon] = (PS.stats.wk[info.weapon] || 0) + 1; M.xhFlash = 0.2; psfx('kill');
      const st = L('streak.' + k.streak, null); if (st) { centerToast(st); psfx('streak'); }
    }
    if (!M.firstBlood) { M.firstBlood = true; if (k.isPlayer) centerToast(L('firstBlood', 'first blood')); }
    if (v.isPlayer) playerDied(k, info); else v.die(k);
    if (!k.isPlayer) k.onKill(v);
    if (M.sudden || k.kills >= M.killCap) endMatch();
  }

  /* ── the player: a cylinder with an eye, moved by the shared solver; every camera and viewmodel motion is a spring ── */
  function makePlayer() {
    const P = { isPlayer: true, name: (api.name && api.name()) || 'you', pos: new THREE.Vector3(), vel: new THREE.Vector3(), yaw: 0, pitch: 0, radius: 0.4, height: 1.75, crouch: false, onGround: true, coyote: 0, jumpBuf: 0, jumpHeld: false, hp: 100, dead: false, deadT: 0, prot: 0, regenT: 0,
      kills: 0, deaths: 0, streak: 0, bestStreak: 0, wk: {}, sprint: false, sprintT: 0, sprintBlock: 0, scoped: false, stepDist: 0, stepAlt: false, spawnAt: new THREE.Vector3(), lastKilledBy: null, killedBy: null, fireHeld: false, adsHeld: false, reloadHeld: false, lastHit: null };
    P.onLand = v => { M.bob.v -= 0.12 * Math.min(1, v / 6) * 30; M.vm.pos.y.v -= Math.min(3, v * 0.3); if (v > 2) psfx('land', { gain: 0.6 + Math.min(1, v / 8) }); };
    giveLoadout(P, M.loadout); return P;
  }
  function stepPlayer(dt) {
    const P = M.P, I = M.input, W = wep(P);
    if (P.dead) { P.deadT -= dt; if (P.deadT <= 0) respawn(P); return; }
    P.prot -= dt; if (P.prot > 0 && Math.hypot(P.pos.x - P.spawnAt.x, P.pos.z - P.spawnAt.z) > 1.5) P.prot = 0;
    P.crouch = !!I.crouch; P.height = P.crouch ? 1.2 : 1.75; P.sprintBlock -= dt;
    P.sprint = !!I.sprint && !P.crouch && !P.scoped && P.sprintBlock <= 0 && I.f > 0.5; P.sprintT = clamp(P.sprintT + (P.sprint ? dt / 0.15 : -dt / 0.15), 0, 1);
    let cap = P.crouch ? 3 : lerp(6, 8, P.sprintT); if (P.cur === 'knife') cap += 0.25; if (P.scoped) cap *= (W.scope && W.scope.moveMul) || 0.55;
    let mx = I.r - I.l, mz = I.b - I.f; const len = Math.hypot(mx, mz); if (len > 1) { mx /= len; mz /= len; }
    const sn = Math.sin(P.yaw), cs = Math.cos(P.yaw), wx = mx * cs + mz * sn, wz = -mx * sn + mz * cs;
    if (P.onGround) { if (len > 0.01) { P.vel.x += wx * 45 * dt; P.vel.z += wz * 45 * dt; } else { const f = Math.exp(-14 * dt); P.vel.x *= f; P.vel.z *= f; } }
    else if (len > 0.01) { P.vel.x += wx * 10 * dt; P.vel.z += wz * 10 * dt; }
    const sp = Math.hypot(P.vel.x, P.vel.z); if (sp > cap) { P.vel.x *= cap / sp; P.vel.z *= cap / sp; }
    if (I.jump) { if (!P.jumpHeld) { P.jumpBuf = JUMP_BUF; P.jumpHeld = true; } } else P.jumpHeld = false; P.jumpBuf -= dt;
    if (P.jumpBuf > 0 && (P.onGround || P.coyote > 0)) { P.vel.y = 5.5; P.onGround = false; P.coyote = 0; P.jumpBuf = 0; psfx('jump'); M.vm.pos.y.v -= 0.8; }
    P.vel.y -= 20 * dt; moveBody(M.cols, P, dt);
    if (P.onGround && sp > 0.8) { P.stepDist += sp * dt; if (P.stepDist >= (P.crouch ? 0.55 : P.sprint ? 0.85 : 0.7)) { P.stepDist = 0; footstep(P); } } else if (!P.onGround) P.stepDist = 0;
    P.regenT -= dt; if (P.regenT <= 0 && P.hp < 100) P.hp = Math.min(100, P.hp + 30 * dt);
    if (P.pos.y > 0.05 && P.onGround) M.onStone = true; else M.onStone = false;
    // triggers
    const firePressed = !!I.fire && !P.fireHeld; P.fireHeld = !!I.fire; if (I.fire) tryFire(P, firePressed);
    const adsPressed = !!I.ads && !P.adsHeld; P.adsHeld = !!I.ads; if (!I.ads) P.adsLatch = false;
    if (P.cur === 'knife') { if (adsPressed) meleeAttack(P, 'stab'); }
    else if (W.scope) { if (PS.cfg.scopeHold) { const want = !!I.ads && !P.adsLatch; if (want !== P.scoped && !gunOf(P).reload && !P.switching) setScope(want); } else if (adsPressed && !gunOf(P).reload && !P.switching) setScope(!P.scoped); }
    if (I.reload && !P.reloadHeld) startReload(P); P.reloadHeld = !!I.reload;
    if (P.scoped && P.sprint) setScope(false);
    stepGuns(P, dt); pickups(P);
  }
  function footstep(P) {
    psfx(M.onStone ? 'stepStone' : P.crouch ? 'stepCrouch' : P.sprint ? 'stepSprint' : 'step');
    M.bob.v -= 0.9; M.vm.pos.y.v += 0.25; M.vm.pos.x.v += P.stepAlt ? 0.15 : -0.15; M.vm.rot.z.v += (P.stepAlt ? 1 : -1) * 2 * DEG * 30; P.stepAlt = !P.stepAlt;
  }
  function setScope(on) {
    const P = M.P, W = wep(P); if (!W.scope && on) return; if (P.scoped === on) return; P.scoped = on; psfx((W.sfx && W.sfx.scope) || 'scope');
    M.fovT = on ? PS.cfg.fov * (W.scope.fovMul || 0.4) : PS.cfg.fov; M.hud.scope.classList.toggle('on', on); M.hud.xh.classList.toggle('off', on); M.vm.root.visible = !on;
  }
  function playerHurt(from, dmg) {
    const P = M.P, dx = from.pos.x - P.pos.x, dz = from.pos.z - P.pos.z, d = Math.hypot(dx, dz) || 1, side = clamp((dx * Math.cos(P.yaw) - dz * Math.sin(P.yaw)) / d, -1, 1);
    M.vigS.x = Math.min(1, M.vigS.x + dmg / 60); M.arrowT = 0.8; M.arrowFrom.copy(from.pos); M.kick.pitch.v += 0.02 * 30; M.kick.roll.v += side * 0.015 * 30; M.hpWob.v += (side < 0 ? -1 : 1) * 60;
    if (P.hp >= 30) psfx('hurt', { pan: side * 0.7 });
  }
  function playerDied(k, info) {
    const P = M.P; P.scoped = false; M.hud.scope.classList.remove('on'); M.hud.xh.classList.add('off'); M.vm.root.visible = true; M.fovT = PS.cfg.fov; P.lastKilledBy = k; if (!k.isPlayer) k.red = 5; gunOf(P).reload = null; P.switching = null; P.melee = null;
    M.el.classList.add('dead'); M.slumpT = -1.2; M.rollT = 0.5; psfx('die'); duck(true);
    M.hud.deathText.textContent = fmt(L('deathCard', 'killed by {a} · {w}'), { a: k.name, w: weaponName(info.weapon) }) + (info.head ? L('headTag', ' (headshot)') : '') + (info.weapon === 'knife' ? L('knifeTag', ' (knife)') : '');
    M.hud.death.classList.add('on'); M.vm.tgt.y = -0.5;
  }
  function pickSpawn(who) {
    const enemies = M.all.filter(b => b !== who && !b.dead), A = new THREE.Vector3(), B = new THREE.Vector3(); let best = null, bd = -1, far = null, fd = -1;
    for (const s of SPAWNS) {
      let md = 1e9, bad = false;
      for (const e of enemies) { const d = Math.hypot(s.x - e.pos.x, s.z - e.pos.z); if (d < md) md = d; if (d < 12) { A.set(s.x, (s.y || 0) + 1.5, s.z); B.set(e.pos.x, e.pos.y + 1.5, e.pos.z); if (segmentClear(M.cols, A, B)) bad = true; } }
      if (md > fd) { fd = md; far = s; } if (!bad && md > bd) { bd = md; best = s; }
    }
    const s = best || far || SPAWNS[0]; return new THREE.Vector3(s.x, s.y || 0, s.z);
  }
  function respawn(P) {
    const sp = pickSpawn(P); P.pos.copy(sp); P.spawnAt.copy(sp); P.vel.set(0, 0, 0); P.yaw = Math.atan2(sp.x, sp.z); P.pitch = 0; P.hp = 100; P.dead = false; P.prot = 1; P.regenT = 0; P.crouch = false; P.streak = 0; P.onGround = true;
    giveLoadout(P, M.loadout); mountViewmodel();
    for (const s of [M.rec.pitch, M.rec.yaw, M.bob, M.kick.pitch, M.kick.roll, M.vm.pos.x, M.vm.pos.y, M.vm.pos.z, M.vm.rot.x, M.vm.rot.y, M.vm.rot.z, M.slump, M.roll]) { s.x = 0; s.v = 0; }
    M.slumpT = 0; M.rollT = 0; M.fov.x = PS.cfg.fov - 20; M.fovT = PS.cfg.fov; M.vm.pos.y.x = -0.5; M.vm.tgt.y = 0; M.hpShow.x = 0; M.hpShow.v = 0; M.vigS.x = 0;
    M.el.classList.remove('dead'); M.hud.death.classList.remove('on'); M.hud.xh.classList.remove('off'); duck(false);
  }
  function pickups(h) {
    for (const c of M.world.crates) {
      if (c.gone > 0) continue; if (Math.hypot(h.pos.x - c.x, h.pos.z - c.z) > 1.2 || c.y < h.pos.y - 0.6 || c.y - h.pos.y > 1.7) continue;
      for (const k in h.guns) { const W = WEAPONS[k]; if (W && !W.melee) h.guns[k].reserve = W.reserve || 0; }
      c.gone = 20; c.lidS.x += 0.15; psfx('crateLid', { pos: new THREE.Vector3(c.x, c.y, c.z) });
      if (h.isPlayer) { psfx('ammo'); centerToast(L('ammo', 'ammo')); }
    }
  }
  function stepCrates(dt) { for (const c of M.world.crates) { c.gone -= dt; springTo(c.lidS, 0, dt); springTo(c.sink, c.gone > 0 ? -0.5 : 0, dt); c.grp.position.y = c.y + c.sink.x; c.lid.position.y = 0.475 + clamp(c.lidS.x, -0.02, 0.3); } }

  /* ── bots: clay hoodie figures on cheap capsule limbs, every motion a spring. decisions at 10 Hz (staggered), movement at 60 Hz
     through the same solver as the player, the same guns, the same hit shapes. WANDER → NOTICE → ENGAGE → HUNT / RETREAT / RESUPPLY ── */
  class Bot {
    constructor(spec, idx) {
      this.isPlayer = false; this.name = spec.name || ('bot' + idx); this.color = spec.color || '#4a6fa5'; this.idx = idx;
      this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.yaw = 0; this.pitch = 0; this.radius = 0.4; this.height = 1.75; this.crouch = false; this.onGround = true; this.coyote = 0;
      this.hp = 100; this.dead = false; this.deadT = 0; this.prot = 0; this.regenT = 0; this.kills = 0; this.deaths = 0; this.streak = 0; this.bestStreak = 0; this.wk = {}; this.red = 0; this.killedBy = null; this.lastHit = null;
      this.state = 'wander'; this.target = null; this.seen = new THREE.Vector3(); this.aimPos = new THREE.Vector3(); this.seenT = -9; this.lostT = 9; this.tTracked = 0; this.noticeT = 0; this.huntT = 0; this.holdT = 0; this.strafeT = 0; this.burst = 0; this.burstLen = 5; this.gap = 0; this.headIntent = false; this.jumpWant = 0;
      this.path = null; this.pathI = 0; this.thinkT = 0.1 * idx / 8; this.stuckT = 0; this.stuckN = 0; this.stuckPos = new THREE.Vector3(); this.unsticks = 0; this.moved = 0; this.wantMove = false; this.stepDist = 0; this.swingSign = 1; this.pvx = 0; this.pvz = 0;
      this.ph = [M.rng() * TAU, M.rng() * TAU, M.rng() * TAU, M.rng() * TAU]; this.tiltT = 0; this.rootT = 0; this.sinkT = 0; this.nameRed = false;
      giveLoadout(this, this.drawWeapon());
      const F = figGeo(), MM = mats(), hood = this.mat = MM.clay(this.color), g = this.g = new THREE.Group(); M.scene.add(g);
      const body = this.body = new THREE.Group(); g.add(body);
      const torso = new THREE.Mesh(F.torso, hood); torso.position.y = 0.875; body.add(torso);
      const ring = new THREE.Mesh(F.hood, hood); ring.position.y = 1.33; ring.rotation.x = Math.PI / 2; body.add(ring);
      const head = this.head = new THREE.Group(); head.position.y = 1.55; body.add(head); const hm = new THREE.Mesh(F.head, MM.skin); head.add(hm);
      if (!isTouch) { const o1 = new THREE.Mesh(F.head, MM.OUTLINE); o1.scale.setScalar(1.07); hm.add(o1); const o2 = new THREE.Mesh(F.torso, MM.OUTLINE); o2.scale.setScalar(1.05); torso.add(o2); }
      const leg = (x) => { const grp = new THREE.Group(); grp.position.set(x, 0.5, 0); const m = new THREE.Mesh(F.leg, MM.jeans); m.position.y = -0.25; grp.add(m); const sh = new THREE.Mesh(F.shoe, MM.sneaker); sh.position.set(0, -0.46, 0.05); grp.add(sh); body.add(grp); return grp; };
      this.legL = leg(-0.14); this.legR = leg(0.14);
      const arm = (x) => { const grp = new THREE.Group(); grp.position.set(x, 1.22, 0.05); const m = new THREE.Mesh(F.arm, hood); m.position.y = -0.23; grp.add(m); body.add(grp); return grp; };
      this.armL = arm(-0.34); this.armR = arm(0.34); this.armL.rotation.set(-1.35, 0, 0.35); this.armR.rotation.set(-1.25, 0, -0.2);
      this.gunG = new THREE.Group(); this.gunG.position.set(0.16, 1.0, 0.36); body.add(this.gunG); this.gun = null; this.onSwitch();
      this.nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex(this.name), transparent: true, depthTest: false })); this.nameSprite.scale.set(1.3, 0.33, 1); this.nameSprite.position.y = 2.1; this.nameSprite.renderOrder = 4; g.add(this.nameSprite);
      this.blob = new THREE.Mesh(F.blob, MM.blob); this.blob.position.y = 0.02; this.blob.renderOrder = -1; g.add(this.blob);
      this.swing = [spring(90, 9), spring(90, 9)]; this.bob = spring(220, 20); this.lean = { x: spring(40, 6), z: spring(40, 6) }; this.headS = { x: spring(60, 6), z: spring(60, 6), y: spring(80, 8) };
      this.squash = spring(120, 9); this.tilt = spring(80, 9); this.rootY = spring(60, 8); this.scaleS = spring(120, 9); this.armKick = spring(60, 7); this.gunKick = spring(200, 16); this.scaleS.x = 1;
    }
    drawWeapon() { const w = diffK().weaponWeights || { ar: 0.45, ak: 0.3, awp: 0.25 }, r = M.rng() * ((w.ar || 0) + (w.ak || 0) + (w.awp || 0)); return r < (w.ar || 0) ? 'ar' : r < (w.ar || 0) + (w.ak || 0) ? 'ak' : 'awp'; }
    onSwitch() { disposeGun(this.gun); this.gun = buildGun(this.cur, null, true); this.gunG.add(this.gun.group); }
    onShot() { this.headS.x.v += 1.2; this.gunKick.v += 1.5; }
    onHurt(from, dmg) {
      this.squash.v -= 4; const dx = from.pos.x - this.pos.x, dz = from.pos.z - this.pos.z, d = Math.hypot(dx, dz) || 1, sn = Math.sin(this.yaw), cs = Math.cos(this.yaw);
      this.headS.x.v += (dx * sn + dz * cs) / d * 2.5; this.headS.z.v += (dx * cs - dz * sn) / d * 2.5;
      for (let i = 0; i < 4; i++) M.world.crumbs.spawn(this.pos.x, this.pos.y + 1.1, this.pos.z, (M.rng() - 0.5) * 3, 1.5 + M.rng() * 2, (M.rng() - 0.5) * 3, 0.8, this.pos.y, 0.8);
      this.seen.copy(from.pos); this.seenT = M.time;
      if (!this.target || this.state === 'wander' || this.state === 'hunt') { this.target = from; if (this.state === 'wander' || this.state === 'hunt') { this.state = 'notice'; this.noticeT = diffK().reaction * 0.5; } }
    }
    hear(shooter) {
      if (this.dead || this.state === 'engage' || this.state === 'notice') return;
      const n = M.nav.nearest(shooter.pos); this.seen.set(n.x, n.y, n.z); this.seenT = M.time - 1;
      if (this.state === 'wander' || this.state === 'hunt') { this.state = 'hunt'; this.huntT = 5; this.target = shooter; this.pathTo(this.seen); }
    }
    onKill(v) { this.armKick.v += 14; if (v.isPlayer) this.holdT = 0.8; if (M.rng() < 0.25) botChat(this.name, pick(LA('botKill', ['gg', 'ez', '?', 'nice try', '1v1 me', 'sit', 'ok']))); }
    die() {
      this.tilt.k = 30; this.tilt.d = 4; this.tiltT = (M.rng() < 0.5 ? -1 : 1) * 1.45; this.rootT = -0.7; this.sinkT = 1.5; this.crouch = false; this.state = 'wander'; this.path = null; this.target = null; this.tTracked = 0; this.holdT = 0;
      for (let i = 0; i < 8; i++) M.world.crumbs.spawn(this.pos.x, this.pos.y + 1.0, this.pos.z, (M.rng() - 0.5) * 5, 2 + M.rng() * 3, (M.rng() - 0.5) * 5, 1.2, this.pos.y, 1);
      psfx('botDie', { pos: this.pos }); if (M.rng() < 0.25) botChat(this.name, pick(LA('botDie', ['lag', 'nice shot', 'how', 'wall hacks', 'my mouse slipped', 'afk sorry'])));
    }
    respawnNow() {
      const sp = pickSpawn(this); this.pos.copy(sp); this.vel.set(0, 0, 0); this.yaw = Math.atan2(sp.x, sp.z); this.pitch = 0; this.hp = 100; this.dead = false; this.prot = 1; this.regenT = 0; this.onGround = true; this.streak = 0;
      this.tilt.k = 80; this.tilt.d = 9; this.tilt.x = 0; this.tilt.v = 0; this.tiltT = 0; this.rootT = 0; this.rootY.x = 0; this.rootY.v = 0; this.scaleS.x = 0; this.scaleS.v = 4;
      giveLoadout(this, this.drawWeapon()); this.onSwitch(); this.state = 'wander'; this.path = null; this.target = null; this.lostT = 9; this.stuckN = 0; this.stuckPos.copy(this.pos);
    }
    canSee(o) {
      const dx = o.pos.x - this.pos.x, dz = o.pos.z - this.pos.z, d = Math.hypot(dx, dz); if (d > 40) return false;
      if (Math.abs(angleDelta(this.yaw, Math.atan2(-dx, -dz))) > 75 * DEG) return false;
      const eye = new THREE.Vector3(this.pos.x, this.pos.y + (this.crouch ? 1.05 : 1.6), this.pos.z), c = new THREE.Vector3(o.pos.x, o.pos.y + (o.crouch ? 0.7 : 1.0), o.pos.z);
      if (segmentClear(M.cols, eye, c)) return true; c.y = o.pos.y + (o.crouch ? 1.0 : 1.55); return segmentClear(M.cols, eye, c);
    }
    /* the node to start a path from: the nearest one a straight walk can actually reach. the plain nearest node can sit on the far side
       of a pier or a crate, and a bot heading straight for it pins itself against the wall — the thing that kept one bot in a corner for
       two minutes */
    startNode() {
      const cands = M.nav.nodes.filter(q => Math.abs(q.y - this.pos.y) < 1.6).sort((a, b) => Math.hypot(a.x - this.pos.x, a.z - this.pos.z) - Math.hypot(b.x - this.pos.x, b.z - this.pos.z));
      for (let k = 0; k < Math.min(6, cands.length); k++) { const q = cands[k]; _sa.set(this.pos.x, this.pos.y + 1.0, this.pos.z); _sb.set(q.x, q.y + 1.0, q.z); if (segmentClear(M.cols, _sa, _sb)) return q; }
      return M.nav.nearest(this.pos);
    }
    pathTo(p) { const from = this.startNode(), to = M.nav.nearest(p); this.path = M.nav.path(from.i, to.i); this.pathI = 0; if (this.path && this.path.length > 1 && Math.hypot(from.x - this.pos.x, from.z - this.pos.z) < 0.6) this.pathI = 1; }
    pickWander() {
      const K = diffK(), hard = M.diff === 'hard', cands = [];
      // a balcony picked earlier is kept as a goal for a while: fights keep interrupting the walk, and without this nobody ever got up there
      if (this.goal && M.time - this.goalT < 45 && Math.hypot(this.goal.x - this.pos.x, this.goal.z - this.pos.z) > 1.5) { this.pathTo(this.goal); if (this.path) return; }
      this.goal = null;
      for (const n of M.nav.nodes) {                                                                              // 10–25 m away, weighted by heat; the balconies (the AWP spots) count from 4 m and weigh more, most of all for AWP carriers and hard bots
        const d = Math.hypot(n.x - this.pos.x, n.z - this.pos.z), roof = n.y >= 2; if (d < (roof ? 4 : 10) || d > 25) continue;
        cands.push([n, (1 + n.hot) * (roof ? (hard || this.cur === 'awp' ? 5 : 2.5) : 1)]);
      }
      const pool = cands.length ? cands : M.nav.nodes.map(n => [n, 1]); let tot = 0; for (const c of pool) tot += c[1]; let r = M.rng() * tot, n = pool[0][0]; for (const c of pool) { r -= c[1]; if (r <= 0) { n = c[0]; break; } }
      if (n.y >= 2) { this.goal = n; this.goalT = M.time; }
      this.pathTo(n);
    }
    pickStrafe() {
      const here = M.nav.nearest(this.pos), tn = M.nav.nearest(this.target.pos), dist = this.pos.distanceTo(this.target.pos);
      const cands = [here]; for (const e of here.adj) if (e.kind === 'walk' && M.nav.vis(e.to, tn.i)) cands.push(M.nav.nodes[e.to]);
      const far = n => Math.hypot(n.x - this.target.pos.x, n.z - this.target.pos.z);
      let n;
      if (this.cur === 'awp' && dist < 15) n = cands.reduce((a, b) => far(b) > far(a) ? b : a);
      else if (this.cur !== 'awp' && dist < 8) n = cands.reduce((a, b) => far(b) > far(a) ? b : a);
      else if (this.cur !== 'awp' && dist > 20) n = cands.reduce((a, b) => far(b) < far(a) ? b : a);
      else n = cands[Math.floor(M.rng() * cands.length)];
      this.path = [n.i]; this.pathI = 0;
    }
    pathToCover() {
      const here = M.nav.nearest(this.pos), tn = M.nav.nearest(this.target ? this.target.pos : this.seen), cands = [here, ...here.adj.filter(e => e.kind === 'walk').map(e => M.nav.nodes[e.to])];
      const hidden = cands.filter(n => !M.nav.vis(n.i, tn.i)), far = n => Math.hypot(n.x - tn.x, n.z - tn.z), n = (hidden.length ? hidden : cands).reduce((a, b) => far(b) > far(a) ? b : a);
      this.path = [n.i]; this.pathI = 0;
    }
    unstick() { const n = M.nav.nearest(this.pos, 9); this.pos.set(n.x, n.y + 0.05, n.z); this.vel.set(0, 0, 0); this.unsticks++; this.path = null; feedLine(fmt(L('feed.unstick', '{n} reconnected'), { n: this.name }), 'sys'); }
    think() {
      const K = diffK(), P = M.P, s = gunOf(this), W = wep(this); let bestT = null, bd = 1e9; const vis = [];
      for (const o of M.all) { if (o === this || o.dead || !this.canSee(o)) continue; vis.push(o); const d = this.pos.distanceTo(o.pos) * (o.isPlayer ? 0.8 : 1); if (d < bd) { bd = d; bestT = o; } }
      if (this.target && this.target.dead) { this.target = null; if (this.state === 'engage' || this.state === 'notice') this.state = 'wander'; }
      if (bestT && (!this.target || !vis.includes(this.target))) { if (!(this.state === 'wander' && M.rng() < K.ignore)) this.target = bestT; }
      const tv = !!this.target && vis.includes(this.target);
      if (tv) { this.seen.copy(this.target.pos); this.aimPos.copy(this.target.pos); this.seenT = M.time; this.tTracked += 0.1; this.lostT = 0; } else { this.lostT += 0.1; if (this.lostT > 0.4) this.tTracked = 0; }
      if (!W.melee && !s.reload && s.mag < (W.mag || 30) * 0.3 && s.reserve > 0) { const ok = M.diff === 'easy' || (M.diff === 'normal' ? (M.rng() < 0.6 || !vis.length) : !vis.length); if (ok) startReload(this); }
      if (s.mag <= 0 && s.reserve <= 0 && !s.reload) { const other = this.cur === 'glock' ? this.primary : 'glock', so = this.guns[other]; if (so.mag > 0 || so.reserve > 0) switchTo(this, other); else if (this.state !== 'resupply') { this.state = 'resupply'; this.path = null; } }
      else if (this.cur === 'glock' && (this.guns[this.primary].mag > 0 || this.guns[this.primary].reserve > 0) && !vis.length && !this.switching) switchTo(this, this.primary);
      switch (this.state) {
        case 'wander': if (tv) { this.state = 'notice'; this.noticeT = K.reaction; } else if (!this.path || this.pathI >= this.path.length) this.pickWander(); break;
        case 'notice': if (!tv) { this.state = 'hunt'; this.huntT = 5; this.pathTo(this.seen); } else { this.noticeT -= 0.1; if (this.noticeT <= 0) { this.state = 'engage'; this.strafeT = 0; this.burst = 0; this.headIntent = M.rng() < K.headIntent; } } break;
        case 'engage':
          if (!this.target) { this.state = 'wander'; break; }
          if (!tv) { if (this.lostT > 0.4) { this.state = 'hunt'; this.huntT = 5; this.pathTo(this.seen); } break; }
          if (this.hp < K.retreatHp) { this.state = 'retreat'; this.pathToCover(); break; }
          this.strafeT -= 0.1; if (this.strafeT <= 0) { this.strafeT = 0.6 + M.rng() * 0.6; this.pickStrafe(); if (M.rng() < K.jumpChance) this.jumpWant = 1; }
          break;
        case 'hunt': if (tv) { this.state = 'notice'; this.noticeT = K.reaction * 0.5; break; } this.huntT -= 0.1; if (this.huntT <= 0 || !this.path || this.pathI >= this.path.length) { this.state = 'wander'; this.target = null; this.path = null; } break;
        case 'retreat': if (this.hp > K.retreatHp + 30 || !this.target || this.target.dead) { this.state = 'hunt'; this.huntT = 4; this.pathTo(this.seen); } else if (tv && (!this.path || this.pathI >= this.path.length)) this.pathToCover(); break;
        case 'resupply': {
          const c = M.world.crates.filter(x => x.gone <= 0).sort((a, b) => Math.hypot(a.x - this.pos.x, a.z - this.pos.z) - Math.hypot(b.x - this.pos.x, b.z - this.pos.z))[0];
          if (!c || s.reserve > 0 || s.mag > 0) { this.state = 'wander'; this.path = null; break; }
          if (!this.path || this.pathI >= this.path.length) this.pathTo(new THREE.Vector3(c.x, c.y, c.z));
          break;
        }
      }
      this.crouch = M.diff === 'hard' && !this.target && !!P && !P.dead && this.pos.distanceTo(P.pos) < 10;
    }
    simulate(dt) {
      if (this.dead) { this.deadT -= dt; if (this.deadT <= 0) this.respawnNow(); return; }
      this.prot -= dt; this.red -= dt; this.regenT -= dt; if (this.regenT <= 0 && this.hp < 100) this.hp = Math.min(100, this.hp + 30 * dt);
      this.thinkT -= dt; if (this.thinkT <= 0) { this.thinkT += 0.1; this.think(); }
      let mx = 0, mz = 0; this.wantMove = false;
      if (this.holdT > 0) { this.holdT -= dt; const s = Math.sin(M.time * 5) > 0 ? 1 : -1, sn = Math.sin(this.yaw), cs = Math.cos(this.yaw); mx = cs * s * 0.6; mz = -sn * s * 0.6; this.wantMove = true; }
      else if (this.path && this.pathI < this.path.length) {
        const n = M.nav.nodes[this.path[this.pathI]], dx = n.x - this.pos.x, dz = n.z - this.pos.z, d = Math.hypot(dx, dz), edge = this.pathI > 0 ? M.nav.edge(this.path[this.pathI - 1], this.path[this.pathI]) : null, kind = edge ? edge.kind : 'walk';
        if (d < 0.6 && (Math.abs(n.y - this.pos.y) < 0.8 || kind === 'drop')) this.pathI++;
        else { mx = dx / d; mz = dz / d; this.wantMove = true; if (kind === 'jump' && d < 1.0 && n.y > this.pos.y + 0.3 && this.onGround) this.jumpWant = 1; }
      }
      const cap = this.crouch ? 3 : 6;
      if (this.onGround) { if (this.wantMove) { this.vel.x += mx * 45 * dt; this.vel.z += mz * 45 * dt; } else { const f = Math.exp(-14 * dt); this.vel.x *= f; this.vel.z *= f; } } else if (this.wantMove) { this.vel.x += mx * 10 * dt; this.vel.z += mz * 10 * dt; }
      const sp = Math.hypot(this.vel.x, this.vel.z); if (sp > cap) { this.vel.x *= cap / sp; this.vel.z *= cap / sp; }
      if (this.jumpWant && this.onGround) { this.vel.y = 5.5; this.onGround = false; this.coyote = 0; psfx('jump', { pos: this.pos, gain: 0.6 }); } this.jumpWant = 0;
      this.vel.y -= 20 * dt; moveBody(M.cols, this, dt); this.moved += sp * dt;
      if (this.wantMove) { this.stuckT += dt; if (this.stuckT >= 1.5) { if (this.pos.distanceTo(this.stuckPos) < 0.3) { this.stuckN++; if (this.stuckN >= 3) { this.unstick(); this.stuckN = 0; } else { this.path = null; if (this.state === 'wander') this.pickWander(); } } else this.stuckN = 0; this.stuckPos.copy(this.pos); this.stuckT = 0; } }
      else { this.stuckT = 0; this.stuckN = 0; this.stuckPos.copy(this.pos); }
      // the watchdog above only counts while the bot is trying to walk; a bot camping a corner it cannot leave, strafing at nothing, needs this one
      this.idleT = (this.idleT || 0) + dt; if (!this.idlePos) this.idlePos = this.pos.clone();
      if (this.idleT >= 12) { if (this.pos.distanceTo(this.idlePos) < 1.0 && this.state !== 'engage') this.unstick(); this.idleT = 0; this.idlePos.copy(this.pos); }
      this.aim(dt);
      if (this.onGround && sp > 0.8) { this.stepDist += sp * dt; if (this.stepDist >= 0.7) { this.stepDist = 0; this.swingSign *= -1; this.bob.v -= 0.9; if (!this.crouch && M.P && this.pos.distanceTo(M.P.pos) < 10) psfx(this.pos.y > 0.05 ? 'stepStone' : 'step', { pos: this.pos, gain: 0.8 }); } }
      stepGuns(this, dt); if (this.state === 'resupply') pickups(this);
    }
    aim(dt) {
      const K = diffK(), W = wep(this); let wantYaw, wantPitch = 0, canFire = false;
      const engaged = (this.state === 'engage' || this.state === 'notice' || this.state === 'retreat') && this.target && !this.target.dead && this.lostT < 0.4;
      if (engaged) {
        const tg = this.target, e = K.e0 * Math.max(0.25, 1 - this.tTracked / K.T), t = M.time;
        const ex = e * (0.6 * Math.sin(1.3 * t + this.ph[0]) + 0.4 * Math.sin(2.7 * t + this.ph[1])), ey = e * (0.6 * Math.sin(1.3 * t + this.ph[2]) + 0.4 * Math.sin(2.7 * t + this.ph[3]));
        const ap = this.aimPos, ay = ap.y + (this.headIntent ? (tg.crouch ? 1.0 : 1.55) : (tg.crouch ? 0.7 : 1.0)), dx = ap.x - this.pos.x, dy = ay - (this.pos.y + 1.6), dz = ap.z - this.pos.z;   // where the target was at the last decision: decisions run at 10 Hz, so movers get missed
        wantYaw = Math.atan2(-dx, -dz) + ex * DEG; wantPitch = Math.atan2(dy, Math.hypot(dx, dz)) + ey * DEG; canFire = this.state === 'engage';
      } else if (this.wantMove && Math.hypot(this.vel.x, this.vel.z) > 0.5) wantYaw = Math.atan2(-this.vel.x, -this.vel.z);
      else if (this.state === 'hunt') wantYaw = Math.atan2(-(this.seen.x - this.pos.x), -(this.seen.z - this.pos.z));
      else wantYaw = this.yaw;
      const maxTurn = K.turn * DEG * dt; this.yaw += clamp(angleDelta(this.yaw, wantYaw), -maxTurn, maxTurn); this.pitch += clamp(wantPitch - this.pitch, -maxTurn, maxTurn);
      if (!canFire || W.melee || M.phase !== 'play') return;
      const errDeg = (Math.abs(angleDelta(this.yaw, wantYaw)) + Math.abs(wantPitch - this.pitch)) / DEG; if (errDeg > (W.spread ? W.spread.base : 1) + 1) return;
      this.gap -= dt; if (this.gap > 0) return;
      if (this.cur === 'awp') { if (errDeg > 1.0) return; if (tryFire(this, true)) this.gap = (0.8 + M.rng() * 0.6) / K.fireMul; return; }
      if (this.cur === 'glock') { if (tryFire(this, true)) { this.burst++; this.gap = 0.18 / K.fireMul; if (this.burst >= 3) { this.burst = 0; this.gap = K.burstGap; } } return; }
      if (this.burst === 0) this.burstLen = 4 + Math.floor(M.rng() * 4);
      if (tryFire(this, this.burst === 0)) { this.burst++; this.gap = (60 / (W.rpm || 600)) * (1 / K.fireMul - 1); if (this.burst >= this.burstLen) { this.burst = 0; this.gap = K.burstGap; this.headIntent = M.rng() < K.headIntent; } }
    }
    animate(dt) {
      const g = this.g, sn = Math.sin(this.yaw), cs = Math.cos(this.yaw);
      springTo(this.rootY, this.rootT, dt); g.position.set(this.pos.x, this.pos.y + this.rootY.x, this.pos.z); g.rotation.y = this.yaw + Math.PI;
      springTo(this.scaleS, 1, dt); springTo(this.squash, 0, dt); const sc = Math.max(0.001, this.scaleS.x), sq = this.squash.x; g.scale.set(sc * (1 - sq * 0.01), sc * (1 + sq * 0.02), sc * (1 - sq * 0.01));
      const ax = (this.vel.x - this.pvx) / dt, az = (this.vel.z - this.pvz) / dt; this.pvx = this.vel.x; this.pvz = this.vel.z;
      const fwdV = -(this.vel.x * sn + this.vel.z * cs), sideV = this.vel.x * cs - this.vel.z * sn, fwdA = -(ax * sn + az * cs), sideA = ax * cs - az * sn;
      springTo(this.lean.x, clamp(0.026 * fwdV + 0.012 * fwdA, -0.45, 0.45), dt); springTo(this.lean.z, clamp(-(0.026 * sideV + 0.012 * sideA), -0.45, 0.45), dt); this.headS.x.v -= fwdA * 0.004;
      springTo(this.tilt, this.tiltT, dt); this.body.rotation.set(this.lean.x.x, 0, this.lean.z.x + this.tilt.x);
      springTo(this.bob, 0, dt); this.body.position.y = this.bob.x + (this.crouch ? -0.45 : 0);
      springTo(this.headS.x, 0, dt); springTo(this.headS.z, 0, dt); springTo(this.headS.y, 0, dt); this.head.rotation.set(this.headS.x.x, 0, this.headS.z.x); this.head.position.y = 1.55 + this.headS.y.x;
      const sp = Math.hypot(this.vel.x, this.vel.z), walking = this.onGround && sp > 0.5 && !this.dead;
      springTo(this.swing[0], walking ? this.swingSign * 0.6 : (this.crouch ? 0.9 : 0), dt); springTo(this.swing[1], walking ? -this.swingSign * 0.6 : (this.crouch ? 0.9 : 0), dt); this.legL.rotation.x = this.swing[0].x; this.legR.rotation.x = this.swing[1].x;
      springTo(this.armKick, 0, dt); springTo(this.gunKick, 0, dt); this.armL.rotation.x = -1.35 - this.armKick.x * 0.15; this.armR.rotation.x = -1.25 - this.gunKick.x * 0.2; this.gunG.position.z = 0.36 - this.gunKick.x * 0.03;
      if (this.dead) { this.sinkT -= dt; if (this.sinkT <= 0) this.rootT = -2.4; }
      const wantRed = this.red > 0; if (wantRed !== this.nameRed) { this.nameRed = wantRed; this.nameSprite.material.color.setHex(wantRed ? 0xe10600 : 0xffffff); }
      this.blob.position.y = (this.onGround ? 0 : floorAt(M.cols, this.pos.x, this.pos.z, this.pos.y, 0.3) - this.pos.y) - this.rootY.x + 0.02; this.blob.visible = !this.dead;
    }
    dispose() { if (this.g.parent) this.g.parent.remove(this.g); disposeGun(this.gun); this.mat.dispose(); this.nameSprite.material.map.dispose(); this.nameSprite.material.dispose(); }
  }
  function botChat(name, line) { feedLine(name + ': ' + line, 'chat'); }

  /* ── the match: one renderer of its own inside the monitor bezel, a DOM HUD, a fixed 60 Hz sim under a rAF loop ── */
  const HUD_HTML = `<canvas id="ps-cv"></canvas>
<div class="hud">
  <div id="ps-vig"></div><div id="ps-scope"><i class="h"></i><i class="v"></i><i class="d"></i></div>
  <div id="ps-xh"><i class="t"></i><i class="b"></i><i class="l"></i><i class="r"></i><i class="c"></i></div>
  <div id="ps-hm"><i class="a"></i><i class="b"></i><i class="c"></i><i class="d"></i></div><div id="ps-arrow"><i></i></div>
  <div id="ps-clk"><div class="n num">5:00</div><div class="s"></div></div><div id="ps-feed"></div>
  <div id="ps-ctr"><div class="cbig num"></div><div class="t"></div></div>
  <div id="ps-hp"><div class="lab">hp</div><div class="bar"><i></i></div><div class="n num">100</div></div>
  <div id="ps-am"><div class="n num"><span class="mag">0</span> <small>| 0</small></div><div class="w"></div><div class="s"></div><div class="rl"><i></i></div><div class="msg"></div></div>
</div>
<div class="ps-card" id="ps-prompt" style="pointer-events:none"><h3></h3><p class="mut"></p></div>
<div class="ps-card" id="ps-pause"><h3></h3><p class="mut psub"></p><div><button class="ps-btn primary" data-a="resume"></button><button class="ps-btn" data-a="leave"></button></div><p class="mut pnote"></p></div>
<div class="ps-card" id="ps-death" style="pointer-events:none"><p class="who"></p><div class="n num"></div></div>
<div class="ps-card" id="ps-board" style="pointer-events:none"><h3></h3><div class="tbl"></div></div>
<div class="ps-card" id="ps-end"><h3></h3><p class="placed"></p><div class="tbl"></div><div class="recs"></div><p class="mut foot"></p><div><button class="ps-btn primary" data-a="again"></button><button class="ps-btn" data-a="launcher"></button></div></div>
<div class="ps-card" id="ps-portrait" style="pointer-events:none"><p></p></div>
<div class="touch"><div id="ps-stick"><i></i></div><div class="tb fire" data-b="fire">fire</div><div class="tb jump" data-b="jump">jump</div><div class="tb reload" data-b="reload">reload</div><div class="tb ads" data-b="ads">scope</div><div class="tb swap" data-b="swap">swap</div><div class="tb crouch" data-b="crouch">crouch</div><div class="tb score" data-b="score">score</div><div class="tb menu" data-b="menu">menu</div></div>`;
  const KEYMAP = { KeyW: 'f', ArrowUp: 'f', KeyS: 'b', ArrowDown: 'b', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r', Space: 'jump', ShiftLeft: 'sprint', ShiftRight: 'sprint', ControlLeft: 'crouch', ControlRight: 'crouch', KeyC: 'crouch', KeyR: 'reload', Tab: 'score' };
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable); };
  function clearInput() { if (!M) return; const I = M.input; for (const k in I) I[k] = 0; M.crouchLatch = false; }
  function onKeyDown(e) {
    if (!active || typing(e)) return;
    if (e.code === 'Escape') { if (M || win) { escape(); e.preventDefault(); } return; }
    if (!M) return;
    if (e.code === 'Tab' || e.code === 'Space' || e.code.startsWith('Arrow')) e.preventDefault();
    const k = KEYMAP[e.code]; if (k) { M.input[k] = 1; return; }
    if (e.repeat || !M.P || M.P.dead) return;
    if (e.code === 'Digit1') switchTo(M.P, M.P.primary); else if (e.code === 'Digit2') switchTo(M.P, 'glock'); else if (e.code === 'Digit3') switchTo(M.P, 'knife'); else if (e.code === 'KeyQ') switchTo(M.P, M.P.last);
  }
  function onKeyUp(e) { if (!active || !M) return; const k = KEYMAP[e.code]; if (k) M.input[k] = 0; if (e.code === 'Tab') e.preventDefault(); }
  function onBlur() { clearInput(); }
  function onVis() { if (document.hidden) clearInput(); }

  function mountMatch(opts) {
    ensureStyle(); if (M) unmountMatch();
    const frame = api.frame(), el = document.createElement('div'); el.id = 'ps'; el.className = (isTouch ? 'has-touch ' : '') + 'btn-' + (PS.cfg.btn || 'm'); el.innerHTML = HUD_HTML; frame.appendChild(el);
    const cv = el.querySelector('canvas'), renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isTouch, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isTouch ? 1 : 1.5)); renderer.shadowMap.enabled = false;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(PS.cfg.fov || 80, 1, 0.03, 260); scene.add(camera);
    const seed = opts.seed != null ? opts.seed : (Math.random() * 1e9) | 0;
    M = { el, cv, renderer, scene, camera, hud: {}, phase: 'load', paused: false, time: 0, limit: 300, killCap: 20, countT: 3, sudden: false, diff: DIFF[opts.diff] ? opts.diff : 'normal', nBots: clamp(opts.bots | 0 || 5, 3, 7), loadout: PRIMARIES.includes(opts.loadout) ? opts.loadout : 'ar', seed, rng: xorshift(seed),
      world: null, cols: [], nav: null, P: null, bots: [], all: [], feedEls: [], input: { f: 0, b: 0, l: 0, r: 0, jump: 0, crouch: 0, sprint: 0, fire: 0, ads: 0, reload: 0, score: 0 }, locked: false, relockAt: 0, test: !!opts.test, mShots: 0, mHits: 0, firstBlood: false, ammoMsg: '', xhFlash: 0, arrowT: 0, arrowFrom: new THREE.Vector3(),
      rec: { pitch: spring(120, 12), yaw: spring(120, 12) }, kick: { pitch: spring(90, 10), roll: spring(90, 10) }, bob: spring(220, 20), eyeS: spring(120, 14), fov: spring(90, 14), fovT: PS.cfg.fov || 80, slump: spring(40, 6), slumpT: 0, roll: spring(40, 6), rollT: 0, vigS: spring(40, 8), hpWob: spring(120, 10), hpShow: spring(60, 8), hm: spring(200, 18), hmT: 0,
      vm: { root: new THREE.Group(), gun: null, pos: { x: spring(160, 16), y: spring(160, 16), z: spring(160, 16) }, rot: { x: spring(120, 14), y: spring(120, 14), z: spring(120, 14) }, tgt: { x: 0, y: -0.5, z: 0 }, nudgeT: 0 }, vmAlt: false, magS: spring(160, 14), magT: 0, slideS: spring(400, 22), boltS: spring(300, 18),
      raf: 0, lastT: 0, acc: 0, endT: 0, endShown: false, statsDone: false, place: 0, records: [], escT: 0, leaveArmed: false, stick: { id: -1, x: 0, y: 0, R: 44, full: 0 }, look: { id: -1, x: 0, y: 0, moved: 0, t0: 0 }, portrait: false, friction: false, centerT: 0, bigT: 0, boardT: 0, frameH: 800, onStone: false, tapFire: 0 };
    M.eyeS.x = 1.6; M.fov.x = PS.cfg.fov || 80; M.hpShow.x = 100; M.hm.x = 1;
    M.world = buildWorld(scene, { outlines: !isTouch, debug: debugOn && /debug=colliders/.test(location.search) }); M.cols = M.world.cols; M.nav = M.world.nav;
    M.vm.root.rotation.y = Math.PI; camera.add(M.vm.root);
    const H = M.hud, q = s => el.querySelector(s);
    Object.assign(H, { xh: q('#ps-xh'), hm: q('#ps-hm'), vig: q('#ps-vig'), arrow: q('#ps-arrow'), scope: q('#ps-scope'), clk: q('#ps-clk'), clkN: q('#ps-clk .n'), clkS: q('#ps-clk .s'), feed: q('#ps-feed'), big: q('#ps-ctr .cbig'), ctr: q('#ps-ctr .t'),
      hp: q('#ps-hp'), hpBar: q('#ps-hp .bar i'), hpN: q('#ps-hp .n'), am: q('#ps-am'), mag: q('#ps-am .mag'), res: q('#ps-am small'), wName: q('#ps-am .w'), sName: q('#ps-am .s'), rl: q('#ps-am .rl'), rlI: q('#ps-am .rl i'), amMsg: q('#ps-am .msg'),
      prompt: q('#ps-prompt'), pause: q('#ps-pause'), death: q('#ps-death'), deathText: q('#ps-death .who'), deathN: q('#ps-death .n'), board: q('#ps-board'), end: q('#ps-end'), portrait: q('#ps-portrait'), stick: q('#ps-stick'), nub: q('#ps-stick i'), tbs: {} });
    el.querySelectorAll('.tb').forEach(b => { H.tbs[b.dataset.b] = b; });
    H.xh.style.setProperty('--xc', ({ red: '#e10600', white: '#f3ecdc', green: '#3ad86a', cyan: '#3ad8e8' })[PS.cfg.xhair] || '#e10600'); H.xh.style.setProperty('--l', Math.round(9 * (PS.cfg.xsize || 1)) + 'px');
    H.prompt.querySelector('h3').textContent = isTouch ? L('touchPrompt', 'tap to play') : L('lockPrompt', 'click to play');
    H.prompt.querySelector('p').textContent = PS.seenTutorial ? '' : (isTouch ? L('touchTraining', 'left thumb moves. right thumb aims. red button shoots.') : L('training', 'wasd moves. mouse aims. left click fires. r reloads. 1 2 3 pick a gun.'));
    H.pause.querySelector('h3').textContent = L('pause', 'paused'); H.pause.querySelector('.psub').textContent = isTouch ? '' : L('pauseSub', 'click to resume');
    H.pause.querySelector('[data-a=resume]').textContent = L('resume', 'resume'); H.pause.querySelector('[data-a=leave]').textContent = L('leave', 'leave');
    H.board.querySelector('h3').textContent = L('hud.scoreboard', 'scoreboard'); H.portrait.querySelector('p').textContent = L('portrait', 'rotate your phone');
    H.end.querySelector('h3').textContent = L('endHeader', 'match over'); H.end.querySelector('.foot').textContent = L('total', "matches don't pay. cases are in the launcher."); H.end.querySelector('[data-a=again]').textContent = L('again', 'again'); H.end.querySelector('[data-a=launcher]').textContent = L('launcherBtn', 'launcher');
    M.trainingText = H.prompt.querySelector('p').textContent; H.prompt.querySelector('p').textContent = L('loading', 'loading sandstone.'); M.loading = true;
    H.tbs.ads.style.display = 'none';
    // people
    M.P = makePlayer(); M.all = [M.P]; respawn(M.P); M.P.prot = 0;
    const names = BOTS.slice(); for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(M.rng() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    for (let i = 0; i < M.nBots; i++) { const b = new Bot(names[i] || { name: 'bot' + (i + 1), color: '#4a6fa5' }, i); M.bots.push(b); M.all.push(b); b.respawnNow(); b.prot = 0; b.scaleS.x = 1; b.scaleS.v = 0; }
    sound.listener = { pos: M.P.pos, yaw: 0 };
    // events
    M.ro = new ResizeObserver(() => resizeMatch()); M.ro.observe(frame); resizeMatch();
    M.onMouseDown = e => { if (!M || isTouch) return; if (!M.locked) return; if (e.button === 0) M.input.fire = 1; else if (e.button === 2) M.input.ads = 1; };
    M.onMouseUp = e => { if (!M) return; if (e.button === 0) M.input.fire = 0; else if (e.button === 2) M.input.ads = 0; };
    M.onMouseMove = e => { if (M && M.locked && !M.paused) look(e.movementX || 0, e.movementY || 0, 1); };
    M.onWheel = e => { if (M && M.locked && M.P && !M.P.dead) cycleWeapon(M.P, e.deltaY > 0 ? 1 : -1); };
    M.onClick = () => { if (!M || isTouch || M.phase === 'end') return; if (!M.locked && performance.now() >= M.relockAt) requestLock(); };
    M.onLockChange = () => { if (!M) return; const locked = document.pointerLockElement === cv; M.locked = locked; if (locked) { H.prompt.classList.remove('on'); if (M.phase === 'load') beginCountdown(); else if (M.paused) resumeGame(); } else { if (M.phase === 'count' || M.phase === 'play') pauseGame(); M.relockAt = performance.now() + 1250; } };
    M.onLockError = () => { if (!M) return; H.prompt.querySelector('p').textContent = L('lockDenied', 'click again'); H.pause.querySelector('.pnote').textContent = L('lockDenied', 'click again'); };
    cv.addEventListener('mousedown', M.onMouseDown); addEventListener('mouseup', M.onMouseUp); addEventListener('mousemove', M.onMouseMove); cv.addEventListener('wheel', M.onWheel, { passive: true }); cv.addEventListener('click', M.onClick);
    document.addEventListener('pointerlockchange', M.onLockChange); document.addEventListener('pointerlockerror', M.onLockError); el.addEventListener('contextmenu', e => e.preventDefault());
    H.pause.querySelector('[data-a=resume]').onclick = () => { if (!M) return; if (isTouch) resumeGame(); else if (performance.now() >= M.relockAt) requestLock(); else H.pause.querySelector('.pnote').textContent = L('lockCooldown', 'one second'); };
    H.pause.querySelector('[data-a=leave]').onclick = () => { if (!M) return; if (!M.leaveArmed) { M.leaveArmed = true; H.pause.querySelector('.pnote').textContent = L('leaveConfirm', 'leave match? it counts as a loss.'); return; } leaveMatch(); };
    H.end.querySelector('[data-a=again]').onclick = () => { const o = { diff: M.diff, bots: M.nBots, loadout: M.loadout }; unmountMatch(); startMatch(o); };
    H.end.querySelector('[data-a=launcher]').onclick = () => toLauncher();
    if (isTouch) bindTouch(el, cv);
    api.musicDuck(true); psfx('uiClick'); M.vm.tgt.y = -0.5;
    if (M.test) beginCountdown(); else H.prompt.classList.add('on');
    if (!PS.seenTutorial) { PS.seenTutorial = true; if (isTouch) PS.seenTouch = true; api.persist(); }
    M.lastT = performance.now(); M.raf = requestAnimationFrame(loop);
  }
  function resizeMatch() { if (!M) return; const f = api.frame(), w = Math.max(2, f.clientWidth), h = Math.max(2, f.clientHeight); M.renderer.setSize(w, h, false); M.camera.aspect = w / h; M.camera.updateProjectionMatrix(); M.frameH = h; const por = isTouch && h > w; if (por !== M.portrait) { M.portrait = por; M.hud.portrait.classList.toggle('on', por); if (por && (M.phase === 'count' || M.phase === 'play') && !M.paused) { pauseGame(); M.portraitPaused = true; } else if (!por && M.portraitPaused) { M.portraitPaused = false; resumeGame(); } } }
  function requestLock() { const cv = M.cv; try { const p = cv.requestPointerLock({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => { try { cv.requestPointerLock(); } catch (e) {} }); } catch (e) { try { cv.requestPointerLock(); } catch (_) {} } }
  function unmountMatch() {
    if (!M) return; const m = M; M = null;
    cancelAnimationFrame(m.raf); if (m.ro) m.ro.disconnect();
    m.cv.removeEventListener('mousedown', m.onMouseDown); removeEventListener('mouseup', m.onMouseUp); removeEventListener('mousemove', m.onMouseMove); m.cv.removeEventListener('wheel', m.onWheel); m.cv.removeEventListener('click', m.onClick);
    document.removeEventListener('pointerlockchange', m.onLockChange); document.removeEventListener('pointerlockerror', m.onLockError);
    if (document.pointerLockElement === m.cv) { try { document.exitPointerLock(); } catch (e) {} }
    for (const b of m.bots) b.dispose(); disposeGun(m.vm.gun); m.world.dispose(); disposeFig();
    m.renderer.dispose(); try { m.renderer.forceContextLoss(); } catch (e) {} m.el.remove(); sound.listener = null; duck(false); api.musicDuck(false);
  }
  function mountViewmodel() { if (!M) return; disposeGun(M.vm.gun); M.vm.gun = buildGun(M.P.cur, equipped(M.P.cur)); M.vm.root.add(M.vm.gun.group); M.magS.x = 0; M.magS.v = 0; M.slideS.x = 0; M.boltS.x = 0; }
  function look(dx, dy, mul) {
    const P = M.P; if (!P || P.dead || M.phase === 'end') return; const W = wep(P);
    let k = (PS.cfg.sens || 10) / 10 * 0.0022 * mul; if (P.scoped && W.scope) k *= W.scope.sensMul || 0.35; if (M.friction) k *= 0.6;
    const dyaw = -dx * k, dpitch = -dy * k * (PS.cfg.invert ? -1 : 1);
    P.yaw += dyaw; P.pitch = clamp(P.pitch + dpitch, -1.55, 1.55); M.vm.rot.y.v -= dyaw * 18; M.vm.rot.x.v -= dpitch * 18;
  }
  function frictionCheck() {                                                                                      // touch only: the look slows near a visible enemy, never pulls
    const P = M.P; M.friction = false; if (!PS.cfg.friction || P.dead) return; const dir = aimDirOf(P), eye = eyeOf(P), c = new THREE.Vector3();
    for (const b of M.bots) { if (b.dead) continue; c.set(b.pos.x - eye.x, b.pos.y + 1.0 - eye.y, b.pos.z - eye.z); const d = c.length(); if (d < 0.5) continue; c.multiplyScalar(1 / d); if (Math.acos(clamp(dir.dot(c), -1, 1)) < 3 * DEG && segmentClear(M.cols, eye, new THREE.Vector3(b.pos.x, b.pos.y + 1.0, b.pos.z))) { M.friction = true; if (!PS.seenTouch) { PS.seenTouch = true; api.persist(); centerToast(L('touchFriction', 'aim slows near targets. everyone gets that.')); } return; } }
  }
  function bindTouch(el, cv) {
    const I = M.input, S = M.stick, LK = M.look, H = M.hud;
    const stickSet = (dx, dy) => { const d = Math.hypot(dx, dy), k = d > S.R ? S.R / d : 1; dx *= k; dy *= k; H.nub.style.transform = `translate(${dx}px,${dy}px)`; I.f = Math.max(0, -dy / S.R); I.b = Math.max(0, dy / S.R); I.l = Math.max(0, -dx / S.R); I.r = Math.max(0, dx / S.R); S.full = d > S.R * 0.9 ? S.full : 0; };
    cv.addEventListener('pointerdown', e => {
      if (!M || e.pointerType !== 'touch') return; e.preventDefault(); const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (M.phase === 'load') { beginCountdown(); H.prompt.classList.remove('on'); return; }
      if (M.paused || M.phase === 'end') return;
      if (x < r.width * 0.45 && S.id < 0) { S.id = e.pointerId; S.x = x; S.y = y; H.stick.style.left = x + 'px'; H.stick.style.top = y + 'px'; H.stick.classList.add('on'); stickSet(0, 0); try { cv.setPointerCapture(e.pointerId); } catch (_) {} return; }
      if (LK.id < 0) { LK.id = e.pointerId; LK.x = e.clientX; LK.y = e.clientY; LK.moved = 0; LK.t0 = performance.now(); try { cv.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    cv.addEventListener('pointermove', e => {
      if (!M) return;
      if (e.pointerId === S.id) { const r = cv.getBoundingClientRect(); stickSet(e.clientX - r.left - S.x, e.clientY - r.top - S.y); return; }
      if (e.pointerId !== LK.id) return; const dx = e.clientX - LK.x, dy = e.clientY - LK.y; LK.x = e.clientX; LK.y = e.clientY; LK.moved += Math.abs(dx) + Math.abs(dy); if (!M.paused) look(dx, dy, 1.6);
    });
    const end = e => { if (!M) return; if (e.pointerId === S.id) { S.id = -1; H.stick.classList.remove('on'); I.f = I.b = I.l = I.r = 0; I.sprint = 0; S.full = 0; } if (e.pointerId === LK.id) { LK.id = -1; if (PS.cfg.tapFire && LK.moved < 8 && performance.now() - LK.t0 < 180 && !M.paused) M.tapFire = 2; } };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    const tb = (name, down, up) => { const b = H.tbs[name]; b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); down(); }); const rel = e => { b.classList.remove('down'); if (up) up(); }; b.addEventListener('pointerup', rel); b.addEventListener('pointercancel', rel); b.addEventListener('pointerleave', rel); };
    tb('fire', () => { I.fire = 1; }, () => { I.fire = 0; }); tb('jump', () => { I.jump = 1; }, () => { I.jump = 0; }); tb('reload', () => { I.reload = 1; }, () => { I.reload = 0; });
    tb('ads', () => { I.ads = 1; }, () => { I.ads = 0; }); tb('swap', () => { if (M.P && !M.P.dead) cycleWeapon(M.P, 1); }); tb('crouch', () => { I.crouch = I.crouch ? 0 : 1; H.tbs.crouch.classList.toggle('on', !!I.crouch); });
    tb('score', () => { I.score = 1; }, () => { I.score = 0; }); tb('menu', () => { escape(); });
  }
  /* pause / resume / countdown / leaving */
  function pauseGame() { if (!M || M.paused) return; M.paused = true; M.leaveArmed = false; M.escT = performance.now(); M.hud.pause.querySelector('.pnote').textContent = ''; M.hud.pause.classList.add('on'); clearInput(); api.musicDuck(false); }
  function resumeGame() { if (!M || !M.paused) return; if (M.portrait) return; M.paused = false; M.hud.pause.classList.remove('on'); M.leaveArmed = false; M.escT = 0; api.musicDuck(true); M.lastT = performance.now(); }
  function beginCountdown() { if (!M || M.phase !== 'load') return; M.phase = 'count'; M.countT = 3; M.hud.prompt.classList.remove('on'); centerBig(LA('countdown', ['3', '2', '1'])[0] || '3', 1.2); }
  function countTick(n) { const arr = LA('countdown', ['3', '2', '1']); if (n >= 1) { centerBig(arr[3 - n] || String(n), 1.2); if (n <= 2) psfx('count'); } }
  function leaveMatch() { if (!M) return; finishStats(false); toLauncher(); }
  function toLauncher() { unmountMatch(); if (launcher) paintTab(); api.musicDuck(false); }

  /* the sim step: everything that moves, at 60 Hz */
  function simStep(dt) {
    if (!M) return;
    if (M.phase === 'end') { M.endT += dt; if (!M.endShown && M.endT >= 1.2) showEnd(); for (const b of M.bots) b.animate(dt); stepCamera(dt); return; }
    if (M.paused || M.phase === 'load') { stepCamera(dt); return; }
    if (M.phase === 'count') {
      const before = Math.ceil(M.countT); M.countT -= dt; const after = Math.ceil(M.countT); if (after !== before && after >= 1) countTick(after);
      if (M.countT <= 0) { M.phase = 'play'; M.vm.tgt.y = 0; centerBig(L('go', 'go'), 0.8); psfx('start'); }
      for (const b of M.bots) b.animate(dt); stepCamera(dt); return;
    }
    M.time += dt; M.nav.decay(dt);
    if (M.time >= M.limit && !M.sudden) { const st = standings(); if (st.length > 1 && st[0].kills === st[1].kills) { M.sudden = true; centerBig(L('suddenDeath', 'sudden death'), 2.5); } else { endMatch(); return; } }
    if (M.tapFire > 0) { M.input.fire = 1; if (--M.tapFire === 0) M.tapFireOff = true; } else if (M.tapFireOff) { M.input.fire = 0; M.tapFireOff = false; }
    if (isTouch) { const S = M.stick; if (S.id >= 0 && (M.input.f > 0.9 || Math.hypot(M.input.r - M.input.l, M.input.b - M.input.f) > 0.9)) { S.full += dt; M.input.sprint = S.full > 0.5 ? 1 : 0; } else { S.full = 0; M.input.sprint = 0; } }
    stepPlayer(dt); if (!M) return;
    for (const b of M.bots) { b.simulate(dt); if (!M) return; }
    for (const b of M.bots) b.animate(dt);
    stepCrates(dt); M.world.casings.step(dt); M.world.crumbs.step(dt); stepCamera(dt);
    if (isTouch) frictionCheck();
  }
  function stepCamera(dt) {
    const P = M.P, vm = M.vm, sprinting = P.sprint && !P.dead;
    springTo(M.rec.pitch, 0, dt); springTo(M.rec.yaw, 0, dt); springTo(M.kick.pitch, 0, dt); springTo(M.kick.roll, 0, dt); springTo(M.bob, 0, dt);
    springTo(M.eyeS, P.crouch ? 1.05 : 1.6, dt); springTo(M.fov, M.fovT, dt); springTo(M.slump, M.slumpT, dt); springTo(M.roll, M.rollT, dt); springTo(M.vigS, 0, dt); springTo(M.hpWob, 0, dt); springTo(M.hpShow, P.hp, dt); springTo(M.hm, 1, dt);
    const tx = vm.tgt.x + (sprinting ? 0.06 : 0) + (P.switching ? 0 : 0), ty = vm.tgt.y + (P.switching || P.dead || M.phase === 'end' || M.phase === 'count' ? -0.5 : 0) + (sprinting ? -0.04 : 0), tz = vm.tgt.z + (sprinting ? 0.04 : 0);
    vm.nudgeT -= dt; if (vm.nudgeT <= 0) { vm.nudgeT = 1.2; vm.rot.x.v += (M.rng() - 0.5) * 0.04; vm.rot.z.v += (M.rng() - 0.5) * 0.04; vm.pos.x.v += (M.rng() - 0.5) * 0.02; vm.pos.y.v += (M.rng() - 0.5) * 0.02; }
    springTo(vm.pos.x, tx, dt); springTo(vm.pos.y, ty, dt); springTo(vm.pos.z, tz, dt); springTo(vm.rot.x, 0, dt); springTo(vm.rot.y, 0, dt); springTo(vm.rot.z, 0, dt);
    springTo(M.magS, M.magT, dt); springTo(M.slideS, P.guns.glock && P.guns.glock.lock && P.cur === 'glock' ? -0.03 : 0, dt); springTo(M.boltS, 0, dt);
    M.hmT -= dt; M.arrowT -= dt; M.xhFlash -= dt; M.centerT -= dt; M.bigT -= dt; M.boardT -= dt;
    for (const f of M.feedEls) { f.t -= dt; springTo(f.s, 0, dt); }
    while (M.feedEls.length && M.feedEls[0].t <= 0) M.feedEls.shift().el.remove();
  }
  function renderFrame(dt) {
    const P = M.P, cam = M.camera, vm = M.vm, H = M.hud;
    cam.position.set(P.pos.x, P.pos.y + M.eyeS.x + M.bob.x + M.slump.x, P.pos.z);
    cam.rotation.set(P.pitch + M.rec.pitch.x + M.kick.pitch.x + (P.dead ? 0.26 : 0), P.yaw + M.rec.yaw.x, M.roll.x + M.kick.roll.x, 'YXZ');
    if (Math.abs(cam.fov - M.fov.x) > 0.05) { cam.fov = M.fov.x; cam.updateProjectionMatrix(); }
    vm.root.position.set(0.2 + vm.pos.x.x, -0.2 + vm.pos.y.x, -0.45 + vm.pos.z.x); vm.root.rotation.set(vm.rot.x.x, Math.PI + vm.rot.y.x, vm.rot.z.x);
    if (vm.gun) { if (vm.gun.mag) vm.gun.mag.position.y = M.magS.x; if (vm.gun.slide) vm.gun.slide.position.z = M.slideS.x; if (vm.gun.bolt) vm.gun.bolt.position.z = M.boltS.x * 0.03; }
    if (sound.listener) sound.listener.yaw = P.yaw;
    updateHud(dt);
    M.renderer.render(M.scene, cam);
  }
  const setText = (el, s) => { if (el.textContent !== s) el.textContent = s; };
  function updateHud(dt) {
    const P = M.P, H = M.hud, W = wep(P), s = gunOf(P), left = M.limit - M.time;
    setText(H.clkN, M.sudden ? L('suddenDeath', 'sudden death') : fmtTime(left)); H.clk.classList.toggle('low', left < 30 && !M.sudden);
    const top = standings()[0]; setText(H.clkS, `${L('hud.you', 'you')} ${P.kills} · ${L('hud.best', 'best')} ${top.kills} (${top.name})`);
    if (M.loading) { M.loading = false; H.prompt.querySelector('p').textContent = M.trainingText || ''; }
    const hp = Math.round(clamp(M.hpShow.x, 0, 100)); setText(H.hpN, String(hp)); H.hpBar.style.width = clamp(P.hp, 0, 100) + '%'; H.hp.classList.toggle('low', P.hp < 30); H.hpN.style.transform = `translateX(${M.hpWob.x.toFixed(1)}px)`;
    if (W.melee) { setText(H.mag, '—'); setText(H.res, ''); } else { setText(H.mag, String(s.mag)); setText(H.res, '| ' + s.reserve); }
    H.am.classList.toggle('empty', !W.melee && s.mag <= 0); setText(H.wName, weaponName(P.cur)); const sk = equipped(P.cur); setText(H.sName, sk.rarity === 'stock' ? '' : sk.name || '');
    setText(H.amMsg, W.melee ? '' : s.reload ? '' : s.mag <= 0 && s.reserve <= 0 ? L('hud.dry', 'no ammo. find a crate.') : s.mag <= 0 ? L('hud.reload', 'reload') : (M.ammoMsg && s.mag > 0 ? '' : M.ammoMsg)); if (s.mag > 0) M.ammoMsg = '';
    if (s.reload) { H.rl.style.display = 'block'; H.rlI.style.width = clamp(s.reload.t / ((W.reload && W.reload.total) || 2), 0, 1) * 100 + '%'; } else H.rl.style.display = 'none';
    const spread = P.scoped && W.scope ? 0 : (W.spread ? W.spread.base : 0) + s.spread; H.xh.style.setProperty('--g', (6 + spread * 14 * (M.frameH / 800)).toFixed(1) + 'px'); H.xh.style.setProperty('--xc', M.xhFlash > 0 ? '#e10600' : ({ red: '#e10600', white: '#f3ecdc', green: '#3ad86a', cyan: '#3ad8e8' })[PS.cfg.xhair] || '#e10600');
    H.hm.style.opacity = M.hmT > 0 ? '1' : '0'; if (M.hmT > 0) H.hm.style.transform = `scale(${M.hm.x.toFixed(3)})`;
    H.vig.style.opacity = clamp(M.vigS.x + (P.hp < 30 && !P.dead ? 0.25 : 0), 0, 0.9).toFixed(3);
    if (M.arrowT > 0) { const dx = M.arrowFrom.x - P.pos.x, dz = M.arrowFrom.z - P.pos.z, ang = Math.atan2(dx, -dz) + P.yaw; H.arrow.style.opacity = (M.arrowT / 0.8).toFixed(2); H.arrow.style.transform = `rotate(${(ang / DEG).toFixed(1)}deg)`; } else H.arrow.style.opacity = '0';
    if (M.bigT <= 0 && H.big.textContent) H.big.textContent = ''; if (M.centerT <= 0 && H.ctr.textContent) H.ctr.textContent = '';
    if (P.dead) setText(H.deathN, fmt(L('respawnIn', 'respawn in {n}'), { n: Math.max(1, Math.ceil(P.deadT)) }));
    for (const f of M.feedEls) { f.el.style.transform = `translateX(${f.s.x.toFixed(1)}px)`; if (f.t < 0.6) f.el.style.opacity = (f.t / 0.6).toFixed(2); }
    const board = !!M.input.score && M.phase !== 'end'; if (board !== H.board.classList.contains('on')) H.board.classList.toggle('on', board); if (board && M.boardT <= 0) { M.boardT = 0.25; H.board.querySelector('.tbl').innerHTML = tableHtml(false); }
    if (isTouch) { const ads = H.tbs.ads, want = P.cur === 'knife' ? 'stab' : W.scope ? 'scope' : ''; if (ads.style.display !== (want ? '' : 'none')) ads.style.display = want ? '' : 'none'; if (want && ads.textContent !== want) ads.textContent = want; H.tbs.reload.classList.toggle('dim', W.melee || s.mag > (W.mag || 0) * 0.5); }
  }
  function centerToast(text) { M.hud.ctr.textContent = text; M.centerT = 2.2; }
  function centerBig(text, dur) { M.hud.big.textContent = text; M.bigT = dur; }
  function hitMarker(head) { M.hmT = 0.25; M.hm.x = 1.6; M.hm.v = 0; M.hud.hm.classList.toggle('head', !!head); }
  function feedLine(text, cls) { if (!M) return; const d = document.createElement('div'); if (cls) d.className = cls; d.textContent = text; M.hud.feed.appendChild(d); const s = spring(120, 12); s.x = 40; M.feedEls.push({ el: d, t: 5, s }); while (M.feedEls.length > 6) M.feedEls.shift().el.remove(); }
  const standings = () => M.all.slice().sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  function tableHtml(final) {
    const rows = standings().map((p, i) => `<tr class="${p.isPlayer ? 'me' : ''}"><td>${i + 1}</td><td>${esc(p.name)}</td><td class="r">${p.kills}</td><td class="r">${p.deaths}</td><td class="r">${(p.kills / Math.max(1, p.deaths)).toFixed(2)}</td><td class="r">${p.bestStreak}</td><td>${esc(weaponName(p.isPlayer ? p.primary : p.primary))}</td></tr>`).join('');
    const c = k => esc(L('hud.cols.' + k, k));
    return `<table><tr><th>#</th><th>${c('name')}</th><th class="r">${c('kills')}</th><th class="r">${c('deaths')}</th><th class="r">${c('kd')}</th><th class="r">${c('streak')}</th><th>${c('weapon')}</th></tr>${rows}</table>`;
  }
  function endMatch() {
    if (!M || M.phase === 'end') return; M.phase = 'end'; M.endT = 0; M.endShown = false; M.vm.tgt.y = -0.5; M.hud.xh.classList.add('off'); M.hud.scope.classList.remove('on'); M.hud.death.classList.remove('on'); M.hud.board.classList.remove('on'); M.P.scoped = false; M.fovT = PS.cfg.fov || 80; clearInput();
    psfx('endWhistle'); if (M.locked) { try { document.exitPointerLock(); } catch (e) {} }
    const st = standings(); M.place = st.indexOf(M.P) + 1; const place = M.place, n = st.length;
    setTimeout(() => { if (!M || M.phase !== 'end') return; psfx(place === 1 ? 'endWin' : place === n ? 'endLose' : 'endMid'); }, 800);
    finishStats(place === 1); api.musicDuck(false);
  }
  function finishStats(won) {
    if (!M || M.statsDone) return; M.statsDone = true; const S = PS.stats, P = M.P; S.matches++; if (won) S.wins++; S.timeMs += Math.round(M.time * 1000); S.deaths += P.deaths; M.records = [];
    if (P.kills > (S.bestKills | 0)) { S.bestKills = P.kills; M.records.push(fmt(L('records', 'new best: {n} kills'), { n: P.kills })); }
    if (P.bestStreak > (S.bestStreak | 0)) { S.bestStreak = P.bestStreak; M.records.push(fmt(L('recordStreak', 'new best streak: {n}'), { n: P.bestStreak })); }
    signPS(); try { api.scores.score('pitty', P.kills); api.scores.play('pitty', Math.round(M.time * 1000)); api.scores.tally('pitty-matches', 1); } catch (e) {}   // the tally goes to its own id: yczTally adds into the same `best` slot yczScore keeps, so on 'pitty' it would turn the record into kills + matches
  }
  function showEnd() {
    M.endShown = true; const H = M.hud, n = M.all.length; H.end.querySelector('.placed').textContent = fmt(L('placed', 'you placed {n} of {m}'), { n: ordinal(M.place), m: n });
    H.end.querySelector('.tbl').innerHTML = tableHtml(true); H.end.querySelector('.recs').innerHTML = M.records.map(r => `<div class="rec">${esc(r)}</div>`).join(''); H.end.classList.add('on');
  }
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  function loop(now) {
    if (!M) return; M.raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, Math.max(0, (now - M.lastT) / 1000)); M.lastT = now; M.acc += dt; let n = 0;
    while (M && M.acc >= STEP && n < 5) { simStep(STEP); if (!M) return; M.acc -= STEP; n++; } if (M && n === 5) M.acc = 0;
    if (M) renderFrame(dt);
  }

  /* ── the launcher: a 2009 game launcher in a 2009 window. left nav, right pane; the match takes the whole bezel over it ── */
  const TABS = ['play', 'cases', 'inventory', 'stats', 'settings', 'quit'];
  const tabLabel = (i, k) => { const arr = LA('launcher.tabs', null); return (arr && arr[i]) || k; };
  function paintLauncher() {
    if (!win) return; ensureStyle(); const body = win.body; body.innerHTML = ''; launcher = document.createElement('div'); launcher.id = 'ps-launcher';
    launcher.innerHTML = `<div class="hd"><span class="wm">${esc(L('launcher.wordmark', 'PITTY STRIKER'))}</span><span class="ver">${esc(L('launcher.version', 'v1.0'))}</span><span class="cash">$${api.cash()}</span></div><div class="main"><nav>${TABS.map((k, i) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${esc(tabLabel(i, k))}</button>`).join('')}<div class="sp"></div></nav><div class="pane"></div></div>`;
    body.appendChild(launcher);
    launcher.querySelectorAll('nav button').forEach(b => { b.onclick = () => { psfx('uiClick'); if (b.dataset.t === 'quit') { quit(); return; } tab = b.dataset.t; paintTab(); }; });
    paintTab();
  }
  function paintTab() {
    if (!launcher) return; launcher.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.t === tab)); launcher.querySelector('.cash').textContent = '$' + api.cash();
    const pane = launcher.querySelector('.pane'); stopPreview(); REEL = null;
    if (tab === 'play') paintPlay(pane); else if (tab === 'cases') paintCases(pane); else if (tab === 'inventory') paintInventory(pane); else if (tab === 'stats') paintStats(pane); else if (tab === 'settings') paintSettings(pane);
  }
  function paintPlay(pane) {
    const LP = 'launcher.play.', sk = equipped(PS.loadout);
    pane.innerHTML = `<h2>${esc(L(LP + 'title', 'deathmatch · sandstone'))}</h2>
      <div class="row"><span class="lbl">${esc(L(LP + 'bots', 'bots'))}</span><span class="seg" data-k="bots">${[3, 4, 5, 6, 7].map(n => `<button data-v="${n}" class="${PS.bots === n ? 'on' : ''}">${n}</button>`).join('')}</span></div>
      <div class="row"><span class="lbl">${esc(L(LP + 'diff', 'difficulty'))}</span><span class="seg" data-k="diff">${['easy', 'normal', 'hard'].map(d => `<button data-v="${d}" class="${PS.diff === d ? 'on' : ''}">${esc(L(LP + 'diffs.' + d, d))}</button>`).join('')}</span></div>
      <div class="row" style="align-items:flex-start"><span class="lbl">${esc(L(LP + 'primary', 'primary'))}</span><div><span class="seg" data-k="loadout">${PRIMARIES.map(w => `<button data-v="${w}" class="${PS.loadout === w ? 'on' : ''}">${esc(weaponName(w))}</button>`).join('')}</span>
        <div class="mut" style="margin-top:8px">${esc(L(LP + 'skin', 'skin'))}: <b style="color:${rarColor(sk.rarity)}">${esc(sk.name || 'stock')}</b></div></div><canvas class="prev" width="260" height="150"></canvas></div>
      <div class="row"><button class="pc-btn go pbig" id="ps-play">${esc(L(LP + 'go', 'play'))}</button><span class="mut">${esc(L(LP + 'small', 'first to 20 or 5:00. glock and knife always come along.'))}</span></div>`;
    pane.querySelectorAll('.seg button').forEach(b => { b.onclick = () => { const k = b.closest('.seg').dataset.k; PS[k] = k === 'bots' ? +b.dataset.v : b.dataset.v; api.persist(); psfx('uiClick'); paintPlay(pane); }; });
    pane.querySelector('#ps-play').onclick = () => { psfx('uiClick'); startMatch({ diff: PS.diff, bots: PS.bots, loadout: PS.loadout }); };
    startPreview(pane.querySelector('canvas.prev'), PS.loadout, sk);
  }
  /* the gun preview: a tiny renderer of its own, the gun turning on a velocity that a nudge kicks every two seconds; drag to turn it */
  let PV = null, REEL = null, uiRaf = 0, uiLast = 0;
  function startPreview(cv, wid, skin) {
    stopPreview(); if (!cv) return;
    try {
      const w = cv.clientWidth || 260, h = cv.clientHeight || 150, r = new THREE.WebGLRenderer({ canvas: cv, antialias: !isTouch, alpha: true }); r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); r.setSize(w, h, false);
      const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, w / h, 0.01, 20); cam.position.set(0, 0.16, 1.15); cam.lookAt(0, 0, 0);
      sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1)); const dl = new THREE.DirectionalLight(0xfff1d6, 1.6); dl.position.set(2, 3, 2); sc.add(dl);
      const gun = buildGun(wid, skin), pivot = new THREE.Group(); sc.add(pivot); pivot.add(gun.group);
      const bb = new THREE.Box3().setFromObject(gun.group), c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3()); gun.group.position.sub(c); pivot.scale.setScalar(0.8 / Math.max(size.x, size.y, size.z, 0.05)); pivot.rotation.x = 0.12;
      PV = { r, sc, cam, gun, pivot, spin: spring(0, 1.4), nudgeT: 0.4, drag: null, cv }; PV.spin.x = 0.9; PV.spin.v = 1.5;
      cv.onpointerdown = e => { if (!PV) return; PV.drag = { x: e.clientX, y: PV.spin.x }; try { cv.setPointerCapture(e.pointerId); } catch (_) {} };
      cv.onpointermove = e => { if (PV && PV.drag) { PV.spin.x = PV.drag.y + (e.clientX - PV.drag.x) * 0.02; PV.spin.v = 0; } };
      cv.onpointerup = cv.onpointercancel = () => { if (PV) PV.drag = null; };
      ensureUiLoop();
    } catch (e) { PV = null; }
  }
  function stopPreview() { if (!PV) return; const p = PV; PV = null; disposeGun(p.gun); p.r.dispose(); try { p.r.forceContextLoss(); } catch (e) {} }
  function pvStep(dt) { const p = PV; if (!p.drag) { p.nudgeT -= dt; if (p.nudgeT <= 0) { p.nudgeT = 2; p.spin.v += 1.4; } springTo(p.spin, p.spin.x, dt); } p.pivot.rotation.y = p.spin.x; p.r.render(p.sc, p.cam); }
  function ensureUiLoop() { if (!uiRaf) { uiLast = performance.now(); uiRaf = requestAnimationFrame(uiLoop); } }
  function uiLoop(now) { uiRaf = 0; if (!active) return; const dt = Math.min(0.1, Math.max(0, (now - uiLast) / 1000)); uiLast = now; if (PV) pvStep(dt); if (REEL && !REEL.done) reelStep(dt); if (PV || (REEL && !REEL.done)) uiRaf = requestAnimationFrame(uiLoop); }

  /* ── cases: one case, bought with cash; a reel that lands on the rolled skin; duplicates become scrap, eight scrap is a case ── */
  const theCase = () => CASES.pitty || Object.values(CASES)[0] || { id: 'pitty', name: 'pitty case', price: 80, odds: {}, scrapPerCase: 8 };
  function paintCases(pane) {
    const C = theCase(), LP = 'launcher.cases.', per = C.scrapPerCase || 8, odds = C.odds || {};
    pane.innerHTML = `<h2>${esc(L(LP + 'title', 'cases'))}</h2>
      <div class="panel"><div class="row" style="justify-content:space-between"><b style="font-size:16px">${esc(C.name || 'pitty case')}</b><b style="color:#9be08a">${esc(fmt(L(LP + 'cash', '${n}'), { n: '$' + api.cash() }))}</b></div>
        <table><tr>${Object.keys(odds).map(r => `<th style="color:${rarColor(r)}">${esc((RARITY[r] && RARITY[r].label) || r)}</th>`).join('')}</tr><tr>${Object.keys(odds).map(r => `<td>${Math.round(odds[r] * 100)}%</td>`).join('')}</tr></table>
        <div class="row"><button class="pc-btn go pbig" id="ps-open">${esc(fmt(L(LP + 'open', 'open · ${p}'), { p: '$' + C.price }))}</button><span class="mut" id="ps-scrap">${esc(fmt(L(LP + 'scrap', 'scrap {n}/8'), { n: PS.scrap | 0 }))}</span><button class="pc-btn" id="ps-recycle" ${(PS.scrap | 0) >= per ? '' : 'disabled'}>${esc(L(LP + 'recycle', 'recycle'))}</button><span class="mut" id="ps-casemsg"></span></div></div>
      <div class="creel" id="ps-reel" style="display:none"><div class="mk"></div><div class="strip"></div></div><div id="ps-result"></div>
      <div class="panel"><div class="mut">${esc(L(LP + 'last', 'last drops'))}</div><div class="cards" id="ps-drops">${drops.map(d => skinCard(d.skinObj, { small: true, dup: d.duplicate })).join('') || `<span class="mut">${esc(L(LP + 'none', 'nothing yet'))}</span>`}</div></div>`;
    pane.querySelector('#ps-open').onclick = () => openCaseUI(false); pane.querySelector('#ps-recycle').onclick = () => openCaseUI(true);
  }
  const caseMsg = t => { const m = launcher && launcher.querySelector('#ps-casemsg'); if (m) m.textContent = t; };
  function doOpenCase(free, rnd) {
    const C = theCase(), per = C.scrapPerCase || 8;
    if (free) { if ((PS.scrap | 0) < per) return null; PS.scrap -= per; }
    else { if (api.cash() < C.price) { caseMsg(fmt(L('notEnough', 'not enough. ${p}.'), { p: '$' + C.price })); psfx('uiNo'); return null; } api.addCash(-C.price); }
    const r = rollCase(C.id || 'pitty', rnd || Math.random) || {}, id = typeof r.skin === 'string' ? r.skin : r.skin && r.skin.id, skinObj = skinById(id) || SKINS.find(s => s.rarity !== 'stock') || SKINS[0];
    if (!skinObj) return null;
    const duplicate = PS.owned.includes(skinObj.id); if (duplicate) PS.scrap = (PS.scrap | 0) + 1; else PS.owned.push(skinObj.id); PS.cases = (PS.cases | 0) + 1; signPS();
    const out = { skin: skinObj.id, rarity: r.rarity || skinObj.rarity, duplicate, skinObj }; drops.unshift(out); if (drops.length > 5) drops.pop(); return out;
  }
  function openCaseUI(free) {
    if (REEL && !REEL.done) return; const res = doOpenCase(free, null); if (!res) return; psfx('uiClick');
    launcher.querySelector('.cash').textContent = '$' + api.cash(); const pane = launcher.querySelector('.pane'); pane.querySelector('#ps-open').disabled = true; pane.querySelector('#ps-recycle').disabled = true;
    const el = pane.querySelector('#ps-reel'), strip = el.querySelector('.strip'); el.style.display = ''; el.classList.remove('land');
    const N = 40, WIN = 33, PITCH = 102, rare = ['common', 'uncommon', 'rare', 'legendary', 'knife'], cards = [];
    const filler = () => { const r = Math.random(), rar = r < 0.55 ? rare[0] : r < 0.8 ? rare[1] : r < 0.93 ? rare[2] : r < 0.99 ? rare[3] : rare[4], pool = SKINS.filter(s => s.rarity === rar); return pool.length ? pick(pool) : (SKINS[Math.floor(Math.random() * SKINS.length)] || res.skinObj); };
    for (let i = 0; i < N; i++) cards.push(i === WIN ? res.skinObj : filler());
    strip.innerHTML = cards.map((s, i) => `<div class="rc ${i === WIN ? 'hit' : ''}" style="--rar:${rarColor(s.rarity)}"><div class="sw" style="background:${skinCss(s)}"></div><b>${esc(s.name)}</b><br><small>${esc(weaponName(s.weapon))}</small></div>`).join('');
    pane.querySelector('#ps-result').innerHTML = `<div class="row"><button class="pc-btn" id="ps-skip">${esc(L('launcher.cases.skip', 'skip'))}</button></div>`; pane.querySelector('#ps-skip').onclick = () => finishReel();
    REEL = { el, strip, s: spring(3.2, 3.0), target: WIN * PITCH + 48 + (Math.random() - 0.5) * 60, pitch: PITCH, lastIdx: -1, done: false, res, t: 0 }; REEL.s.v = 2400;
    ensureUiLoop();
  }
  function reelStep(dt) {
    const R = REEL; R.t += dt; springTo(R.s, R.target, dt); const x = R.s.x; R.strip.style.transform = `translateX(${(-x).toFixed(1)}px)`;
    const idx = Math.floor(x / R.pitch); if (idx !== R.lastIdx) { R.lastIdx = idx; if (R.t > 0.03) psfx('reelTick'); }
    if ((Math.abs(R.s.v) < 4 && Math.abs(R.target - x) < 1.5) || R.t > 9) finishReel();
  }
  function finishReel() {
    const R = REEL; if (!R || R.done) return; R.done = true; R.s.x = R.target; R.s.v = 0; R.strip.style.transform = `translateX(${(-R.target).toFixed(1)}px)`; R.el.classList.add('land');
    const rar = R.res.rarity; psfx(rar === 'legendary' || rar === 'knife' ? 'revealLegendary' : rar === 'rare' || rar === 'uncommon' ? 'revealRare' : 'revealCommon');
    const pane = launcher && launcher.querySelector('.pane'); if (!pane) return; const s = R.res.skinObj, LP = 'launcher.cases.';
    pane.querySelector('#ps-result').innerHTML = `<div class="panel res">${skinCard(s, { small: true, dup: R.res.duplicate })}<div><p><b style="color:${rarColor(s.rarity)}">${esc(s.name)}</b> · ${esc(weaponName(s.weapon))} · ${esc((RARITY[s.rarity] && RARITY[s.rarity].label) || s.rarity)}</p><p class="mut">${esc(R.res.duplicate ? L(LP + 'duplicate', 'duplicate. +1 scrap.') : (s.desc || ''))}</p><div class="row"><button class="pc-btn go" id="ps-eq">${esc(L(LP + 'equip', 'equip'))}</button><button class="pc-btn" id="ps-later">${esc(L(LP + 'later', 'later'))}</button></div></div></div>`;
    pane.querySelector('#ps-eq').onclick = () => { equipSkin(s.id); paintCases(pane); }; pane.querySelector('#ps-later').onclick = () => paintCases(pane);
    pane.querySelector('#ps-open').disabled = false; pane.querySelector('#ps-recycle').disabled = (PS.scrap | 0) < (theCase().scrapPerCase || 8); const sp = pane.querySelector('#ps-scrap'); if (sp) sp.textContent = fmt(L(LP + 'scrap', 'scrap {n}/8'), { n: PS.scrap | 0 });
  }
  function skinCard(s, o = {}) {
    if (!s) return ''; const rl = (RARITY[s.rarity] && RARITY[s.rarity].label) || s.rarity;
    return `<div class="sk ${o.eq ? 'eq' : ''}" style="--rar:${rarColor(s.rarity)}"><div class="sw" style="background:${skinCss(s)}"></div><b>${esc(s.name)}</b><span class="r">${esc(weaponName(s.weapon))} · ${esc(rl)}${o.dup ? ' · ' + esc(L('launcher.cases.duplicate', 'duplicate')) : ''}</span>${o.small ? '' : `<div class="d">${esc(s.desc || '')}</div>`}${o.equip ? `<button class="pc-btn" data-eq="${esc(s.id)}" ${o.eq ? 'disabled' : ''}>${esc(o.eq ? L('launcher.inventory.equipped', 'equipped') : L('launcher.inventory.equip', 'equip'))}</button>` : ''}</div>`;
  }
  function equipSkin(id) {
    const s = skinById(id) || (/^stock_/.test(id || '') ? stockSkin(id.slice(6)) : null); if (!s || !owns(s.id)) return false;
    PS.eq[s.weapon] = s.rarity === 'stock' ? null : s.id; signPS(); psfx('uiEquip'); if (M && M.P && M.P.cur === s.weapon) mountViewmodel(); return true;
  }
  function paintInventory(pane) {
    const LP = 'launcher.inventory.', per = theCase().scrapPerCase || 8, total = SKINS.filter(s => s.rarity !== 'stock').length;
    pane.innerHTML = `<h2>${esc(L(LP + 'title', 'inventory'))}</h2><div class="row"><span class="mut">${esc(fmt(L(LP + 'owned', '{n} owned'), { n: PS.owned.length }))} / ${total}</span><span class="mut">${esc(fmt(L(LP + 'scrap', 'scrap {n}'), { n: PS.scrap | 0 }))} / ${per}</span><button class="pc-btn" id="ps-recycle2" ${(PS.scrap | 0) >= per ? '' : 'disabled'}>${esc(L(LP + 'recycle', 'recycle'))}</button></div>` +
      ['knife', 'glock', 'ar', 'ak', 'awp'].map(w => { const list = [stockSkin(w), ...SKINS.filter(s => s.weapon === w && s.rarity !== 'stock' && owns(s.id))], eq = equipped(w).id; return `<div class="panel"><div class="row" style="justify-content:space-between"><b>${esc(weaponName(w))}</b><span class="mut">${list.length - 1} ${esc(L(LP + 'skins', 'skins'))}</span></div><div class="cards">${list.map(s => skinCard(s, { equip: true, eq: eq === s.id })).join('')}</div></div>`; }).join('');
    pane.querySelectorAll('[data-eq]').forEach(b => { b.onclick = () => { equipSkin(b.dataset.eq); paintInventory(pane); }; });
    pane.querySelector('#ps-recycle2').onclick = () => { tab = 'cases'; paintTab(); openCaseUI(true); };
  }
  const fmtDur = ms => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : `${m}m`; };
  function paintStats(pane) {
    const S = PS.stats, ranks = LA('launcher.stats.ranks', [[0, 'rookie'], [50, 'regular'], [200, 'veteran'], [500, 'sharp'], [1200, 'lethal'], [3000, 'legend']]), lab = k => L('launcher.stats.labels.' + k, k);
    let rank = ranks[0][1], next = null; for (const r of ranks) { if ((S.kills | 0) >= r[0]) rank = r[1]; else { next = r; break; } }
    const rows = [['matches', S.matches | 0], ['wins', S.wins | 0], ['kills', S.kills | 0], ['deaths', S.deaths | 0], ['kd', ((S.kills | 0) / Math.max(1, S.deaths | 0)).toFixed(2)], ['heads', S.heads | 0], ['acc', S.shots ? Math.round((S.hits | 0) / S.shots * 100) + '%' : '—'], ['bestKills', S.bestKills | 0], ['bestStreak', S.bestStreak | 0], ['time', fmtDur(S.timeMs | 0)]];
    pane.innerHTML = `<h2>${esc(L('launcher.stats.title', 'stats'))}</h2><div class="panel"><div class="row" style="justify-content:space-between"><span>${esc(lab('rank'))}: <b style="color:#e8c04a">${esc(rank)}</b></span><span class="mut">${next ? esc(fmt(L('launcher.stats.next', 'next: {n} kills'), { n: next[0] - (S.kills | 0) })) : esc(L('launcher.stats.top', ''))}</span></div></div>
      <div class="panel"><table>${rows.map(([k, v]) => `<tr><th>${esc(lab(k))}</th><td>${esc(String(v))}</td></tr>`).join('')}</table></div>
      <div class="panel"><div class="mut">${esc(lab('wk'))}</div><table><tr>${Object.keys(S.wk).map(w => `<th>${esc(weaponName(w))}</th>`).join('')}</tr><tr>${Object.keys(S.wk).map(w => `<td>${S.wk[w] | 0}</td>`).join('')}</tr></table></div>`;
  }
  function paintSettings(pane) {
    const c = PS.cfg, lab = k => L('launcher.settings.' + k, k);
    const seg = (k, opts, cur, name) => `<span class="seg" data-k="${k}">${opts.map(o => `<button data-v="${o}" class="${String(cur) === String(o) ? 'on' : ''}">${esc(name ? name(o) : lab(String(o)))}</button>`).join('')}</span>`;
    const onoff = o => lab(o), sizes = o => L('launcher.settings.sizes.' + o, o), colors = o => L('launcher.settings.colors.' + o, o);
    pane.innerHTML = `<h2>${esc(lab('title'))}</h2>
      <div class="row"><span class="lbl">${esc(lab('sens'))}</span><input type="range" min="3" max="20" step="1" value="${c.sens}" data-k="sens"><b data-out="sens">${c.sens}</b></div>
      <div class="row"><span class="lbl">${esc(lab('fov'))}</span><input type="range" min="70" max="100" step="1" value="${c.fov}" data-k="fov"><b data-out="fov">${c.fov}</b></div>
      <div class="row"><span class="lbl">${esc(lab('scope'))}</span>${seg('scopeHold', ['hold', 'toggle'], c.scopeHold ? 'hold' : 'toggle', o => lab(o === 'hold' ? 'scopeHold' : 'scopeToggle'))}</div>
      <div class="row"><span class="lbl">${esc(lab('invert'))}</span>${seg('invert', ['off', 'on'], c.invert ? 'on' : 'off', onoff)}</div>
      <div class="row"><span class="lbl">${esc(lab('xhair'))}</span>${seg('xhair', ['red', 'white', 'green', 'cyan'], c.xhair, colors)}</div>
      <div class="row"><span class="lbl">${esc(lab('xsize'))}</span>${seg('xsize', [0.75, 1, 1.5], c.xsize, o => sizes({ 0.75: 's', 1: 'm', 1.5: 'l' }[o]))}</div>
      <div class="row"><span class="lbl">${esc(lab('btn'))}</span>${seg('btn', ['s', 'm', 'l'], c.btn, sizes)}</div>
      <div class="row"><span class="lbl">${esc(lab('friction'))}</span>${seg('friction', ['off', 'on'], c.friction ? 'on' : 'off', onoff)}</div>
      <div class="row"><span class="lbl">${esc(lab('tapFire'))}</span>${seg('tapFire', ['off', 'on'], c.tapFire ? 'on' : 'off', onoff)}</div>`;
    pane.querySelectorAll('input[type=range]').forEach(i => { i.oninput = () => { const k = i.dataset.k; c[k] = clamp(+i.value | 0, +i.min, +i.max); pane.querySelector(`[data-out=${k}]`).textContent = c[k]; api.persist(); if (M && k === 'fov' && !M.P.scoped) M.fovT = c.fov; }; });
    pane.querySelectorAll('.seg button').forEach(b => { b.onclick = () => { const k = b.closest('.seg').dataset.k, v = b.dataset.v; if (k === 'scopeHold') c.scopeHold = v === 'hold'; else if (k === 'invert' || k === 'friction' || k === 'tapFire') c[k] = v === 'on'; else if (k === 'xsize') c.xsize = +v; else c[k] = v; api.persist(); psfx('uiClick'); paintSettings(pane); }; });
  }

  /* ── open / close / the Esc chain / the crash gag ── */
  function crashDialog(text, btn, onBtn) {
    const body = win.body; body.innerHTML = `<div id="ps-launcher"><div class="crash"><div class="cdlg"><div class="t">pitty_striker.exe</div><div class="b"><span class="msg">${esc(text)}</span></div><div class="f">${btn ? `<button class="pc-btn" id="ps-try">${esc(btn)}</button>` : ''}</div></div></div></div>`;
    if (btn) body.querySelector('#ps-try').onclick = () => { psfx('uiClick'); onBtn(); };
    return body.querySelector('.msg');
  }
  function startMatch(opts) { if (!PS) loadPS(); stopPreview(); REEL = null; mountMatch(opts || {}); }
  function open(W) {
    if (active && win === W) { if (!M && !launcher) paintLauncher(); return; }
    if (active) close();
    ensureStyle(); win = W; active = true; api.onActive(true); loadPS(); PS.launches = (PS.launches | 0) + 1; api.persist();
    addEventListener('keydown', onKeyDown); addEventListener('keyup', onKeyUp); addEventListener('blur', onBlur); document.addEventListener('visibilitychange', onVis);
    W.body.style.padding = '0'; W.body.style.overflow = 'hidden'; W.body.style.position = 'relative';
    if (PS.launches === 1) {                                                                                     // the first launch crashes. it is kidding. once
      const msg = crashDialog(L('crash', 'pitty_striker.exe has stopped working.'), null);
      setTimeout(() => { if (!active || win !== W) return; msg.className = 'msg fade'; msg.textContent = L('crashKidding', 'kidding. loading.'); requestAnimationFrame(() => msg.classList.add('on')); setTimeout(() => { if (active && win === W && !launcher) paintLauncher(); }, 900); }, 1200);
    } else if (Math.random() < 1 / 40) crashDialog(L('crashReal', 'pitty_striker.exe has stopped working. it does that. try again.'), L('tryAgain', 'try again'), () => paintLauncher());
    else paintLauncher();
  }
  function close() {
    if (!active) return;
    if (M) { if (M.phase === 'play' || M.phase === 'count') finishStats(false); unmountMatch(); }
    stopPreview(); REEL = null; if (uiRaf) { cancelAnimationFrame(uiRaf); uiRaf = 0; }
    if (launcher) { launcher.remove(); launcher = null; } if (win && win.body) win.body.innerHTML = '';
    removeEventListener('keydown', onKeyDown); removeEventListener('keyup', onKeyUp); removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVis);
    disposeFig(); disposeMats(); if (PS) api.persist();
    active = false; win = null; api.musicDuck(false); api.onActive(false);
  }
  function quit() { api.toast(L('closedToast', 'pitty_striker.exe closed. properly. for once.')); const W = win; if (W && W.close) W.close(); else close(); }
  function escape() {
    if (!active) return false;
    if (M) {
      if (M.phase === 'end') { toLauncher(); return true; }
      if (M.phase === 'load') { unmountMatch(); if (launcher) paintTab(); return true; }
      if (!M.paused) { if (M.locked) { try { document.exitPointerLock(); } catch (e) { pauseGame(); } } else pauseGame(); return true; }
      const now = performance.now(); if (now - M.escT < 1500) { leaveMatch(); return true; } M.escT = now; return true;
    }
    if (win) { const W = win; if (W.close) W.close(); else close(); return true; }
    return false;
  }
  const __test = debugOn ? {
    startMatch: o => { if (!PS) loadPS(); startMatch(Object.assign({ test: true }, o || {})); },
    state: () => M ? { phase: M.phase, time: M.time, paused: M.paused, kills: M.P.kills, deaths: M.P.deaths, hp: M.P.hp, ammo: gunOf(M.P).mag, reserve: gunOf(M.P).reserve, weapon: M.P.cur, scoped: M.P.scoped, place: M.place, bots: M.bots.map(b => ({ name: b.name, x: b.pos.x, y: b.pos.y, z: b.pos.z, hp: b.hp, state: b.state, moved: b.moved, unsticks: b.unsticks, kills: b.kills, deaths: b.deaths, dead: b.dead })), player: { x: M.P.pos.x, y: M.P.pos.y, z: M.P.pos.z, yaw: M.P.yaw, pitch: M.P.pitch, dead: M.P.dead } } : null,
    get input() { return M ? M.input : null; },
    look: (dy, dp) => { if (M) { M.P.yaw += dy; M.P.pitch = clamp(M.P.pitch + (dp || 0), -1.55, 1.55); } },
    fire: () => { if (M && M.P) return tryFire(M.P, true); return false; },
    tick: s => { const n = Math.max(1, Math.round((s || STEP) * 60)); for (let i = 0; i < n && M; i++) simStep(STEP); if (M) renderFrame(STEP); },
    openCase: rnd => { if (!PS) loadPS(); const r = doOpenCase(false, rnd); return r ? { skin: r.skin, rarity: r.rarity, duplicate: r.duplicate } : null; },
    equip: id => equipSkin(id), recycle: () => { if (!PS) loadPS(); const r = doOpenCase(true, null); return r ? { skin: r.skin, rarity: r.rarity, duplicate: r.duplicate } : null; },
    lines: () => flattenLines(LINES), sfxLog: sound.log, paintTab: () => paintTab(), setTab: t => { tab = t; paintTab(); },
    get match() { return M; }, get ps() { return PS; }, draws: () => M ? M.renderer.info.render.calls : 0,
  } : undefined;
  return { open, close, escape, get active() { return active; }, get inMatch() { return !!M; }, __test };
}
