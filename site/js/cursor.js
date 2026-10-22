/* cursor.js - Ember ozel imleci: cekirdek + halo + kivilcim izi. Vanilla, file:// uyumlu. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, TAU = Math.PI * 2;
  var inst = null;

  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function mq(q) { return !!(window.matchMedia && matchMedia(q).matches); }
  function eligible() { return mq('(hover: hover) and (pointer: fine)'); }
  function isDark() { return root.getAttribute('data-theme') !== 'light'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  var SEL = '[data-cursor], a, button, input, textarea, select, summary, [role="button"], .btn';
  var TEXT_TYPES = /^(text|search|email|url|tel|password|number|)$/i;

  function start() {
    if (inst) return true;
    var cfg = (window.SITE_CONTENT || {}).settings;
    if (cfg && cfg.cursor === false) return false;   // content.js -> settings.cursor: false ise imlec baslamaz
    if (!doc.body || !eligible() || lsGet('cursor-off') === '1') return false;
    try {
      var dot = doc.createElement('div'), halo = doc.createElement('div'), cvs = doc.createElement('canvas');
      dot.className = 'cc-dot cc-hidden'; halo.className = 'cc-halo cc-hidden'; cvs.className = 'cc-trail';
      dot.setAttribute('aria-hidden', 'true'); halo.setAttribute('aria-hidden', 'true'); cvs.setAttribute('aria-hidden', 'true');
      dot.innerHTML = '<i></i>';
      halo.innerHTML = '<span class="cc-ring"></span><span class="cc-label"></span>';
      dot.dataset.state = halo.dataset.state = 'default';
      doc.body.appendChild(cvs); doc.body.appendChild(halo); doc.body.appendChild(dot);
      var ring = halo.firstChild, label = halo.lastChild, ctx = cvs.getContext('2d');
      if (!ctx) throw new Error('no canvas');
    } catch (e) { return false; }

    var mx = -100, my = -100, hx = -100, hy = -100, moved = false, visible = false;
    var state = 'default', pressed = false, heat = 0, lastHeat = 0;
    var raf = 0, last = 0, idleT = 0, accT = 0, lastMX = -100, lastMY = -100, speed = 0;
    var W = 0, H = 0, destroyed = false;
    var P = [], POOL = 80, nOn = 0, trailN = 0;
    for (var i = 0; i < POOL; i++) P.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 2, trail: false });
    var cursorState = window.__cursor = { x: -100, y: -100, visible: false };

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cvs.width = W; cvs.height = H; dirty = false;
    }
    var dirty = false, dx0 = 0, dy0 = 0, dx1 = 0, dy1 = 0, rzT = 0, idleTimer = 0;
    resize();

    // reduced-motion: her karede matchMedia sorgusu yerine onbellekli
    var rmq = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    var rmCache = !!(rmq && rmq.matches);
    var rmH = function () { rmCache = !!(rmq && rmq.matches); };
    if (rmq) { if (rmq.addEventListener) rmq.addEventListener('change', rmH); else if (rmq.addListener) rmq.addListener(rmH); }
    function reduced() { return rmCache || root.getAttribute('data-motion') === 'reduce'; }
    var darkCache = isDark();

    /* --- durum --- */
    function viewLabel() { return /^tr/i.test(root.lang || '') ? 'Gör' : 'View'; }
    function detect(t) {
      var el = t && t.closest ? t.closest(SEL) : null;
      if (!el) return { s: 'default' };
      var dc = el.getAttribute('data-cursor');
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { s: 'disabled' };
      if (dc === 'view') return { s: 'view', l: el.getAttribute('data-cursor-label') || viewLabel() };
      if (dc === 'drag') return { s: 'drag', l: '← →' };
      if (dc === 'link') return { s: 'link' };
      if (dc === 'button') return { s: 'button', l: el.getAttribute('data-cursor-label') || '→' };
      if (dc === 'text') return { s: 'text' };
      var tag = el.tagName;
      if (tag === 'TEXTAREA' || (tag === 'INPUT' && TEXT_TYPES.test(el.getAttribute('type') || ''))) return { s: 'text' };
      if (tag === 'BUTTON' || el.classList.contains('btn') || el.getAttribute('role') === 'button' || tag === 'SUMMARY' ||
          (tag === 'INPUT' && /^(submit|button|reset|checkbox|radio)$/i.test(el.type))) {
        return { s: 'button', l: el.getAttribute('data-cursor-label') || '→' };
      }
      if (tag === 'A' || tag === 'SELECT' || tag === 'LABEL') return tag === 'A' && !el.hasAttribute('href') && !dc ? { s: 'default' } : { s: 'link' };
      return { s: 'default' };
    }
    function setState(d) {
      if (d.s !== state) { state = d.s; dot.dataset.state = halo.dataset.state = state; }
      var l = d.l || '';
      if (label.textContent !== l) label.textContent = l;
    }

    /* --- parcaciklar --- */
    function spawn(x, y, vx, vy, life, size, trail) {
      for (var i = 0; i < POOL; i++) {
        var p = P[i];
        if (!p.on) { p.on = true; p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.age = 0; p.life = life; p.size = size; p.trail = trail; nOn++; if (trail) trailN++; return; }
      }
    }
    function burst(x, y) {
      if (reduced()) return;
      var n = Math.round(rnd(8, 12));
      for (var i = 0; i < n; i++) {
        var a = (i / n) * TAU + rnd(-0.3, 0.3), v = rnd(60, 160);
        spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(0.3, 0.5), rnd(2, 3.4), false);
      }
    }
    function ripple(x, y) {
      var r = doc.createElement('div'); r.className = 'cc-ripple'; r.setAttribute('aria-hidden', 'true');
      r.style.left = x + 'px'; r.style.top = y + 'px';
      r.addEventListener('animationend', function () { if (r.parentNode) r.parentNode.removeChild(r); });
      doc.body.appendChild(r);
      setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 900);
    }

    /* --- dongu --- */
    function wake() { if (!raf && !destroyed && !doc.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    function tick(now) {
      raf = 0;
      var dt = Math.min((now - last) / 1000, 0.05); last = now;
      var red = reduced();

      // cekirdek anlik, halo lerp 0.18 (yalnizca transform yazilir)
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      var k = red ? 1 : 1 - Math.pow(1 - 0.18, dt * 60);
      hx += (mx - hx) * k; hy += (my - hy) * k;
      var settled = Math.abs(mx - hx) < 0.05 && Math.abs(my - hy) < 0.05;
      if (settled) { hx = mx; hy = my; }
      halo.style.transform = 'translate3d(' + hx + 'px,' + hy + 'px,0)';

      // ates yakinligi
      var f = window.__fire, ht = 0;
      if (visible && f && f.heat) ht = f.heat(mx, my);
      heat += (ht - heat) * Math.min(1, dt * 8);
      if (Math.abs(heat - lastHeat) > 0.02 || (heat < 0.01 && lastHeat !== 0)) {
        lastHeat = heat < 0.01 ? 0 : heat;
        halo.style.setProperty('--heat', lastHeat.toFixed(2));
      }
      cursorState.x = mx; cursorState.y = my; cursorState.visible = visible;

      // iz
      var moving = false;
      if (!red && visible) {
        var dx = mx - lastMX, dy = my - lastMY; lastMX = mx; lastMY = my;
        speed = Math.sqrt(dx * dx + dy * dy);
        accT += dt * 1000;
        var dens = state === 'link' ? 2 : 1;
        if (speed > 4) {
          moving = true; idleT = 0;
          while (accT >= 16 / dens) {
            accT -= 16 / dens;
            if (trailN < 24) spawn(mx + rnd(-2, 2), my + rnd(-2, 2), rnd(-10, 10), -rnd(20, 50), rnd(0.5, 0.8), rnd(1.2, 2.2), true);
          }
        } else { accT = 0; speed = 0; }
      }

      // cizim: yalnizca onceki karede boyanan kirli dikdortgen temizlenir; parcacik yoksa canvas'a dokunulmaz
      var alive = false;
      if (nOn > 0 || dirty) {
        if (dirty) { ctx.clearRect(dx0, dy0, dx1 - dx0, dy1 - dy0); dirty = false; }
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        ctx.globalCompositeOperation = darkCache ? 'lighter' : 'source-over';
        for (var i = 0; i < POOL; i++) {
          var p = P[i]; if (!p.on) continue;
          p.age += dt;
          var u = p.age / p.life;
          if (u >= 1) { p.on = false; nOn--; if (p.trail) trailN--; continue; }
          alive = true;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (!p.trail) { p.vx *= 0.94; p.vy *= 0.94; }
          var r, g, b;
          if (u < 0.5) { var t = u * 2; r = 255; g = 226 - 103 * t; b = 160 - 113 * t; }       // hot -> core
          else { var t2 = (u - 0.5) * 2; r = 255 - 46 * t2; g = 123 - 60 * t2; b = 47 - 29 * t2; } // core -> deep
          if (!darkCache) { r *= 0.85; g *= 0.6; b *= 0.5; }
          var rad = Math.max(0.4, p.size * (1 - u * 0.4));
          ctx.fillStyle = 'rgba(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ',' + ((1 - u) * (darkCache ? 0.95 : 0.8)).toFixed(2) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, TAU); ctx.fill();
          if (p.x - rad < x0) x0 = p.x - rad; if (p.y - rad < y0) y0 = p.y - rad;
          if (p.x + rad > x1) x1 = p.x + rad; if (p.y + rad > y1) y1 = p.y + rad;
        }
        ctx.globalCompositeOperation = 'source-over';
        if (alive) {
          dx0 = Math.max(0, Math.floor(x0) - 2); dy0 = Math.max(0, Math.floor(y0) - 2);
          dx1 = Math.min(W, Math.ceil(x1) + 2); dy1 = Math.min(H, Math.ceil(y1) + 2);
          dirty = true;
        }
      }

      // bosta durdur: hareket yok, halo yerlesti, parcacik yok, ates yakinligi yok. Duran imlecte nadir kivilcim icin zamanlayici.
      if (settled && !alive && !moving && heat < 0.01 && !dirty) {
        if (visible && !red && !idleTimer) idleTimer = setTimeout(idleSpark, 700);
      } else raf = requestAnimationFrame(tick);
    }
    function idleSpark() {
      idleTimer = 0;
      if (destroyed || !visible || reduced() || doc.hidden) return;
      spawn(mx, my, rnd(-14, 14), -rnd(25, 55), rnd(0.5, 0.8), rnd(1.2, 2), true);
      wake();
    }

    /* --- olaylar --- */
    var on = [];
    function bind(t, ev, fn, opt) { t.addEventListener(ev, fn, opt); on.push([t, ev, fn, opt]); }

    bind(doc, 'pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      mx = e.clientX; my = e.clientY;
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; }
      if (!moved) { moved = true; hx = mx; hy = my; lastMX = mx; lastMY = my; }
      if (!visible) { visible = true; dot.classList.remove('cc-hidden'); halo.classList.remove('cc-hidden'); }
      wake();
    }, { passive: true });
    bind(doc, 'pointerover', function (e) { setState(detect(e.target)); }, { passive: true });
    bind(doc, 'pointerdown', function (e) {
      if (e.button > 0) return;
      pressed = true; dot.classList.add('cc-down'); halo.classList.add('cc-down');
      if (!reduced()) { ripple(e.clientX, e.clientY); burst(e.clientX, e.clientY); }
      wake();
    }, { passive: true });
    function up() { pressed = false; dot.classList.remove('cc-down'); halo.classList.remove('cc-down'); }
    bind(doc, 'pointerup', up, { passive: true });
    bind(window, 'blur', up);
    bind(doc.documentElement, 'mouseleave', function () { visible = false; dot.classList.add('cc-hidden'); halo.classList.add('cc-hidden'); cursorState.visible = false; });
    bind(doc.documentElement, 'mouseenter', function () { if (moved) { visible = true; dot.classList.remove('cc-hidden'); halo.classList.remove('cc-hidden'); wake(); } });
    bind(doc, 'keydown', function (e) {
      if (e.key === 'Tab') { visible = false; dot.classList.add('cc-hidden'); halo.classList.add('cc-hidden'); cursorState.visible = false; }
    });
    bind(window, 'resize', function () { clearTimeout(rzT); rzT = setTimeout(resize, 150); }, { passive: true });
    bind(doc, 'visibilitychange', function () { if (doc.hidden) { cancelAnimationFrame(raf); raf = 0; } else wake(); });
    // tema degisince renk modu guncellensin (her karede getAttribute yerine)
    var themeMO = window.MutationObserver ? new MutationObserver(function () { darkCache = isDark(); }) : null;
    if (themeMO) themeMO.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    // disaridan tetiklenen patlama (ornegin e-posta kopyalama)
    bind(window, 'cursor:burst', function (e) { var d = e.detail || {}; burst(d.x != null ? d.x : mx, d.y != null ? d.y : my); wake(); });

    // sistem imlecini yalnizca basari sonrasi gizle
    root.classList.add('has-custom-cursor');

    inst = {
      destroy: function () {
        destroyed = true; cancelAnimationFrame(raf); raf = 0; clearTimeout(idleTimer); clearTimeout(rzT);
        if (themeMO) themeMO.disconnect();
        if (rmq) { if (rmq.removeEventListener) rmq.removeEventListener('change', rmH); else if (rmq.removeListener) rmq.removeListener(rmH); }
        for (var i = 0; i < on.length; i++) on[i][0].removeEventListener(on[i][1], on[i][2], on[i][3]);
        [dot, halo, cvs].forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
        root.classList.remove('has-custom-cursor');
        if (window.__cursor === cursorState) window.__cursor = null;
        inst = null;
      }
    };
    return true;
  }

  function init() { start(); }

  window.toggleCustomCursor = function (force) {
    var enable = typeof force === 'boolean' ? force : !inst;
    if (enable) { lsSet('cursor-off', null); return start(); }
    lsSet('cursor-off', '1');
    if (inst) inst.destroy();
    return false;
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();

  // fare takilip cikarsa (pointer: fine degisimi)
  if (window.matchMedia) {
    var m = matchMedia('(hover: hover) and (pointer: fine)');
    var h = function () { if (!m.matches && inst) inst.destroy(); else if (m.matches && !inst) start(); };
    if (m.addEventListener) m.addEventListener('change', h); else if (m.addListener) m.addListener(h);
  }
})();
