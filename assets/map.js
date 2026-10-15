/* MoorSafe: "Anchors in the water" map.
   A compact map of the lower 48 with an orange pin for each MoorSafe anchor the owner has approved.
   Pins come from the CRM's public feed. Each is an approximate point (moved up to about a mile from
   the real spot) with a general place name and the year. Nothing else is ever sent. */
(function () {
  'use strict';
  var box = document.getElementById('usmap');
  if (!box) return;

  var C = window.MOORSAFE || {};
  var countEl = document.getElementById('map-count');
  var noteEl = document.getElementById('map-note');

  var LEAFLET = {
    css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
    cssHash: 'sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw==',
    js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
    jsHash: 'sha512-puJW3E/qXDqYp9IfhAI54BJEaWIfloJ7JWs7OeD5i6ruC9JZL1gERT1wjtwXFlh7CjE7ZJ+/vcRZRkIYIb6p4g=='
  };
  var US_BOUNDS = [[24.4, -125.5], [49.8, -66.0]];
  // The logo sits over the middle of the country, drawn on the map so it stays there as you zoom.
  var LOGO_BOUNDS = [[36.5, -102.5], [39.7, -89.5]];

  // An orange pin: the point is the tip at the bottom.
  var PIN = '<svg width="26" height="34" viewBox="0 0 26 34" aria-hidden="true"><path d="M13 33C13 33 2 20.5 2 12.5a11 11 0 0 1 22 0C24 20.5 13 33 13 33z" fill="#F26B0F" stroke="#fff" stroke-width="2"/><circle cx="13" cy="12.5" r="4.2" fill="#fff"/></svg>';

  var map = null;
  var layer = null;
  var pending = null;

  function say(el, text) { if (el) el.textContent = text; }

  function loadLeaflet(done) {
    if (window.L) return done();
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = LEAFLET.css;
    css.integrity = LEAFLET.cssHash;
    css.crossOrigin = '';
    document.head.appendChild(css);
    var s = document.createElement('script');
    s.src = LEAFLET.js;
    s.integrity = LEAFLET.jsHash;
    s.crossOrigin = '';
    s.onload = done;
    s.onerror = function () { say(noteEl, 'The map could not load. Please try again later.'); };
    document.head.appendChild(s);
  }

  function ensureMap() {
    if (map) return;
    var L = window.L;
    map = L.map(box, { scrollWheelZoom: false, zoomSnap: 0.25, minZoom: 3, maxZoom: 12, worldCopyJump: false, attributionControl: true });
    map.fitBounds(US_BOUNDS, { padding: [6, 6] });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.imageOverlay('/assets/logo-transparent.png', LOGO_BOUNDS, { opacity: 0.2, interactive: false, className: 'map-logo', alt: '' }).addTo(map);
    layer = L.layerGroup().addTo(map);
    // Keep the whole country in view when the box changes size (phone rotation, window resize).
    if (window.ResizeObserver) new ResizeObserver(function () { map.invalidateSize(); map.fitBounds(US_BOUNDS, { padding: [6, 6] }); }).observe(box);
  }

  function popup(p) {
    // Built from text nodes, never HTML strings, so feed text can never run as code.
    var el = document.createElement('div');
    var title = document.createElement('strong');
    title.textContent = p.label;
    el.appendChild(title);
    if (p.year) {
      var sub = document.createElement('div');
      sub.textContent = 'Installed ' + p.year;
      el.appendChild(sub);
    }
    return el;
  }

  function render(points) {
    pending = points;
    loadLeaflet(function () {
      ensureMap();
      var L = window.L;
      layer.clearLayers();
      var icon = L.divIcon({ className: 'map-pin', html: PIN, iconSize: [26, 34], iconAnchor: [13, 33], popupAnchor: [0, -30] });
      points.forEach(function (p) {
        if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || !p.label) return;
        L.marker([p.lat, p.lng], { icon: icon, title: p.label, alt: p.label + ' (approximate location)' }).bindPopup(popup(p)).addTo(layer);
      });
      var n = points.length;
      say(countEl, n === 1 ? '1 MoorSafe anchor in the water' : n + ' MoorSafe anchors in the water');
      if (n === 0) say(noteEl, 'The first MoorSafe anchors are going into the water. Check back soon.');
    });
  }

  function load() {
    if (!C.mapEndpoint) return render([]);
    fetch(C.mapEndpoint, { headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('bad status'); return r.json(); })
      .then(function (j) { render((j && j.anchors) || []); })
      .catch(function () {
        render([]);
        say(countEl, '');
        say(noteEl, 'Pins could not be loaded just now. Please try again later.');
      });
  }

  // Examples and tests can draw their own pins.
  window.moorsafeMap = { render: render };

  if (box.getAttribute('data-manual') === 'true') return;

  // Load the map library only when the map scrolls into view, to keep the page fast.
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); load(); }
    }, { rootMargin: '200px' });
    io.observe(box);
  } else {
    load();
  }
})();
