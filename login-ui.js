/* login-ui.js: login.html (sign up, log in, quick switch, profile editing, PIN change, switch user, log out,
   moving old single-user progress into a profile). Needs progress.js. GENERATED from study-guide-src/progress-src. */
(function () {
  'use strict';
  var P = window.Progress, A = P && P.Auth;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function nextUrl() { var m = /[?&]next=([^&#]+)/.exec(location.search), n = m ? decodeURIComponent(m[1]) : ''; return /^[a-z0-9-]+\.html(#[a-z0-9-]+)?$/.test(n) && n !== 'login.html' ? n : 'index.html'; }
  function wantMigrate() { return /[?&]migrate=1/.test(location.search); }
  function say(box, text, ok) { box.textContent = text; box.className = 'lg-msg' + (ok ? ' lg-ok' : text ? ' lg-err' : ''); }
  function bases(box, name, chosen) {
    box.innerHTML = '';
    Object.keys(P.BASE).forEach(function (k) {
      var lab = el('label', 'lg-base'), r = el('input'); r.type = 'radio'; r.name = name; r.value = k; r.checked = k === chosen;
      var pic = el('span', 'lg-base-pic'); pic.innerHTML = P.avatarSVG({ equipped: {}, base: k }, { label: P.BASE[k].name });
      lab.appendChild(r); lab.appendChild(pic); lab.appendChild(el('span', 'lg-base-name', P.BASE[k].name)); box.appendChild(lab);
    });
  }
  function picked(form, name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : 'girl'; }
  function grades(sel, val) { sel.innerHTML = ''; var o0 = el('option', '', '(choose)'); o0.value = ''; sel.appendChild(o0); A.GRADES.forEach(function (g) { var o = el('option', '', g === 'other' ? 'Other' : 'Grade ' + g); o.value = g; o.selected = g === val; sel.appendChild(o); }); }
  function busy(btn, p) { btn.disabled = true; var t = btn.textContent; btn.textContent = 'Please wait…'; return p.then(function (r) { btn.disabled = false; btn.textContent = t; return r; }); }
  function tab(which) {
    ['login', 'signup'].forEach(function (k) { var on = k === which, b = $('lg-tab-' + k); b.setAttribute('aria-selected', on ? 'true' : 'false'); b.classList.toggle('on', on); $('lg-' + k).hidden = !on; });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var root = $('tutor-login'); if (!root || !P || !A) return;
    root.classList.add('lg-ready');
    var L = A.legacy(), mig = $('lg-migrate');
    /* ---- moving old progress into a profile ---- */
    function drawMigrate() {
      L = A.legacy(); mig.hidden = !L; ['li-migrate-row', 'su-migrate-row'].forEach(function (id) { $(id).hidden = !L; });
      if (!L) return;
      var txt = 'This device has saved progress from before profiles: ' + L.tests + ' test' + (L.tests === 1 ? '' : 's') + ' and ' + L.points + ' points' + (L.syncId ? ' (with its old sync code)' : '') + '.';
      $('lg-migrate-text').textContent = txt + ' Make a new profile for it (for example for Alleyah), or log in to add it to a profile you already have.';
      ['li-migrate-n', 'su-migrate-n'].forEach(function (id) { $(id).textContent = '(' + L.tests + ' tests, ' + L.points + ' points)'; });
    }
    $('lg-migrate-new').addEventListener('click', function () { tab('signup'); $('su-migrate').checked = true; if (!$('su-user').value) $('su-user').value = 'alleyah'; if (!$('su-name').value) $('su-name').value = 'Alleyah'; $('su-pin').focus(); });
    $('lg-migrate-existing').addEventListener('click', function () { tab('login'); $('li-migrate').checked = true; $('li-user').focus(); });
    /* ---- quick switch list ---- */
    function drawQuick() {
      var me = A.user(), list = A.devices().filter(function (d) { return d.u !== me; }), box = $('lg-quick-list');
      $('lg-quick').hidden = !list.length; box.innerHTML = '';
      list.forEach(function (d) {
        var b = el('button', 'lg-quick-btn'); b.type = 'button'; b.setAttribute('data-user', d.u);
        var pic = el('span', 'lg-base-pic'); pic.innerHTML = P.avatarSVG({ equipped: {}, base: d.base }, { label: '' }); b.appendChild(pic);
        b.appendChild(el('span', 'lg-quick-name', d.name)); b.appendChild(el('span', 'pr-sub', '@' + d.u));
        b.addEventListener('click', function () { tab('login'); $('li-user').value = d.u; $('li-pin').value = ''; $('li-pin').focus(); say($('li-msg'), 'Type the PIN for ' + d.name + '.', true); });
        box.appendChild(b);
      });
    }
    /* ---- signed in: profile editor ---- */
    function drawProfile() {
      var p = A.profile(); $('profile').hidden = !p; $('lg-forms').hidden = !!p; $('lg-title').textContent = p ? '👤 My profile' : '🔑 Log in or sign up';
      if (!p) return;
      $('pf-who').textContent = 'Signed in as ' + p.name + ' (username: ' + p.username + ').';
      $('pf-avatar').innerHTML = P.avatarSVG(P.load(), { label: 'Your avatar' });
      $('pf-name').value = p.name; grades($('pf-grade'), p.grade); bases($('pf-bases'), 'pf-base', p.base);
      var c = P.Sync.config(); $('pf-sync').textContent = c.status === 'limit' ? '⚠️ ' + c.error : c.status === 'offline' ? '⚠️ Can\u2019t reach the sync service; your progress is saved here and will sync later.' : c.status === 'missing' ? '⚠️ This profile\u2019s cloud record was not found.' : '☁️ Your progress syncs to this profile on any device where you log in.';
    }
    function drawAll() { drawMigrate(); drawQuick(); drawProfile(); }
    /* ---- forms ---- */
    grades($('su-grade'), '7'); bases($('su-bases'), 'su-base', 'girl');
    $('lg-tab-login').addEventListener('click', function () { tab('login'); });
    $('lg-tab-signup').addEventListener('click', function () { tab('signup'); });
    function done(r, msgBox, verb) {
      if (!r.ok) { say(msgBox, r.error); return; }
      say(msgBox, (verb === 'up' ? 'Profile made! ' : 'Welcome back! ') + (r.warning ? '(' + r.warning + ') ' : '') + 'Taking you to ' + nextUrl().replace(/\.html.*/, '').replace('index', 'the home page') + '…', true);
      setTimeout(function () { location.href = nextUrl(); }, 600);
    }
    $('lg-login').addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('li-go');
      busy(b, A.logIn({ username: $('li-user').value, pin: $('li-pin').value, migrate: !!L && $('li-migrate').checked })).then(function (r) { if (!r.ok) $('li-pin').value = ''; done(r, $('li-msg'), 'in'); });
    });
    $('lg-signup').addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('su-go');
      busy(b, A.signUp({ username: $('su-user').value, name: $('su-name').value, pin: $('su-pin').value, pin2: $('su-pin2').value, grade: $('su-grade').value, base: picked($('lg-signup'), 'su-base'), migrate: !!L && $('su-migrate').checked })).then(function (r) { done(r, $('su-msg'), 'up'); });
    });
    $('lg-edit').addEventListener('submit', function (e) {
      e.preventDefault(); var r = A.updateProfile({ name: $('pf-name').value, grade: $('pf-grade').value, base: picked($('lg-edit'), 'pf-base') });
      say($('pf-msg'), r.ok ? 'Saved.' : r.error, r.ok); if (r.ok) drawAll();
    });
    $('lg-pin').addEventListener('submit', function (e) {
      e.preventDefault(); var b = $('pf-pin-go');
      busy(b, A.changePin($('pf-old').value, $('pf-new').value, $('pf-new2').value)).then(function (r) { say($('pf-pin-msg'), r.ok ? 'PIN changed. Use the new PIN next time.' : r.error, r.ok); if (r.ok) ['pf-old', 'pf-new', 'pf-new2'].forEach(function (id) { $(id).value = ''; }); });
    });
    $('lg-switch').addEventListener('click', function () { A.switchUser().then(function () { drawAll(); tab('login'); say($('li-msg'), 'Signed out. Pick a profile below or log in.', true); }); });
    $('lg-logout').addEventListener('click', function () {
      var forget = $('lg-forget').checked;
      A.logOut(forget).then(function () { drawAll(); tab('login'); say($('li-msg'), forget ? 'Logged out and forgotten on this device. Your progress is still saved in your profile.' : 'Logged out.', true); });
    });
    tab(wantMigrate() || (!A.devices().length && L) ? 'signup' : 'login');
    drawAll();
    if (wantMigrate() && L && !A.user()) $('lg-migrate-new').click();
    window.addEventListener('progress:changed', drawProfile);
  });
})();
