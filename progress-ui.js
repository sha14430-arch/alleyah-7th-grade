/* progress-ui.js: home-page Math Test Scores panel, avatar shop (avatar.html), per-chapter score box,
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
      a.download = 'alleyah-progress-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000); msg.textContent = 'Progress file downloaded. Keep it safe as a backup.';
    });
    im.addEventListener('change', function () {
      var f = im.files && im.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        try {
          JSON.parse(rd.result);
          if (!window.confirm('Importing replaces the scores, points and avatar saved in this browser. Continue?')) { im.value = ''; return; }
          var s = P.importJSON(rd.result); msg.textContent = 'Imported ' + s.results.length + ' test results and ' + s.points + ' points.'; after();
        } catch (e) { msg.textContent = 'Could not import: ' + (e && e.message && /backup/.test(e.message) ? e.message : 'that file is not a valid progress backup.'); }
        im.value = '';
      };
      rd.readAsText(f);
    });
    rs.addEventListener('click', function () {
      if (!window.confirm('Reset ALL progress on this device? This deletes every saved test score, all points and the avatar items you bought here, and turns sync off on this device (the synced copy is kept for other devices). Export first if you want a backup.')) return;
      P.reset(); msg.textContent = 'Progress reset on this device (sync turned off here).'; after(); window.dispatchEvent(new CustomEvent('progress:sync'));
    });
    wrap.appendChild(ex); wrap.appendChild(imLbl); wrap.appendChild(rs);
    /* sync across devices */
    var S = P.Sync, sy = el('div', 'pr-sync'), st = el('p', 'pr-sync-status'); st.setAttribute('aria-live', 'polite');
    var on = el('button', 'pg-generate pr-sync-on', '🔄 Turn on sync'), now = el('button', 'pg-toggle pr-sync-now', '🔄 Sync now'), off = el('button', 'pg-toggle pr-sync-off', 'Turn off sync here'),
        copy = el('button', 'pg-toggle pr-sync-copy', '📋 Copy code'), form = el('form', 'pr-sync-form'), lab = el('label', '', 'Enter sync code from another device: '), inp = el('input', 'pr-sync-input'), go = el('button', 'pg-toggle pr-sync-link', 'Link');
    [on, now, off, copy].forEach(function (b) { b.type = 'button'; }); go.type = 'submit'; inp.type = 'text'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'characters'); inp.spellcheck = false; inp.placeholder = 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX'; inp.id = 'sync-code-' + Math.random().toString(36).slice(2, 7); lab.htmlFor = inp.id;
    form.appendChild(lab); form.appendChild(inp); form.appendChild(go);
    function t(ms) { return ms ? new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) + ' ' + new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'not yet'; }
    function show() {
      var c = S.config(), en = !!c.id; sy.className = 'pr-sync' + (en ? ' pr-sync-enabled' : '');
      if (!en) st.textContent = '☁️ Sync is off: progress is saved on this device only.';
      else st.innerHTML = '';
      if (en) { st.appendChild(document.createTextNode('☁️ Sync is on. Your code: ')); st.appendChild(el('strong', 'pr-sync-code', S.code())); st.appendChild(document.createTextNode(c.status === 'offline' ? ' · ⚠️ Can\u2019t reach the sync service right now; changes are saved here and will sync later.' : c.status === 'missing' ? ' · ⚠️ The synced copy was not found (it may have been deleted). Turn sync off and on again to make a new one.' : ' · Last synced ' + t(c.lastPull || c.lastPush) + (c.dirty ? ' · waiting to upload' : ''))); }
      on.hidden = en; form.hidden = en; now.hidden = !en; off.hidden = !en; copy.hidden = !en;
    }
    function busy(b, txt, p) { b.disabled = true; msg.textContent = txt; return p.then(function (r) { b.disabled = false; msg.textContent = r && r.ok === false ? r.error : (r && r.msg) || ''; show(); after(); return r; }); }
    on.addEventListener('click', function () { busy(on, 'Turning on sync…', S.enable().then(function (r) { if (r.ok) r.msg = 'Sync is on! On another device, open this page and enter the code ' + r.code + '.'; return r; })); });
    form.addEventListener('submit', function (e) { e.preventDefault(); busy(go, 'Linking…', S.link(inp.value).then(function (r) { if (r.ok) { r.msg = 'Linked! Progress from both devices is now combined.'; inp.value = ''; } return r; })); });
    now.addEventListener('click', function () { busy(now, 'Syncing…', S.sync().then(function (r) { if (r.ok) r.msg = 'Synced.'; return r; })); });
    off.addEventListener('click', function () { if (!window.confirm('Turn off sync on this device? Your progress stays here, and the synced copy stays for your other devices.')) return; S.disable(); msg.textContent = 'Sync turned off on this device.'; show(); });
    copy.addEventListener('click', function () { var c = S.code(); (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { msg.textContent = 'Code copied: ' + c; }, function () { window.prompt('Copy this sync code:', c); }); });
    sy.appendChild(st); [on, now, copy, off].forEach(function (b) { sy.appendChild(b); }); sy.appendChild(form);
    sy.appendChild(el('p', 'pr-sub', 'Sync stores only test scores, dates, points, items and the avatar (no names) on a free public service (restful-api.dev). Anyone with the code could see or change it, so share it only with your own devices.'));
    box.appendChild(sy); box.appendChild(wrap); box.appendChild(msg);
    window.addEventListener('progress:sync', show); show();
  }

  /* ---------- home page panel ---------- */
  function home(box) {
    var chapters = JSON.parse(box.getAttribute('data-chapters') || '[]'), body = box.querySelector('.pr-body');
    function draw() {
      var s = P.load(); body.innerHTML = '';
      var top = el('div', 'pr-top'), av = el('a', 'pr-avatar'); av.href = 'avatar.html'; av.title = 'Open the Avatar Shop'; av.innerHTML = P.avatarSVG(s);
      var info = el('div', 'pr-info'); info.appendChild(el('p', 'pr-balance', '⭐ ' + s.points + ' points'));
      info.appendChild(el('p', 'pr-sub', 'Earned ' + s.earned + ' · spent ' + s.spent));
      var shop = el('a', 'pt-link', '🛍️ Avatar Shop'); shop.href = 'avatar.html'; info.appendChild(shop);
      top.appendChild(av); top.appendChild(info); body.appendChild(top);
      body.appendChild(el('h3', '', '📊 Math Test Scores'));
      var o = P.overall(s);
      body.appendChild(el('p', 'pr-overall', o.taken ? 'Overall: ' + o.taken + ' test' + (o.taken > 1 ? 's' : '') + ' taken in ' + o.chapters + ' chapter' + (o.chapters > 1 ? 's' : '') + ', average ' + o.avg + '% (' + o.grade + ')' : 'Overall: no practice tests taken yet. Open a chapter and press the Practice Test tab!'));
      var wrap = el('div', 'pr-table-wrap'), t = el('table', 'pr-table'), hd = el('tr');
      ['Chapter', 'Tests', 'Best', 'Latest', 'Average', 'Grade'].forEach(function (h) { var th = el('th', '', h); th.scope = 'col'; hd.appendChild(th); });
      var thead = el('thead'); thead.appendChild(hd); t.appendChild(thead); var tb = el('tbody');
      chapters.forEach(function (c) {
        var st = P.chapterStats(s, c[0]), tr = el('tr'), th = el('th'), a = el('a', '', c[0] + '. ' + c[1]); th.scope = 'row'; a.href = 'chapter-' + c[0] + '.html#test'; th.appendChild(a); tr.appendChild(th);
        if (!st.taken) { var td = el('td', 'pr-none', 'Not taken yet'); td.colSpan = 5; tr.appendChild(td); }
        else [String(st.taken), pctTxt(st.best), pctTxt(st.latest) + ' · ' + fmtDate(st.latest.date), st.avg + '%', st.grade].forEach(function (v, i) { var td = el('td', i === 4 ? 'pr-grade pr-g' + v : '', v); if (i) td.setAttribute('data-label', ['Tests', 'Best', 'Latest', 'Average', 'Grade'][i]); else td.setAttribute('data-label', 'Tests'); tr.appendChild(td); });
        tb.appendChild(tr);
      });
      var tf = el('tfoot'), fr = el('tr'), fth = el('th', '', 'Overall'); fth.scope = 'row'; fr.appendChild(fth);
      if (!o.taken) { var n = el('td', 'pr-none', 'Not taken yet'); n.colSpan = 5; fr.appendChild(n); }
      else [String(o.taken), '', '', o.avg + '%', o.grade].forEach(function (v, i) { var td = el('td', i === 4 ? 'pr-grade pr-g' + v : '', v); td.setAttribute('data-label', ['Tests', 'Best', 'Latest', 'Average', 'Grade'][i]); fr.appendChild(td); });
      tf.appendChild(fr); t.appendChild(tb); t.appendChild(tf); wrap.appendChild(t); body.appendChild(wrap);
      body.appendChild(el('p', 'pr-sub', 'Grades: A 90%+, B 80%+, C 70%+, D 60%+, F below 60%. Average is over all tests in that chapter.'));
    }
    draw(); dataTools(box, draw); noStore(box);
    window.addEventListener('storage', function (e) { if (e.key === P.KEY) draw(); }); window.addEventListener('progress:changed', draw);
  }

  /* ---------- avatar shop ---------- */
  function shop(box) {
    var stage = box.querySelector('.av-stage'), bal = box.querySelector('.av-balance'), bases = box.querySelector('.av-bases'), cat = box.querySelector('.av-catalog'), msg = box.querySelector('.av-msg');
    function say(t) { msg.textContent = t; }
    function draw() {
      var s = P.load(); stage.innerHTML = P.avatarSVG(s, { label: 'Your avatar' }); bal.textContent = '⭐ ' + s.points + ' points';
      bases.innerHTML = '';
      Object.keys(P.BASE).forEach(function (k) {
        var b = el('button', 'av-base-btn' + (s.base === k ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-pressed', s.base === k ? 'true' : 'false'); b.setAttribute('data-base', k);
        b.innerHTML = P.avatarSVG({ equipped: {}, base: k }, { label: P.BASE[k].name }); b.appendChild(el('span', '', P.BASE[k].name));
        b.addEventListener('click', function () { P.update(function (st) { P.setBase(st, k); }); say('You are now the ' + P.BASE[k].name + '.'); draw(); });
        bases.appendChild(b);
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
          card.appendChild(btn); grid.appendChild(card);
        });
        sec.appendChild(grid); cat.appendChild(sec);
      });
    }
    draw(); dataTools(box.querySelector('.av-data'), draw); noStore(box);
    window.addEventListener('storage', function (e) { if (e.key === P.KEY) draw(); }); window.addEventListener('progress:changed', draw);
  }

  /* ---------- chapter page: my scores in the Practice Test tab ---------- */
  function chapterBox(box) {
    var ch = +box.getAttribute('data-chapter'), s = P.load(), st = P.chapterStats(s, ch); box.innerHTML = '';
    if (!st.taken) { box.appendChild(el('p', '', 'Your scores: not taken yet.')); return; }
    box.appendChild(el('p', '', 'Your scores: ' + st.taken + ' test' + (st.taken > 1 ? 's' : '') + ' · best ' + pctTxt(st.best) + ' · latest ' + pctTxt(st.latest) + ' · average ' + st.avg + '% (' + st.grade + ') · ⭐ ' + s.points + ' points'));
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!P) return;
    var h = document.getElementById('math-progress'); if (h) home(h);
    var a = document.getElementById('avatar-shop'); if (a) shop(a);
    Array.prototype.forEach.call(document.querySelectorAll('.pr-chapter'), chapterBox);
    window.addEventListener('progress:changed', function () { Array.prototype.forEach.call(document.querySelectorAll('.pr-chapter'), chapterBox); });
  });
})();
