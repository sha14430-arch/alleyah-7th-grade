/* practice-test.js: Chapter Practice Test page (test-chapter-N.html).
   A brand-new random 20-question test is made every time the page loads and every time "New test" is pressed.
   Nothing is saved or reused. Needs section-generators.js and chapter-tests.js. GENERATED from study-guide-src/test-src. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var CT = window.ChapterTests, root = document.querySelector('.pt-test');
    if (!root) return;
    var ch = +root.getAttribute('data-chapter'), secs = JSON.parse(root.getAttribute('data-sections')),
        keys = secs.map(function (s) { return s[0]; }), names = {};
    secs.forEach(function (s) { names[s[0]] = s[1]; });
    var list = root.querySelector('.pt-list'), form = root.querySelector('.pt-form'), result = root.querySelector('.pt-result'),
        submit = root.querySelector('.pt-submit'), newBtn = root.querySelectorAll('.pt-new'), msg = root.querySelector('.pt-msg'),
        timerBox = root.querySelector('.pt-timer-on'), clock = root.querySelector('.pt-clock'), printBtn = root.querySelector('.pt-print');
    var items = [], graded = false, t0 = 0, tick = null, testNo = 0;
    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
    function fmtTime(ms) { var s = Math.floor(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    function startClock() { stopClock(); t0 = Date.now(); clock.textContent = '0:00'; if (timerBox.checked) tick = setInterval(function () { clock.textContent = fmtTime(Date.now() - t0); }, 1000); }
    function stopClock() { if (tick) clearInterval(tick); tick = null; }
    timerBox.addEventListener('change', function () { clock.hidden = !timerBox.checked; if (timerBox.checked && !graded) { if (!t0) t0 = Date.now(); tick = tick || setInterval(function () { clock.textContent = fmtTime(Date.now() - t0); }, 1000); } else if (!timerBox.checked) stopClock(); });
    function render() {
      testNo++;
      try { items = CT.buildTest(ch, keys); } catch (e) { msg.textContent = 'Something went wrong making the test. Press New test.'; return; }
      list.innerHTML = ''; result.hidden = true; result.innerHTML = ''; graded = false; submit.disabled = false; msg.textContent = '';
      root.classList.remove('pt-done');
      items.forEach(function (it, i) {
        var li = el('li', 'pt-q'), id = 't' + testNo + 'q' + (i + 1);
        li.id = 'pt-' + id;
        var meta = el('p', 'pt-meta'); meta.appendChild(el('span', 'pt-sec', it.sec.replace('-ext', ' Ext') + ' ' + (names[it.sec] || '')));
        if (it.kind === 'word') meta.appendChild(el('span', 'pt-badge', 'Word problem'));
        li.appendChild(meta);
        var q = el('p', 'pg-text', it.q); q.id = id + '-text'; li.appendChild(q);
        if (it.choices) {
          var fs = el('fieldset', 'pt-choices'); fs.setAttribute('aria-labelledby', id + '-text');
          it.choices.forEach(function (c, k) { var lab = el('label', 'pt-choice'), r = el('input'); r.type = 'radio'; r.name = id; r.value = c; lab.appendChild(r); lab.appendChild(document.createTextNode(' ' + c)); fs.appendChild(lab); });
          li.appendChild(fs);
        } else {
          var lab2 = el('label', 'pt-label'); lab2.appendChild(el('span', 'sr-only', 'Answer to question ' + (i + 1)));
          var inp = el('input', 'pt-input'); inp.type = 'text'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'off'); inp.spellcheck = false; inp.placeholder = 'Your answer';
          lab2.appendChild(inp); li.appendChild(lab2);
        }
        li.appendChild(el('div', 'pt-feedback'));
        li.lastChild.hidden = true;
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
    function gradeAll() {
      if (graded) return;
      var lis = list.querySelectorAll('.pt-q'), score = 0, blank = 0;
      items.forEach(function (it, i) { if (!String(userAnswer(lis[i], it)).trim()) blank++; });
      if (blank && !window.confirm(blank + (blank === 1 ? ' question is' : ' questions are') + ' blank. Grade anyway?')) return;
      graded = true; stopClock(); submit.disabled = true; root.classList.add('pt-done');
      var wrongList = [];
      items.forEach(function (it, i) {
        var li = lis[i], ua = userAnswer(li, it), g = CT.grade(it, ua), fb = li.querySelector('.pt-feedback');
        Array.prototype.forEach.call(li.querySelectorAll('input'), function (x) { x.disabled = true; });
        li.classList.add(g.ok ? 'pt-right' : 'pt-wrong'); if (g.ok) score++; else wrongList.push(i + 1);
        fb.hidden = false; fb.innerHTML = '';
        var head = el('p', 'pt-mark', g.ok ? '\u2714 Correct' : '\u2718 Not quite'); fb.appendChild(head);
        if (!g.ok) { var y = el('p'); y.appendChild(el('strong', '', 'Your answer: ')); y.appendChild(document.createTextNode(ua.trim() ? ua : '(blank)')); fb.appendChild(y); }
        var a = el('p'); a.appendChild(el('strong', '', 'Correct answer: ')); a.appendChild(document.createTextNode(it.a)); fb.appendChild(a);
        var steps = el('ol', 'pg-work'); (it.work || []).forEach(function (w) { steps.appendChild(el('li', '', w)); });
        if (g.ok) { var d = el('details'); d.appendChild(el('summary', '', 'Show the worked solution')); d.appendChild(steps); fb.appendChild(d); }
        else {
          fb.appendChild(el('p', 'pt-sub', 'Step by step:')); fb.appendChild(steps);
          var why = el('p'); why.appendChild(el('strong', '', 'Why: ')); why.appendChild(document.createTextNode('Following these steps with the numbers in the question gives ' + it.a + '.')); fb.appendChild(why);
          if (g.hint) { var h = el('p', 'pt-hint'); h.appendChild(el('strong', '', 'Likely mistake: ')); h.appendChild(document.createTextNode(g.hint)); fb.appendChild(h); }
        }
      });
      result.hidden = false; result.innerHTML = '';
      var pct = Math.round(score / items.length * 100);
      result.appendChild(el('h2', '', 'Score: ' + score + ' / ' + items.length + ' (' + pct + '%)'));
      result.appendChild(el('p', '', pct >= 90 ? 'Excellent work! 🌟' : pct >= 70 ? 'Nice job! Review the ones marked wrong below.' : 'Keep practicing. Read the step-by-step solutions below, then try a new test.'));
      if (timerBox.checked) result.appendChild(el('p', '', 'Time: ' + fmtTime(Date.now() - t0)));
      if (wrongList.length) { var p = el('p', '', 'Review: '); wrongList.forEach(function (n, k) { var a2 = el('a', '', '#' + n); a2.href = '#pt-t' + testNo + 'q' + n; p.appendChild(a2); if (k < wrongList.length - 1) p.appendChild(document.createTextNode(', ')); }); result.appendChild(p); }
      result.scrollIntoView ? result.scrollIntoView({ behavior: 'smooth', block: 'start' }) : 0;
    }
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || !e.target.classList.contains('pt-input')) return;
      e.preventDefault(); var all = list.querySelectorAll('.pt-input, .pt-choices input'), idx = Array.prototype.indexOf.call(all, e.target);
      for (var j = idx + 1; j < all.length; j++) { if (all[j].type === 'text' || all[j].parentNode.parentNode.querySelector('input') === all[j]) { all[j].focus(); return; } }
      submit.focus();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); gradeAll(); });
    Array.prototype.forEach.call(newBtn, function (b) { b.addEventListener('click', render); });
    printBtn.addEventListener('click', function () { window.print(); });
    clock.hidden = !timerBox.checked;
    render();
  });
})();
