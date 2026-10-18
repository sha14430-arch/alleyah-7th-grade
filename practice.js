/* Practice Generator: random 7th-grade rational-number problems.
   Plain JS, no libraries. All arithmetic is exact, using integer fractions reduced with gcd. */
(function (root) {
  'use strict';
  var MINUS = '\u2212';

  /* ---------- exact fraction arithmetic ---------- */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function F(n, d) {
    if (d === undefined) d = 1;
    if (!Number.isInteger(n) || !Number.isInteger(d)) throw new Error('fraction parts must be integers');
    if (d === 0) throw new Error('zero denominator');
    if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) throw new Error('number too big');
    if (d < 0) { n = -n; d = -d; }
    if (n === 0) return { n: 0, d: 1 };
    var g = gcd(n, d);
    return { n: n / g, d: d / g };
  }
  function add(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function div(a, b) { if (b.n === 0) throw new Error('division by zero'); return F(a.n * b.d, a.d * b.n); }
  function neg(a) { return F(-a.n, a.d); }
  function cmp(a, b) { var x = a.n * b.d - b.n * a.d; return x < 0 ? -1 : x > 0 ? 1 : 0; }
  function floorF(a) { var r = ((a.n % a.d) + a.d) % a.d; return (a.n - r) / a.d; }
  function isInt(a) { return a.d === 1; }

  /* ---------- formatting ---------- */
  function sgn(neg) { return neg ? MINUS : ''; }
  function fmtFrac(f) { return f.d === 1 ? sgn(f.n < 0) + Math.abs(f.n) : sgn(f.n < 0) + Math.abs(f.n) + '/' + f.d; }
  function fmtMixed(f) {
    var n = Math.abs(f.n);
    if (f.d === 1 || n < f.d) return null;
    return sgn(f.n < 0) + Math.floor(n / f.d) + ' ' + (n % f.d) + '/' + f.d;
  }
  /* mixed number if improper, else plain fraction (or integer) */
  function fmtNice(f) { return fmtMixed(f) || fmtFrac(f); }
  function decimalParts(f) {
    var n = Math.abs(f.n), d = f.d, ip = Math.floor(n / d), r = n % d, digits = [], seen = {}, start = -1;
    while (r !== 0) {
      if (seen[r] !== undefined) { start = seen[r]; break; }
      seen[r] = digits.length; r *= 10; digits.push(Math.floor(r / d)); r %= d;
      if (digits.length > 5000) throw new Error('decimal too long');
    }
    return { neg: f.n < 0, intPart: ip,
      nonRep: digits.slice(0, start < 0 ? digits.length : start).join(''),
      rep: start < 0 ? '' : digits.slice(start).join('') };
  }
  /* { text, html, terminating, approx, parts } */
  function fmtDecimal(f) {
    var p = decimalParts(f), head = sgn(p.neg) + p.intPart;
    if (!p.rep) {
      var t = head + (p.nonRep ? '.' + p.nonRep : '');
      return { text: t, html: esc(t), terminating: true, parts: p };
    }
    var approx = sgn(p.neg) + (Math.abs(f.n) / f.d).toFixed(3);
    if (p.rep.length > 6) {
      return { text: '\u2248 ' + approx, html: '\u2248 ' + esc(approx) + ' <em>(repeating decimal, rounded)</em>',
        terminating: false, parts: p, approx: approx };
    }
    var shown = p.rep; while (shown.length < 3) shown += p.rep;
    var text = head + '.' + p.nonRep + shown + '\u2026';
    var html = esc(head + '.' + p.nonRep) + '<span class="rep">' + p.rep + '</span>' +
      ' <em>(the ' + p.rep + ' repeats; \u2248 ' + esc(approx) + ')</em>';
    return { text: text, html: html, terminating: false, parts: p, approx: approx };
  }
  function fmtMoney(f) {
    var cents = f.n * 100 / f.d;
    if (!Number.isInteger(cents)) throw new Error('not whole cents');
    var a = Math.abs(cents);
    return sgn(cents < 0) + '$' + Math.floor(a / 100) + '.' + String(a % 100).padStart(2, '0');
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- random helpers ---------- */
  function mk(rng) {
    var R = {
      ri: function (a, b) { return a + Math.floor(rng() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(rng() * arr.length)]; },
      chance: function (p) { return rng() < p; }
    };
    /* proper fraction in simplest form with denominator from dens */
    R.properFrac = function (dens) {
      for (;;) { var d = R.pick(dens), n = R.ri(1, d - 1); if (gcd(n, d) === 1) return F(n, d); }
    };
    /* operand: { value, text } ; kind = fraction | mixed | decimal | integer */
    R.operand = function (kind, o) {
      var v, t, ng = R.chance(o.negP);
      if (kind === 'fraction') {
        v = R.properFrac(o.dens); t = fmtFrac(v);
      } else if (kind === 'mixed') {
        var w = R.ri(1, o.maxWhole), pf = R.properFrac(o.dens);
        v = add(F(w), pf); t = w + ' ' + pf.n + '/' + pf.d;
      } else if (kind === 'decimal') {
        var places = R.pick(o.places), scale = Math.pow(10, places), k;
        do { k = R.ri(1, o.maxWhole * scale + scale - 1); } while (k % 10 === 0 && places > 0 || k % scale === 0);
        v = F(k, scale); t = fmtDecimal(v).text;
      } else {
        v = F(R.ri(o.intMin || 1, o.intMax || 9)); t = String(v.n);
      }
      if (ng) { v = neg(v); t = MINUS + t; }
      return { value: v, text: t, kind: kind };
    };
    R.kind = function (weights) {
      var tot = 0, k; for (k in weights) tot += weights[k];
      var x = rng() * tot; for (k in weights) { x -= weights[k]; if (x < 0) return k; }
      return k;
    };
    return R;
  }
  function wrap(op) { return op.value.n < 0 ? '(' + op.text + ')' : op.text; }
  /* kid-friendly: not too big, and the denominator only uses 2s, 3s and 5s (short decimals) */
  function bounded(f, maxAbs, maxDen) {
    var d = f.d; while (d % 2 === 0) d /= 2; while (d % 3 === 0) d /= 3; while (d % 5 === 0) d /= 5;
    return d === 1 && Math.abs(f.n / f.d) <= maxAbs && f.d <= maxDen;
  }
  function signed(f, useDec) { var t = useDec ? fmtDecimal(f).text : fmtNice(f); return f.n < 0 ? '(' + t + ')' : t; }

  /* Standard answer for a value. */
  function answer(label, value, opts) {
    opts = opts || {};
    var a = { label: label, value: value, unit: opts.unit || '' };
    if (opts.money) { a.money = fmtMoney(value); return a; }
    a.fraction = fmtFrac(value);
    a.mixed = fmtMixed(value);
    a.decimal = fmtDecimal(value);
    if (opts.count) a.count = true;
    return a;
  }

  /* ---------- topic generators ---------- */
  var gen = {};

  gen.frac2dec = function (R) {
    var dens = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 15, 16, 20, 25, 40], d = R.pick(dens), n;
    if (R.chance(0.3)) n = R.ri(d + 1, 3 * d); else n = R.ri(1, d - 1);
    if (n % d === 0) n += 1;
    var dn = n, dd = d;
    if (R.chance(0.2) && d <= 10) { var k = R.pick([2, 3]); dn *= k; dd *= k; } /* not in simplest form */
    var isNeg = R.chance(0.35), v = F(isNeg ? -dn : dn, dd);
    var shown = sgn(isNeg) + dn + '/' + dd;
    var dec = fmtDecimal(v), work = [dn + ' \u00f7 ' + dd + ' = ' + (isNeg ? dec.text.slice(1) : dec.text)];
    if (isNeg) work.push('The fraction is negative, so the decimal is negative: ' + dec.text);
    if (!dec.terminating && dec.parts.rep.length <= 6) work.push('The remainder starts repeating, so the digits ' + dec.parts.rep + ' repeat forever.');
    return { topic: 'frac2dec', question: 'Write ' + shown + ' as a decimal.',
      operands: [{ value: v, text: shown }], ops: [], primary: 'decimal',
      answers: [answer('Answer', v)], work: work };
  };

  gen.dec2frac = function (R) {
    var places = R.pick([1, 2, 2, 3]), scale = Math.pow(10, places), whole = R.chance(0.45) ? R.ri(1, 5) : 0, k;
    do { k = R.ri(1, scale - 1); } while (k % 10 === 0);
    var raw = whole * scale + k, isNeg = R.chance(0.35), v = F(isNeg ? -raw : raw, scale);
    var shown = fmtDecimal(v).text, g = gcd(raw, scale);
    var work = [shown.replace(MINUS, '') + ' = ' + raw + '/' + scale + ' (' + places + ' decimal place' + (places > 1 ? 's' : '') + ' \u2192 over ' + scale + ')'];
    if (g > 1) work.push('Divide top and bottom by ' + g + ': ' + raw + '/' + scale + ' = ' + (raw / g) + '/' + (scale / g));
    if (fmtMixed(F(raw, scale))) work.push((raw / g) + '/' + (scale / g) + ' = ' + fmtMixed(F(raw, scale)));
    if (isNeg) work.push('Keep the negative sign: ' + fmtNice(v));
    return { topic: 'dec2frac', question: 'Write ' + shown + ' as a fraction (or mixed number) in simplest form.',
      operands: [{ value: v, text: shown }], ops: [], primary: 'fraction',
      answers: [answer('Answer', v)], work: work };
  };

  function arith(R, topic, cfg) {
    for (;;) {
      var count = cfg.count(), ops = [], operands = [], i;
      for (i = 0; i < count; i++) {
        var kind = R.kind(cfg.weights);
        if (i > 0 && kind === 'integer' && operands[i - 1].kind === 'integer') kind = 'fraction';
        operands.push(R.operand(kind, cfg.o));
        if (i > 0) ops.push(R.pick(cfg.ops));
      }
      var v = operands[0].value, ok = true;
      for (i = 0; i < ops.length; i++) {
        var b = operands[i + 1].value;
        if (b.n === 0) { ok = false; break; }
        v = ops[i] === '+' ? add(v, b) : ops[i] === MINUS ? sub(v, b) : ops[i] === '\u00d7' ? mul(v, b) : div(v, b);
      }
      if (!ok || !bounded(v, cfg.maxAbs, cfg.maxDen)) continue;
      var expr = operands[0].text;
      for (i = 0; i < ops.length; i++) expr += ' ' + ops[i] + ' ' + wrap(operands[i + 1]);
      var work = [];
      var hasDec = operands.some(function (o) { return o.kind === 'decimal'; });
      var hasFrac = operands.some(function (o) { return o.kind === 'fraction' || o.kind === 'mixed'; });
      if (hasDec && hasFrac) work.push('Tip: change the decimals to fractions first (or the fractions to decimals).');
      work.push(expr + ' = ' + fmtNice(v));
      return { topic: topic, question: 'Find: ' + expr, expr: expr, operands: operands, ops: ops,
        primary: 'fraction', answers: [answer('Answer', v)], work: work };
    }
  }
  gen.addsub = function (R) {
    return arith(R, 'addsub', {
      count: function () { return R.chance(0.2) ? 3 : 2; }, ops: ['+', MINUS],
      weights: { fraction: 35, mixed: 30, decimal: 25, integer: 10 },
      o: { negP: 0.4, dens: [2, 3, 4, 5, 6, 8, 10, 12], maxWhole: 6, places: [1, 2] },
      maxAbs: 30, maxDen: 120 });
  };
  gen.muldiv = function (R) {
    return arith(R, 'muldiv', {
      count: function () { return 2; }, ops: ['\u00d7', '\u00f7'],
      weights: { fraction: 40, mixed: 25, decimal: 20, integer: 15 },
      o: { negP: 0.4, dens: [2, 3, 4, 5, 6, 8, 9, 10], maxWhole: 3, places: [1], intMin: 2, intMax: 9 },
      maxAbs: 40, maxDen: 200 });
  };

  /* ---------- word problems ---------- */
  var NAMES = ['Alleyah', 'Maya', 'Jordan', 'Sofia', 'Leo', 'Priya', 'Marcus', 'Emma'];

  function riseFall(R) {
    for (;;) { var p = riseFallOnce(R); if (p) return p; }
  }
  function riseFallOnce(R) {
    var style = R.pick(['diver', 'balloon', 'temp', 'money']), n = R.ri(2, 3), steps = [], i, v, start, work;
    var amt;
    if (style === 'money') {
      var name = R.pick(NAMES);
      start = F(R.ri(4, 60 * 20) * 5, 100); /* whole multiples of 5 cents */
      var spend = ['buys a hoodie for', 'pays for a movie ticket that costs', 'spends', 'buys art supplies for', 'buys a video game for'];
      var earn = ['earns', 'gets a birthday gift of', 'deposits', 'is paid for babysitting'];
      v = start; var sentence = name + ' has ' + fmtMoney(start) + ' in a savings account.';
      for (i = 0; i < n; i++) {
        var up = i === 0 ? false : R.chance(0.45);
        amt = F(R.ri(100, 4000), 100);
        steps.push({ dir: up ? 1 : -1, text: fmtMoney(amt).slice(1), value: amt });
        sentence += (i === 0 ? ' She ' : i === n - 1 ? ' Finally, she ' : ' Then she ') + R.pick(up ? earn : spend) + ' ' + fmtMoney(amt) + '.';
        v = up ? add(v, amt) : sub(v, amt);
      }
      sentence += ' What is her balance now? (A negative balance means she owes the bank money.)';
      work = [fmtMoney(start).slice(1) + steps.map(function (s) { return (s.dir > 0 ? ' + ' : ' ' + MINUS + ' ') + s.text; }).join('') + ' = ' + fmtMoney(v).replace('$', '')];
      return { topic: 'word', style: 'risefall', question: sentence,
        data: { kind: 'risefall', start: { text: fmtMoney(start).slice(1), value: start }, steps: steps },
        primary: 'money', answers: [answer('Balance', v, { money: true })], work: work };
    }
    var useDec = R.chance(0.5), o = useDec ? { negP: 0, dens: [2], maxWhole: 9, places: [1] } : { negP: 0, dens: [2, 4], maxWhole: 9, places: [1] };
    function amount(maxW) { o.maxWhole = maxW; return R.operand(useDec ? 'decimal' : (R.chance(0.75) ? 'mixed' : 'fraction'), o); }
    var unit, text, upW, downW, startOp, it;
    if (style === 'diver') {
      startOp = amount(30); start = neg(startOp.value); unit = 'feet';
      text = 'A scuba diver is at ' + MINUS + startOp.text + ' feet (below sea level).'; upW = ['rises', 'swims up']; downW = ['dives', 'descends', 'sinks']; it = 'the diver';
    } else if (style === 'balloon') {
      startOp = amount(40); start = add(startOp.value, F(60)); startOp = { text: fmtNice(start).replace(MINUS, ''), value: start };
      if (useDec) startOp.text = fmtDecimal(start).text;
      unit = 'meters'; text = 'A hot-air balloon is ' + startOp.text + ' meters above the ground.'; upW = ['rises', 'climbs']; downW = ['drops', 'descends']; it = 'the balloon';
    } else {
      startOp = amount(9); var below = R.chance(0.5); start = below ? neg(startOp.value) : startOp.value;
      unit = 'degrees'; text = 'At 6 a.m. the temperature was ' + (below ? MINUS : '') + startOp.text + '\u00b0F.'; upW = ['rises', 'warms up']; downW = ['falls', 'drops']; it = 'it';
    }
    v = start;
    for (i = 0; i < n; i++) {
      var goUp = R.chance(0.5); amt = amount(style === 'temp' ? 9 : 20);
      steps.push({ dir: goUp ? 1 : -1, text: amt.text, value: amt.value });
      text += (i === 0 ? ' ' + it.charAt(0).toUpperCase() + it.slice(1) + ' ' : ' Then ' + it + ' ') + R.pick(goUp ? upW : downW) + ' ' + amt.text + (style === 'temp' ? '\u00b0F' : ' ' + unit) + '.';
      v = goUp ? add(v, amt.value) : sub(v, amt.value);
    }
    if (style === 'diver' && v.n >= 0) return null;   /* a diver stays under water */
    if (style === 'balloon' && v.n <= 0) return null; /* a balloon stays above the ground */
    text += style === 'temp' ? ' What is the temperature now?' : style === 'diver' ? ' What is the diver\'s elevation now?' : ' How high is the balloon now?';
    var startText = (start.n < 0 ? MINUS : '') + startOp.text;
    work = [startText + steps.map(function (s) { return (s.dir > 0 ? ' + ' : ' ' + MINUS + ' ') + s.text; }).join('') + ' = ' + (useDec ? fmtDecimal(v).text : fmtNice(v))];
    if (style === 'diver' && v.n < 0) work.push('Negative means below sea level.');
    return { topic: 'word', style: 'risefall', question: text,
      data: { kind: 'risefall', start: { text: startText, value: start }, steps: steps },
      primary: useDec ? 'decimal' : 'fraction',
      answers: [answer(style === 'temp' ? 'Temperature' : style === 'diver' ? 'Elevation' : 'Height', v, { unit: style === 'temp' ? '\u00b0F' : unit })], work: work };
  }

  function averageChange(R) {
    var useDec = R.chance(0.5), n, per, total, text, unit, i, data, work;
    if (R.chance(0.55)) {
      /* total change over n equal periods */
      var ctx = R.pick([
        { what: 'The temperature', up: 'rose', down: 'fell', u: '\u00b0F', per: 'hour', periods: 'hours' },
        { what: 'A submarine', up: 'rose', down: 'descended', u: ' feet', per: 'minute', periods: 'minutes' },
        { what: 'The water level in a pond', up: 'rose', down: 'dropped', u: ' inches', per: 'week', periods: 'weeks' }]);
      n = R.ri(2, 8);
      per = useDec ? F(R.ri(1, 60) * 5, 100) : R.operand(R.chance(0.6) ? 'mixed' : 'fraction', { negP: 0, dens: [2, 4, 8], maxWhole: 4 }).value;
      if (!useDec && per.d === 1) per = add(per, F(1, 2));
      var down = R.chance(0.6); if (down) per = neg(per);
      total = mul(per, F(n));
      var tAbs = total.n < 0 ? neg(total) : total, tText = useDec ? fmtDecimal(tAbs).text : fmtNice(tAbs);
      text = ctx.what + ' ' + (down ? ctx.down : ctx.up) + ' a total of ' + tText + ctx.u + ' over ' + n + ' ' + ctx.periods +
        '. What was the average change per ' + ctx.per + '? (Use a negative number for a decrease.)';
      unit = ctx.u.trim() + ' per ' + ctx.per;
      var signedTotal = (down ? MINUS : '') + tText;
      data = { kind: 'avgTotal', total: { text: signedTotal }, count: n };
      var avg = div(total, F(n));
      work = ['Average change = total change \u00f7 number of ' + ctx.periods, signedTotal + ' \u00f7 ' + n + ' = ' + (useDec ? fmtDecimal(avg).text : fmtNice(avg))];
      return { topic: 'word', style: 'average', question: text, data: data, primary: useDec ? 'decimal' : 'fraction',
        answers: [answer('Average change', avg, { unit: unit })], work: work };
    }
    /* list of changes */
    n = R.pick([3, 4, 4, 5]);
    var o = useDec ? { negP: 0.5, maxWhole: 4, places: [1], dens: [2] } : { negP: 0.5, maxWhole: 2, dens: [2, 4] };
    var changes = [], sum = F(0);
    for (i = 0; i < n; i++) {
      var c = R.operand(useDec ? 'decimal' : R.pick(['fraction', 'mixed', 'fraction']), o);
      if (c.value.n > 0) c.text = '+' + c.text;
      changes.push(c); sum = add(sum, c.value);
    }
    var ctx2 = R.pick([{ q: 'the temperature changed by', u: '\u00b0F', per: 'day', p: 'days' },
                       { q: 'a plant\'s height changed by', u: ' cm', per: 'week', p: 'weeks' },
                       { q: 'the water level of a river changed by', u: ' feet', per: 'day', p: 'days' }]);
    text = 'Over ' + n + ' ' + ctx2.p + ', ' + ctx2.q + ' ' + changes.map(function (c) { return c.text + ctx2.u; }).join(', ') +
      '. What was the average change per ' + ctx2.per + '?';
    var avg2 = div(sum, F(n));
    work = ['Add the changes: ' + changes.map(function (c) { return signed(c.value, useDec); }).join(' + ') + ' = ' + (useDec ? fmtDecimal(sum).text : fmtNice(sum)),
            'Divide by ' + n + ': ' + (useDec ? fmtDecimal(sum).text : fmtNice(sum)) + ' \u00f7 ' + n + ' = ' + fmtNice(avg2) + (avg2.d !== 1 ? ' = ' + fmtDecimal(avg2).text : '')];
    return { topic: 'word', style: 'average', question: text,
      data: { kind: 'avgList', changes: changes.map(function (c) { return { text: c.text }; }), count: n },
      primary: useDec ? 'decimal' : 'fraction', answers: [answer('Average change', avg2, { unit: ctx2.u.trim() + ' per ' + ctx2.per })], work: work };
  }

  function fitLeft(R) {
    var ctx = R.pick([
      { have: 'has a ribbon that is', thing: 'feet long', each: 'She cuts it into pieces that are', eachU: 'feet long', item: 'pieces', u: 'feet' },
      { have: 'has', thing: 'cups of flour', each: 'Each batch of cookies needs', eachU: 'cups', item: 'batches', u: 'cups' },
      { have: 'has', thing: 'liters of lemonade', each: 'Each glass holds', eachU: 'liters', item: 'glasses', u: 'liters', dec: true },
      { have: 'has', thing: 'pounds of trail mix', each: 'She fills bags that hold', eachU: 'pounds each', item: 'bags', u: 'pounds' },
      { have: 'has a rope that is', thing: 'meters long', each: 'She cuts it into jump ropes that are', eachU: 'meters long', item: 'jump ropes', u: 'meters', dec: true }]);
    var useDec = ctx.dec || R.chance(0.3), each, q = R.ri(2, 12), left, total;
    if (useDec) {
      do { each = F(R.ri(2, 15), 10); } while (each.d === 1); /* 0.2 .. 1.5, never a whole number */
      left = F(R.ri(0, each.n * 10 / each.d - 1), 10); /* 0 .. each - 0.1, steps of 0.1 */
    } else {
      each = R.chance(0.6) ? R.properFrac([2, 3, 4, 8]) : add(F(R.ri(1, 2)), R.properFrac([2, 3, 4]));
      left = mul(each, F(R.ri(0, 3), 4));            /* 0, 1/4, 1/2 or 3/4 of a piece */
    }
    total = add(mul(each, F(q)), left);
    var tText = useDec ? fmtDecimal(total).text : fmtNice(total), eText = useDec ? fmtDecimal(each).text : fmtNice(each);
    var name = R.pick(NAMES);
    var text = name + ' ' + ctx.have + ' ' + tText + ' ' + ctx.thing + '. ' + ctx.each + ' ' + eText + ' ' + ctx.eachU +
      '. How many full ' + ctx.item + ' can ' + name + ' make, and how much is left over?';
    /* compute the answer from the question numbers (not from how we built them) */
    var quot = div(total, each), full = floorF(quot), rest = sub(total, mul(F(full), each));
    var fmt = function (f) { return useDec ? fmtDecimal(f).text : fmtNice(f); };
    var work = [tText + ' \u00f7 ' + eText + ' = ' + fmtNice(quot) + (quot.d !== 1 ? (fmtDecimal(quot).terminating ? ' = ' : ' ') + fmtDecimal(quot).text.replace(/^(?!\u2248)/, fmtDecimal(quot).terminating ? '' : '= ') : ''),
      'So ' + full + ' full ' + ctx.item + '.',
      'Left over: ' + tText + ' ' + MINUS + ' ' + full + ' \u00d7 ' + eText + ' = ' + tText + ' ' + MINUS + ' ' + fmt(mul(F(full), each)) + ' = ' + fmt(rest) + ' ' + ctx.u];
    return { topic: 'word', style: 'fit', question: text,
      data: { kind: 'fit', total: { text: tText }, each: { text: eText } }, primary: useDec ? 'decimal' : 'fraction',
      answers: [answer('Full ' + ctx.item, F(full), { count: true }), answer('Left over', rest, { unit: ctx.u })], work: work };
  }

  var wordStyles = [riseFall, averageChange, fitLeft];
  gen.word = function (R, i) { return wordStyles[(i === undefined ? R.ri(0, 2) : i) % 3](R); };

  var TOPICS = ['frac2dec', 'dec2frac', 'addsub', 'muldiv', 'word'];

  /* Make `count` different problems. Word problems rotate through all three styles. */
  function generate(topic, count, rng) {
    if (!gen[topic]) throw new Error('unknown topic ' + topic);
    var R = mk(rng || Math.random), out = [], seen = {}, tries = 0, offset = R.ri(0, 2);
    count = count || 5;
    while (out.length < count) {
      var p = gen[topic](R, out.length + offset);
      if (seen[p.question] && tries++ < 50) continue;
      seen[p.question] = true; out.push(p);
    }
    return out;
  }

  /* ---------- answer HTML ---------- */
  function answerHtml(p) {
    var h = '';
    p.answers.forEach(function (a) {
      var unit = a.unit ? ' ' + esc(a.unit) : '';
      var line = '<strong>' + esc(a.label) + ':</strong> ';
      if (a.money) line += esc(a.money);
      else if (a.count) line += esc(a.fraction);
      else {
        var bits = [];
        if (p.primary === 'decimal' && !isInt(a.value)) {
          bits.push(a.decimal.html + unit);
          bits.push('= ' + esc(a.fraction) + (a.mixed ? ' = ' + esc(a.mixed) : ''));
        } else {
          bits.push(esc(a.fraction) + (a.mixed ? ' = ' + esc(a.mixed) : '') + unit);
          if (!isInt(a.value)) bits.push('= ' + a.decimal.html);
        }
        line += bits.join(' ');
      }
      h += '<p>' + line + '</p>';
    });
    if (p.work && p.work.length) {
      h += '<p class="pg-work-title"><strong>Work:</strong></p><ul class="pg-work">' +
        p.work.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + '</ul>';
    }
    return h;
  }

  var api = { F: F, gcd: gcd, add: add, sub: sub, mul: mul, div: div, floorF: floorF, cmp: cmp,
    fmtFrac: fmtFrac, fmtMixed: fmtMixed, fmtDecimal: fmtDecimal, fmtMoney: fmtMoney,
    TOPICS: TOPICS, generate: generate, answerHtml: answerHtml };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Practice = api;

  /* ---------- page wiring ---------- */
  if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', function () {
    var uid = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.pg-block'), function (block) {
      var btn = block.querySelector('.pg-generate'), list = block.querySelector('.pg-list'), topic = block.getAttribute('data-topic');
      if (!btn || !list || !gen[topic]) return;
      btn.addEventListener('click', function () {
        list.innerHTML = '';
        var hint = block.querySelector('.pg-hint'); if (hint) hint.hidden = true;
        generate(topic, 5).forEach(function (p) {
          var li = document.createElement('li'), q = document.createElement('p'), t = document.createElement('button'),
              ans = document.createElement('div'), id = 'pg-ans-' + (++uid);
          li.className = 'pg-q'; q.className = 'pg-text'; q.textContent = p.question;
          t.type = 'button'; t.className = 'pg-toggle'; t.textContent = 'Show answer';
          t.setAttribute('aria-expanded', 'false'); t.setAttribute('aria-controls', id);
          ans.className = 'pg-answer'; ans.id = id; ans.hidden = true; ans.innerHTML = answerHtml(p);
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
})(this);
