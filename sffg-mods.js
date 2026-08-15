/* ═══════════════════════════════════════════════════════════════════
   SFFG — community fighter format (v2) · shared by fight.html & create.html

   A community fighter is PURE DATA: stats, frame data, hitboxes, sprite
   strip metadata and optional passives/projectiles. There is no code in
   a mod and none is ever executed — that is the sandbox. Everything is
   whitelisted, typed and clamped by validateMod() below; unknown fields
   are dropped. Matchup fields (weakTo etc.) are reserved for the
   official roster and are stripped from community data.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const LIM={
  name:[3,24], tagline:[0,60],
  hp:[400,2000], walk:[30,130], back:[20,110],
  jumpVX:[20,110], jumpVY:[-340,-160], grav:[8,24],
  w:[30,90], h:[100,200], crouchH:[60,160],
  dmg:[5,400], startup:[2,40], active:[1,20], recovery:[3,60],
  hitstun:[4,45], blockstun:[2,30], hitstop:[0,18],
  kbx:[-260,260], kby:[-340,-60], step:[0,180],
  boxX:[-40,80], boxY:[-220,0], boxW:[10,260], boxH:[10,220],
  impact:[0,30],
  projSpeed:[30,260], projLife:[20,120], projW:[8,80], projH:[8,80],
  regen:[0,4],            /* hp per second */
  defense:[70,130],       /* % damage taken */
  meterMult:[50,200],     /* % meter gain */
  scale:[0.1,6], idleTop:[0,400],
  animN:[1,24], animCell:[8,1400],
};
const MOVE_KEYS=['light','heavy','special','clight','cheavy','air','throw','super'];
const REQUIRED_MOVES=['light','heavy','special','air','throw','super'];
const ANIM_KEYS=['idle','run','walkback','dash','backdash','jump','fall',
  'attack1','attack2','attack3','attack4','special','super','clight','cheavy',
  'airatk','hit','block','death','getup','crouch'];
const REQUIRED_ANIMS=['idle','run','jump','fall','attack1','attack2','hit','death'];
const HITS_VALUES=['mid','low','high'];
const MAX_JSON_BYTES=60000;

const isNum=v=>typeof v==='number'&&isFinite(v);
function clamp(v,[a,b]){return Math.max(a,Math.min(b,v));}
function cleanStr(v,[a,b]){
  if(typeof v!=='string')return null;
  const s=v.replace(/[<>&"'`\\]/g,'').replace(/[\u0000-\u001f]/g,'').trim();
  return s.length>=a&&s.length<=b?s:null;
}
function cleanColor(v,fallback){
  return (typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v))?v.toLowerCase():fallback;
}
function cleanFile(v){
  /* storage-relative file name only — no paths, no URLs */
  return (typeof v==='string'&&/^[a-z0-9_-]{1,32}\.png$/.test(v))?v:null;
}

/* Validate + normalize raw mod data. Returns {ok, errors:[], data} where
   data is a fresh whitelisted object safe to feed to the engine. */
function validateMod(raw){
  const errors=[];
  const out={format:2};
  if(!raw||typeof raw!=='object'){return {ok:false,errors:['Not an object'],data:null};}

  const name=cleanStr(raw.name,LIM.name);
  if(!name)errors.push('Name must be '+LIM.name[0]+'-'+LIM.name[1]+' characters');
  out.name=name||'Unnamed';
  out.tagline=cleanStr(raw.tagline,LIM.tagline)||'';
  out.color=cleanColor(raw.color,'#00d4ff');
  out.color2=cleanColor(raw.color2,'#c8f4ff');
  out.skin=cleanColor(raw.skin,'#e9c9a8');

  for(const k of ['hp','walk','back','jumpVX','jumpVY','grav','w','h','crouchH']){
    if(!isNum(raw[k]))errors.push(k+' must be a number');
    out[k]=clamp(isNum(raw[k])?Math.round(raw[k]):LIM[k][0],LIM[k]);
  }
  if(out.crouchH>out.h)out.crouchH=out.h;

  /* passives — optional, neutral defaults */
  const p=raw.passive||{};
  out.passive={
    regen:clamp(isNum(p.regen)?Math.round(p.regen):0,LIM.regen),
    defense:clamp(isNum(p.defense)?Math.round(p.defense):100,LIM.defense),
    meterMult:clamp(isNum(p.meterMult)?Math.round(p.meterMult):100,LIM.meterMult),
  };

  /* sprite block — optional (no sprites = engine puppet) */
  if(raw.sprite&&typeof raw.sprite==='object'){
    const s=raw.sprite;
    const anims={};
    let animCount=0;
    for(const ak of ANIM_KEYS){
      const a=s.anims&&s.anims[ak];
      if(!a||typeof a!=='object')continue;
      const f=cleanFile(a.f);
      if(!f){errors.push('sprite.'+ak+': bad file name');continue;}
      const ent={f,
        n:clamp(isNum(a.n)?Math.round(a.n):1,LIM.animN),
        cw:clamp(isNum(a.cw)?Math.round(a.cw):100,LIM.animCell),
        ch:clamp(isNum(a.ch)?Math.round(a.ch):100,LIM.animCell),
        cx:clamp(isNum(a.cx)?Math.round(a.cx):50,[0,LIM.animCell[1]]),
        fy:clamp(isNum(a.fy)?Math.round(a.fy):100,[0,LIM.animCell[1]])};
      anims[ak]=ent;animCount++;
    }
    if(animCount>0){
      const missing=REQUIRED_ANIMS.filter(k=>!anims[k]);
      if(missing.length)errors.push('sprite is missing required animations: '+missing.join(', '));
      out.sprite={
        scale:clamp(isNum(s.scale)?s.scale:1,LIM.scale),
        smooth:s.smooth?1:0,
        idleTop:clamp(isNum(s.idleTop)?Math.round(s.idleTop):0,LIM.idleTop),
        anims
      };
    }
  }

  /* moves */
  out.moves={};
  const rmoves=raw.moves||{};
  for(const mk of REQUIRED_MOVES)if(!rmoves[mk])errors.push('missing move: '+mk);
  for(const mk of MOVE_KEYS){
    const m=rmoves[mk];
    if(!m||typeof m!=='object')continue;
    const o={};
    o.name=cleanStr(m.name,[1,28])||mk;
    for(const f of ['dmg','startup','active','recovery','hitstun','blockstun','hitstop']){
      o[f]=clamp(isNum(m[f])?Math.round(m[f]):LIM[f][0],LIM[f]);
    }
    o.kbx=clamp(isNum(m.kbx)?Math.round(m.kbx):60,LIM.kbx);
    const b=m.box||{};
    o.box={
      x:clamp(isNum(b.x)?Math.round(b.x):20,LIM.boxX),
      y:clamp(isNum(b.y)?Math.round(b.y):-120,LIM.boxY),
      w:clamp(isNum(b.w)?Math.round(b.w):60,LIM.boxW),
      h:clamp(isNum(b.h)?Math.round(b.h):30,LIM.boxH)};
    if(HITS_VALUES.includes(m.hits))o.hits=m.hits;
    if(mk==='air')o.hits='high';
    if(mk==='clight'||mk==='cheavy'){if(o.hits==='high')delete o.hits;}
    if(m.launch){o.launch=1;o.kby=clamp(isNum(m.kby)?Math.round(m.kby):-200,LIM.kby);}
    if(m.step)o.step=clamp(Math.round(m.step),LIM.step);
    if(m.armor)o.armor=1;
    if(m.armorBreak)o.armorBreak=1;
    if(mk==='super'){o.super=1;if(m.inv)o.inv=1;}
    if(mk==='throw'){o.throw=1;o.launch=1;o.kby=o.kby||-190;delete o.hits;}
    if(typeof m.anim==='string'&&ANIM_KEYS.includes(m.anim))o.anim=m.anim;
    if(isNum(m.impact))o.impact=clamp(Math.round(m.impact),LIM.impact);
    /* projectile — optional per move (not on throw) */
    if(m.projectile&&typeof m.projectile==='object'&&mk!=='throw'){
      const pj=m.projectile;
      o.projectile={
        speed:clamp(isNum(pj.speed)?Math.round(pj.speed):90,LIM.projSpeed),
        life:clamp(isNum(pj.life)?Math.round(pj.life):50,LIM.projLife),
        w:clamp(isNum(pj.w)?Math.round(pj.w):24,LIM.projW),
        h:clamp(isNum(pj.h)?Math.round(pj.h):24,LIM.projH)};
    }
    out.moves[mk]=o;
  }
  /* sanity: total damage economy — stop obvious one-touch-kill data */
  if(out.moves.light&&out.moves.light.dmg>=out.hp)errors.push('light attack kills from full health — tone it down');

  const bytes=JSON.stringify(out).length;
  if(bytes>MAX_JSON_BYTES)errors.push('character data too large ('+bytes+' bytes, max '+MAX_JSON_BYTES+')');
  return {ok:errors.length===0,errors,data:out};
}

/* stable stringify (sorted keys) + FNV-1a — both online peers hash the
   mod data they loaded and compare before a match starts */
function stableStringify(v){
  if(v===null||typeof v!=='object')return JSON.stringify(v);
  if(Array.isArray(v))return '['+v.map(stableStringify).join(',')+']';
  return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableStringify(v[k])).join(',')+'}';
}
function hashMod(data){
  const s=stableStringify(data);
  let h=0x811c9dc5|0;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}
  return (h>>>0).toString(36);
}

window.SFFG_MODS={LIM,MOVE_KEYS,REQUIRED_MOVES,ANIM_KEYS,REQUIRED_ANIMS,
  MAX_JSON_BYTES,validateMod,hashMod,stableStringify};
})();
