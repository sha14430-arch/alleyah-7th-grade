/* progress.js: practice-test scores, points and the avatar shop for The Tutor.
   Everything is stored in this browser's localStorage (key "alleyahHub.progress.v1"), so progress is
   per device and per browser; use Export/Import to move it. Works in the browser (window.Progress) and node.
   GENERATED from study-guide-src/progress-src; edit there. */
(function (root) {
  'use strict';
  var KEY = 'alleyahHub.progress.v1';
  /* ---------- points ---------- */
  function percent(score, total) { return total > 0 ? Math.round(score / total * 100) : 0; }
  function grade(pct) { return pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'; }
  function pointsFor(pct) { return pct >= 100 ? 50 : pct >= 90 ? 30 : pct >= 80 ? 20 : pct >= 70 ? 10 : pct >= 60 ? 5 : 2; }
  var A_BONUS = 10;
  function fresh() { return { v: 1, results: [], points: 0, earned: 0, spent: 0, awarded: {}, aBonus: {}, owned: {}, equipped: {}, base: 'girl', eqAt: 0 }; }
  /* points are always DERIVED: earned = sum of each test's base points + one +10 A-bonus per chapter (first A in date order);
     spent = sum of prices of owned items; balance = earned - spent (never below 0). Merging devices can't double count. */
  function recompute(s) {
    var order = s.results.map(function (r, i) { return [r, i]; }).sort(function (a, b) { return a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]; });
    s.aBonus = {}; s.earned = 0;
    order.forEach(function (x) { var r = x[0]; r.pts = r.base; if (r.pct >= 90 && !s.aBonus[r.ch]) { s.aBonus[r.ch] = true; r.pts += A_BONUS; } s.earned += r.pts; });
    s.spent = Object.keys(s.owned).reduce(function (a, k) { return a + (ITEM[k] ? ITEM[k].price : 0); }, 0);
    s.points = Math.max(0, s.earned - s.spent); return s;
  }
  /* merge two states (devices): union of results by test id, union of owned items, latest avatar choice wins */
  function merge(a, b) {
    a = sanitize(a); b = sanitize(b); var m = fresh(), seen = {};
    a.results.concat(b.results).forEach(function (r) { if (!seen[r.id]) { seen[r.id] = 1; m.results.push(r); } });
    [a, b].forEach(function (x) { Object.keys(x.awarded).forEach(function (k) { m.awarded[k] = true; }); Object.keys(x.owned).forEach(function (k) { m.owned[k] = true; }); });
    var w = b.eqAt > a.eqAt ? b : a; m.equipped = Object.assign({}, w.equipped); m.base = w.base; m.eqAt = w.eqAt;
    return recompute(m);
  }
  function int(x, lo, hi) { x = Math.floor(Number(x)); if (!isFinite(x)) x = lo; return Math.max(lo, Math.min(hi, x)); }
  /* clean any loaded/imported object into a valid state (never negative, only known items) */
  function sanitize(o) {
    var s = fresh(); if (!o || typeof o !== 'object') return s;
    (Array.isArray(o.results) ? o.results : []).forEach(function (r) {
      if (!r || typeof r !== 'object') return; var ch = int(r.ch, 0, 99), total = int(r.total, 1, 100), score = int(r.score, 0, total);
      if (ch < 1) return; s.results.push({ id: String(r.id || ('imp' + s.results.length)).slice(0, 60), ch: ch, score: score, total: total, pct: percent(score, total), date: String(r.date || '').slice(0, 40), base: r.base === undefined ? pointsFor(percent(score, total)) : int(r.base, 0, 50), pts: 0 });
    });
    s.eqAt = int(o.eqAt, 0, 1e14);
    s.results.forEach(function (r) { s.awarded[r.id] = true; });
    if (o.awarded && typeof o.awarded === 'object') Object.keys(o.awarded).slice(0, 5000).forEach(function (k) { s.awarded[String(k).slice(0, 60)] = true; });
    if (o.owned && typeof o.owned === 'object') Object.keys(o.owned).forEach(function (k) { if (ITEM[k] && o.owned[k]) s.owned[k] = true; });
    if (o.equipped && typeof o.equipped === 'object') Object.keys(o.equipped).forEach(function (slot) { var id = o.equipped[slot]; if (ITEM[id] && ITEM[id].slot === slot && s.owned[id]) s.equipped[slot] = id; });
    if (BASE[o.base]) s.base = o.base;
    var seen = {}; s.results = s.results.filter(function (r) { if (seen[r.id]) return false; seen[r.id] = 1; return true; });
    return recompute(s);
  }
  /* record a submitted test; awards points once per test instance id */
  function recordTest(s, t) {
    var id = String(t.id || ''); if (!id) throw new Error('test id required');
    if (s.awarded[id]) return { duplicate: true, points: 0, bonus: 0, total: s.points };
    var total = int(t.total, 1, 100), score = int(t.score, 0, total), ch = int(t.ch, 1, 99), pct = percent(score, total);
    var answered = t.answered === undefined ? total : int(t.answered, 0, total);
    var base = answered * 2 >= total ? pointsFor(pct) : 0;  /* effort points need at least half the questions answered */
    var before = s.earned; recompute(s);
    s.results.push({ id: id, ch: ch, score: score, total: total, pct: pct, date: t.date || new Date().toISOString(), base: base, pts: 0 });
    s.awarded[id] = true; recompute(s); var got = s.earned - before, bonus = got - base;
    return { duplicate: false, points: base, bonus: bonus, total: s.points, pct: pct, grade: grade(pct), answered: answered };
  }
  function chapterStats(s, ch) {
    var rs = s.results.filter(function (r) { return r.ch === ch; });
    if (!rs.length) return { taken: 0 };
    var best = rs.reduce(function (a, r) { return r.pct > a.pct ? r : a; }), last = rs[rs.length - 1],
        avg = Math.round(rs.reduce(function (a, r) { return a + r.pct; }, 0) / rs.length);
    return { taken: rs.length, best: best, latest: last, avg: avg, grade: grade(avg), bestGrade: grade(best.pct) };
  }
  function overall(s) {
    var n = s.results.length; if (!n) return { taken: 0 };
    var avg = Math.round(s.results.reduce(function (a, r) { return a + r.pct; }, 0) / n);
    return { taken: n, avg: avg, grade: grade(avg), chapters: Object.keys(s.results.reduce(function (a, r) { a[r.ch] = 1; return a; }, {})).length };
  }
  /* ---------- shop ---------- */
  function buy(s, id) {
    var it = ITEM[id]; if (!it) return { ok: false, error: 'No such item.' };
    if (s.owned[id]) return { ok: true, already: true, points: s.points };
    if (s.points < it.price) return { ok: false, error: 'You need ' + (it.price - s.points) + ' more points.' };
    s.owned[id] = true; recompute(s);
    return { ok: true, points: s.points };
  }
  function now() { return Date.now(); }
  function equip(s, id) { var it = ITEM[id]; if (!it || !s.owned[id]) return false; s.equipped[it.slot] = id; s.eqAt = now(); return true; }
  function unequip(s, slot) { if (!s.equipped[slot]) return false; delete s.equipped[slot]; s.eqAt = now(); return true; }
  function setBase(s, b) { if (!BASE[b]) return false; s.base = b; s.eqAt = now(); return true; }

  /* ---------- avatar art (original, simple shapes; viewBox 0 0 200 200, head centred at 100,92) ---------- */
  var BASE = {
    girl: { name: 'Girl', svg: '<path d="M52 92c0-36 22-56 48-56s48 20 48 56v42H52z" fill="#5b3a29"/><rect x="70" y="140" width="60" height="50" rx="20" fill="#7a5cff"/><circle cx="100" cy="94" r="38" fill="#f6c9a5"/><path d="M62 88c6-30 70-38 76 0-16-14-52-16-76 0z" fill="#5b3a29"/><circle cx="86" cy="96" r="4.5" fill="#2b2b3a"/><circle cx="114" cy="96" r="4.5" fill="#2b2b3a"/><circle cx="78" cy="108" r="5" fill="#f4a3a8" opacity=".7"/><circle cx="122" cy="108" r="5" fill="#f4a3a8" opacity=".7"/><path d="M90 113q10 8 20 0" stroke="#2b2b3a" stroke-width="3" fill="none" stroke-linecap="round"/>' },
    cat: { name: 'Cat', svg: '<rect x="70" y="140" width="60" height="50" rx="22" fill="#f39c12"/><path d="M64 70l6-34 24 22zM136 70l-6-34-24 22z" fill="#f39c12"/><path d="M70 64l3-18 12 12zM130 64l-3-18-12 12z" fill="#ffd1dc"/><circle cx="100" cy="94" r="40" fill="#f5a623"/><circle cx="86" cy="92" r="5" fill="#2b2b3a"/><circle cx="114" cy="92" r="5" fill="#2b2b3a"/><path d="M96 104h8l-4 5z" fill="#e0567a"/><path d="M100 109q-6 6-12 2M100 109q6 6 12 2" stroke="#2b2b3a" stroke-width="2.5" fill="none"/><path d="M70 104h-18M70 110h-16M130 104h18M130 110h16" stroke="#2b2b3a" stroke-width="2"/>' },
    fox: { name: 'Fox', svg: '<rect x="70" y="140" width="60" height="50" rx="22" fill="#e8743b"/><path d="M60 76l4-42 30 26zM140 76l-4-42-30 26z" fill="#e8743b"/><circle cx="100" cy="94" r="40" fill="#e8743b"/><path d="M62 96q38 44 76 0q-10 34-38 34t-38-34z" fill="#fff"/><circle cx="86" cy="90" r="5" fill="#2b2b3a"/><circle cx="114" cy="90" r="5" fill="#2b2b3a"/><ellipse cx="100" cy="108" rx="6" ry="4.5" fill="#2b2b3a"/>' },
    robot: { name: 'Robot', svg: '<rect x="68" y="140" width="64" height="50" rx="10" fill="#8395a7"/><circle cx="100" cy="164" r="8" fill="#2ecc71"/><line x1="100" y1="54" x2="100" y2="36" stroke="#576574" stroke-width="4"/><circle cx="100" cy="34" r="6" fill="#e74c3c"/><rect x="62" y="54" width="76" height="80" rx="16" fill="#c8d6e5"/><rect x="74" y="80" width="52" height="24" rx="12" fill="#2b2b3a"/><circle cx="88" cy="92" r="6" fill="#48dbfb"/><circle cx="112" cy="92" r="6" fill="#48dbfb"/><rect x="84" y="114" width="32" height="6" rx="3" fill="#576574"/>' },
    panda: { name: 'Panda', svg: '<rect x="70" y="140" width="60" height="50" rx="22" fill="#2b2b3a"/><circle cx="68" cy="60" r="14" fill="#2b2b3a"/><circle cx="132" cy="60" r="14" fill="#2b2b3a"/><circle cx="100" cy="94" r="40" fill="#fff" stroke="#ddd" stroke-width="2"/><ellipse cx="85" cy="94" rx="10" ry="13" fill="#2b2b3a"/><ellipse cx="115" cy="94" rx="10" ry="13" fill="#2b2b3a"/><circle cx="86" cy="93" r="3.5" fill="#fff"/><circle cx="114" cy="93" r="3.5" fill="#fff"/><ellipse cx="100" cy="110" rx="6" ry="4" fill="#2b2b3a"/>' },
    alien: { name: 'Alien', svg: '<rect x="72" y="140" width="56" height="50" rx="22" fill="#16a085"/><path d="M78 58q-8-18-18-20M122 58q8-18 18-20" stroke="#1abc9c" stroke-width="4" fill="none"/><circle cx="60" cy="38" r="6" fill="#f1c40f"/><circle cx="140" cy="38" r="6" fill="#f1c40f"/><ellipse cx="100" cy="94" rx="42" ry="40" fill="#2ecc71"/><ellipse cx="84" cy="92" rx="10" ry="14" fill="#2b2b3a"/><ellipse cx="116" cy="92" rx="10" ry="14" fill="#2b2b3a"/><circle cx="87" cy="87" r="3" fill="#fff"/><circle cx="119" cy="87" r="3" fill="#fff"/><path d="M92 116q8 5 16 0" stroke="#2b2b3a" stroke-width="3" fill="none" stroke-linecap="round"/>' }
  };
  var SLOTS = [['background', 'Backgrounds'], ['cape', 'Capes'], ['eyes', 'Glasses'], ['head', 'Hats, bows & crowns'], ['pet', 'Pets'], ['effect', 'Sparkle effects']];
  var ITEMS = [
    { id: 'bg-sky', slot: 'background', name: 'Sunny sky', price: 20, svg: '<rect width="200" height="200" fill="#bfe6ff"/><circle cx="165" cy="35" r="16" fill="#ffd93b"/><ellipse cx="45" cy="40" rx="24" ry="9" fill="#fff"/>' },
    { id: 'bg-meadow', slot: 'background', name: 'Flower meadow', price: 40, svg: '<rect width="200" height="200" fill="#d6f5ff"/><rect y="150" width="200" height="50" fill="#7bd389"/><g fill="#ff8fb1"><circle cx="25" cy="170" r="5"/><circle cx="170" cy="178" r="5"/><circle cx="150" cy="162" r="4"/></g>' },
    { id: 'bg-sunset', slot: 'background', name: 'Sunset', price: 60, svg: '<defs><linearGradient id="g-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a8b"/><stop offset="1" stop-color="#ffd86f"/></linearGradient></defs><rect width="200" height="200" fill="url(#g-sun)"/><circle cx="100" cy="190" r="40" fill="#ff6f61" opacity=".6"/>' },
    { id: 'bg-space', slot: 'background', name: 'Outer space', price: 120, svg: '<rect width="200" height="200" fill="#1b1464"/><g fill="#fff"><circle cx="20" cy="30" r="2"/><circle cx="60" cy="15" r="1.5"/><circle cx="170" cy="60" r="2"/><circle cx="150" cy="20" r="1.5"/><circle cx="30" cy="120" r="1.5"/><circle cx="180" cy="130" r="2"/></g><circle cx="165" cy="165" r="18" fill="#f39c12"/><ellipse cx="165" cy="165" rx="28" ry="6" fill="none" stroke="#ffd86f" stroke-width="3"/>' },
    { id: 'bg-rainbow', slot: 'background', name: 'Rainbow', price: 200, svg: '<rect width="200" height="200" fill="#e8f7ff"/><g fill="none" stroke-width="10"><path d="M10 200a90 90 0 0 1 180 0" stroke="#ff595e"/><path d="M20 200a80 80 0 0 1 160 0" stroke="#ffca3a"/><path d="M30 200a70 70 0 0 1 140 0" stroke="#8ac926"/><path d="M40 200a60 60 0 0 1 120 0" stroke="#1982c4"/><path d="M50 200a50 50 0 0 1 100 0" stroke="#6a4c93"/></g>' },
    { id: 'cape-red', slot: 'cape', name: 'Hero cape', price: 60, svg: '<path d="M66 140l-26 58h120l-26-58z" fill="#e74c3c"/>' },
    { id: 'cape-galaxy', slot: 'cape', name: 'Galaxy cape', price: 180, svg: '<path d="M66 140l-30 58h128l-30-58z" fill="#4a3aa8"/><g fill="#fff"><circle cx="60" cy="180" r="2"/><circle cx="140" cy="175" r="2"/><circle cx="120" cy="190" r="1.5"/></g>' },
    { id: 'glasses-round', slot: 'eyes', name: 'Round glasses', price: 20, svg: '<g fill="none" stroke="#2b2b3a" stroke-width="3"><circle cx="86" cy="94" r="10"/><circle cx="114" cy="94" r="10"/><path d="M96 94h8M76 92l-12-4M124 92l12-4"/></g>' },
    { id: 'glasses-star', slot: 'eyes', name: 'Star glasses', price: 50, svg: '<g fill="#ff6fb5" stroke="#c2185b" stroke-width="2"><path d="M86 81l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/><path d="M114 81l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/></g>' },
    { id: 'glasses-cool', slot: 'eyes', name: 'Cool shades', price: 80, svg: '<path d="M70 86h60v6q-2 14-14 14t-14-12h-4q-2 12-14 12t-14-14z" fill="#2b2b3a"/><path d="M76 90l8 0" stroke="#fff" stroke-width="2"/>' },
    { id: 'bow-pink', slot: 'head', name: 'Pink bow', price: 25, svg: '<path d="M100 56l-24-12v24zM100 56l24-12v24z" fill="#ff6fb5"/><circle cx="100" cy="56" r="7" fill="#e0567a"/>' },
    { id: 'hat-party', slot: 'head', name: 'Party hat', price: 30, svg: '<path d="M100 10l-22 50h44z" fill="#4f8cff"/><circle cx="100" cy="10" r="7" fill="#ffd93b"/><path d="M84 46h32M90 32h20" stroke="#ffd93b" stroke-width="4"/>' },
    { id: 'hat-wizard', slot: 'head', name: 'Wizard hat', price: 100, svg: '<path d="M100 4l-30 56h60z" fill="#6a4c93"/><ellipse cx="100" cy="60" rx="46" ry="9" fill="#4a3aa8"/><path d="M96 30l3 6 6 1-5 4 1 6-5-3-5 3 1-6-5-4 6-1z" fill="#ffd93b"/>' },
    { id: 'hat-grad', slot: 'head', name: 'Graduation cap', price: 150, svg: '<path d="M100 30l52 18-52 18-52-18z" fill="#2b2b3a"/><rect x="78" y="52" width="44" height="14" fill="#2b2b3a"/><path d="M146 48v24" stroke="#ffd93b" stroke-width="3"/><circle cx="146" cy="74" r="4" fill="#ffd93b"/>' },
    { id: 'crown-gold', slot: 'head', name: 'Golden crown', price: 250, svg: '<path d="M66 64l4-34 16 18 14-24 14 24 16-18 4 34z" fill="#ffd93b" stroke="#e1a100" stroke-width="2"/><circle cx="100" cy="50" r="5" fill="#e74c3c"/><circle cx="80" cy="56" r="4" fill="#4f8cff"/><circle cx="120" cy="56" r="4" fill="#2ecc71"/>' },
    { id: 'pet-chick', slot: 'pet', name: 'Baby chick', price: 70, svg: '<g transform="translate(150 158)"><circle r="14" fill="#ffd93b"/><circle cx="4" cy="-3" r="2" fill="#2b2b3a"/><path d="M12 0l7 2-7 3z" fill="#f39c12"/></g>' },
    { id: 'pet-bunny', slot: 'pet', name: 'Bunny', price: 120, svg: '<g transform="translate(152 160)"><ellipse cx="-6" cy="-22" rx="4" ry="12" fill="#fff" stroke="#ccc"/><ellipse cx="6" cy="-22" rx="4" ry="12" fill="#fff" stroke="#ccc"/><circle r="14" fill="#fff" stroke="#ccc" stroke-width="1.5"/><circle cx="-5" cy="-2" r="2" fill="#2b2b3a"/><circle cx="5" cy="-2" r="2" fill="#2b2b3a"/><circle cy="4" r="2" fill="#ff8fb1"/></g>' },
    { id: 'pet-dragon', slot: 'pet', name: 'Tiny dragon', price: 300, svg: '<g transform="translate(152 158)"><path d="M-6-10l-14-12 4 16zM6-10l14-12-4 16z" fill="#8ac926"/><ellipse rx="16" ry="14" fill="#2ecc71"/><circle cx="-5" cy="-3" r="2.5" fill="#2b2b3a"/><circle cx="5" cy="-3" r="2.5" fill="#2b2b3a"/><path d="M-4 6q4 3 8 0" stroke="#2b2b3a" stroke-width="2" fill="none"/><path d="M-6-14l3-6 3 6zM2-14l3-6 3 6z" fill="#ffd93b"/></g>' },
    { id: 'fx-hearts', slot: 'effect', name: 'Floating hearts', price: 60, svg: '<g fill="#ff4d6d"><path d="M30 60c-6-8-16 0-8 8l8 8 8-8c8-8-2-16-8-8z"/><path d="M168 96c-5-6-13 0-6 6l6 6 6-6c7-6-1-12-6-6z"/><path d="M40 140c-4-5-10 0-5 5l5 5 5-5c5-5-1-10-5-5z"/></g>' },
    { id: 'fx-sparkle', slot: 'effect', name: 'Sparkles', price: 90, svg: '<g fill="#ffd93b"><path d="M30 40l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/><path d="M170 50l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/><path d="M160 130l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/><path d="M36 150l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></g>' }
  ];
  var ITEM = {}; ITEMS.forEach(function (it) { ITEM[it.id] = it; });
  /* layered avatar: background, cape, character, glasses, head item, pet, effects */
  function avatarSVG(s, opts) {
    opts = opts || {}; var eq = Object.assign({}, s.equipped, opts.preview || {}), b = BASE[opts.base || s.base] || BASE.girl;
    function layer(slot) { var id = eq[slot]; return id && ITEM[id] ? '<g class="av-' + slot + '">' + ITEM[id].svg + '</g>' : ''; }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" class="av-svg" role="img" aria-label="' + (opts.label || 'Avatar: ' + b.name) + '">' +
      (eq.background ? layer('background') : '<rect width="200" height="200" fill="#f3f0ff"/>') + layer('cape') + '<g class="av-base">' + b.svg + '</g>' + layer('eyes') + layer('head') + layer('pet') + layer('effect') + '</svg>';
  }
  /* ---------- storage ---------- */
  var SKEY = 'alleyahHub.sync.v1';
  function storage() { try { var ls = root.localStorage; var t = '__t'; ls.setItem(t, t); ls.removeItem(t); return ls; } catch (e) { return null; } }
  function load() { var ls = storage(); if (!ls) return fresh(); try { return sanitize(JSON.parse(ls.getItem(KEY) || 'null')); } catch (e) { return fresh(); } }
  function save(s) { var ls = storage(); if (!ls) return false; ls.setItem(KEY, JSON.stringify(s)); return true; }
  /* load -> change -> save, so two open tabs don't overwrite each other's newer data; then sync (if on) */
  function update(fn) { var s = load(), r = fn(s); save(s); Sync.changed(); return r; }
  function exportJSON() { var s = load(); return JSON.stringify({ app: 'alleyah-learning-hub', exported: new Date().toISOString(), progress: s }, null, 1); }
  function importJSON(text) {
    var o = JSON.parse(text); var p = o && o.progress ? o.progress : o;
    if (!p || typeof p !== 'object' || !Array.isArray(p.results)) throw new Error('This file is not a progress backup from The Tutor.');
    var s = sanitize(p); save(s); Sync.changed(); return s;
  }
  /* reset clears this device and turns sync off here (the synced copy stays, so other devices are not wiped) */
  function reset() { var ls = storage(); if (ls) { ls.removeItem(KEY); ls.removeItem(SKEY); } }

  /* ---------- cross-device sync (no account): one JSON record on the free public API at restful-api.dev ----------
     Only test results (chapter, score, date, random test id), owned items and the avatar choice are sent. No names.
     The sync code is the record id. Pull on page load (at most every 2 min), push after a test, purchase or avatar change. */
  var API = 'https://api.restful-api.dev/objects', PREFIX = 'ff808181', TAG = 'alleyah-hub-progress';
  function cfg() { var ls = storage(); try { return JSON.parse((ls && ls.getItem(SKEY)) || 'null') || {}; } catch (e) { return {}; } }
  function setCfg(c) { var ls = storage(); if (ls) ls.setItem(SKEY, JSON.stringify(c)); emit(); return c; }
  function emit() { try { if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('progress:sync', { detail: cfg() })); } catch (e) { } }
  function codeFromId(id) { id = String(id).toLowerCase(); var h = id.indexOf(PREFIX) === 0 && id.length === 32 ? id.slice(8) : id; return h.toUpperCase().match(/.{1,4}/g).join('-'); }
  function idFromCode(code) { var h = String(code || '').toLowerCase().replace(/[^0-9a-f]/g, ''); if (h.length === 24) return PREFIX + h; if (h.length === 32) return h; return null; }
  function payload(s) { return { name: TAG, data: { v: 1, results: s.results.map(function (r) { return { id: r.id, ch: r.ch, score: r.score, total: r.total, date: r.date, base: r.base }; }), owned: s.owned, equipped: s.equipped, base: s.base, eqAt: s.eqAt } }; }
  function fromRemote(obj) { if (!obj || !obj.data || obj.name !== TAG) throw new Error('That sync code does not belong to this site.'); return sanitize(obj.data); }
  function req(method, url, body) {
    var f = Sync.fetch || root.fetch; if (!f) return Promise.reject(new Error('offline'));
    return f.call(root, url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) { if (r.status === 404) { var e = new Error('No synced progress found for that code.'); e.notFound = true; throw e; } if (!r.ok) throw new Error('Sync service error ' + r.status + (r.status === 429 ? ' (daily limit reached; it will retry tomorrow)' : '')); return r.json(); });
  }
  function same(a, b) { return JSON.stringify(payload(a).data) === JSON.stringify(payload(b).data); }
  var busy = null, timer = null;
  function fail(e) { var c = cfg(); c.status = e && e.notFound ? 'missing' : 'offline'; c.error = String(e && e.message || e); c.dirty = true; setCfg(c); return { ok: false, error: c.error }; }
  /* pull remote, merge with local, save; push back if local had anything the remote lacked */
  function syncNow(force) {
    var c = cfg(); if (!c.id) return Promise.resolve({ ok: false, error: 'Sync is off.' });
    if (busy) return busy;
    busy = req('GET', API + '/' + c.id).then(function (remote) {
      var r = fromRemote(remote), m = merge(load(), r); save(m);
      var c2 = cfg(); c2.lastPull = Date.now();
      var push = !same(m, r) ? req('PUT', API + '/' + c.id, payload(m)).then(function () { c2.lastPush = Date.now(); }) : Promise.resolve();
      return push.then(function () { c2.dirty = false; c2.status = 'ok'; c2.error = ''; setCfg(c2); return { ok: true, state: m }; });
    }).catch(fail).then(function (x) { busy = null; return x; }, function (e) { busy = null; throw e; });
    return busy;
  }
  var Sync = {
    fetch: null, API: API, codeFromId: codeFromId, idFromCode: idFromCode, payload: payload, config: cfg,
    enabled: function () { return !!cfg().id; },
    code: function () { var c = cfg(); return c.id ? codeFromId(c.id) : ''; },
    enable: function () {
      if (cfg().id) return Promise.resolve({ ok: true, code: Sync.code() });
      return req('POST', API, payload(load())).then(function (o) {
        if (!o || !o.id) throw new Error('Sync service gave no id.');
        setCfg({ id: String(o.id), status: 'ok', lastPush: Date.now(), lastPull: Date.now() }); return { ok: true, code: codeFromId(o.id) };
      }).catch(function (e) { return { ok: false, error: 'Could not turn on sync: ' + (e.message || e) + '. Check the internet connection and try again.' }; });
    },
    link: function (code) {
      var id = idFromCode(code); if (!id) return Promise.resolve({ ok: false, error: 'That code doesn\u2019t look right. It is 6 groups of 4 letters/numbers, like 1A2B-3C4D-...' });
      return req('GET', API + '/' + id).then(function (remote) { fromRemote(remote); setCfg({ id: id, status: 'ok' }); return syncNow(true); })
        .then(function (r) { return r.ok ? { ok: true, code: codeFromId(id), state: r.state } : r; })
        .catch(function (e) { return { ok: false, error: e.message || String(e) }; });
    },
    disable: function () { var ls = storage(); if (ls) ls.removeItem(SKEY); emit(); },
    sync: syncNow,
    /* called after every local change: push soon (debounced so several clicks cost one request pair) */
    changed: function () { var c = cfg(); if (!c.id) return; c.dirty = true; setCfg(c); if (timer) clearTimeout(timer); timer = setTimeout(function () { timer = null; syncNow(); }, Sync.delay); },
    delay: 1500,
    /* page load: pull at most every 2 minutes, or right away if this device has unsynced changes */
    auto: function () { var c = cfg(); if (!c.id) return Promise.resolve(null); if (!c.dirty && c.lastPull && Date.now() - c.lastPull < 120000) return Promise.resolve(null); return syncNow(); },
    flush: function () { if (timer) { clearTimeout(timer); timer = null; return syncNow(); } return busy || Promise.resolve(null); }
  };
  if (root.addEventListener && root.document) {
    root.addEventListener('online', function () { if (cfg().dirty) syncNow(); });
    root.addEventListener('pagehide', function () { if (timer) { clearTimeout(timer); timer = null; syncNow(); } });
  }
  var api = { KEY: KEY, percent: percent, grade: grade, pointsFor: pointsFor, A_BONUS: A_BONUS, fresh: fresh, sanitize: sanitize, recordTest: recordTest,
    chapterStats: chapterStats, merge: merge, recompute: recompute, Sync: Sync, overall: overall, buy: buy, equip: equip, unequip: unequip, setBase: setBase, BASE: BASE, SLOTS: SLOTS, ITEMS: ITEMS, ITEM: ITEM,
    avatarSVG: avatarSVG, load: load, save: save, update: update, exportJSON: exportJSON, importJSON: importJSON, reset: reset, available: function () { return !!storage(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.Progress = api;
    /* pull from sync on every page load; tell pages to redraw when merged data arrives */
    var start = function () { Sync.auto().then(function (r) { if (r && r.ok) try { root.dispatchEvent(new root.CustomEvent('progress:changed')); } catch (e) { } }); };
    if (root.document && root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start); else if (root.document) start();
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this);
