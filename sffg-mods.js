/* ═══════════════════════════════════════════════════════════════════
   SFFG — community fighter format (v3) · shared by fight.html & create.html

   A community fighter is PURE DATA: stats, frame data, hitboxes, sprite
   strip metadata and optional passives/projectiles. There is no code in
   a mod and none is ever executed — that is the sandbox. Everything is
   whitelisted and typed by validateMod() below; unknown fields are
   dropped. Matchup fields (weakTo etc.) are reserved for the official
   roster and are stripped from community data.

   v3 — the Freedom Update. Balance clamps are GONE: the ranges below are
   security bounds only (integer safety, determinism, renderer sanity),
   not fairness. A 999999-damage jab is legal; the tier system will just
   label it "omnipotent regular guy" and everyone will know what you are.
   New in v3: chain moves (nextA/nextB/nextC), custom move slots reached
   through chains, burst, invulnerable startup on any move, chip damage
   on block, lifesteal passive, arcing / bouncing / piercing projectiles,
   negative-speed projectiles, per-fighter live-projectile cap.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* Security bounds. Every number in a mod is clamped into one of these —
   wide enough that no realistic design ever touches them, tight enough
   that the deterministic integer sim can never overflow and the renderer
   can never be handed something degenerate. NOT balance limits. */
const LIM={
  name:[1,32], tagline:[0,90], moveName:[1,40],
  hp:[1,999999], walk:[0,2000], back:[0,2000],
  jumpVX:[0,2000], jumpVY:[-2000,0], grav:[1,200],
  w:[8,800], h:[20,800], crouchH:[12,800],
  dmg:[0,999999], startup:[1,600], active:[1,600], recovery:[0,600],
  hitstun:[0,600], blockstun:[0,600], hitstop:[0,60],
  kbx:[-4000,4000], kby:[-4000,0], step:[-2000,2000],
  boxX:[-2000,2000], boxY:[-2000,0], boxW:[0,2000], boxH:[0,2000],
  impact:[0,63], chip:[0,100],
  projSpeed:[-4000,4000], projLife:[1,3600], projW:[1,2000], projH:[1,2000],
  projVY:[-4000,4000], projGrav:[0,400], pierce:[0,8],
  projMax:[1,6],
  regen:[0,999999],       /* hp per second */
  defense:[0,1000],       /* % damage taken (0 = statue, 1000 = made of glass) */
  meterMult:[0,10000],    /* % meter gain */
  lifesteal:[0,100],      /* % of damage dealt healed back (clean hits) */
  scale:[0.02,20], idleTop:[0,4096],
  animN:[1,64], animCell:[2,4096],
};
/* the slots the input system can reach directly */
const STD_MOVES=['light','heavy','special','clight','cheavy','air','throw','super','burst'];
const MOVE_KEYS=STD_MOVES;                     /* kept for callers that iterate it */
const REQUIRED_MOVES=['light','heavy','special','air','throw','super'];
const MAX_MOVES=32;
const CUSTOM_KEY=/^[a-z][a-z0-9]{0,19}$/;      /* extra moves, reached via chains */
const ANIM_KEYS=['idle','run','walkback','dash','backdash','jump','fall',
  'attack1','attack2','attack3','attack4','special','super','clight','cheavy',
  'airatk','hit','block','death','getup','crouch','burst'];
const REQUIRED_ANIMS=['idle','run','jump','fall','attack1','attack2','hit','death'];
const MAX_ANIMS=40;
const MAX_SHEET_PX=16384;                      /* n*cw — canvas/browser decode ceiling */
const HITS_VALUES=['mid','low','high'];
const MAX_JSON_BYTES=150000;

const isNum=v=>typeof v==='number'&&isFinite(v);
function clamp(v,[a,b]){return Math.max(a,Math.min(b,v));}
function num(v,lim,dflt){return clamp(isNum(v)?Math.round(v):dflt,lim);}
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
const isAnimKey=k=>typeof k==='string'&&(ANIM_KEYS.includes(k)||CUSTOM_KEY.test(k));

/* one move, whitelisted and clamped. mk = slot key */
function cleanMove(mk,m,errors){
  const o={};
  o.name=cleanStr(m.name,LIM.moveName)||mk;
  for(const f of ['dmg','startup','active','recovery','hitstun','blockstun','hitstop']){
    o[f]=num(m[f],LIM[f],LIM[f][0]);
  }
  o.kbx=num(m.kbx,LIM.kbx,60);
  const b=m.box||{};
  o.box={
    x:num(b.x,LIM.boxX,20),
    y:num(b.y,LIM.boxY,-120),
    w:num(b.w,LIM.boxW,60),
    h:num(b.h,LIM.boxH,30)};
  if(HITS_VALUES.includes(m.hits)&&m.hits!=='mid')o.hits=m.hits;
  if(mk==='air'&&!o.hits)o.hits='high';        /* air defaults to overhead; override allowed */
  if(m.launch){o.launch=1;o.kby=num(m.kby,LIM.kby,-200);}
  if(isNum(m.step)&&Math.round(m.step)!==0)o.step=num(m.step,LIM.step,0);
  if(m.armor)o.armor=1;
  if(m.armorBreak)o.armorBreak=1;
  if(m.inv)o.inv=1;                            /* v3: invulnerable startup on ANY move */
  if(m.crouch)o.crouch=1;                      /* v3: use crouch hurtbox during the move */
  if(m.nonAttack)o.nonAttack=1;                /* v3: pure animation, no hitbox */
  if(isNum(m.chip)&&Math.round(m.chip)>0)o.chip=num(m.chip,LIM.chip,0);  /* v3: % dmg through block */
  if(mk==='super')o.super=1;
  if(mk==='throw'){o.throw=1;o.launch=1;if(o.kby==null)o.kby=-190;delete o.hits;}
  if(isAnimKey(m.anim))o.anim=m.anim;
  if(isNum(m.impact))o.impact=num(m.impact,LIM.impact,0);
  /* projectile — optional on any move */
  if(m.projectile&&typeof m.projectile==='object'){
    const pj=m.projectile;
    const p={
      speed:num(pj.speed,LIM.projSpeed,90),
      life:num(pj.life,LIM.projLife,50),
      w:num(pj.w,LIM.projW,24),
      h:num(pj.h,LIM.projH,24)};
    if(isNum(pj.vy)&&Math.round(pj.vy)!==0)p.vy=num(pj.vy,LIM.projVY,0);
    if(isNum(pj.grav)&&Math.round(pj.grav)>0)p.grav=num(pj.grav,LIM.projGrav,0);
    if(pj.bounce)p.bounce=1;
    if(isNum(pj.pierce)&&Math.round(pj.pierce)>0)p.pierce=num(pj.pierce,LIM.pierce,0);
    o.projectile=p;
    if(m.projectileOnly)o.projectileOnly=1;
  }
  /* chain targets are checked against the finished move set afterwards */
  for(const ck of ['nextA','nextB','nextC']){
    if(typeof m[ck]==='string'&&(STD_MOVES.includes(m[ck])||CUSTOM_KEY.test(m[ck])))o[ck]=m[ck];
  }
  return o;
}

/* Validate + normalize raw mod data. Returns {ok, errors:[], data} where
   data is a fresh whitelisted object safe to feed to the engine. */
function validateMod(raw){
  const errors=[];
  const out={format:3};
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
    out[k]=num(raw[k],LIM[k],LIM[k][0]);
  }
  if(out.crouchH>out.h)out.crouchH=out.h;
  if(isNum(raw.projMax)&&Math.round(raw.projMax)!==2)out.projMax=num(raw.projMax,LIM.projMax,2);

  /* passives — optional, neutral defaults */
  const p=raw.passive||{};
  out.passive={
    regen:num(p.regen,LIM.regen,0),
    defense:num(p.defense,LIM.defense,100),
    meterMult:num(p.meterMult,LIM.meterMult,100),
  };
  if(isNum(p.lifesteal)&&Math.round(p.lifesteal)>0)out.passive.lifesteal=num(p.lifesteal,LIM.lifesteal,0);

  /* sprite block — optional (no sprites = engine puppet) */
  if(raw.sprite&&typeof raw.sprite==='object'){
    const s=raw.sprite;
    const anims={};
    let animCount=0;
    const rawAnims=(s.anims&&typeof s.anims==='object')?s.anims:{};
    for(const ak of Object.keys(rawAnims)){
      if(!isAnimKey(ak))continue;
      if(animCount>=MAX_ANIMS){errors.push('too many animations (max '+MAX_ANIMS+')');break;}
      const a=rawAnims[ak];
      if(!a||typeof a!=='object')continue;
      const f=cleanFile(a.f);
      if(!f){errors.push('sprite.'+ak+': bad file name');continue;}
      const ent={f,
        n:num(a.n,LIM.animN,1),
        cw:num(a.cw,LIM.animCell,100),
        ch:num(a.ch,LIM.animCell,100),
        cx:clamp(isNum(a.cx)?Math.round(a.cx):50,[0,LIM.animCell[1]]),
        fy:clamp(isNum(a.fy)?Math.round(a.fy):100,[0,LIM.animCell[1]])};
      if(ent.n*ent.cw>MAX_SHEET_PX){errors.push('sprite.'+ak+': sheet wider than '+MAX_SHEET_PX+'px — fewer or smaller frames');continue;}
      anims[ak]=ent;animCount++;
    }
    if(animCount>0){
      const missing=REQUIRED_ANIMS.filter(k=>!anims[k]);
      if(missing.length)errors.push('sprite is missing required animations: '+missing.join(', '));
      out.sprite={
        scale:clamp(isNum(s.scale)?s.scale:1,LIM.scale),
        smooth:s.smooth?1:0,
        idleTop:clamp(isNum(s.idleTop)?Math.round(s.idleTop):0,[0,LIM.idleTop[1]]),
        anims
      };
    }
  }

  /* moves: the 9 standard slots plus custom slots reached through chains */
  out.moves={};
  const rmoves=(raw.moves&&typeof raw.moves==='object')?raw.moves:{};
  for(const mk of REQUIRED_MOVES)if(!rmoves[mk])errors.push('missing move: '+mk);
  let moveCount=0;
  for(const mk of STD_MOVES){
    const m=rmoves[mk];
    if(!m||typeof m!=='object')continue;
    out.moves[mk]=cleanMove(mk,m,errors);moveCount++;
  }
  for(const mk of Object.keys(rmoves)){
    if(STD_MOVES.includes(mk))continue;
    if(!CUSTOM_KEY.test(mk))continue;          /* silently dropped: not a legal key */
    if(moveCount>=MAX_MOVES){errors.push('too many moves (max '+MAX_MOVES+')');break;}
    const m=rmoves[mk];
    if(!m||typeof m!=='object')continue;
    out.moves[mk]=cleanMove(mk,m,errors);moveCount++;
  }
  /* chain targets must exist in the finished set; dangling refs are dropped */
  for(const mk in out.moves){
    const o=out.moves[mk];
    for(const ck of ['nextA','nextB','nextC'])if(o[ck]&&!out.moves[o[ck]])delete o[ck];
  }

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

window.SFFG_MODS={LIM,MOVE_KEYS,STD_MOVES,REQUIRED_MOVES,ANIM_KEYS,REQUIRED_ANIMS,
  MAX_MOVES,MAX_ANIMS,MAX_JSON_BYTES,CUSTOM_KEY,validateMod,hashMod,stableStringify};
})();
