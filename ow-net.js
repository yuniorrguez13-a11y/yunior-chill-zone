/* ow-net.js — the wire for Overwork multiplayer.
   Signalling goes over Supabase realtime broadcast (the same project the rest of the site uses) or, for
   testing two tabs on one machine, a BroadcastChannel. After that every peer talks to the host over its own
   WebRTC connection with two data channels: 'rel' (ordered, for events) and 'fast' (unordered, lossy, for
   state snapshots). The host is the only one who talks to everybody; clients only talk to the host.
   This file knows nothing about boxes or vans — it moves JSON and tells you who joined and who left. */

const FALLBACK_ICE = [{ urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun.l.google.com:19302' }];
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const makeCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');

/* TURN credentials from the site's edge function (needs a signed-in user); STUN only otherwise */
let iceCache = null;
async function getIce(sb) {
  if (iceCache && iceCache.exp > Date.now()) return iceCache.servers;
  if (!sb) return FALLBACK_ICE;
  const timeout = ms => new Promise((_, rej) => setTimeout(() => rej(new Error('turn timeout')), ms));
  try {
    for (const fn of ['turn-credentials', 'smart-function']) {
      const r = await Promise.race([sb.functions.invoke(fn, { body: {} }), timeout(3500)]);      // a hanging TURN request must not block joining
      if (!r.error && r.data && r.data.iceServers) {
        const raw = r.data.iceServers, list = Array.isArray(raw) ? raw : [raw];
        if (list.length) { iceCache = { servers: list, exp: Date.now() + (r.data.ttl || 3600) * 900 }; return list; }
      }
    }
  } catch (e) { console.warn('[ow-net] TURN fetch failed', e); }
  return FALLBACK_ICE;
}

/* ── signallers: same interface, two transports ── */
function supabaseSignal(sb, code, myKey) {
  const chan = sb.channel('ow:' + code, { config: { broadcast: { self: false } } });
  const s = { onmsg: null, ready: false, waiters: [] };
  chan.on('broadcast', { event: 'sig' }, ({ payload }) => { if (payload && (payload.to == null || payload.to === myKey) && payload.from !== myKey && s.onmsg) s.onmsg(payload); })
    .subscribe(st => { if (st === 'SUBSCRIBED') { s.ready = true; s.waiters.splice(0).forEach(f => f()); } if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') { s.waiters.splice(0).forEach(f => f(new Error('signalling failed'))); } });
  s.whenReady = () => s.ready ? Promise.resolve() : new Promise((res, rej) => s.waiters.push(e => e ? rej(e) : res()));
  s.send = msg => chan.send({ type: 'broadcast', event: 'sig', payload: msg });
  s.close = () => { try { sb.removeChannel(chan); } catch (e) {} };
  return s;
}
function localSignal(code, myKey) {
  const bc = new BroadcastChannel('ow:' + code);
  const s = { onmsg: null, ready: true, whenReady: () => Promise.resolve() };
  bc.onmessage = e => { const p = e.data; if (p && (p.to == null || p.to === myKey) && p.from !== myKey && s.onmsg) s.onmsg(p); };
  s.send = msg => bc.postMessage(JSON.parse(JSON.stringify(msg)));     // RTCSessionDescription/RTCIceCandidate are not structured-cloneable; JSON them like the real wire does
  s.close = () => bc.close();
  return s;
}

/* ── the lobby: who is hosting right now. presence on Supabase, a chatty BroadcastChannel locally ── */
function supabaseLobby(sb, myKey) {
  let chan = null, meta = null, subscribed = false; const listeners = [];
  const list = () => { if (!chan) return []; const st = chan.presenceState(); const out = []; for (const k in st) { const m = st[k][0]; if (m && m.code && k !== myKey) out.push(m); } return out; };
  return {
    join() { if (chan) return; chan = sb.channel('ow:lobby', { config: { presence: { key: myKey } } }); chan.on('presence', { event: 'sync' }, () => listeners.forEach(f => f(list()))).subscribe(st => { if (st === 'SUBSCRIBED') { subscribed = true; if (meta) { try { chan.track(meta); } catch (e) {} } } }); },
    track(m) { meta = m; if (chan && subscribed) { try { if (m) chan.track(m); else chan.untrack(); } catch (e) {} } },
    leave() { if (chan) { try { sb.removeChannel(chan); } catch (e) {} chan = null; subscribed = false; } },
    onChange(f) { listeners.push(f); }, list,
  };
}
function localLobby(myKey) {
  let bc = null, meta = null, timer = null; const rooms = new Map(), listeners = [];
  const list = () => { const now = Date.now(); for (const [k, v] of rooms) if (now - v.t > 5000) rooms.delete(k); return [...rooms.values()].map(v => v.m); };
  const announce = () => { if (bc && meta) bc.postMessage({ from: myKey, m: meta }); };
  return {
    join() { if (bc) return; bc = new BroadcastChannel('ow:lobby'); bc.onmessage = e => { const p = e.data; if (!p || p.from === myKey) return; if (p.m) rooms.set(p.from, { t: Date.now(), m: p.m }); else rooms.delete(p.from); listeners.forEach(f => f(list())); }; timer = setInterval(() => { announce(); listeners.forEach(f => f(list())); }, 1500); },
    track(m) { meta = m; if (bc) { if (m) announce(); else bc.postMessage({ from: myKey, m: null }); } },
    leave() { if (bc) { bc.postMessage({ from: myKey, m: null }); bc.close(); bc = null; } if (timer) clearInterval(timer); timer = null; },
    onChange(f) { listeners.push(f); }, list,
  };
}

/* ── the net object the game talks to ── */
export function createNet({ sb, local, myKey, log }) {
  log = log || (() => {});
  const handlers = {}; const emit = (ev, ...a) => (handlers[ev] || []).forEach(f => { try { f(...a); } catch (e) { console.error('[ow-net]', ev, e); } });
  const net = {
    on: false, host: false, code: null, peers: new Map(), myKey,
    lobby: local ? localLobby(myKey) : (sb ? supabaseLobby(sb, myKey) : null),
    addListener(ev, f) { (handlers[ev] = handlers[ev] || []).push(f); },
  };
  let sig = null, ice = FALLBACK_ICE, joinTimer = null, nextId = 1;

  function dropPeer(key, why) {
    const p = net.peers.get(key); if (!p) return;
    net.peers.delete(key); try { p.pc.close(); } catch (e) {}
    emit('gone', p, why || 'disconnected');
    if (!net.host && net.on) { emit('status', 'lost the host'); net.leave(); }
  }
  function wire(peer, ch, label) {
    peer[label] = ch;
    ch.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (err) { return; } emit('msg', peer, m); };
    ch.onopen = () => { if (peer.rel && peer.fast && peer.rel.readyState === 'open' && peer.fast.readyState === 'open' && !peer.ready) { peer.ready = true; emit('open', peer); } };
    ch.onclose = () => dropPeer(peer.key, 'left');
  }
  function connectTo(key, initiator) {
    if (net.peers.has(key)) return net.peers.get(key);
    const pc = new RTCPeerConnection({ iceServers: ice, iceCandidatePoolSize: 2 });
    const peer = { key, pc, rel: null, fast: null, iceQ: [], making: false, polite: !initiator, id: initiator ? nextId++ : 0, ready: false, name: '' };
    pc.onicecandidate = e => { if (e.candidate && sig) sig.send({ from: myKey, to: key, ice: e.candidate }); };
    pc.onnegotiationneeded = async () => { try { peer.making = true; await pc.setLocalDescription(); sig && sig.send({ from: myKey, to: key, desc: pc.localDescription }); } catch (e) { console.warn('[ow-net] negotiation', e); } finally { peer.making = false; } };
    pc.onconnectionstatechange = () => { if (['failed', 'closed'].includes(pc.connectionState)) dropPeer(key, 'connection ' + pc.connectionState); };
    // one audio line per connection, negotiated up front and silent until someone turns a mic on: a voice is then a replaceTrack away, no renegotiation
    pc.ontrack = e => { peer.track = e.track; emit('track', peer, e.track); };
    if (initiator) { pc.addTransceiver('audio', { direction: 'sendrecv' }); wire(peer, pc.createDataChannel('rel', { ordered: true }), 'rel'); wire(peer, pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 }), 'fast'); }
    else pc.ondatachannel = e => wire(peer, e.channel, e.channel.label);
    net.peers.set(key, peer);
    return peer;
  }
  async function onSig(p) {
    if (p.hello) { if (net.host) { log('joiner', p.from); connectTo(p.from, true); } return; }
    if (p.full) { if (!net.host && !net.peers.size) { emit('status', 'that room is full'); net.leave(); } return; }
    let peer = net.peers.get(p.from);
    if (!peer) { if (net.host) return; peer = connectTo(p.from, false); if (joinTimer) { clearTimeout(joinTimer); joinTimer = null; } }
    const pc = peer.pc;
    try {
      if (p.desc) {
        const collision = p.desc.type === 'offer' && (peer.making || pc.signalingState !== 'stable');
        if (!peer.polite && collision) return;
        await pc.setRemoteDescription(p.desc);
        for (const c of peer.iceQ.splice(0)) { try { await pc.addIceCandidate(c); } catch (e) {} }
        if (p.desc.type === 'offer') { for (const t of pc.getTransceivers()) if (t.receiver.track && t.receiver.track.kind === 'audio' && t.direction !== 'sendrecv') t.direction = 'sendrecv'; await pc.setLocalDescription(); sig.send({ from: myKey, to: p.from, desc: pc.localDescription }); }   // answer the audio line both ways too
      } else if (p.ice) {
        const cand = new RTCIceCandidate(p.ice);
        if (!pc.remoteDescription) { peer.iceQ.push(cand); return; }
        try { await pc.addIceCandidate(cand); } catch (e) {}
      }
    } catch (e) { console.warn('[ow-net] sig', e); }
  }
  async function open(code, asHost) {
    if (net.on) net.leave();
    net.on = true; net.host = asHost; net.code = code; nextId = 1;
    ice = local ? FALLBACK_ICE : await getIce(sb);
    if (!net.on) return;                                                            // left while fetching
    sig = local ? localSignal(code, myKey) : supabaseSignal(sb, code, myKey);
    sig.onmsg = onSig;
    try { await sig.whenReady(); } catch (e) { emit('status', 'could not reach the signalling server'); net.leave(); return; }
    if (!asHost) {
      let tries = 0;
      const knock = () => { if (!net.on || net.peers.size) return; sig.send({ from: myKey, to: null, hello: true }); if (++tries < 5) joinTimer = setTimeout(knock, 1500); else { emit('status', 'nobody in that room. check the code.'); net.leave(); } };
      knock();
    }
    emit('status', asHost ? 'hosting ' + code : 'knocking on ' + code);
  }
  net.host_ = async () => { const code = makeCode(); await open(code, true); return code; };
  net.join = async code => { await open(String(code || '').toUpperCase().trim(), false); };
  net.leave = () => {
    if (!net.on) return;
    net.on = false; net.host = false;
    for (const [k, p] of net.peers) { try { p.pc.close(); } catch (e) {} }
    net.peers.clear();
    if (sig) { sig.close(); sig = null; }
    if (joinTimer) { clearTimeout(joinTimer); joinTimer = null; }
    net.code = null; emit('left');
  };
  net.refuse = key => { if (sig) sig.send({ from: myKey, to: key, full: true }); };
  net.send = (peer, obj, fast) => { const ch = fast ? peer.fast : peer.rel; if (ch && ch.readyState === 'open') { try { ch.send(JSON.stringify(obj)); } catch (e) {} } };
  net.broadcast = (obj, fast, except) => { const s = JSON.stringify(obj); for (const p of net.peers.values()) { if (p === except || !p.ready) continue; const ch = fast ? p.fast : p.rel; if (ch && ch.readyState === 'open') { try { ch.send(s); } catch (e) {} } } };
  net.hostPeer = () => { for (const p of net.peers.values()) return p; return null; };
  net.audioSender = peer => { for (const t of peer.pc.getTransceivers()) if (t.receiver.track && t.receiver.track.kind === 'audio') return t.sender; return null; };
  return net;
}
