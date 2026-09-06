/* ow-piano.js — the piano.
   A real one: sampled grand piano notes (see art/overwork/piano/LICENSE.txt), eighteen of them, one every third semitone from
   A1 to C6, re-encoded small. Every note the game plays is one of those recordings, pitched at most two semitones. There is no
   oscillator in this file and there will not be one.

   Two things live here:
   - the background music: generative, slow, never the same twice. A tired pianist in the next room: left hand keeps the chords,
     right hand rolls a voicing, a thin melody wanders in when it feels like it. Lo-fi treatment — a felt lowpass, a small room
     reverb, a limiter — nothing that makes it sound like anything but a piano.
   - the cues: the things the game used to beep. A delivery, la peace, the mystery box, the dog, the van's horn. A silent-film
     accompanist plays those on the same piano: a dog is a low cluster, a horn is a sour chord that sags.

   createPiano(ac, base) → { load(), ready, cue(name), music: { start(), stop(), playing, gain }, setMuffled(b), out, until(t) }
   `out` is a GainNode; the game connects it to its master. Music volume is music.gain (0..1). */

const NOTES = { A1: 33, C2: 36, Ds2: 39, Fs2: 42, A2: 45, C3: 48, Ds3: 51, Fs3: 54, A3: 57, C4: 60, Ds4: 63, Fs4: 66, A4: 69, C5: 72, Ds5: 75, Fs5: 78, A5: 81, C6: 84 };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;

/* chords as semitone offsets from the key root. diatonic sevenths plus two borrowed colours */
const CH = {
  I: [0, 4, 7, 11], ii: [2, 5, 9, 12], iii: [4, 7, 11, 14], IV: [5, 9, 12, 16], V: [7, 11, 14, 17], vi: [9, 12, 16, 19],
  Vsus: [7, 12, 14, 17], bVI: [8, 12, 15, 19], bVII: [10, 14, 17, 21], IVm: [5, 8, 12, 15],
};
const PROGRESSIONS = [
  ['I', 'vi', 'ii', 'V'], ['IV', 'V', 'iii', 'vi'], ['ii', 'V', 'I', 'vi'], ['I', 'iii', 'IV', 'Vsus'],
  ['vi', 'IV', 'I', 'V'], ['I', 'IV', 'ii', 'bVII'], ['IV', 'IVm', 'I', 'V'], ['I', 'bVI', 'IV', 'V'],
];
const SCALE = [0, 2, 4, 5, 7, 9, 11];

export function createPiano(ac, base = 'art/overwork/piano/') {
  const buffers = {};
  let loading = null, ready = false;

  /* ── the signal chain: notes → (music bus with a felt lowpass | cue bus) → dry + small room → limiter → out ── */
  const out = ac.createGain();
  const limiter = ac.createDynamicsCompressor();
  limiter.threshold.value = -14; limiter.knee.value = 18; limiter.ratio.value = 5; limiter.attack.value = 0.004; limiter.release.value = 0.22;
  limiter.connect(out);
  const dry = ac.createGain(); dry.gain.value = 1.0; dry.connect(limiter);
  const wet = ac.createGain(); wet.gain.value = 0.3;
  const room = ac.createConvolver(); room.buffer = roomIR(ac, 1.9); room.connect(wet); wet.connect(limiter);
  const musicBus = ac.createGain(); musicBus.gain.value = 0.55;
  const felt = ac.createBiquadFilter(); felt.type = 'lowpass'; felt.frequency.value = 3600; felt.Q.value = 0.4;
  musicBus.connect(felt); felt.connect(dry); felt.connect(room);
  const cueBus = ac.createGain(); cueBus.gain.value = 0.9; cueBus.connect(dry); cueBus.connect(room);

  /* a small room: two channels of decaying noise, smoothed so it does not hiss. an impulse response, not an instrument */
  function roomIR(ctx, seconds) {
    const n = Math.floor(ctx.sampleRate * seconds), buf = ctx.createBuffer(2, n, ctx.sampleRate), pre = Math.floor(ctx.sampleRate * 0.018);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c); let lp = 0;
      for (let i = pre; i < n; i++) { const t = (i - pre) / ctx.sampleRate; lp += ((Math.random() * 2 - 1) - lp) * 0.22; d[i] = lp * Math.exp(-t * 3.4) * (1 - Math.exp(-t * 40)); }
    }
    return buf;
  }

  function load() {
    if (loading) return loading;
    loading = Promise.all(Object.keys(NOTES).map(async n => {
      const r = await fetch(base + n + '.mp3'); if (!r.ok) throw new Error('piano: ' + n + ' ' + r.status);
      buffers[NOTES[n]] = await ac.decodeAudioData(await r.arrayBuffer());
    })).then(() => { ready = true; api.ready = true; return api; });
    return loading;
  }

  /* the nearest recording, pitched the rest of the way (never more than two semitones) */
  function sample(midi) {
    let best = null, bd = 99; for (const k in buffers) { const d = Math.abs(k - midi); if (d < bd) { bd = d; best = +k; } }
    return best === null ? null : { buf: buffers[best], rate: Math.pow(2, (midi - best) / 12) };
  }
  let live = 0;
  /* one note. vel 0..1 → level and brightness (soft notes are darker, that is what a felt does); dur = time until the key is let go */
  function note(midi, vel, when, dur, bus, rel = 0.45) {
    const s = sample(midi); if (!s) return;
    const src = ac.createBufferSource(); src.buffer = s.buf; src.playbackRate.value = s.rate;
    const g = ac.createGain(), f = ac.createBiquadFilter(), pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    const v = clamp(vel, 0.05, 1), level = 0.10 + 0.72 * v * v;
    f.type = 'lowpass'; f.frequency.value = 700 + v * v * 6800; f.Q.value = 0.3;
    g.gain.setValueAtTime(level, when); g.gain.setValueAtTime(level, when + Math.max(0.02, dur)); g.gain.exponentialRampToValueAtTime(0.0005, when + dur + rel);
    src.connect(f); f.connect(g);
    if (pan) { pan.pan.value = clamp((midi - 62) / 34, -0.65, 0.65); g.connect(pan); pan.connect(bus); } else g.connect(bus);
    src.start(when); src.stop(when + dur + rel + 0.05); live++; src.onended = () => { live--; };
    api.notes++;
  }

  /* ── the cues: what the accompanist does when something happens on screen ── */
  const CUES = {
    ding: (t, k) => { note(k + 7 + 60, 0.62, t, 0.6, cueBus); note(k + 12 + 60, 0.7, t + 0.13, 1.1, cueBus, 0.9); },                       // delivered: fifth, octave. a small "there."
    peace: (t, k) => { [0, 7, 11, 14, 19, 23].forEach((iv, i) => note(k + 48 + iv, 0.42 - i * 0.02, t + i * 0.11, 3.2, cueBus, 1.6)); },   // la peace: a major-seventh-add-nine, rolled slowly. serenity, sampled
    squeak: t => { note(85, 0.5, t, 0.07, cueBus, 0.08); note(86, 0.55, t + 0.07, 0.07, cueBus, 0.08); note(85, 0.45, t + 0.14, 0.1, cueBus, 0.1); },   // the mystery box: a nervous trill at the very top
    bark: t => { for (const [d, a] of [[0, 40], [0.19, 38]]) { note(a, 0.75, t + d, 0.11, cueBus, 0.12); note(a + 1, 0.7, t + d, 0.11, cueBus, 0.12); } },   // the dog: two low clusters. woof. woof.
    honk: t => { for (const n of [50, 52, 57]) note(n, 0.8, t, 0.36, cueBus, 0.14); for (const n of [49, 51, 56]) note(n, 0.7, t + 0.42, 0.3, cueBus, 0.2); },   // the horn: a sour chord that sags a semitone. like everyone here
    start: (t, k) => { [0, 4, 7].forEach((iv, i) => note(k + 60 + iv, 0.5, t + i * 0.08, 0.7, cueBus)); note(k + 72, 0.55, t + 0.36, 1.2, cueBus, 0.8); },   // clocking in
    lose: t => { for (const [d, n] of [[0, 55], [0.28, 54], [0.56, 53], [0.84, 52]]) note(n, 0.5, t + d, 0.5, cueBus, 0.5); note(40, 0.5, t + 0.84, 1.2, cueBus, 0.8); },   // the casino took it
    win: (t, k) => { [0, 4, 7, 12, 16].forEach((iv, i) => note(k + 60 + iv, 0.55, t + i * 0.09, 0.8, cueBus, 0.7)); },
  };
  function cue(name, at) {
    if (!ready) { load().catch(() => {}); return false; }
    const fn = CUES[name]; if (!fn) return false;
    fn(at || ac.currentTime + 0.01, music.key % 12); return true;
  }

  /* ── the music. a state machine that writes one chord (two bars) at a time into a queue; until(t) plays what is due ── */
  const music = { playing: false, gain: musicBus.gain, key: 48, tempo: 60, t0: 0, next: 0, queue: [], song: null, chordN: 0, lastMel: 72, timer: null, silenceUntil: 0 };
  function newSong() {
    music.key = 45 + Math.floor(Math.random() * 8);                                                                          // A2..E3 as the bass root
    music.tempo = rnd(56, 66); music.song = { prog: pick(PROGRESSIONS), motif: [0, pick([2, 3]), 4, pick([6, 7])].map(v => v + (Math.random() < 0.3 ? 1 : 0)),
      contour: [0, pick([-1, 1, 2]), pick([-2, -1, 1]), pick([-1, 0, 1])], length: 6 + Math.floor(Math.random() * 4), swing: Math.random() < 0.5 ? 0.06 : 0,
      style: Math.random() < 0.5 ? 'arp' : 'block',                                                                          // broken chords all bar long, or block chords with air between them
      arp: pick([[0, 1, 2, 3, 2, 1, 0, 1], [0, 2, 1, 3, 1, 2, 0, 2], [0, 1, 3, 2, 0, 1, 3, 2], [0, 3, 1, 2, 3, 1, 0, 2]]) };
    music.chordN = 0; music.lastMel = 72;
  }
  const jitter = (s = 0.018) => rnd(-s, s);
  /* is this scale step allowed over the chord: chord tones, their ninths, and scale notes that are not a semitone above a chord tone */
  function melodyPool(ch) {
    const tones = ch.map(v => v % 12), pool = [];
    for (const s of SCALE) { const above = tones.some(t => (s - t + 12) % 12 === 1); if (above) continue; const w = tones.includes(s) ? 3 : tones.some(t => (s - t + 12) % 12 === 2) ? 2 : 1; for (let i = 0; i < w; i++) pool.push(s); }
    return pool;
  }
  function writeChord() {
    const S = music.song, beat = 60 / music.tempo, t0 = music.next, bar = beat * 4, len = bar * 2;
    if (music.chordN >= S.length * S.prog.length) {                                                                        // the song ends; a breath; another one
      music.silenceUntil = t0 + rnd(5, 9); music.next = music.silenceUntil; newSong(); return;
    }
    const ch = CH[S.prog[music.chordN % S.prog.length]], k = music.key, progress = music.chordN / (S.length * S.prog.length), heat = 0.35 + 0.65 * Math.sin(progress * Math.PI);
    const Q = music.queue, push = (t, m, v, d, rel) => Q.push({ t, m, v: clamp(v + jitter(0.05), 0.08, 0.95), d, rel });
    // left hand: the root on one, the fifth (or a tenth) on three, the root again into bar two, sometimes a pickup into the next chord
    const root = k + ch[0] - (ch[0] > 6 ? 12 : 0), fifth = root + (ch[2] - ch[0]), tenth = root + 12 + (ch[1] - ch[0]) - (ch[1] - ch[0] > 6 ? 12 : 0);
    push(t0 - 0.012 + jitter(), root, 0.5 + heat * 0.1, len - 0.2, 0.6);
    if (Math.random() < 0.8) push(t0 + 2 * beat + jitter(), Math.random() < 0.6 ? fifth : tenth, 0.36, 2 * beat - 0.1, 0.5);
    if (Math.random() < 0.7) push(t0 + bar + jitter(), root, 0.4, bar - 0.2, 0.6);
    if (Math.random() < 0.6) push(t0 + bar + 2 * beat + jitter(), Math.random() < 0.6 ? fifth : tenth, 0.33, 2 * beat - 0.1, 0.5);
    if (Math.random() < 0.3) push(t0 + len - beat * 0.5 + jitter(), (root - 12 < 33 ? root : root - 12) + (Math.random() < 0.5 ? 0 : 7), 0.3, beat * 0.5, 0.3);
    // right hand: a rootless voicing around middle C
    const voicing = [ch[1], ch[3], ch[2] + 12, (Math.random() < 0.5 ? ch[1] + 12 : ch[3] + 12)].slice(0, 3 + (Math.random() < 0.5 ? 1 : 0)).map(iv => { let m = k + 12 + iv; while (m < 58) m += 12; while (m > 74) m -= 12; return m; }).sort((a, b) => a - b);
    const roll = () => rnd(0.025, 0.06);
    if (S.style === 'arp') {                                                                                                 // broken chords in eighths, all the way through, accents on the beats. a few notes dropped, because hands
      const arpNotes = [...voicing, voicing[0] + 12]; while (arpNotes.length < 4) arpNotes.push(voicing[0] + 12);
      for (let e = 0; e < 16; e++) { if (Math.random() < 0.1) continue; const at = t0 + e * beat * 0.5 + (e % 2 ? S.swing : 0) + jitter(0.012), m = arpNotes[S.arp[e % 8] % arpNotes.length];
        push(at, m, (e % 4 === 0 ? 0.36 : e % 2 ? 0.24 : 0.29) + heat * 0.08, beat * 0.5 * 1.7, 0.5); }
    } else {                                                                                                                 // block chords: rolled on one, again on bar two (softer, sometimes early), and on the "and of two" when awake
      voicing.forEach((m, i) => push(t0 + i * roll() + jitter(0.01), m, 0.4 + heat * 0.08 - i * 0.02, bar - 0.15, 0.7));
      if (Math.random() < 0.8) { const at = t0 + bar - (Math.random() < 0.3 ? beat * 0.5 : 0); voicing.forEach((m, i) => push(at + i * roll(), m, 0.3 + heat * 0.06, bar - 0.2, 0.7)); }
      if (Math.random() < 0.25 + heat * 0.4) voicing.slice(0, 2).forEach((m, i) => push(t0 + 1.5 * beat + i * roll(), m, 0.26, beat, 0.5));
    }
    // the melody: a motif, transposed into whatever fits the chord. a few notes, then it thinks about it
    if (Math.random() < 0.45 + heat * 0.5) {
      const pool = melodyPool(ch), inBar = music.chordN % 2 ? 1 : 0, n = 2 + Math.floor(Math.random() * (2 + heat * 3));
      let cur = music.lastMel;
      for (let i = 0; i < n && i < 4; i++) {
        const slot = S.motif[i], at = t0 + inBar * bar + slot * beat * 0.5 + (slot % 2 ? S.swing : 0) + jitter(0.02);
        const target = cur + S.contour[i] * 2, cands = []; for (let m = 70; m <= 86; m++) if (pool.includes(((m - k) % 12 + 12) % 12)) cands.push(m);
        cands.sort((a, b) => Math.abs(a - target) - Math.abs(b - target)); cur = cands[Math.random() < 0.7 ? 0 : 1] || target;
        const nextSlot = i + 1 < n && i + 1 < 4 ? S.motif[i + 1] : slot + 3, d = Math.max(0.25, (nextSlot - slot) * beat * 0.5 * 1.3);
        if (Math.random() < 0.12) push(at - 0.07, cur - (pool.includes(((cur - 1 - k) % 12 + 12) % 12) ? 1 : 2), 0.25, 0.08, 0.1);   // a grace note, occasionally
        push(at, cur, 0.3 + heat * 0.22 - i * 0.03, d, 0.6);
      }
      music.lastMel = cur;
    }
    music.chordN++; music.next = t0 + len;
  }
  /* play everything due before t (generating as far as needed). the realtime scheduler and the offline renderer both call this */
  function until(t) {
    if (!music.playing) return;
    while (music.next < t + 0.05 && music.queue.length < 400) writeChord();
    music.queue.sort((a, b) => a.t - b.t);
    while (music.queue.length && music.queue[0].t < t) { const e = music.queue.shift(); if (e.t > ac.currentTime - 0.5) note(e.m, e.v, Math.max(e.t, ac.currentTime + 0.002), e.d, musicBus, e.rel); }
  }
  music.start = () => {
    if (music.playing) return; if (!ready) { load().then(() => music.start()).catch(() => {}); return; }
    music.playing = true; newSong(); music.queue.length = 0; music.next = ac.currentTime + 0.4;
    if (typeof setInterval === 'function' && !music.offline) music.timer = setInterval(() => until(ac.currentTime + 1.4), 180);
    until(ac.currentTime + 1.4);
  };
  music.stop = () => { music.playing = false; if (music.timer) { clearInterval(music.timer); music.timer = null; } music.queue.length = 0; };
  music.pause = p => { musicBus.gain.setTargetAtTime(p ? 0 : api.musicLevel, ac.currentTime, 0.2); };

  const api = {
    out, ready, load, cue, music, note, until, notes: 0, musicLevel: 0.55,
    get live() { return live; },
    setVolume(v) { api.musicLevel = clamp(v, 0, 1); musicBus.gain.setTargetAtTime(api.musicLevel, ac.currentTime, 0.05); },
    setMuffled(b) { felt.frequency.setTargetAtTime(b ? 1500 : 3600, ac.currentTime, 0.6); },                                     // rain on the window
  };
  return api;
}
