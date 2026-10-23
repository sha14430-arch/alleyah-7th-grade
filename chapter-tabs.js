/* chapter-tabs.js: Study Guide / Revision Plan / Practice Test tabs on chapter-N.html.
   Accessible (WAI-ARIA tabs pattern: arrow keys, Home/End), remembers the tab in the URL hash (#study, #revision, #test).
   A hash pointing inside a panel (e.g. #s-2-3) opens that panel. Without JavaScript every panel is shown.
   GENERATED from study-guide-src/progress-src. */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var wrap = document.querySelector('.ch-tabs'); if (!wrap) return;
    var list = wrap.querySelector('[role="tablist"]'), tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]')),
        panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    wrap.classList.add('tabs-ready');
    function nameOf(i) { return tabs[i].getAttribute('data-hash'); }
    function select(i, opts) {
      opts = opts || {};
      tabs.forEach(function (t, j) { var on = j === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
      if (opts.focus) tabs[i].focus();
      if (opts.hash && location.hash !== '#' + nameOf(i)) history.replaceState(null, '', '#' + nameOf(i));
    }
    function fromHash() {
      var h = decodeURIComponent(location.hash.slice(1)); if (!h) return select(0);
      for (var i = 0; i < tabs.length; i++) if (nameOf(i) === h) return select(i);
      var target = document.getElementById(h);
      if (target) for (var j = 0; j < panels.length; j++) if (panels[j].contains(target)) { select(j); target.scrollIntoView(); return; }
      if (h === 'top') return; select(0);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, { hash: true }); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, to = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % n; else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0; else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, { focus: true, hash: true }); }
      });
    });
    window.addEventListener('hashchange', fromHash);
    fromHash();
  });
})();
