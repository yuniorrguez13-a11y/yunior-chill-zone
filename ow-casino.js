/* ow-casino.js — the rules of the Lucky Loaf Casino, with no pixels attached.
   Three games as small state machines over a bank ({ cash(), add(delta) }). The MirrorOS windows draw them
   in 2D, the tables inside the casino draw them in 3D, and both read the same state, so what you see on the
   felt is exactly what the maths did. Nothing here is real money: the bank is the sock drawer. */

const pick = a => a[Math.floor(Math.random() * a.length)];

/* ── slots ── */
export const SLOT_SYMBOLS = [['box', 6], ['van', 6], ['gnome', 6], ['dog', 6], ['$', 12], ['loaf', 20]];
export const BETS = [5, 10, 25, 50];
export function createSlots(bank) {
  const s = { reels: ['loaf', '$', 'gnome'], bet: 10, msg: 'three loaves pays 20×. three of anything pays 6×. two pays back double. the rest pays nothing, like the job.', win: 0, spins: 0, spinning: false };
  return {
    state: s,
    setBet(v) { if (BETS.includes(v)) s.bet = v; },
    /* takes the bet, decides the reels and the payout at once; renderers animate the reveal and call settle() when done */
    spin() {
      if (s.spinning) return null;
      if (bank.cash() < s.bet) { s.msg = pick(["you can't afford that. the van can't either.", 'not enough in the drawer. deliver something.', 'the sock drawer says no.']); return null; }
      bank.add(-s.bet); s.spinning = true; s.spins++;
      const final = [0, 1, 2].map(() => pick(SLOT_SYMBOLS)[0]);
      let win = 0;
      if (final[0] === final[1] && final[1] === final[2]) win = s.bet * SLOT_SYMBOLS.find(x => x[0] === final[0])[1];
      else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) win = s.bet * 2;
      s.pending = { final, win }; return s.pending;
    },
    settle() {
      const p = s.pending; if (!p) return; s.pending = null; s.spinning = false; s.reels = p.final; s.win = p.win;
      if (p.win) { bank.add(p.win); s.msg = p.win >= s.bet * 6 ? pick([`$${p.win}. don't tell dispatch.`, `$${p.win}. the loaf provides.`, `$${p.win}. la peace.`]) : pick([`$${p.win}. that's lunch.`, `two of a kind. $${p.win}.`]); }
      else s.msg = pick(['nothing. the van watched.', 'the house thanks you. the house is a van.', 'that was a whole box of pay.', "gone. it's fine. it's not fine."]);
    },
  };
}

/* ── blackjack (the 21 kind) ── */
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'], SUITS = ['♠', '♥', '♦', '♣'];
export const deck = () => { const d = []; for (const s of SUITS) for (const r of RANKS) d.push({ r, s }); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
export const handValue = h => { let t = 0, a = 0; for (const c of h) { if (c.r === 'A') { a++; t += 11; } else if ('JQK'.includes(c.r)) t += 10; else t += +c.r; } while (t > 21 && a > 0) { t -= 10; a--; } return t; };
export const isRed = c => '♥♦'.includes(c.s);
export function createBlackjack(bank) {
  const s = { phase: 'bet', p: [], h: [], bet: 10, msg: 'dealer stands on 17. blackjack pays 3 to 2. the dealer is also a van.', win: 0, hands: 0, d: null };
  const finish = () => {
    const pv = handValue(s.p);
    if (pv <= 21) while (handValue(s.h) < 17) s.h.push(s.d.pop());
    const hv = handValue(s.h); s.phase = 'done'; let win = 0;
    if (pv > 21) s.msg = pick(['bust. the dealer did nothing. it just sat there.', 'over. like the shift.']);
    else if (pv === 21 && s.p.length === 2 && !(hv === 21 && s.h.length === 2)) { win = Math.round(s.bet * 2.5); s.msg = `blackjack. $${win}. suspicious.`; }
    else if (hv > 21 || pv > hv) { win = s.bet * 2; s.msg = pick([`you win $${win}. don't get used to it.`, `$${win}. the van looks away.`]); }
    else if (pv === hv) { win = s.bet; s.msg = 'push. nobody wins. familiar.'; }
    else s.msg = pick(['dealer wins. the dealer is a van.', 'house. always the house.']);
    s.win = win; if (win) bank.add(win);
  };
  return {
    state: s, value: handValue,
    setBet(v) { if (BETS.includes(v) && s.phase !== 'play') s.bet = v; },
    deal() {
      if (s.phase === 'play') return false;
      if (bank.cash() < s.bet) { s.msg = 'the sock drawer says no.'; return false; }
      bank.add(-s.bet); s.hands++; s.win = 0; s.d = deck(); s.p = [s.d.pop(), s.d.pop()]; s.h = [s.d.pop(), s.d.pop()]; s.phase = 'play'; s.msg = 'hit or stand. the dealer has all night. the dealer does not.';
      if (handValue(s.p) === 21) finish();
      return true;
    },
    hit() { if (s.phase !== 'play') return; s.p.push(s.d.pop()); if (handValue(s.p) > 21) finish(); else if (handValue(s.p) === 21) finish(); },
    stand() { if (s.phase !== 'play') return; finish(); },
    canDouble() { return s.phase === 'play' && s.p.length === 2 && bank.cash() >= s.bet; },
    double() { if (!this.canDouble()) return; bank.add(-s.bet); s.bet *= 2; s.p.push(s.d.pop()); finish(); s.bet /= 2; },
    reset() { if (s.phase === 'done') { s.phase = 'bet'; s.p = []; s.h = []; } },
  };
}

/* ── roulette (european, one zero, three ways to lose) ── */
export const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export const colorOf = n => n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black';
export function createRoulette(bank) {
  const s = { bets: { red: 0, black: 0, green: 0 }, chip: 10, last: [], msg: 'red or black pays double. green is the zero: 36×, once a lifetime.', spinning: false, result: null, win: 0, spins: 0 };
  const total = () => s.bets.red + s.bets.black + s.bets.green;
  return {
    state: s, total,
    setChip(v) { if (BETS.includes(v)) s.chip = v; },
    place(zone) {
      if (s.spinning || !(zone in s.bets)) return false;
      if (bank.cash() < s.chip) { s.msg = 'the sock drawer says no.'; return false; }
      bank.add(-s.chip); s.bets[zone] += s.chip; s.msg = `$${total()} on the felt. the wheel does not care.`; return true;
    },
    clear() { if (s.spinning) return; bank.add(total()); s.bets = { red: 0, black: 0, green: 0 }; s.msg = 'chips back. cowardice is free.'; },
    /* decides the number now; renderers spin the wheel and call settle() when the ball drops */
    spin() {
      if (s.spinning || total() === 0) { if (!total()) s.msg = 'put something down first. anything. a dollar. a hope.'; return null; }
      s.spinning = true; s.spins++; const n = WHEEL[Math.floor(Math.random() * WHEEL.length)]; s.pending = { n, color: colorOf(n) }; return s.pending;
    },
    settle() {
      const p = s.pending; if (!p) return; s.pending = null; s.spinning = false; s.result = p; s.last.unshift(p.n); if (s.last.length > 8) s.last.pop();
      let win = 0;
      if (p.color === 'red') win = s.bets.red * 2; else if (p.color === 'black') win = s.bets.black * 2; else win = s.bets.green * 36;
      s.win = win; if (win) bank.add(win);
      const lost = total() - (win ? (p.color === 'green' ? s.bets.green : s.bets[p.color]) : 0);
      s.msg = win ? (p.color === 'green' ? `ZERO. green. $${win}. the monk saw this.` : pick([`${p.n} ${p.color}. $${win}. don't leave. leave.`, `${p.n} ${p.color}. $${win}. the dealer nods.`])) : pick([`${p.n} ${p.color}. that's $${lost} the van needed anyway.`, `${p.n} ${p.color}. nothing. the wheel is also a van.`]);
      s.bets = { red: 0, black: 0, green: 0 };
    },
  };
}
