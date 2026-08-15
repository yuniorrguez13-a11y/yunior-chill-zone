/* ═══════════════════════════════════════════════════════════════
   YUNIORS CHILL ZONE — records and playtime
   ───────────────────────────────────────────────────────────────
   One shared store for "your best run" and "how long you've played",
   kept in this browser only. Nothing is sent anywhere.

   A GAME reports a finished run:      yczScore('snake', 42)
   The console counts time played:     yczPlay('snake', 30000)
   Anything can read the lot:          yczData()

   Games are on the same origin as the console, so a game running in
   the console's iframe writes to the same store the console reads.
   That is the whole trick — no messaging needed.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var KEY = 'ycz-games';

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }

  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  function slot(data, id) {
    if (!data[id]) data[id] = { best: null, runs: 0, ms: 0, bestAt: 0 };
    return data[id];
  }

  /* Record the result of one run. Keeps the best ever seen.
     Pass {lower:true} for games where a smaller number is better. */
  window.yczScore = function (id, value, opts) {
    if (!id) return;
    value = Number(value);
    if (!isFinite(value)) return;

    var data = read(), g = slot(data, id);
    var better = (opts && opts.lower) ? (value < g.best) : (value > g.best);

    g.runs = (g.runs || 0) + 1;
    if (g.best === null || g.best === undefined || better) {
      g.best = value;
      g.bestAt = Date.now();
    }
    write(data);
    return g.best;
  };

  /* Some games have no "high score", just a count that keeps growing —
     matches won, for instance. This adds to the running total instead
     of keeping the highest single value. Stored in the same place, so
     the console reads every game the same way. */
  window.yczTally = function (id, n) {
    if (!id) return;
    n = (n === undefined) ? 1 : Number(n);
    if (!isFinite(n)) return;
    var data = read(), g = slot(data, id);
    g.runs = (g.runs || 0) + 1;
    g.best = (g.best || 0) + n;
    g.bestAt = Date.now();
    write(data);
    return g.best;
  };

  /* Add time played, in milliseconds. Called by the console, not by games —
     a game has no idea when the player closed it. */
  window.yczPlay = function (id, ms) {
    if (!id) return;
    ms = Number(ms);
    if (!isFinite(ms) || ms <= 0) return;
    var data = read(), g = slot(data, id);
    g.ms = (g.ms || 0) + ms;
    write(data);
    return g.ms;
  };

  /* Everything, or one game's slot. */
  window.yczData = function (id) {
    var data = read();
    return id ? (data[id] || { best: null, runs: 0, ms: 0, bestAt: 0 }) : data;
  };

  /* Wipe one game's record and time, or all of it. */
  window.yczReset = function (id) {
    if (!id) { write({}); return; }
    var data = read();
    delete data[id];
    write(data);
  };
})();
