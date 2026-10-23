/* science-test.js: Science Practice Test page (science-test-N.html). A brand-new random 20-question test
   (8 scenario/application + 12 other: multiple choice, true/false, fill in the blank, short answer) every time the page loads
   or "New test" is pressed. Graded on submit with an explanation for every question; the score is saved with progress.js
   (progress id 100 + unit number) and earns the same points as Math. Needs science-tests.js and science-bank.js.
   GENERATED from study-guide-src/science-src. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var ST = window.ScienceTests, root = document.querySelector('.st-test');
    if (!root) return;
    var unitNo = +root.getAttribute('data-unit'), ch = 100 + unitNo, unit = window.SCIENCE_BANK && window.SCIENCE_BANK[unitNo], names = {};
    var list = root.querySelector('.pt-list'), form = root.querySelector('.pt-form'), result = root.querySelector('.pt-result'),
        submit = root.querySelector('.pt-submit'), newBtn = root.querySelectorAll('.pt-new'), msg = root.querySelector('.pt-msg'),
        timerBox = root.querySelector('.pt-timer-on'), clock = root.querySelector('.pt-clock'), printBtn = root.querySelector('.pt-print');
    if (unit) unit.lessons.forEach(function (l) { names[l.id] = l.title; });
    var items = [], testId = '', graded = false, t0 = 0, tick = null, testNo = 0;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
    function fmtTime(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function startClock() { stopClock(); t0 = Date.now(); clock.textContent = '0:00'; if (timerBox.checked) tick = setInterval(function () { clock.textContent = fmtTime(Date.now() - t0); }, 1000); }
    function stopClock() { if (tick) clearInterval(tick); tick = null; }
    timerBox.addEventListener('change', function () { clock.hidden = !timerBox.checked; if (timerBox.checked && !graded) { if (!t0) t0 = Date.now(); tick = tick || setInterval(function () { clock.textContent = fmtTime(Date.now() - t0); }, 1000); } else if (!timerBox.checked) stopClock(); });
    function render() {
      testNo++; testId = 's' + unitNo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
      try { if (!ST || !unit) throw new Error('missing bank'); items = ST.buildTest(unit); } catch (e) {
        msg.textContent = 'Your browser loaded an old copy of the question files. Do a hard refresh (Ctrl+Shift+R, or Cmd+Shift+R on a Mac) and the test will load.';
        if (window.console) console.error('Science test error:', e); return; }
      list.innerHTML = ''; result.hidden = true; result.innerHTML = ''; graded = false; submit.disabled = false; msg.textContent = '';
      root.classList.remove('pt-done');
      items.forEach(function (it, i) {
        var li = el('li', 'pt-q st-' + it.type), id = 't' + testNo + 'q' + (i + 1);
        li.id = 'pt-' + id;
        var meta = el('p', 'pt-meta'); meta.appendChild(el('span', 'pt-sec', 'Lesson ' + it.lesson + ': ' + (names[it.lesson] || '')));
        meta.appendChild(el('span', 'pt-badge st-type', ST.TYPE_NAMES[it.type]));
        if (it.scen) meta.appendChild(el('span', 'pt-badge st-scen', 'Scenario'));
        li.appendChild(meta);
        var q = el('p', 'pg-text', it.type === 'tf' ? 'True or false: ' + it.q : it.q); q.id = id + '-text'; li.appendChild(q);
        if (it.choices) {
          var fs = el('fieldset', 'pt-choices'); fs.setAttribute('aria-labelledby', id + '-text');
          it.choices.forEach(function (c) { var lab = el('label', 'pt-choice'), r = el('input'); r.type = 'radio'; r.name = id; r.value = c; lab.appendChild(r); lab.appendChild(document.createTextNode(' ' + c)); fs.appendChild(lab); });
          li.appendChild(fs);
        } else {
          var lab2 = el('label', 'pt-label'); lab2.appendChild(el('span', 'sr-only', 'Answer to question ' + (i + 1)));
          var inp = el(it.type === 'short' ? 'textarea' : 'input', 'pt-input' + (it.type === 'short' ? ' st-long' : ''));
          if (it.type === 'short') { inp.rows = 3; inp.placeholder = 'Answer in a sentence or two'; } else { inp.type = 'text'; inp.placeholder = 'Fill in the blank'; }
          inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'off'); inp.spellcheck = it.type === 'short';
          lab2.appendChild(inp); li.appendChild(lab2);
        }
        var fb = el('div', 'pt-feedback'); fb.hidden = true; li.appendChild(fb);
        list.appendChild(li);
      });
      root.ptItems = items; /* read by the automated browser test */
      startClock();
      window.scrollTo(0, 0);
    }
    function userAnswer(li, it) {
      if (it.choices) { var r = li.querySelector('input[type=radio]:checked'); return r ? r.value : ''; }
      return li.querySelector('.pt-input').value;
    }
    function line(parent, label, text, cls) { var p = el('p', cls || ''); p.appendChild(el('strong', '', label)); p.appendChild(document.createTextNode(text)); parent.appendChild(p); }
    function gradeAll() {
      if (graded) return;
      var lis = list.querySelectorAll('.pt-q'), score = 0, blank = 0;
      items.forEach(function (it, i) { if (!String(userAnswer(lis[i], it)).trim()) blank++; });
      if (blank && !window.confirm(blank + (blank === 1 ? ' question is' : ' questions are') + ' blank. Grade anyway?')) return;
      graded = true; stopClock(); submit.disabled = true; root.classList.add('pt-done');
      var wrongList = [];
      items.forEach(function (it, i) {
        var li = lis[i], ua = userAnswer(li, it), g = ST.grade(it, ua), fb = li.querySelector('.pt-feedback');
        Array.prototype.forEach.call(li.querySelectorAll('input, textarea'), function (x) { x.disabled = true; });
        li.classList.add(g.ok ? 'pt-right' : 'pt-wrong'); if (g.ok) score++; else wrongList.push(i + 1);
        fb.hidden = false; fb.innerHTML = '';
        fb.appendChild(el('p', 'pt-mark', g.ok ? '\u2714 Correct' : '\u2718 Not quite'));
        if (!g.ok) line(fb, 'Your answer: ', String(ua).trim() ? ua : '(blank)');
        line(fb, it.type === 'short' ? (g.ok ? 'Model answer: ' : 'A good answer: ') : 'Correct answer: ', it.a);
        if (it.type === 'fill' && it.alts.length > 1) line(fb, 'Also accepted: ', it.alts.slice(1).join(', '), 'pt-sub');
        line(fb, 'Why: ', it.why, g.ok ? 'pt-sub' : '');
        if (!g.ok && it.type === 'short') line(fb, 'Tip: ', 'Short answers are checked for the key ideas: ' + it.groups.map(function (gr) { return '\u201c' + gr[0] + '\u201d'; }).join(' + ') + '. Use the science words from the lesson.', 'pt-hint');
      });
      result.hidden = false; result.innerHTML = '';
      var pct = Math.round(score / items.length * 100);
      result.appendChild(el('h2', '', 'Score: ' + score + ' / ' + items.length + ' (' + pct + '%)'));
      result.appendChild(el('p', '', pct >= 90 ? 'Excellent work! 🌟' : pct >= 70 ? 'Nice job! Review the ones marked wrong below.' : 'Keep practicing. Read the explanations below, review the Study Guide, then try a new test.'));
      if (timerBox.checked) result.appendChild(el('p', '', 'Time: ' + fmtTime(Date.now() - t0)));
      if (window.Progress) {
        try {
          if (window.Progress.canSave && !window.Progress.canSave()) {
            var nb = el('div', 'pt-points'), lp = el('p', '', 'You are not logged in, so this score was not saved and no points were added. '), la = el('a', 'pt-link', '🔑 Log in or make a profile');
            la.href = 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() || 'index.html'); lp.appendChild(la); nb.appendChild(lp); result.appendChild(nb);
          } else {
          var rec = window.Progress.update(function (st) { return window.Progress.recordTest(st, { id: testId, ch: ch, score: score, total: items.length, answered: items.length - blank, date: new Date().toISOString() }); });
          var box = el('div', 'pt-points' + (rec.points + rec.bonus > 0 ? ' pt-celebrate' : ''));
          if (rec.duplicate) box.appendChild(el('p', '', 'This test was already saved.'));
          else if (rec.points + rec.bonus > 0) {
            var fx = el('span', 'pt-confetti'); fx.setAttribute('aria-hidden', 'true'); ['🎉', '⭐', '✨', '🎊', '🌟', '💫'].forEach(function (c) { fx.appendChild(el('i', '', c)); }); box.appendChild(fx);
            box.appendChild(el('p', 'pt-points-big', '+' + (rec.points + rec.bonus) + ' points!'));
            if (rec.bonus) box.appendChild(el('p', '', '🏅 Bonus +' + rec.bonus + ' for your first A on Science Unit ' + unit.letter + '!'));
          } else box.appendChild(el('p', '', 'Answer at least half the questions to earn points.'));
          box.appendChild(el('p', '', 'Score saved. Point balance: ' + rec.total + '.'));
          var links = el('p', 'pt-points-links'), a1 = el('a', 'pt-link', '🛍️ Spend points in the Avatar Shop'), a3 = el('a', '', '📊 See all my science scores');
          a1.href = 'avatar.html'; a3.href = 'index.html#science-scores'; links.appendChild(a1); links.appendChild(document.createTextNode(' ')); links.appendChild(a3); box.appendChild(links);
          result.appendChild(box);
          }
        } catch (e) { result.appendChild(el('p', 'pt-hint', 'Your score could not be saved in this browser (storage may be turned off).')); }
      }
      if (wrongList.length) { var p = el('p', '', 'Review: '); wrongList.forEach(function (n, k) { var a2 = el('a', '', '#' + n); a2.href = '#pt-t' + testNo + 'q' + n; p.appendChild(a2); if (k < wrongList.length - 1) p.appendChild(document.createTextNode(', ')); }); result.appendChild(p); }
      if (result.scrollIntoView) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.target.tagName !== 'INPUT' || !e.target.classList.contains('pt-input')) return;
      e.preventDefault(); var all = list.querySelectorAll('.pt-input'), idx = Array.prototype.indexOf.call(all, e.target);
      if (all[idx + 1]) all[idx + 1].focus(); else submit.focus();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); gradeAll(); });
    Array.prototype.forEach.call(newBtn, function (b) { b.addEventListener('click', render); });
    printBtn.addEventListener('click', function () { window.print(); });
    clock.hidden = !timerBox.checked;
    render();
  });
})();
