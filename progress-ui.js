/* progress-ui.js: home-page Math and Science Test Scores panels, avatar shop (avatar.html), per-chapter score box,
   and Export / Import / Reset of progress. Needs progress.js. GENERATED from study-guide-src/progress-src. */
(function () {
  'use strict';
  var P = window.Progress;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function fmtDate(d) { var t = new Date(d); return isNaN(t) ? '' : t.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); }
  function pctTxt(r) { return r.score + '/' + r.total + ' (' + r.pct + '%)'; }
  function noStore(box) { if (!P.available()) { var w = el('p', 'pg-hint', 'Saving is turned off in this browser (private mode?), so scores and points won\u2019t be kept.'); box.insertBefore(w, box.firstChild); } }

  /* ---------- Export / Import / Reset ---------- */
  function dataTools(box, after) {
    var wrap = el('div', 'pr-data'), msg = el('p', 'pr-msg'); msg.setAttribute('role', 'status');
    var ex = el('button', 'pg-toggle pr-export', '⬇️ Export progress'), imLbl = el('label', 'pg-toggle pr-import-label', '⬆️ Import progress'),
        im = el('input', 'pr-import'), rs = el('button', 'pg-toggle pr-reset', '🗑️ Reset progress');
    ex.type = rs.type = 'button'; im.type = 'file'; im.accept = '.json,application/json'; imLbl.appendChild(im);
    ex.addEventListener('click', function () {
      var blob = new Blob([P.exportJSON()], { type: 'application/json' }), a = el('a'); a.href = URL.createObjectURL(blob);
      a.download = 'tutor-progress-' + (P.user() || 'me') + '-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); msg.textContent = 'Progress file downloaded. Keep it safe as a backup.';
    });
    im.addEventListener('change', function () {
      var f = im.files && im.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        try {
          JSON.parse(rd.result);
          if (!window.confirm('Add the scores, points and items from this backup to your profile?')) { im.value = ''; return; }
          var s = P.importJSON(rd.result); msg.textContent = 'Imported ' + s.results.length + ' test results and ' + s.points + ' points.'; after();
        } catch (e) { msg.textContent = 'Could not import: ' + (e && e.message && /backup/.test(e.message) ? e.message : 'that file is not a valid progress backup.'); }
        im.value = '';
      };
      rd.readAsText(f);
    });
    rs.addEventListener('click', function () {
      var p = P.Auth.profile(); if (!p) return;
      if (!window.confirm('Reset ALL progress in the profile \u201c' + p.name + '\u201d? This deletes every saved test score, all points and the avatar items you bought, on every device where you use this profile. Export first if you want a backup.')) return;
      P.reset(); msg.textContent = 'Progress reset for ' + p.name + '.'; after();
    });
    wrap.appendChild(ex); wrap.appendChild(imLbl); wrap.appendChild(rs);
    /* which profile is saving, and its sync status (sync is automatic per profile) */
    var S = P.Sync, sy = el('div', 'pr-sync'), st = el('p', 'pr-sync-status'), now = el('button', 'pg-toggle pr-sync-now', '🔄 Sync now'), link = el('a', 'pt-link pr-profile-link');
    st.setAttribute('aria-live', 'polite'); now.type = 'button';
    function t(ms) { return ms ? new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' ' + new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'not yet'; }
    function show() {
      var p = P.Auth.profile(), c = S.config(); sy.className = 'pr-sync' + (p ? ' pr-sync-enabled' : '');
      [ex, rs].forEach(function (b) { b.disabled = !p; }); im.disabled = !p; imLbl.classList.toggle('pr-disabled', !p);
      if (!p) { st.textContent = '🔑 You are not logged in, so scores and points are not saved.'; link.textContent = '🔑 Log in or make a profile'; link.href = 'login.html'; now.hidden = true; return; }
      link.textContent = '👤 My profile'; link.href = 'login.html#profile'; now.hidden = !c.id;
      st.textContent = '☁️ Saving to ' + p.name + '\u2019s profile' + (c.status === 'limit' ? ' · ⚠️ ' + c.error : c.status === 'offline' ? ' · ⚠️ Can\u2019t reach the sync service right now; changes are saved here and will sync later.' : c.status === 'missing' ? ' · ⚠️ The profile\u2019s cloud record was not found; progress is saved on this device.' : ' · Last synced ' + t(c.lastPull || c.lastPush) + (c.dirty ? ' · waiting to upload' : ''));
    }
    now.addEventListener('click', function () { now.disabled = true; msg.textContent = 'Syncing…'; S.sync().then(function (r) { now.disabled = false; msg.textContent = r.ok ? 'Synced.' : r.error; show(); after(); }); });
    sy.appendChild(st); sy.appendChild(now); sy.appendChild(link);
    box.appendChild(sy); box.appendChild(wrap); box.appendChild(msg);
    window.addEventListener('progress:sync', show); window.addEventListener('progress:changed', show); show();
  }

  /* ---------- score table (Math chapters or Science units) ---------- */
  function scoreTable(body, s, chapters, o) {
    var noun = o.noun || 'Chapter', ids = chapters.map(function (c) { return c[0]; }), ov = P.overall(s, ids), plural = noun.toLowerCase() + 's';
    body.appendChild(el('h3', '', o.title));
    body.appendChild(el('p', 'pr-overall', ov.taken ? 'Overall: ' + ov.taken + ' test' + (ov.taken > 1 ? 's' : '') + ' taken in ' + ov.chapters + ' ' + (ov.chapters > 1 ? plural : noun.toLowerCase()) + ', average ' + ov.avg + '% (' + ov.grade + ')' : 'Overall: no practice tests taken yet. ' + o.empty));
    var wrap = el('div', 'pr-table-wrap'), t = el('table', 'pr-table'), hd = el('tr');
    [noun, 'Tests', 'Best', 'Latest', 'Average', 'Grade'].forEach(function (h) { var th = el('th', '', h); th.scope = 'col'; hd.appendChild(th); });
    var thead = el('thead'); thead.appendChild(hd); t.appendChild(thead); var tb = el('tbody');
    chapters.forEach(function (c) {
      var st = P.chapterStats(s, c[0]), tr = el('tr'), th = el('th'), a = el('a', '', (c[2] || c[0]) + '. ' + c[1]); th.scope = 'row'; a.href = o.link.replace('{n}', c[3] || c[0]); th.appendChild(a); tr.appendChild(th);
      if (!st.taken) { var td = el('td', 'pr-none', 'Not taken yet'); td.colSpan = 5; tr.appendChild(td); }
      else [String(st.taken), pctTxt(st.best), pctTxt(st.latest) + ' · ' + fmtDate(st.latest.date), st.avg + '%', st.grade].forEach(function (v, i) { var td = el('td', i === 4 ? 'pr-grade pr-g' + v : '', v); td.setAttribute('data-label', ['Tests', 'Best', 'Latest', 'Average', 'Grade'][i]); tr.appendChild(td); });
      tb.appendChild(tr);
    });
    var tf = el('tfoot'), fr = el('tr'), fth = el('th', '', 'Overall'); fth.scope = 'row'; fr.appendChild(fth);
    if (!ov.taken) { var n = el('td', 'pr-none', 'Not taken yet'); n.colSpan = 5; fr.appendChild(n); }
    else [String(ov.taken), '', '', ov.avg + '%', ov.grade].forEach(function (v, i) { var td = el('td', i === 4 ? 'pr-grade pr-g' + v : '', v); td.setAttribute('data-label', ['Tests', 'Best', 'Latest', 'Average', 'Grade'][i]); fr.appendChild(td); });
    tf.appendChild(fr); t.appendChild(tb); t.appendChild(tf); wrap.appendChild(t); body.appendChild(wrap);
    body.appendChild(el('p', 'pr-sub', 'Grades: A 90%+, B 80%+, C 70%+, D 60%+, F below 60%. Average is over all tests in that ' + noun.toLowerCase() + '.'));
  }
  /* ---------- home page panels ---------- */
  function home(box) {
    var chapters = JSON.parse(box.getAttribute('data-chapters') || '[]'), body = box.querySelector('.pr-body');
    function draw() {
      var s = P.load(); body.innerHTML = '';
      var top = el('div', 'pr-top'), av = el('a', 'pr-avatar'); av.href = 'avatar.html'; av.title = 'Open the Avatar Shop'; av.innerHTML = P.avatarSVG(s);
      var info = el('div', 'pr-info'); info.appendChild(el('p', 'pr-balance', '⭐ ' + s.points + ' points'));
      info.appendChild(el('p', 'pr-sub', 'Earned ' + s.earned + ' · spent ' + s.spent + ' (Math and Science tests both earn points)'));
      var shop = el('a', 'pt-link', '🛍️ Avatar Shop'); shop.href = 'avatar.html'; info.appendChild(shop);
      top.appendChild(av); top.appendChild(info); body.appendChild(top);
      scoreTable(body, s, chapters, { title: '📊 Math Test Scores', noun: 'Chapter', link: 'chapter-{n}.html#test', empty: 'Open a chapter and press the Practice Test tab!' });
    }
    draw(); dataTools(box, draw); noStore(box);
    window.addEventListener('storage', function (e) { if (P.isStateKey(e.key)) draw(); }); window.addEventListener('progress:changed', draw);
  }
  /* Science Test Scores: data-chapters = [[101, "Ecology", "A", 1], ...] (progress id, title, unit letter, page number) */
  function sciHome(box) {
    var units = JSON.parse(box.getAttribute('data-chapters') || '[]'), body = box.querySelector('.pr-body');
    function draw() { body.innerHTML = ''; scoreTable(body, P.load(), units, { title: '🔬 Science Test Scores', noun: 'Unit', link: 'science-chapter-{n}.html#test', empty: 'Open a science unit and press the Practice Test tab!' }); }
    draw(); window.addEventListener('storage', function (e) { if (P.isStateKey(e.key)) draw(); }); window.addEventListener('progress:changed', draw);
  }

  /* ---------- avatar shop ---------- */
  function shop(box) {
    var stage = box.querySelector('.av-stage'), bal = box.querySelector('.av-balance'), bases = box.querySelector('.av-bases'), cat = box.querySelector('.av-catalog'), msg = box.querySelector('.av-msg');
    function say(t) { msg.textContent = t; }
    function draw() {
      var s = P.load(), can = P.canSave(); stage.innerHTML = P.avatarSVG(s, { label: 'Your avatar' }); bal.textContent = can ? '⭐ ' + s.points + ' points' : '⭐ Log in to earn and spend points';
      var gate = box.querySelector('.av-login'); if (!can && !gate) { gate = el('p', 'pg-hint av-login'); gate.innerHTML = 'You are not logged in. <a class="pt-link" href="login.html?next=avatar.html">🔑 Log in or make a profile</a> to choose a character and buy items.'; stage.parentNode.parentNode.insertBefore(gate, stage.parentNode); } if (gate) gate.hidden = can;
      bases.innerHTML = '';
      Object.keys(P.BASE).forEach(function (k) {
        var b = el('button', 'av-base-btn' + (s.base === k ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-pressed', s.base === k ? 'true' : 'false'); b.setAttribute('data-base', k);
        b.innerHTML = P.avatarSVG({ equipped: {}, base: k }, { label: P.BASE[k].name }); b.appendChild(el('span', '', P.BASE[k].name));
        b.addEventListener('click', function () { P.update(function (st) { P.setBase(st, k); }); say('You are now the ' + P.BASE[k].name + '.'); draw(); });
        b.disabled = !can; bases.appendChild(b);
      });
      cat.innerHTML = '';
      P.SLOTS.forEach(function (sl) {
        var sec = el('section', 'av-slot'); sec.appendChild(el('h3', '', sl[1])); var grid = el('div', 'av-grid');
        P.ITEMS.filter(function (it) { return it.slot === sl[0]; }).forEach(function (it) {
          var own = !!s.owned[it.id], on = s.equipped[it.slot] === it.id, card = el('div', 'av-item' + (on ? ' on' : '') + (own ? ' owned' : '')); card.setAttribute('data-item', it.id);
          var pv = el('div', 'av-preview'); pv.innerHTML = P.avatarSVG({ equipped: {}, base: s.base }, { preview: (function () { var o = {}; o[it.slot] = it.id; return o; })(), label: it.name + ' preview' }); card.appendChild(pv);
          card.appendChild(el('p', 'av-name', it.name)); card.appendChild(el('p', 'av-price', own ? (on ? 'Wearing' : 'Owned') : '⭐ ' + it.price));
          var btn = el('button', own ? 'pg-toggle av-equip' : 'pg-generate av-buy'); btn.type = 'button';
          if (!own) {
            btn.textContent = 'Buy'; if (s.points < it.price) { btn.disabled = true; btn.title = 'Need ' + (it.price - s.points) + ' more points'; }
            btn.addEventListener('click', function () {
              var r = P.update(function (st) { return P.buy(st, it.id); });
              say(r.ok ? (r.already ? 'You already own the ' + it.name + '.' : 'You bought the ' + it.name + '! Press Wear to put it on.') : r.error); draw();
            });
          } else {
            btn.textContent = on ? 'Take off' : 'Wear';
            btn.addEventListener('click', function () { P.update(function (st) { on ? P.unequip(st, it.slot) : P.equip(st, it.id); }); say((on ? 'Took off the ' : 'Wearing the ') + it.name + '.'); draw(); });
          }
          if (!can) btn.disabled = true; card.appendChild(btn); grid.appendChild(card);
        });
        sec.appendChild(grid); cat.appendChild(sec);
      });
    }
    draw(); dataTools(box.querySelector('.av-data'), draw); noStore(box);
    window.addEventListener('storage', function (e) { if (P.isStateKey(e.key)) draw(); }); window.addEventListener('progress:changed', draw);
  }

  /* ---------- chapter page: my scores in the Practice Test tab ---------- */
  function chapterBox(box) {
    var ch = +box.getAttribute('data-chapter'), s = P.load(), st = P.chapterStats(s, ch); box.innerHTML = '';
    if (!P.canSave()) { var p = el('p'); p.innerHTML = 'Your scores: <a href="login.html?next=' + location.pathname.split('/').pop().replace(/[^a-z0-9.-]/g, '') + '%23test">log in</a> to save scores and earn points.'; box.appendChild(p); return; }
    if (!st.taken) { box.appendChild(el('p', '', 'Your scores: not taken yet.')); return; }
    box.appendChild(el('p', '', 'Your scores: ' + st.taken + ' test' + (st.taken > 1 ? 's' : '') + ' · best ' + pctTxt(st.best) + ' · latest ' + pctTxt(st.latest) + ' · average ' + st.avg + '% (' + st.grade + ') · ⭐ ' + s.points + ' points'));
  }

  /* ---------- home: greeting, log-in prompt, offer to move old progress into a profile ---------- */
  function hello(h) {
    var prompt = document.getElementById('tutor-login-prompt'), ban = null;
    function draw() {
      var p = P.Auth.profile(), L = P.Auth.legacy();
      h.textContent = p ? 'Hi, ' + p.name + '! 👋' : 'Hi there! 👋';
      if (prompt) prompt.hidden = !!p;
      if (L && !L.later && !ban) {
        ban = el('div', 'panel lg-migrate tutor-migrate'); ban.setAttribute('role', 'region'); ban.setAttribute('aria-label', 'Saved progress found');
        ban.appendChild(el('p', '', '📦 This device has progress saved from before profiles (' + L.tests + ' tests, ' + L.points + ' points). Save it in a profile so it isn’t lost?'));
        var go = el('a', 'pg-generate', '➕ Save it in a profile'), no = el('button', 'pg-toggle', 'Not now'); go.href = 'login.html?migrate=1'; no.type = 'button';
        no.addEventListener('click', function () { P.Auth.later(); ban.remove(); ban = null; });
        var row = el('p', 'lg-actions'); row.appendChild(go); row.appendChild(document.createTextNode(' ')); row.appendChild(no); ban.appendChild(row);
        (prompt || h).parentNode.insertBefore(ban, (prompt || h).nextSibling);
      } else if (ban && !L) { ban.remove(); ban = null; }
    }
    draw(); window.addEventListener('progress:changed', draw); window.addEventListener('storage', function (e) { if (P.isStateKey(e.key)) draw(); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!P) return;
    var hi = document.getElementById('tutor-hello'); if (hi) hello(hi);
    var h = document.getElementById('math-progress'); if (h) home(h);
    var sc = document.getElementById('science-progress'); if (sc) sciHome(sc);
    var a = document.getElementById('avatar-shop'); if (a) shop(a);
    Array.prototype.forEach.call(document.querySelectorAll('.pr-chapter'), chapterBox);
    window.addEventListener('progress:changed', function () { Array.prototype.forEach.call(document.querySelectorAll('.pr-chapter'), chapterBox); });
  });
})();
