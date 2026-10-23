/* progress.js: profiles, practice-test scores, points and the avatar shop for The Tutor.
   Each profile's progress is kept in this browser's localStorage (key "alleyahHub.progress.v1.u.<username>") and synced
   to that profile's record on restful-api.dev. The old single-user key "alleyahHub.progress.v1" is only read to migrate it.
   Works in the browser (window.Progress) and node.
   GENERATED from study-guide-src/progress-src; edit there. */
(function (root) {
  'use strict';
  var KEY = 'alleyahHub.progress.v1';
  /* ---------- points ---------- */
  function percent(score, total) { return total > 0 ? Math.round(score / total * 100) : 0; }
  function grade(pct) { return pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'; }
  function pointsFor(pct) { return pct >= 100 ? 50 : pct >= 90 ? 30 : pct >= 80 ? 20 : pct >= 70 ? 10 : pct >= 60 ? 5 : 2; }
  var A_BONUS = 10;
  function fresh() { return { v: 1, results: [], points: 0, earned: 0, spent: 0, awarded: {}, aBonus: {}, owned: {}, equipped: {}, base: 'girl', eqAt: 0, profile: { name: '', grade: '', at: 0 }, resetAt: '' }; }
  /* points are always DERIVED: earned = sum of each test's base points + one +10 A-bonus per chapter (first A in date order);
     spent = sum of prices of owned items; balance = earned - spent (never below 0). Merging devices can't double count. */
  function recompute(s) {
    var order = s.results.map(function (r, i) { return [r, i]; }).sort(function (a, b) { return a[0].date < b[0].date ? -1 : a[0].date > b[0].date ? 1 : a[1] - b[1]; });
    s.aBonus = {}; s.earned = 0;
    order.forEach(function (x) { var r = x[0]; r.pts = r.base; if (r.pct >= 90 && !s.aBonus[r.ch]) { s.aBonus[r.ch] = true; r.pts += A_BONUS; } s.earned += r.pts; });
    s.spent = Object.keys(s.owned).reduce(function (a, k) { return a + (ITEM[k] ? ITEM[k].price : 0); }, 0);
    s.points = Math.max(0, s.earned - s.spent); return s;
  }
  /* merge two states (devices): union of results by test id, union of owned items, latest avatar choice and latest
     profile edit win. A reset (resetAt) on one device drops older results and items that a stale device still has. */
  function merge(a, b) {
    a = sanitize(a); b = sanitize(b); var m = fresh(), seen = {};
    m.resetAt = a.resetAt > b.resetAt ? a.resetAt : b.resetAt;
    a.results.concat(b.results).forEach(function (r) { if (!seen[r.id] && !(m.resetAt && (r.at || r.date) < m.resetAt)) { seen[r.id] = 1; m.results.push(r); } });
    [a, b].forEach(function (x) { var stale = x.resetAt < m.resetAt; Object.keys(x.awarded).forEach(function (k) { if (!stale || seen[k]) m.awarded[k] = true; }); if (!stale) Object.keys(x.owned).forEach(function (k) { m.owned[k] = true; }); });
    var w = b.resetAt < m.resetAt ? a : a.resetAt < m.resetAt ? b : b.eqAt > a.eqAt ? b : a; m.equipped = {}; Object.keys(w.equipped).forEach(function (k) { if (m.owned[w.equipped[k]]) m.equipped[k] = w.equipped[k]; }); m.base = w.base; m.eqAt = w.eqAt;
    m.profile = Object.assign({}, b.profile.at > a.profile.at ? b.profile : a.profile);
    return recompute(m);
  }
  var GRADES = ['4', '5', '6', '7', '8', '9', '10', '11', '12', 'other'];
  function cleanName(x) { return String(x == null ? '' : x).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30); }
  function int(x, lo, hi) { x = Math.floor(Number(x)); if (!isFinite(x)) x = lo; return Math.max(lo, Math.min(hi, x)); }
  /* clean any loaded/imported object into a valid state (never negative, only known items) */
  function sanitize(o) {
    var s = fresh(); if (!o || typeof o !== 'object') return s;
    (Array.isArray(o.results) ? o.results : []).forEach(function (r) {
      if (!r || typeof r !== 'object') return; var ch = int(r.ch, 0, 199), total = int(r.total, 1, 100), score = int(r.score, 0, total);
      if (ch < 1) return; s.results.push({ id: String(r.id || ('imp' + s.results.length)).slice(0, 60), ch: ch, score: score, total: total, pct: percent(score, total), date: String(r.date || '').slice(0, 40), base: r.base === undefined ? pointsFor(percent(score, total)) : int(r.base, 0, 50), pts: 0 });
      if (typeof r.at === 'string' && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(r.at)) s.results[s.results.length - 1].at = r.at; /* when it was restored from a backup (outlives an earlier reset) */
    });
    s.eqAt = int(o.eqAt, 0, 1e14);
    s.results.forEach(function (r) { s.awarded[r.id] = true; });
    if (o.awarded && typeof o.awarded === 'object') Object.keys(o.awarded).slice(0, 5000).forEach(function (k) { s.awarded[String(k).slice(0, 60)] = true; });
    if (o.owned && typeof o.owned === 'object') Object.keys(o.owned).forEach(function (k) { if (ITEM[k] && o.owned[k]) s.owned[k] = true; });
    if (o.equipped && typeof o.equipped === 'object') Object.keys(o.equipped).forEach(function (slot) { var id = o.equipped[slot]; if (ITEM[id] && ITEM[id].slot === slot && s.owned[id]) s.equipped[slot] = id; });
    if (BASE[o.base]) s.base = o.base;
    if (o.profile && typeof o.profile === 'object') s.profile = { name: cleanName(o.profile.name), grade: GRADES.indexOf(String(o.profile.grade)) >= 0 ? String(o.profile.grade) : '', at: int(o.profile.at, 0, 1e14) };
    if (typeof o.resetAt === 'string' && /^\d{4}-\d\d-\d\dT[\d:.]+Z$/.test(o.resetAt)) s.resetAt = o.resetAt;
    var seen = {}; s.results = s.results.filter(function (r) { if (seen[r.id]) return false; seen[r.id] = 1; return true; });
    return recompute(s);
  }
  /* record a submitted test; awards points once per test instance id */
  function recordTest(s, t) {
    var id = String(t.id || ''); if (!id) throw new Error('test id required');
    if (s.awarded[id]) return { duplicate: true, points: 0, bonus: 0, total: s.points };
    var total = int(t.total, 1, 100), score = int(t.score, 0, total), ch = int(t.ch, 1, 199), pct = percent(score, total);
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
  /* chapter ids: math chapters are 1-99, science units are 101-105 (100 + unit number). chs = optional list of ids to include */
  function overall(s, chs) {
    var rs = chs ? s.results.filter(function (r) { return chs.indexOf(r.ch) >= 0; }) : s.results, n = rs.length; if (!n) return { taken: 0 };
    var avg = Math.round(rs.reduce(function (a, r) { return a + r.pct; }, 0) / n);
    return { taken: n, avg: avg, grade: grade(avg), chapters: Object.keys(rs.reduce(function (a, r) { a[r.ch] = 1; return a; }, {})).length };
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
  /* ---------- profiles and storage ----------
     SESSION = the signed-in username on this browser. DEVICES = this browser's quick-switch list of remembered profiles
     (with a local copy of each profile's PIN check, so switching back needs no network). Progress for a profile is under
     KEY + '.u.' + username; its sync settings under SKEY + '.u.' + username. KEY itself = old single-user data (migration). */
  var SKEY = 'alleyahHub.sync.v1', SESSION = 'alleyahHub.session.v1', DEVICES = 'alleyahHub.devices.v1', LOCKS = 'alleyahHub.locks.v1',
      BACKUP = KEY + '.backup', LATER = 'alleyahHub.migrate.later';
  var USER_RE = /^[a-z0-9_-]{3,20}$/, PIN_RE = /^\d{4,6}$/;
  function storage() { try { var ls = root.localStorage; var t = '__t'; ls.setItem(t, t); ls.removeItem(t); return ls; } catch (e) { return null; } }
  function getJ(k, d) { var ls = storage(); if (!ls) return d; try { var v = JSON.parse(ls.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } }
  function setJ(k, v) { var ls = storage(); if (ls) ls.setItem(k, JSON.stringify(v)); }
  function del(k) { var ls = storage(); if (ls) ls.removeItem(k); }
  function user() { var x = getJ(SESSION, null); return x && typeof x.u === 'string' && USER_RE.test(x.u) ? x.u : ''; }
  function pkey(u) { u = u === undefined ? user() : u; return u ? KEY + '.u.' + u : ''; }
  function skey(u) { u = u === undefined ? user() : u; return u ? SKEY + '.u.' + u : ''; }
  /* saving scores, points and items needs a signed-in profile (pages stay readable without one) */
  function canSave() { return !!user() && !!storage(); }
  function load(u) { var k = pkey(u), ls = storage(); if (!k || !ls) return fresh(); try { return sanitize(JSON.parse(ls.getItem(k) || 'null')); } catch (e) { return fresh(); } }
  function save(s, u) { var k = pkey(u), ls = storage(); if (!k || !ls) return false; ls.setItem(k, JSON.stringify(s)); return true; }
  /* load -> change -> save, so two open tabs don't overwrite each other's newer data; then sync. Signed out: nothing is saved. */
  function update(fn) { var s = load(), r = fn(s); if (canSave()) { save(s); Sync.changed(); } return r; }
  function exportJSON() { var s = load(); return JSON.stringify({ app: 'the-tutor', user: user(), exported: new Date().toISOString(), progress: s }, null, 1); }
  function importJSON(text) {
    if (!canSave()) throw new Error('Log in to a profile first, then import the backup into it.');
    var o = JSON.parse(text); var p = o && o.progress ? o.progress : o;
    if (!p || typeof p !== 'object' || !Array.isArray(p.results)) throw new Error('This file is not a progress backup from The Tutor.');
    var cur = load(), s = sanitize(p), have = {}, at = new Date().toISOString(); cur.results.forEach(function (r) { have[r.id] = 1; });
    s.results.forEach(function (r) { if (!have[r.id]) r.at = at; }); /* restoring a backup after a reset keeps its scores */
    s.profile = cur.profile; s.resetAt = cur.resetAt; s.eqAt = Math.max(now(), cur.eqAt + 1); /* the backup's outfit wins */ s = merge(cur, s); save(s); Sync.changed(); return s;
  }
  /* reset this profile's scores, points and items everywhere (the reset syncs, so other devices drop the old data too) */
  function reset() {
    if (!canSave()) return false; var cur = load(), s = fresh(); s.profile = cur.profile; s.base = cur.base; s.eqAt = now(); s.resetAt = new Date().toISOString();
    s.profile.at = cur.profile.at; save(s); Sync.changed(); return true;
  }

  /* ---------- cross-device sync: one JSON record per profile on the free public API at restful-api.dev ----------
     Sent: test results (chapter/unit, score, date, random test id), owned items, avatar, and the profile's display name and grade.
     Page load pulls at most every PULL_MS; after a test or purchase it pushes (a single PUT if it pulled recently). */
  var API = 'https://api.restful-api.dev/objects', TAG = 'alleyah-hub-progress', DIR_TAG = 'the-tutor-directory';
  var DIR_ID = 'ff808181a09d98f701a166308c7b60a6'; /* set by study-guide-src/build.js from tutor-config.json */
  function cfg(u) { return getJ(skey(u), {}) || {}; }
  function setCfg(c, u) { var k = skey(u); if (k) setJ(k, c); emit(); return c; }
  function emit() { try { if (root.dispatchEvent && root.CustomEvent) root.dispatchEvent(new root.CustomEvent('progress:sync', { detail: cfg() })); } catch (e) { } }
  function payload(s) { return { name: TAG, data: { v: 2, results: s.results.map(function (r) { var o = { id: r.id, ch: r.ch, score: r.score, total: r.total, date: r.date, base: r.base }; if (r.at) o.at = r.at; return o; }), owned: s.owned, equipped: s.equipped, base: s.base, eqAt: s.eqAt, profile: s.profile, resetAt: s.resetAt } }; }
  function fromRemote(obj) { if (!obj || !obj.data || obj.name !== TAG) throw new Error('That record does not belong to this site.'); return sanitize(obj.data); }
  function req(method, url, body) {
    var f = Sync.fetch || root.fetch; if (!f) return Promise.reject(new Error('offline'));
    Sync.requests++;
    return f.call(root, url, { method: method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' })
      .then(function (r) {
        if (r.status === 404) { var e = new Error('Not found on the sync service.'); e.notFound = true; throw e; }
        if (r.status === 429) { var l = new Error('The free sync service\u2019s daily limit was reached on this network. Your progress is saved here and will sync later.'); l.limit = true; throw l; }
        if (!r.ok) throw new Error('Sync service error ' + r.status); return r.json();
      });
  }
  function same(a, b) { return JSON.stringify(payload(a).data) === JSON.stringify(payload(b).data); }
  var busy = null, timer = null, BACKOFF = 3600000;
  function fail(e, u) { var c = cfg(u); c.status = e && e.notFound ? 'missing' : e && e.limit ? 'limit' : 'offline'; c.error = String(e && e.message || e); c.dirty = true; if (e && e.limit) c.wait = Date.now() + BACKOFF; setCfg(c, u); return { ok: false, error: c.error }; }
  function waiting(c) { return c.wait && Date.now() < c.wait; }
  function done(u, c2, m) { c2.dirty = false; c2.status = 'ok'; c2.error = ''; c2.wait = 0; setCfg(c2, u); return { ok: true, state: m }; }
  /* pull remote, merge with local, save; push back only if local had anything the remote lacked (1-2 requests) */
  function syncNow() {
    var u = user(), c = cfg(u); if (!u || !c.id) return Promise.resolve({ ok: false, error: 'Sync is off.' });
    if (busy) return busy;
    busy = req('GET', API + '/' + c.id).then(function (remote) {
      var r = fromRemote(remote), m = merge(load(u), r); save(m, u);
      var c2 = cfg(u); c2.lastPull = Date.now();
      var push = !same(m, r) ? req('PUT', API + '/' + c.id, payload(m)).then(function () { c2.lastPush = Date.now(); }) : Promise.resolve();
      return push.then(function () { return done(u, c2, m); });
    }).catch(function (e) { return fail(e, u); }).then(function (x) { busy = null; return x; });
    return busy;
  }
  /* push only (1 request). Safe because merging is a union: if another device wrote since our last pull, it still has its
     own copy and puts it back on its next sync. Used only when this device pulled within PULL_MS. */
  function pushNow() {
    var u = user(), c = cfg(u); if (!u || !c.id) return Promise.resolve({ ok: false, error: 'Sync is off.' });
    if (busy) return busy;
    var m = load(u);
    busy = req('PUT', API + '/' + c.id, payload(m)).then(function () { var c2 = cfg(u); c2.lastPush = Date.now(); return done(u, c2, m); })
      .catch(function (e) { return fail(e, u); }).then(function (x) { busy = null; return x; });
    return busy;
  }
  function flushNow() { var c = cfg(); return c.lastPull && Date.now() - c.lastPull < Sync.PULL_MS ? pushNow() : syncNow(); }
  var Sync = {
    fetch: null, API: API, payload: payload, config: function () { return cfg(); }, requests: 0,
    enabled: function () { return !!cfg().id; },
    sync: syncNow,
    /* called after every local change: push soon (debounced so several clicks cost one request) */
    changed: function () { var c = cfg(); if (!c.id) return; c.dirty = true; setCfg(c); if (waiting(c)) return; if (timer) clearTimeout(timer); timer = setTimeout(function () { timer = null; flushNow(); }, Sync.delay); },
    delay: 1500, PULL_MS: 15 * 60000,
    /* page load: pull at most every PULL_MS (or right away if this device has unsynced changes); wait an hour after a 429 */
    auto: function () { var c = cfg(); if (!user() || !c.id || waiting(c)) return Promise.resolve(null); if (!c.dirty && c.lastPull && Date.now() - c.lastPull < Sync.PULL_MS) return Promise.resolve(null); return c.dirty && c.lastPull && Date.now() - c.lastPull < Sync.PULL_MS ? pushNow() : syncNow(); },
    flush: function () { if (timer) { clearTimeout(timer); timer = null; return flushNow(); } return busy || Promise.resolve(null); }
  };
  if (root.addEventListener && root.document) {
    root.addEventListener('online', function () { var c = cfg(); if (c.dirty && !waiting(c)) flushNow(); });
    root.addEventListener('pagehide', function () { if (timer) { clearTimeout(timer); timer = null; flushNow(); } });
  }

  /* ---------- profiles: sign up, log in, switch, log out ----------
     The directory record (one shared record on restful-api.dev) maps username -> { s: salt, i: PBKDF2 iterations,
     h: PIN check (PBKDF2-SHA-256), iv + r: the profile's record id encrypted with AES-GCM using a key from the same PBKDF2 run }.
     This is LIGHTWEIGHT protection: a 4-6 digit PIN can be guessed offline by anyone who copies the public directory, and
     anyone can edit or delete records on the free public API. It keeps classmates from casually using each other's profile. */
  var ITER = 100000, LOCK_TRIES = 5, LOCK_MS = 30000;
  function subtle() { var c = root.crypto || (typeof globalThis !== 'undefined' && globalThis.crypto); if (!c || !c.subtle) throw new Error('This browser can\u2019t do the PIN check (it needs a secure https page).'); return c; }
  function b64(bytes) { var s = ''; bytes = new Uint8Array(bytes); for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return (root.btoa || function (x) { return Buffer.from(x, 'binary').toString('base64'); })(s); }
  function unb64(t) { var s = (root.atob || function (x) { return Buffer.from(x, 'base64').toString('binary'); })(String(t)), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  function hex(bytes) { return Array.prototype.map.call(new Uint8Array(bytes), function (x) { return (x < 16 ? '0' : '') + x.toString(16); }).join(''); }
  function derive(u, pin, salt, iter) {
    var c = subtle(), enc = new TextEncoder();
    return c.subtle.importKey('raw', enc.encode(u + ':' + pin), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return c.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: iter }, k, 512); })
      .then(function (bits) { var b = new Uint8Array(bits); return c.subtle.importKey('raw', b.slice(32), 'AES-GCM', false, ['encrypt', 'decrypt']).then(function (key) { return { check: hex(b.slice(0, 32)), key: key }; }); });
  }
  function makeEntry(u, pin, recordId) {
    var c = subtle(), salt = c.getRandomValues(new Uint8Array(16)), iv = c.getRandomValues(new Uint8Array(12));
    return derive(u, pin, salt, ITER).then(function (d) {
      return c.subtle.encrypt({ name: 'AES-GCM', iv: iv }, d.key, new TextEncoder().encode(recordId)).then(function (ct) { return { s: b64(salt), i: ITER, h: d.check, iv: b64(iv), r: b64(ct), at: new Date().toISOString() }; });
    });
  }
  /* -> record id if the PIN is right, else null */
  function openEntry(u, e, pin) {
    if (!e || !e.s || !e.h) return Promise.resolve(null);
    return derive(u, pin, unb64(e.s), int(e.i, 1000, 1e7)).then(function (d) {
      var a = d.check, b = String(e.h), diff = a.length ^ b.length; for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i % (b.length || 1));
      if (diff) return null;
      return subtle().subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.iv) }, d.key, unb64(e.r)).then(function (pt) { return new TextDecoder().decode(pt); }, function () { return null; });
    });
  }
  function dirUrl() { var id = Auth.DIR_ID; if (!id || /^__/.test(id)) throw new Error('Profiles are not set up on this copy of the site yet (no directory record).'); return API + '/' + id; }
  function getDir() {
    return Promise.resolve().then(dirUrl).then(function (url) { return req('GET', url); }).then(function (o) {
      if (!o || o.name !== DIR_TAG || !o.data || typeof o.data.users !== 'object') throw new Error('The profile directory looks damaged.');
      return o.data.users || {};
    }, function (e) { if (e && e.notFound) throw new Error('The profile directory is missing from the sync service.'); throw e; });
  }
  function putDir(users) { return req('PUT', dirUrl(), { name: DIR_TAG, data: { v: 1, users: users } }); }
  function normUser(x) { return String(x || '').trim().toLowerCase(); }
  function devices() { var d = getJ(DEVICES, []); return Array.isArray(d) ? d.filter(function (x) { return x && USER_RE.test(x.u); }) : []; }
  function remember(u, entry) {
    var s = load(u), list = devices().filter(function (x) { return x.u !== u; }), old = devices().filter(function (x) { return x.u === u; })[0] || {};
    list.unshift({ u: u, name: s.profile.name || u, base: s.base, e: entry || old.e }); setJ(DEVICES, list.slice(0, 12));
  }
  function setSession(u) { if (u) setJ(SESSION, { u: u, at: Date.now() }); else del(SESSION); try { root.dispatchEvent(new root.CustomEvent('progress:changed')); } catch (e) { } }
  function locked(u) { var l = getJ(LOCKS, {})[u]; return l && l.until > Date.now() ? Math.ceil((l.until - Date.now()) / 1000) : 0; }
  function failedTry(u) { var all = getJ(LOCKS, {}), l = all[u] || { n: 0 }; l.n++; if (l.n >= LOCK_TRIES) { l.until = Date.now() + LOCK_MS; l.n = 0; } all[u] = l; setJ(LOCKS, all); }
  function clearTries(u) { var all = getJ(LOCKS, {}); delete all[u]; setJ(LOCKS, all); }
  function err(m) { return { ok: false, error: m }; }
  function checkFields(o, isNew) {
    var u = normUser(o.username);
    if (!USER_RE.test(u)) return 'Usernames are 3 to 20 letters, numbers, - or _ (no spaces).';
    if (!PIN_RE.test(String(o.pin || ''))) return 'The PIN must be 4 to 6 digits.';
    if (isNew) {
      if (!cleanName(o.name)) return 'Please type a display name (a first name or nickname is enough).';
      if (o.pin2 !== undefined && String(o.pin2) !== String(o.pin)) return 'The two PINs don\u2019t match.';
      if (/^(\d)\1+$/.test(o.pin) || '0123456789'.indexOf(o.pin) >= 0 || '9876543210'.indexOf(o.pin) >= 0) return 'That PIN is too easy to guess. Avoid 1234 or 1111.';
    }
    return '';
  }
  /* the old single-user progress on this device (before profiles), if any */
  function legacy() { var ls = storage(); if (!ls || !ls.getItem(KEY)) return null; var s; try { s = sanitize(JSON.parse(ls.getItem(KEY))); } catch (e) { return null; } if (!s.results.length && !Object.keys(s.owned).length) return null; return { state: s, tests: s.results.length, points: s.points, syncId: (getJ(SKEY, {}) || {}).id || '', later: !!getJ(LATER, false) }; }
  function finishMigration() { var ls = storage(); if (!ls) return; var raw = ls.getItem(KEY); if (raw) ls.setItem(BACKUP, raw); ls.removeItem(KEY); ls.removeItem(SKEY); ls.removeItem(LATER); }
  /* fold the old data (and whatever its old sync record held) into state s; costs 1 GET only if old sync was on */
  function withLegacy(s) {
    var L = legacy(); if (!L) return Promise.resolve(s);
    var m = merge(s, L.state); m.profile = s.profile; m.base = s.base; m.eqAt = Math.max(s.eqAt, 1);
    if (!L.syncId) return Promise.resolve(m);
    return req('GET', API + '/' + L.syncId).then(function (o) { var r = merge(m, fromRemote(o)); r.profile = m.profile; r.base = m.base; r.eqAt = m.eqAt; return r; }, function () { return m; });
  }
  var Auth = {
    DIR_ID: DIR_ID, USER_RE: USER_RE, PIN_RE: PIN_RE, GRADES: GRADES, ITER: ITER,
    user: user, devices: devices, legacy: legacy, makeEntry: makeEntry, openEntry: openEntry, checkFields: checkFields,
    later: function () { setJ(LATER, true); },
    profile: function () { var u = user(); if (!u) return null; var s = load(u); return { username: u, name: s.profile.name || u, grade: s.profile.grade, base: s.base }; },
    /* sign up: GET directory (name free?), POST the new progress record, GET directory again, PUT it with the new entry */
    signUp: function (o) {
      var bad = checkFields(o, true); if (bad) return Promise.resolve(err(bad));
      var u = normUser(o.username), pin = String(o.pin), s = fresh(), recId = '';
      s.profile = { name: cleanName(o.name), grade: GRADES.indexOf(String(o.grade)) >= 0 ? String(o.grade) : '', at: now() };
      if (BASE[o.base]) { s.base = o.base; } s.eqAt = now();
      return getDir().then(function (users) {
        if (users[u]) throw new Error('The username \u201c' + u + '\u201d is taken. Please pick another one.');
        return o.migrate ? withLegacy(s) : s;
      }).then(function (st) { s = st; return req('POST', API, payload(s)); }).then(function (rec) {
        if (!rec || !rec.id) throw new Error('The sync service gave no record id.'); recId = String(rec.id);
        return getDir(); /* re-read right before writing, so a profile made a moment ago on another device is not lost */
      }).then(function (users) {
        if (users[u]) { req('DELETE', API + '/' + recId).catch(function () { }); throw new Error('The username \u201c' + u + '\u201d was just taken. Please pick another one.'); }
        return makeEntry(u, pin, recId).then(function (entry) { users[u] = entry; return putDir(users).then(function () { return entry; }); });
      }).then(function (entry) {
        save(s, u); setCfg({ id: recId, status: 'ok', lastPull: Date.now(), lastPush: Date.now() }, u);
        if (o.migrate) finishMigration();
        remember(u, entry); clearTries(u); setSession(u); return { ok: true, user: u };
      }).catch(function (e) { return err(e.message || String(e)); });
    },
    /* log in: check the PIN against this device's saved copy first (no network); otherwise GET the directory.
       Then pull the profile's record (GET, plus a PUT only if this device had something new). */
    logIn: function (o) {
      var bad = checkFields(o, false); if (bad) return Promise.resolve(err(bad));
      var u = normUser(o.username), pin = String(o.pin), wait = locked(u);
      if (wait) return Promise.resolve(err('Too many wrong PINs. Wait ' + wait + ' seconds and try again.'));
      var mine = devices().filter(function (x) { return x.u === u; })[0], entry = null, viaLocal = false;
      return (mine && mine.e ? openEntry(u, mine.e, pin) : Promise.resolve(null)).then(function (id) {
        if (id) { viaLocal = true; entry = mine.e; return id; }
        return getDir().then(function (users) {
          entry = users[u]; if (!entry) { failedTry(u); throw new Error('No profile called \u201c' + u + '\u201d. Check the spelling or sign up.'); }
          return openEntry(u, entry, pin);
        });
      }).then(function (id) {
        if (!id) { failedTry(u); throw new Error('Wrong PIN for \u201c' + u + '\u201d.'); }
        clearTries(u); var c = cfg(u); if (c.id !== id) c = { id: id }; setCfg(c, u);
        setSession(u);
        var mig = o.migrate ? withLegacy(load(u)).then(function (m) { var cur = load(u); m.profile = cur.profile; m.base = cur.base; m.eqAt = cur.eqAt; save(merge(cur, m), u); finishMigration(); var c2 = cfg(u); c2.dirty = true; c2.lastPull = 0; setCfg(c2, u); }) : Promise.resolve();
        return mig.then(function () { return viaLocal ? Sync.auto() : syncNow(); });
      }).then(function (r) {
        remember(u, entry); setSession(u);
        return { ok: true, user: u, synced: !!(r && r.ok), warning: r && r.ok === false ? r.error : '' };
      }).catch(function (e) { return err(e.message || String(e)); });
    },
    /* switch user: sign out here but stay in the quick-switch list */
    switchUser: function () { return Sync.flush().then(function () { setSession(''); return { ok: true }; }); },
    /* log out: optionally forget the profile on this device (its progress stays in the cloud record) */
    logOut: function (forget) {
      var u = user();
      return Sync.flush().then(function () {
        if (forget && u) { setJ(DEVICES, devices().filter(function (x) { return x.u !== u; })); if (!cfg(u).dirty) { del(pkey(u)); del(skey(u)); } }
        setSession(''); return { ok: true };
      });
    },
    /* display name, grade, starter character: saved in the profile's own record (no directory call) */
    updateProfile: function (o) {
      var u = user(); if (!u) return err('Log in first.'); var name = cleanName(o.name);
      if (!name) return err('Please type a display name.');
      update(function (s) { s.profile = { name: name, grade: GRADES.indexOf(String(o.grade)) >= 0 ? String(o.grade) : '', at: now() }; if (o.base && o.base !== s.base) setBase(s, o.base); });
      remember(u); setSession(u); return { ok: true };
    },
    /* change PIN: GET directory, check the old PIN against it, PUT the new entry (2 requests) */
    changePin: function (oldPin, newPin, newPin2) {
      var u = user(); if (!u) return Promise.resolve(err('Log in first.'));
      var bad = checkFields({ username: u, pin: newPin, pin2: newPin2, name: 'x' }, true); if (bad) return Promise.resolve(err(bad.replace('The PIN', 'The new PIN')));
      var wait = locked(u); if (wait) return Promise.resolve(err('Too many wrong PINs. Wait ' + wait + ' seconds.'));
      var users;
      return getDir().then(function (us) { users = us; return openEntry(u, users[u], String(oldPin)); }).then(function (id) {
        if (!id) { failedTry(u); throw new Error('Your current PIN is not right.'); }
        return makeEntry(u, String(newPin), id);
      }).then(function (entry) { users[u] = entry; return putDir(users).then(function () { remember(u, entry); clearTries(u); return { ok: true }; }); })
        .catch(function (e) { return err(e.message || String(e)); });
    }
  };

  var api = { KEY: KEY, percent: percent, grade: grade, pointsFor: pointsFor, A_BONUS: A_BONUS, fresh: fresh, sanitize: sanitize, recordTest: recordTest,
    chapterStats: chapterStats, merge: merge, recompute: recompute, Sync: Sync, Auth: Auth, overall: overall, buy: buy, equip: equip, unequip: unequip, setBase: setBase, BASE: BASE, SLOTS: SLOTS, ITEMS: ITEMS, ITEM: ITEM,
    avatarSVG: avatarSVG, load: load, save: save, update: update, exportJSON: exportJSON, importJSON: importJSON, reset: reset, canSave: canSave, user: user,
    storageKey: function () { return pkey(); }, isStateKey: function (k) { return k === SESSION || (!!pkey() && k === pkey()); }, available: function () { return !!storage(); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else {
    root.Progress = api;
    /* pull from sync on page load; tell pages to redraw when merged data arrives; show who is signed in in the menu */
    var account = function () {
      var p = Auth.profile(); Array.prototype.forEach.call(root.document.querySelectorAll('a.nav-account'), function (a) {
        a.textContent = p ? '\ud83d\udc64 ' + p.name : '\ud83d\udd11 Log in'; a.href = p ? 'login.html#profile' : 'login.html'; a.title = p ? 'Signed in as ' + p.username + ' \u2014 profile, switch user, log out' : 'Log in or make a profile';
      });
    };
    var start = function () { account(); Sync.auto().then(function (r) { if (r && r.ok) try { root.dispatchEvent(new root.CustomEvent('progress:changed')); } catch (e) { } }); };
    if (root.addEventListener) root.addEventListener('progress:changed', function () { if (root.document && root.document.body) account(); });
    if (root.document && root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start); else if (root.document) start();
  }
})(typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : this);
