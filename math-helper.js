/* Math Helper: client-side expression solver using math.js (fractions). */
(function (root) {
  function prep(input) {
    var s = String(input).trim();
    if (!s) throw new Error('empty');
    s = s.replace(/[×✕✖]/g, '*').replace(/[xX]/g, '*').replace(/÷/g, '/')
         .replace(/[−–—]/g, '-').replace(/,/g, '');
    // Mixed numbers "a b/c" -> (a+b/c); a leading "-" then negates the whole group.
    s = s.replace(/(?<![\d.\/])(\d+)\s+(\d+)\s*\/\s*(\d+)(?![\d.])/g, '($1+$2/$3)');
    if (/[^0-9+\-*/^().\s]/.test(s)) throw new Error('chars');
    return s;
  }
  function gcdBig(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }
  function solve(input, math) {
    var expr = prep(input), f;
    var fm = math.create(math.all, { number: 'Fraction' });
    try { f = fm.evaluate(expr); } catch (e) {
      // e.g. fractional powers: fall back to plain numbers
      var v = math.evaluate(expr);
      if (typeof v !== 'number' || !isFinite(v)) throw e;
      f = fm.fraction(v);
    }
    if (!f || f.n === undefined) throw new Error('nores');
    var sign = Number(f.s) < 0 ? -1 : 1, n = Number(f.n), d = Number(f.d);
    var sg = sign < 0 && n !== 0 ? '-' : '';
    var fraction = d === 1 ? sg + n : sg + n + '/' + d;
    var mixed = null;
    if (d !== 1 && n > d) mixed = sg + Math.floor(n / d) + ' ' + (n % d) + '/' + d;
    var dd = d; while (dd % 2 === 0) dd /= 2; while (dd % 5 === 0) dd /= 5;
    var repeating = dd !== 1, val = sign * n / d, decimal;
    if (repeating) decimal = String(Number(val.toFixed(6)));
    else decimal = String(Number(val.toPrecision(15)));
    return { expr: expr, fraction: fraction, mixed: mixed, decimal: decimal, repeating: repeating };
  }
  var api = { prep: prep, solve: solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.MathHelper = api;

  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
    var inp = document.getElementById('mh-input'), out = document.getElementById('mh-result');
    if (!inp) return;
    function esc(t) { return String(t).replace(/[&<>]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
    function run() {
      if (!inp.value.trim()) { out.innerHTML = '<p class="mh-error">Type a math expression first, like <code>-5/6 + (-1/9)</code>.</p>'; return; }
      if (typeof math === 'undefined') { out.innerHTML = '<p class="mh-error">The math tool couldn\'t load. Check your internet connection and refresh.</p>'; return; }
      try {
        var r = solve(inp.value, math);
        var h = '<p><strong>Fraction:</strong> ' + esc(r.fraction) + '</p>';
        if (r.mixed) h += '<p><strong>Mixed number:</strong> ' + esc(r.mixed) + '</p>';
        h += '<p><strong>Decimal:</strong> ' + esc(r.decimal) + (r.repeating ? ' <em>(repeating decimal, rounded to 6 places)</em>' : '') + '</p>';
        out.innerHTML = h;
      } catch (e) {
        out.innerHTML = '<p class="mh-error">Oops! I couldn\'t understand that. Check for typos or missing parentheses, and use numbers with + − × ÷ ^ ( ). Example: <code>2 1/4 + (-5/8)</code></p>';
      }
    }
    document.getElementById('mh-solve').addEventListener('click', run);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
  });
})(this);
