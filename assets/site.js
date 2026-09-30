/* MoorSafe — small vanilla enhancements. Pages are fully readable without this file. */
(function () {
  'use strict';
  var C = window.MOORSAFE || {};
  var PRICES = C.prices || {};
  var TITLES = { 300: 'Boats up to ~30 ft', 400: 'Boats ~30–40 ft', 500: 'Boats 40 ft+ or exposed harbors' };
  var money = function (n) { return '$' + Number(n).toLocaleString('en-US'); };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var state = { size: 300, qty: 1 };

  /* videos: muted + inline so phones allow autoplay. The hero plays at once; the rest play when scrolled near.
     Respect reduced-motion and data-saver settings. */
  var calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saver = navigator.connection && navigator.connection.saveData;
  function play(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  $$('video').forEach(function (v) { v.muted = true; v.playsInline = true; });
  if (!calm && !saver) {
    $$('video[data-hero-video]').forEach(play);
    var lazy = $$('video[data-lazy-play]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) play(e.target); else e.target.pause(); });
      }, { rootMargin: '150px' });
      lazy.forEach(function (v) { io.observe(v); });
    } else { lazy.forEach(play); }
  }

  /* ---------- size picker ---------- */
  function paint() {
    var p = PRICES[state.size];
    $$('[data-size]').forEach(function (r) {
      var on = Number(r.getAttribute('data-size')) === state.size;
      r.classList.toggle('is-on', on); r.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    $$('[data-sel-weight]').forEach(function (e) { e.textContent = state.size; });
    $$('[data-sel-price]').forEach(function (e) { e.textContent = money(p); });
    $$('[data-sel-title]').forEach(function (e) { e.textContent = TITLES[state.size]; });
    $$('[data-buy]').forEach(function (a) {
      a.setAttribute('href', (C.purchase ? '/checkout' : '/contact') + '?size=' + state.size);
      if (a.hasAttribute('data-buy-label')) a.textContent = C.purchase ? 'Buy ' + state.size + ' lb — ' + money(p) : 'Request a quote for ' + state.size + ' lb';
    });
    $$('[data-qty]').forEach(function (e) { e.textContent = state.qty; });
    $$('[data-unit]').forEach(function (e) { e.textContent = money(p); });
    $$('[data-subtotal]').forEach(function (e) { e.textContent = money(p * state.qty); });
  }
  function setSize(n) { if (PRICES[n]) { state.size = n; paint(); } }
  $$('[data-size]').forEach(function (r) {
    r.addEventListener('click', function () { setSize(Number(r.getAttribute('data-size'))); });
  });
  var q = new URLSearchParams(location.search).get('size');
  if (q && PRICES[q]) state.size = Number(q);
  $$('[data-qty-dec]').forEach(function (b) { b.addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); paint(); }); });
  $$('[data-qty-inc]').forEach(function (b) { b.addEventListener('click', function () { state.qty = Math.min(20, state.qty + 1); paint(); }); });
  paint();

  /* quote form: prefill the message when arriving with ?size= */
  (function () {
    var m = $('form[data-form=quote] [name=message]');
    if (m && q && PRICES[q] && !m.value) m.value = 'I’m interested in the ' + q + ' lb MoorSafe. Boat length / harbor: ';
  })();

  /* ---------- "which size?" helper ---------- */
  $$('[data-helper]').forEach(function (form) {
    var out = $('[data-helper-out]', form);
    function suggest() {
      var len = parseFloat($('[name=length]', form).value);
      var exp = $('[name=exposure]', form).value;
      if (!len || len < 10) { out.textContent = ''; return; }
      var s = len <= 30 ? 300 : len <= 40 ? 400 : 500;
      if (exp === 'moderate' && s < 400) s = 400;
      if (exp === 'exposed') s = 500;
      out.innerHTML = 'We’d start with the <strong>' + s + ' lb</strong> (' + money(PRICES[s]) + '). Sizing also depends on displacement and scope, so we confirm it with you before anything ships. ' +
        '<a href="#buy" data-pick="' + s + '">Select ' + s + ' lb</a> or <a href="/contact#quote">ask us to confirm</a>.';
      var pick = $('[data-pick]', out);
      pick.addEventListener('click', function () { setSize(s); });
    }
    form.addEventListener('input', suggest);
    form.addEventListener('submit', function (e) { e.preventDefault(); suggest(); });
  });

  /* ---------- forms ---------- */
  function fieldsOf(form) {
    var d = {};
    $$('input,select,textarea', form).forEach(function (el) { if (el.name && el.type !== 'submit') d[el.name] = el.value; });
    return d;
  }
  function lines(d) {
    return Object.keys(d).filter(function (k) { return d[k]; }).map(function (k) { return k + ': ' + d[k]; }).join('\n');
  }
  function mailto(subject, body) {
    location.href = 'mailto:' + C.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }
  function done(form, msg) {
    var m = $('[data-form-msg]', form);
    if (m) { m.textContent = msg; m.hidden = false; }
  }
  function post(url, data) {
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r; });
  }

  $$('[data-form]').forEach(function (form) {
    var kind = form.getAttribute('data-form');
    var intent = 'Request a quote';
    $$('[data-intent]', form).forEach(function (b) {
      b.addEventListener('click', function () {
        intent = b.getAttribute('data-intent');
        $$('[data-intent]', form).forEach(function (o) {
          var on = o === b; o.setAttribute('aria-pressed', on ? 'true' : 'false');
          o.style.background = on ? '#0B1F33' : '#fff'; o.style.color = on ? '#fff' : '#3C4854'; o.style.borderColor = on ? '#0B1F33' : '#E3E5E8';
        });
        var l = $('[data-submit-label]', form); if (l) l.textContent = intent === 'Ask a question' ? 'Send question' : intent;
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = fieldsOf(form), subject, body, payload;

      if (kind === 'order') {
        var unit = PRICES[state.size];
        payload = { type: 'order', size: state.size, quantity: state.qty, unitPrice: unit, subtotal: unit * state.qty, customer: d };
        subject = 'MoorSafe order — ' + state.size + ' lb × ' + state.qty;
        body = 'Order request\n\nMoorSafe ' + state.size + ' lb × ' + state.qty + ' (' + money(unit) + ' each) — ' + money(unit * state.qty) + '\n\n' + lines(d);
        /* PAYMENT INTEGRATION: set "paymentEndpoint" in site.config.json to a server route (e.g. a Vercel function at
           /api/checkout) that creates a Stripe Checkout Session and returns { url }. Recompute the price on the
           server from size + quantity; never trust totals sent from the browser. */
        if (C.paymentEndpoint) {
          fetch(C.paymentEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            .then(function (r) { return r.json(); })
            .then(function (j) { if (j && j.url) location.href = j.url; else throw new Error('no url'); })
            .catch(function () { mailto(subject, body); });
          return;
        }
      } else if (kind === 'packet') {
        payload = { type: 'info-packet', customer: d };
        subject = 'MoorSafe info packet request';
        body = 'Please send the MoorSafe info packet to ' + (d.email || '') + '.';
      } else {
        payload = { type: kind, intent: intent, customer: d };
        subject = 'MoorSafe — ' + (kind === 'pro' ? 'Harbormaster / mooring pro inquiry' : intent);
        body = (kind === 'pro' ? 'Harbormaster / mooring pro inquiry' : intent) + '\n\n' + lines(d);
      }

      if (C.formEndpoint) {
        post(C.formEndpoint, payload)
          .then(function () { form.reset(); done(form, kind === 'order' ? 'Order request sent. We’ll confirm details, shipping and payment by email.' : 'Thanks — we’ll reply within one business day.'); })
          .catch(function () { mailto(subject, body); });
      } else {
        mailto(subject, body);
      }
    });
  });
})();
