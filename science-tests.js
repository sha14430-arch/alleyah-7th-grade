/* science-tests.js: question bank engine for The Tutor's Science practice tests.
   Parses the compact question lines, builds a random 20-question test (exactly 8 scenario/application + 12 other questions,
   spread across every lesson of the unit, with multiple choice, true/false, fill-in and short answer), and grades answers.
   Works in the browser (window.ScienceTests, bank from science-bank.js) and in node. GENERATED from study-guide-src/science-src. */
(function (root) {
  'use strict';
  var TEST_SIZE = 20, N_SCEN = 8;
  /* line formats ("*" in front = scenario/application question):
     M|question|correct|wrong1|wrong2|wrong3|why      T|statement|T or F|why
     F|text with ___|answer/alternative|why           S|question|kw1/kw1b&kw2|model answer|why  (every &-group needs one keyword) */
  function parse(line, lesson) {
    var scen = line.charAt(0) === '*', p = (scen ? line.slice(1) : line).split('|'), t = p[0], it = { lesson: lesson, scen: scen };
    if (t === 'M') { if (p.length !== 7) throw new Error('M needs 7 fields: ' + line); it.type = 'mc'; it.q = p[1]; it.a = p[2]; it.wrong = p.slice(3, 6); it.why = p[6]; }
    else if (t === 'T') { if (p.length !== 4 || !/^[TF]$/.test(p[2])) throw new Error('T needs statement|T or F|why: ' + line); it.type = 'tf'; it.q = p[1]; it.a = p[2] === 'T' ? 'True' : 'False'; it.why = p[3]; }
    else if (t === 'F') { if (p.length !== 4 || p[1].indexOf('___') < 0) throw new Error('F needs ___ and 4 fields: ' + line); it.type = 'fill'; it.q = p[1]; it.alts = p[2].split('/'); it.a = it.alts[0]; it.why = p[3]; }
    else if (t === 'S') { if (p.length !== 5) throw new Error('S needs 5 fields: ' + line); it.type = 'short'; it.q = p[1]; it.groups = p[2].split('&').map(function (g) { return g.split('/'); }); it.a = p[3]; it.why = p[4]; }
    else throw new Error('unknown question type: ' + line);
    if (!it.q || !it.a || !it.why) throw new Error('empty field: ' + line);
    return it;
  }
  function norm(s) { return String(s == null ? '' : s).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u2212\u2013]/g, '-').replace(/₂/g, '2').replace(/₃/g, '3').replace(/₄/g, '4').replace(/\s+/g, ' ').trim(); }
  function words(s) { return norm(s).replace(/\.(?!\d)/g, ' ').replace(/[^a-z0-9.%\- ]/g, ' ').replace(/\b(a|an|the)\b/g, ' ').replace(/\s+/g, ' ').trim(); }
  function num(s) { var m = norm(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
  function isNum(s) { return /^-?\d+(\.\d+)?%?$/.test(norm(s).replace(/,/g, '')); }
  function singular(w) { return w.replace(/(es|s)$/, ''); }
  /* grade one answer; returns {ok, matched?} */
  function grade(it, ans) {
    var u = norm(ans); if (!u) return { ok: false, blank: true };
    if (it.type === 'mc') return { ok: ans === it.a || u === norm(it.a) };
    if (it.type === 'tf') return { ok: (/^(t|true)$/.test(u) ? 'True' : /^(f|false)$/.test(u) ? 'False' : '') === it.a };
    if (it.type === 'fill') {
      var w = words(ans), n = num(ans);
      return { ok: it.alts.some(function (a) {
        if (isNum(a)) return n !== null && Math.abs(n - parseFloat(norm(a))) < 1e-9 && words(ans).replace(/[^a-z]/g, '').length <= 12; /* allow units like "g/cm3" */
        var wa = words(a); return w === wa || singular(w) === singular(wa) || norm(ans) === norm(a);
      }) };
    }
    /* short answer: each group of key ideas needs one keyword; identical groups need different keywords */
    var used = {}, hit = [];
    var ok = it.groups.every(function (g) {
      for (var i = 0; i < g.length; i++) { var k = norm(g[i]); if (k && !used[k] && u.indexOf(k) >= 0) { used[k] = 1; hit.push(k); return true; } }
      return false;
    });
    return { ok: ok, matched: hit };
  }
  function rng(seed) { if (seed === undefined) return Math.random; var x = (seed >>> 0) || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
  function shuffle(a, r) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* unit = {num, lessons:[{id, title, qs:[parsed]}]} */
  function pick(unit, scen, n, r) {
    var pools = shuffle(unit.lessons, r).map(function (l) { return shuffle(l.qs.filter(function (q) { return !!q.scen === scen; }), r); }), out = [], i = 0, guard = 0;
    while (out.length < n && guard++ < 1000) { var p = pools[i++ % pools.length]; if (p.length) out.push(p.pop()); }
    if (out.length < n) throw new Error('not enough ' + (scen ? 'scenario' : 'other') + ' questions in unit ' + unit.num);
    return out;
  }
  function buildTest(unit, seed) {
    var r = rng(seed), best = null;
    for (var tries = 0; tries < 40; tries++) {
      var qs = pick(unit, true, N_SCEN, r).concat(pick(unit, false, TEST_SIZE - N_SCEN, r)), types = {};
      qs.forEach(function (q) { types[q.type] = 1; });
      best = qs; if (Object.keys(types).length === 4) break;
    }
    return shuffle(best, r).map(function (q) {
      var it = { lesson: q.lesson, scen: q.scen, type: q.type, q: q.q, a: q.a, why: q.why };
      if (q.type === 'mc') it.choices = shuffle([q.a].concat(q.wrong), r);
      if (q.type === 'tf') it.choices = ['True', 'False'];
      if (q.alts) it.alts = q.alts.slice();
      if (q.groups) it.groups = q.groups.map(function (g) { return g.slice(); });
      return it;
    });
  }
  /* unit content file -> compact bank unit */
  function compile(u) {
    return { num: u.num, letter: u.letter, title: u.title, lessons: u.lessons.map(function (l) { return { id: l.id, title: l.title, qs: l.qs.map(function (s) { return parse(s, l.id); }) }; }) };
  }
  /* returns a list of problems with a unit's bank (empty = valid) */
  function validate(unit) {
    var errs = [], seen = {};
    unit.lessons.forEach(function (l) {
      var sc = l.qs.filter(function (q) { return q.scen; }).length, types = {};
      if (l.qs.length < 12) errs.push(l.id + ': only ' + l.qs.length + ' questions');
      if (sc < 4) errs.push(l.id + ': only ' + sc + ' scenario questions');
      l.qs.forEach(function (q) {
        types[q.type] = 1; var k = norm(q.q);
        if (seen[k]) errs.push(l.id + ': duplicate question "' + q.q + '"'); seen[k] = 1;
        if (q.type === 'mc') { var all = [q.a].concat(q.wrong).map(norm); if (new Set(all).size !== 4) errs.push(l.id + ': repeated choices in "' + q.q + '"'); }
        if (q.type === 'short') {
          q.groups.forEach(function (g) { g.forEach(function (k2) { if (/[a-z]/i.test(k2) && k2.replace(/[^a-z]/gi, '').length < 3) errs.push(l.id + ': keyword too short "' + k2 + '" in "' + q.q + '"'); }); });
          if (!grade(q, q.a).ok) errs.push(l.id + ': model answer fails its own keywords: "' + q.q + '"');
          if (grade(q, 'I do not know, maybe it is something else entirely').ok) errs.push(l.id + ': keywords too loose: "' + q.q + '"');
        }
        if (q.type === 'fill' && !grade(q, q.a).ok) errs.push(l.id + ': fill answer fails: "' + q.q + '"');
      });
      if (Object.keys(types).length < 4) errs.push(l.id + ': missing a question type');
    });
    return errs;
  }
  var api = { TEST_SIZE: TEST_SIZE, N_SCEN: N_SCEN, parse: parse, compile: compile, validate: validate, buildTest: buildTest, grade: grade, norm: norm, TYPE_NAMES: { mc: 'Multiple choice', tf: 'True or false', fill: 'Fill in the blank', short: 'Short answer' } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ScienceTests = api;
})(typeof window !== 'undefined' ? window : globalThis);
