/* Frame-stepped capture: virtualize requestAnimationFrame so the deterministic
   engine advances exactly 1/60s per tick, screenshot every 2nd tick → perfect 30fps. */
const {chromium}=require('playwright');
const fs=require('fs');
const OUT=process.cwd();
const SIM=1000/60;

const VIRT=`
window.__rafQ=[];window.__vt=0;
window.requestAnimationFrame=cb=>{window.__rafQ.push(cb);return window.__rafQ.length;};
window.cancelAnimationFrame=()=>{};
window.__tick=(n,ms)=>{for(let i=0;i<n;i++){window.__vt+=ms;const q=window.__rafQ;window.__rafQ=[];
  for(const cb of q){try{cb(window.__vt);}catch(e){}}}};
window.__key=(type,code)=>{window.dispatchEvent(new KeyboardEvent(type,{code}))};
`;

function fightScript(frames){
  /* choreography: [frame, 'down'|'up', code] — repeating 8s pattern */
  const ev=[];
  const P=[ // dt-frames, action
    [40,'hold','KeyD'],[6,'tapA'],[14,''],[6,'tapA'],[14,''],[7,'tapB'],[26,''],
    [8,'spc'],[34,''],[6,'jump'],[20,''],[7,'tapB'],[30,''],
    [30,'hold','KeyA'],[8,'tapC'],[40,''],[9,'super'],[60,''],
  ];
  let f=10;
  while(f<frames-60){
    for(const[st,act,key]of P){
      if(f>=frames-60)break;
      if(act==='hold'){ev.push([f,'keydown',key]);ev.push([f+st,'keyup',key]);}
      else if(act==='tapA'){ev.push([f,'keydown','KeyF']);ev.push([f+5,'keyup','KeyF']);}
      else if(act==='tapB'){ev.push([f,'keydown','KeyG']);ev.push([f+6,'keyup','KeyG']);}
      else if(act==='tapC'){ev.push([f,'keydown','KeyH']);ev.push([f+7,'keyup','KeyH']);}
      else if(act==='spc'){ev.push([f,'keydown','KeyS']);ev.push([f,'keydown','KeyH']);
        ev.push([f+7,'keyup','KeyH']);ev.push([f+7,'keyup','KeyS']);}
      else if(act==='jump'){ev.push([f,'keydown','KeyW']);ev.push([f+6,'keyup','KeyW']);}
      else if(act==='super'){ev.push([f,'keydown','KeyG']);ev.push([f,'keydown','KeyH']);
        ev.push([f+8,'keyup','KeyG']);ev.push([f+8,'keyup','KeyH']);}
      f+=st;
    }
  }
  const map={};for(const[fr,t,c]of ev){(map[fr]=map[fr]||[]).push([t,c]);}
  return map;
}

(async()=>{
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});

async function captureFight(name,setup,simFrames,dirName){
  const dir=OUT+'/'+dirName;
  fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
  const p=await browser.newPage({viewport:{width:1920,height:1080}});
  await p.addInitScript(VIRT);
  await p.addInitScript(()=>{const s=document.createElement('style');
    s.textContent='*{cursor:none!important}';
    document.addEventListener('DOMContentLoaded',()=>document.head.appendChild(s));});
  await p.goto('http://localhost:8940/fight.html');
  await p.waitForTimeout(2500);
  const T=async(n,ms)=>p.evaluate(([n2,ms2])=>window.__tick(n2,ms2),[n,ms||SIM]);
  await T(120,33);                 // let the menu paint
  await setup(p,T);                // click through to the match
  await T(260,SIM);                // intro / loading
  const sched=fightScript(simFrames);
  let shot=0;
  for(let f=0;f<simFrames;f++){
    const evs=sched[f];
    if(evs)await p.evaluate(list=>{for(const[t,c]of list)window.__key(t,c);},evs);
    await T(1,SIM);
    if(f%2===0){
      await p.screenshot({path:dir+`/f${String(shot).padStart(5,'0')}.jpg`,
        type:'jpeg',quality:82});
      shot++;
    }
    if(f%300===0)console.log(name,f+'/'+simFrames);
  }
  console.log(name,'shots:',shot);
  await p.close();
}

await captureFight('match',async(p,T)=>{
  await p.click('#btn-cpu');await T(30,33);
  const cards=await p.$$('#sel-grid .chr-card');
  await cards[0].click();await T(20,33);
  await cards[4].click();await T(20,33);
  await p.click('#sel-go');await T(30,33);
},1750,'frames-match');

await captureFight('training',async(p,T)=>{
  await p.click('#btn-train');await T(30,33);
  const cards=await p.$$('#sel-grid .chr-card');
  await cards[2].click();await T(20,33);
  await cards[3].click();await T(20,33);
  await p.click('#sel-go');await T(30,33);
  await p.evaluate(()=>{const c=document.getElementById('tr-boxes');if(c&&!c.checked)c.click();});
},700,'frames-training');

await browser.close();console.log('CAPTURE DONE');
})().catch(e=>{console.error('FATAL',e);process.exit(1)});
