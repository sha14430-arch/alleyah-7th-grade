/* Textbook Study Guide: per-section "Generate 5 questions" buttons.
   Questions come from section-generators.js (window.SectionGenerators), keyed by section id
   (for example "1.2" or "3.2-ext"). Same classes and toggle behavior as the Practice Generator. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var SG = window.SectionGenerators, uid = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.sg-guide .sg-gen'), function (block) {
      var btn = block.querySelector('.pg-generate'), list = block.querySelector('.pg-list'),
          key = block.getAttribute('data-section'), hint = block.querySelector('.pg-hint');
      if (!btn || !list) return;
      if (!SG || SG.keys().indexOf(key) < 0) { btn.disabled = true; if (hint) hint.textContent = 'Practice questions are not available for this section.'; return; }
      btn.addEventListener('click', function () {
        var set;
        try { set = SG.generate(key, 5); } catch (e) { if (hint) { hint.hidden = false; hint.textContent = 'Something went wrong. Press the button again.'; } return; }
        list.innerHTML = '';
        if (hint) hint.hidden = true;
        set.forEach(function (p) {
          var li = document.createElement('li'), q = document.createElement('p'), t = document.createElement('button'),
              ans = document.createElement('div'), a = document.createElement('p'), b = document.createElement('strong'),
              id = 'sg-ans-' + key.replace(/\./g, '-') + '-' + (++uid);
          li.className = 'pg-q'; q.className = 'pg-text'; q.textContent = p.q;
          t.type = 'button'; t.className = 'pg-toggle'; t.textContent = 'Show answer';
          t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-controls', id);
          ans.className = 'pg-answer'; ans.id = id; ans.hidden = true;
          b.textContent = 'Answer:'; a.appendChild(b); a.appendChild(document.createTextNode(' ' + p.a)); ans.appendChild(a);
          if (p.work && p.work.length) {
            var ul = document.createElement('ul'); ul.className = 'pg-work';
            p.work.forEach(function (w) { var wi = document.createElement('li'); wi.textContent = w; ul.appendChild(wi); });
            ans.appendChild(ul);
          }
          t.addEventListener('click', function () {
            var open = ans.hidden; ans.hidden = !open;
            t.textContent = open ? 'Hide answer' : 'Show answer'; t.setAttribute('aria-expanded', String(open));
          });
          li.appendChild(q); li.appendChild(t); li.appendChild(ans); list.appendChild(li);
        });
        btn.textContent = 'Generate 5 new questions';
      });
    });
  });
})();
