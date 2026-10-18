/* Textbook Study Guide: "Show answer" toggles (same behavior and classes as the Practice Generator). */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.sg-guide .pg-toggle'), function (t) {
      var ans = document.getElementById(t.getAttribute('aria-controls'));
      if (!ans) return;
      t.addEventListener('click', function () {
        var open = ans.hidden; ans.hidden = !open;
        t.textContent = open ? 'Hide answer' : 'Show answer'; t.setAttribute('aria-expanded', String(open));
      });
    });
  });
})();
