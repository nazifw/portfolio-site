/* fire.js - Ember kamp atesi. Vanilla, bagimliliksiz, file:// uyumlu.
   Tek rAF, sekme gizliyken durur, kalite otomatik duser, reduced-motion'da statik kareler. */
(function () {
  'use strict';
  if (window.__fireInit) return;
  window.__fireInit = true;

  var doc = document, root = doc.documentElement;
  var SS_KEY = 'ember:fire', SS_FLASH = 'ember:flash';
  var TAU = Math.PI * 2;

  /* ---------- yardimcilar ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(x, a, b) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function ssGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function ssSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  var NP = new Float32Array(256);
  for (var ni = 0; ni < 256; ni++) NP[ni] = Math.random() * 2 - 1;
  function noise(x) {
    var i = Math.floor(x), f = x - i;
    f = f * f * (3 - 2 * f);
    return NP[i & 255] * (1 - f) + NP[(i + 1) & 255] * f;
  }

  /* ---------- asama anahtar noktalari (stage orta noktalari, smoothstep interpolasyon) ---------- */
  var KP = [0, 0.06, 0.21, 0.425, 0.665, 0.85, 0.96, 1];
  var K = {
    h:  [0, 0, 9, 17, 27, 36, 44, 44],            // vh
    w:  [90, 90, 70, 120, 190, 250, 300, 300],    // px
    gr: [120, 120, 240, 420, 640, 860, 1100, 1100],
    ga: [.18, .18, .30, .45, .60, .75, .90, .90],
    sp: [.3, .3, 1.5, 4, 9, 16, 26, 26],
    wm: [0, 0, .05, .20, .45, .70, 1, 1],
    vg: [0, 0, 0, .08, .16, .24, .32, .32]
  };
  var STAGE_T = [0.12, 0.30, 0.55, 0.78, 0.92];
  var cur = { h: 0, w: 90, gr: 120, ga: .18, sp: .3, wm: 0, vg: 0 };
  var KEYS = Object.keys(K), tmpK = { h: 0, w: 0, gr: 0, ga: 0, sp: 0, wm: 0, vg: 0 };
  function interpInto(o, p) {
    var i = 0;
    while (i < KP.length - 2 && p >= KP[i + 1]) i++;
    var t = sstep(p, KP[i], KP[i + 1]);
    for (var n = 0; n < KEYS.length; n++) { var k = KEYS[n], a = K[k]; o[k] = a[i] + (a[i + 1] - a[i]) * t; }
  }
  function interp(p) { interpInto(cur, p); }
  function stageOf(p) { var s = 0; while (s < 5 && p >= STAGE_T[s]) s++; return s; }

  /* ---------- durum ---------- */
  var S = 1, vw = 0, vh = 0, W = 0, H = 0, CH = 0, cx = 150, BASE = 26, dpr = 1;
  var isDark = true, reduced = false, mobile = false;
  var quality = 0;                    // 0 tam, 1 dpr1 + yari parcacik, 2 parlama kapali + 30fps, 3 duman+flicker kapali
  var smooth = 0, target = 0, lerpK = 0.06, saved = 0;
  var raf = 0, last = 0, t0 = 0, running = false, fcount = 0, needSave = false;
  var maxScroll = 0, maxDirty = true, floorInfo = null;
  var stage = -1, flare = 0, flareT = 0, nextFlare = 3500, heat = 0;
  var bad = 0, frames = 0;
  var el, cv, ctx, glowEl, warmEl, vigEl, flashEl, staticEl, staticSvgs = [];
  var bloom, blctx;                   // dusuk cozunurluklu parlama tamponu (yumusak isik)
  var GK = 2200 / 512;                // isik havuzu 512px dokuda, scale ile buyur (bellek)
  var FC = {                          // katman renkleri [dis ... cekirdek]
    dark:  [[209, 63, 18], [255, 110, 40], [255, 168, 60], [255, 220, 140], [255, 248, 225]],
    light: [[190, 55, 16], [240, 100, 30], [244, 140, 46], [255, 205, 120], [255, 244, 215]]
  };

  /* ---------- parcacik havuzu ---------- */
  var POOL = 120, sparks = [], smoke = [];
  for (var si = 0; si < POOL; si++) sparks.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, age: 0, life: 1, size: 2, seed: 0, star: false });
  for (var mi = 0; mi < 8; mi++) smoke.push({ x: 0, y: 0, age: 0, life: 1, s: 1, dx: 0, on: false });
  var sprites = [], strokes = [], smokeSprite = null, palette = null, flameGr = [], coalSprite = null, coalCol = [], embCol = [];
  var spawnAcc = 0, nLive = 0;

  function buildSprites() {
    var stops = isDark
      ? [[255, 246, 220], [255, 226, 160], [255, 179, 71], [255, 122, 47], [209, 63, 18], [160, 45, 14], [138, 42, 14], [138, 42, 14]]
      : [[255, 122, 47], [255, 122, 47], [240, 100, 30], [209, 63, 18], [190, 80, 40], [160, 66, 32], [138, 42, 14], [138, 42, 14]];
    sprites = []; strokes = [];
    for (var i = 0; i < 8; i++) {
      var c = doc.createElement('canvas'); c.width = c.height = 32;
      var g = c.getContext('2d'), s = stops[i], u = i / 7;
      var a = (isDark ? 1 : 0.85) * (1 - u * u * 0.9);
      var gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + a + ')');
      gr.addColorStop(0.35, 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + a * 0.7 + ')');
      gr.addColorStop(1, 'rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',0)');
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
      sprites.push(c);
      strokes.push('rgba(' + s[0] + ',' + s[1] + ',' + s[2] + ',' + (a * 0.6) + ')');
    }
    // duman sprite (onceden render, yumusak)
    smokeSprite = doc.createElement('canvas'); smokeSprite.width = smokeSprite.height = 64;
    var sg = smokeSprite.getContext('2d');
    var sgr = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    sgr.addColorStop(0, 'rgba(104,92,80,1)'); sgr.addColorStop(1, 'rgba(84,74,64,0)');
    sg.fillStyle = sgr; sg.fillRect(0, 0, 64, 64);
    palette = { m: isDark ? 'lighter' : 'source-over' };
    // alev gradyanlari: birim uzayinda (0,0)->(0,1) bir kez olusur, cizimde transform ile olceklenir
    flameGr = [];
    var fcs = isDark ? FC.dark : FC.light, fas = isDark ? FA.dark : FA.light;
    for (var l = 0; l < 5; l++) {
      var rgb = fcs[l][0] + ',' + fcs[l][1] + ',' + fcs[l][2], fa = fas[l];
      var g2 = ctx.createLinearGradient(0, 0, 0, 1);
      g2.addColorStop(0, 'rgba(' + rgb + ',' + fa + ')');
      g2.addColorStop(0.55, 'rgba(' + rgb + ',' + (fa * 0.8).toFixed(3) + ')');
      g2.addColorStop(1, 'rgba(' + rgb + ',' + (fa * 0.08).toFixed(3) + ')');
      flameGr.push(g2);
    }
    // kor yatagi parlamasi (alpha 1 / .36 orani; genel alpha globalAlpha ile)
    coalSprite = doc.createElement('canvas'); coalSprite.width = 128; coalSprite.height = 128;
    var cg = coalSprite.getContext('2d'), cgr = cg.createRadialGradient(64, 64, 0, 64, 64, 64);
    cgr.addColorStop(0, 'rgba(255,140,50,1)'); cgr.addColorStop(0.45, 'rgba(255,100,30,.36)'); cgr.addColorStop(1, 'rgba(255,100,30,0)');
    cg.fillStyle = cgr; cg.fillRect(0, 0, 128, 128);
    // kor tanecikleri / kor topu renk tablolari (kare basina string uretme yok)
    coalCol = []; embCol = [];
    for (var q = 0; q < 8; q++) {
      var ph = q / 7;
      coalCol.push('rgb(255,' + Math.round(110 + 80 * ph) + ',40)');
      embCol.push('rgb(' + Math.round(138 + 71 * ph) + ',' + Math.round(42 + 21 * ph) + ',' + Math.round(14 + 4 * ph) + ')');
    }
  }

  function spawn(burst, bx, by, hh, ww) {
    var limit = quality >= 1 ? POOL * 0.5 : POOL; if (mobile) limit = Math.min(limit, 50);
    var p = null, i;
    if (!burst && nLive >= limit) return;
    for (i = 0; i < sparks.length; i++) { if (!sparks[i].on) { p = sparks[i]; break; } }
    if (!p) return;
    nLive++;
    var f = smooth;
    p.on = true;
    p.x = bx + rnd(-0.35, 0.35) * ww;
    p.y = by - rnd(0, 0.5) * hh - 2;
    p.vx = rnd(-20, 40) * S;
    p.vy = -rnd(60, 160) * (0.7 + 0.6 * f) * (0.6 + 0.4 * S);
    if (burst) { p.vx = rnd(-90, 110) * S; p.vy = -rnd(80, 220) * S; }
    p.age = 0;
    p.life = rnd(0.9, 2.6) * (0.8 + 0.5 * f);
    p.size = rnd(1.5, 3.2 + 1.8 * f) * (isDark ? 1 : 1.15);
    p.seed = Math.random() * 100;
    p.star = Math.random() < 0.08 && f > 0.3;
    if (p.star) { p.life = rnd(4, 6.5); p.size = rnd(1.2, 2); }
  }
  function burstAt(count) {
    var hh = curHH();
    for (var i = 0; i < count; i++) spawn(true, cx, CH - BASE, hh, cur.w * S);
  }

  /* ---------- yerlesim ---------- */
  function readMode() {
    var th = root.getAttribute('data-theme');
    isDark = th ? th !== 'light' : !(window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches);
    reduced = (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || root.getAttribute('data-motion') === 'reduce';
  }
  function layout() {
    vw = window.innerWidth; vh = window.innerHeight;
    mobile = vw < 960; S = mobile ? 0.6 : 1;
    dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5);
    if (quality >= 1) dpr = 1;
    cx = Math.round(Math.max(150 * S + 8, vw * 0.09));
    BASE = Math.round(26 * S);
    W = Math.round(Math.min(Math.max(vw, 280), cx + 420 * S));
    H = Math.round(Math.min(vh, 900));
    if (el) {
      el.style.setProperty('--fx', cx + 'px');
      el.style.setProperty('--fy', BASE + 'px');
      el.style.setProperty('--sc', S);
    }
    if (cv) sizeCanvas(true);
    maxDirty = true;
    lastGs = -1;
    updateTarget();
  }
  // canvas yalnizca alevin/kivilcimin kaplayabilecegi kutu kadar (asamaya gore); asama degisince yeniden boyutlanir
  function wantCH() {
    var up = stage >= 5 ? 1 : STAGE_T[Math.max(stage, 0)];
    interpInto(tmpK, up);
    var reach = 90 + 330 * sstep(up, 0.05, 0.7);
    var h = BASE + Math.min(tmpK.h * vh / 100 * S * 1.1, H * 0.95) + reach * S;
    return Math.max(120, Math.min(H, Math.round(h / 8) * 8));
  }
  function sizeCanvas(force) {
    var ch = wantCH();
    if (!force && ch === CH) return;
    var d = ch - CH;
    if (CH && d) {
      for (var i = 0; i < sparks.length; i++) if (sparks[i].on) sparks[i].y += d;
      for (var j = 0; j < smoke.length; j++) if (smoke[j].on) smoke[j].y += d;
    }
    CH = ch;
    cv.width = Math.round(W * dpr); cv.height = Math.round(CH * dpr);
    cv.style.width = W + 'px'; cv.style.height = CH + 'px';
    bloom.width = Math.max(8, Math.round(W / 6)); bloom.height = Math.max(8, Math.round(CH / 6));
  }

  /* ---------- progress ---------- */
  function pageFloor() {
    return floorInfo || (floorInfo = pageFloor0());
  }
  function pageFloor0() {
    var p = location.pathname.toLowerCase(), a = root.getAttribute('data-fire-floor');
    if (a !== null && a !== '' && !isNaN(parseFloat(a))) return { f: parseFloat(a), contact: false };
    if (/contact|iletisim/.test(p)) return { f: 0.5, contact: true };
    if (/about|hakkimda|hakkinda/.test(p)) return { f: 0.25, contact: false };
    if (/project|proje/.test(p)) return { f: 0.15, contact: false };
    return { f: 0, contact: false };
  }
  function updateTarget() {
    if (maxDirty) { maxScroll = Math.max(0, (doc.documentElement.scrollHeight || 0) - window.innerHeight); maxDirty = false; }
    var max = maxScroll;
    var y = window.pageYOffset || doc.documentElement.scrollTop || 0;
    var pp = max > 0 ? clamp(y / max, 0, 1) : 0, fl = pageFloor();
    target = fl.contact ? 0.6 + 0.4 * pp : Math.max(pp, fl.f);
    if (reduced) { smooth = target; applyLayers(true); }
    else if (!running) start();
  }
  function save() { ssSet(SS_KEY, smooth.toFixed(4)); }

  /* ---------- katman degiskenleri ---------- */
  var lastFire = -1, lastRootFire = -1, lastGs = -1, lastGlow = -1;
  function applyLayers(force) {
    interp(smooth);
    var gr = cur.gr * S * (isDark ? 1 : 0.6) / 1100;
    if (force || Math.abs(smooth - lastFire) > 0.01) {
      lastFire = smooth;
      el.style.setProperty('--fire', smooth.toFixed(2));
      warmEl.style.opacity = cur.wm.toFixed(2);
      vigEl.style.opacity = (cur.vg / 0.32).toFixed(2);
    }
    // --fire (kartlarin zemin isigi) kok elemanda: kaba adimlarla, tum belgeyi gereksiz stillendirmesin
    if (force || Math.abs(smooth - lastRootFire) > 0.05) {
      lastRootFire = smooth;
      root.style.setProperty('--fire', smooth.toFixed(2));
    }
    if (force || Math.abs(gr - lastGs) > 0.004) {
      lastGs = gr; glowEl.style.transform = 'translate(-50%,50%) scale(' + (gr * GK).toFixed(3) + ')';
    }
    if (reduced || force) {
      glowEl.style.opacity = (cur.ga * (isDark ? 1 : 0.55)).toFixed(3);
      if (reduced) updateStatic();
    }
  }

  /* ---------- alev cizimi ---------- */
  var FA = { dark: [0.5, 0.55, 0.62, 0.68, 0.62], light: [0.9, 0.9, 0.92, 0.95, 0.95] };
  var LAYERS = [[1, 1], [0.78, 0.82], [0.52, 0.62], [0.3, 0.4], [0.17, 0.26]];
  var SLOTS = [
    { o: 0, hf: 1, wf: 0.55, min: 0, seed: 1 },
    { o: -0.45, hf: 0.72, wf: 0.42, min: 0.28, seed: 7 },
    { o: 0.42, hf: 0.78, wf: 0.42, min: 0.28, seed: 13 },
    { o: -0.8, hf: 0.5, wf: 0.34, min: 0.52, seed: 21 },
    { o: 0.78, hf: 0.55, wf: 0.34, min: 0.52, seed: 29 },
    { o: 1.15, hf: 0.45, wf: 0.3, min: 0.78, seed: 37 }
  ];
  function tonguePath(c, x, by, ww, hh, sway, n1, n2) {
    var tx = x + sway * hh, ty = by - hh;
    c.beginPath();
    c.moveTo(x - ww / 2, by);
    c.bezierCurveTo(x - ww * 0.65, by - hh * 0.35, tx - ww * 0.35 + n1 * ww * 0.2, by - hh * 0.7, tx, ty);
    c.bezierCurveTo(tx + ww * 0.35 + n2 * ww * 0.2, by - hh * 0.68, x + ww * 0.65, by - hh * 0.35, x + ww / 2, by);
    c.quadraticCurveTo(x, by + ww * 0.14, x - ww / 2, by);
    c.closePath();
  }
  function curHH() { return Math.min(cur.h * vh / 100 * S, H * 0.85); }

  function drawFlame(t, hhTotal, flick) {
    if (hhTotal < 2) return;
    var by = CH - BASE, f = smooth, ww0 = cur.w * S, fa = Math.min(1, clamp(flick, 0.5, 1.3));
    ctx.globalCompositeOperation = palette.m;
    for (var s = 0; s < SLOTS.length; s++) {
      var sl = SLOTS[s], a = s === 0 ? 1 : sstep(f, sl.min, sl.min + 0.08);
      if (a <= 0.01) continue;
      var wf = s === 0 ? 1 - 0.45 * sstep(f, 0.2, 0.35) : sl.wf;
      var x = cx + sl.o * ww0 * 0.5;
      var hh = hhTotal * sl.hf * a * (0.86 + 0.14 * noise(t * 1.3 + sl.seed));
      var ww = ww0 * wf * (0.85 + 0.15 * a);
      var sway = noise(t * 0.8 + sl.seed) * 0.1 + sl.o * 0.03;
      if (s === 0) sway += Math.sin(t * TAU / 3.2) * 0.07 * (1 - sstep(f, 0.3, 0.5)); // +-4deg egim
      if (s === 5) sway += 0.1;
      var n1 = noise(t * 1.7 + sl.seed * 3.1), n2 = noise(t * 1.9 + sl.seed * 5.3 + 10);
      for (var l = 0; l < 5; l++) {
        if (l === 4 && f < 0.55) break;
        var lh = hh * LAYERS[l][1];
        tonguePath(ctx, x, by, ww * LAYERS[l][0], lh, sway, n1, n2);
        ctx.globalAlpha = fa * (l === 4 ? sstep(f, 0.55, 0.7) : 1);
        // onbellekteki birim gradyan: yol zaten cizildi, yalnizca dolgu uzayi olceklenir
        ctx.setTransform(dpr, 0, 0, -dpr * lh, 0, dpr * by);
        ctx.fillStyle = flameGr[l];
        ctx.fill();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!isDark && l === 0) { ctx.strokeStyle = 'rgba(138,42,14,.25)'; ctx.lineWidth = 1.5; ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // kor yatagi + zemine vuran isik (alevin ALTINA, destination-over): ates buyudukce parlar
  function drawCoals(t, fl) {
    var f = smooth, by = CH - BASE + 4 * S;
    var k = (0.25 + 0.75 * sstep(f, 0.02, 0.5)) * (1 + fl * 2);
    var rx = (60 + cur.w * 0.55) * S * 1.6;
    ctx.globalCompositeOperation = 'destination-over';
    var fk = 0.35 + 0.65 * sstep(f, 0.02, 0.4);
    for (var i = 0; i < 9; i++) {
      var ph = (Math.sin(t * 1.7 + i * 2.1) + 1) / 2, x = cx + (i - 4) * 11 * S * (0.7 + 0.3 * f);
      ctx.globalAlpha = (0.35 + 0.65 * ph) * fk * 0.55;
      ctx.fillStyle = coalCol[(ph * 7 + 0.5) | 0];
      ctx.beginPath(); ctx.ellipse(x, by - 2 * S, (3.2 + (i % 3)) * S, 1.8 * S, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = Math.min(1, 0.5 * k * (isDark ? 1 : 0.5));
    ctx.drawImage(coalSprite, cx - rx, by - rx * 0.28, rx * 2, rx * 0.56);
    if (!isDark && smooth > 0.05) {   // acik tema yer golgesi
      ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(60,40,28,.18)';
      ctx.beginPath(); ctx.ellipse(cx, CH - BASE + 6 * S, cur.w * S * 0.75, 9 * S, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawEmbers(t) {
    var by = CH - BASE + 2, f = smooth;
    var fade = 1 - 0.55 * sstep(f, 0.2, 0.5);
    for (var i = 0; i < 5; i++) {
      var ph = (Math.sin(t * TAU / 2.4 + i * 1.3) + 1) / 2;
      var a = (0.5 + 0.5 * ph) * fade;
      var x = cx + (i - 2) * 17 * S + Math.sin(i * 5.1) * 5 * S;
      var r = (3 + (i * 7 % 4) * 1.5) * S;
      ctx.globalAlpha = a; ctx.fillStyle = embCol[(ph * 7 + 0.5) | 0];
      ctx.beginPath(); ctx.arc(x, by - r * 0.4, r, 0, TAU); ctx.fill();
      if (isDark) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = a * 0.12; ctx.fillStyle = 'rgb(255,122,47)';
        ctx.beginPath(); ctx.arc(x, by - r * 0.4, r * 2.4, 0, TAU); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawSparks(dt, t) {
    var cur2 = window.__cursor, px = 0, py = 0, cOn = cur2 && cur2.visible;
    if (cOn) { px = cur2.x; py = cur2.y - (vh - CH); }
    ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
    var damp = Math.pow(0.985, dt * 60);
    for (var i = 0; i < sparks.length; i++) {
      var p = sparks[i]; if (!p.on) continue;
      p.age += dt;
      var u = p.age / p.life;
      if (u >= 1 || p.y < -20) { p.on = false; nLive--; continue; }
      var d = p.star ? Math.pow(0.97, dt * 60) : damp;
      p.vx *= d; p.vy *= d;
      var ox = p.x, oy = p.y;
      p.x += (p.vx + Math.sin(t * 3 + p.seed) * 12) * dt;
      p.y += p.vy * dt;
      if (cOn) {
        var dx = p.x - px, dy = p.y - py, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < 140 && dd > 0.5) { var fo = (1 - dd / 140) * 40 * dt; p.x += dx / dd * fo; p.y += dy / dd * fo; }
      }
      var idx = p.star ? Math.min(1, (u * 3) | 0) : Math.min(7, (u * 8) | 0);
      var sz = p.size * (p.star ? 1 : 1 - u * 0.45) * 2.6;
      var al = p.star ? (0.5 + 0.4 * Math.sin(t * 2 + p.seed)) * (1 - u) : 1;
      if (!isDark) al = Math.min(al, 0.85);
      ctx.globalAlpha = al;
      if (!p.star && quality < 3) {
        ctx.strokeStyle = strokes[idx]; ctx.lineWidth = p.size * 0.6;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      ctx.drawImage(sprites[idx], p.x - sz / 2, p.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSmoke(dt, hh) {
    if (!isDark || quality >= 3 || smooth < 0.02) return;
    var by = CH - BASE;
    ctx.globalCompositeOperation = 'destination-over';
    for (var i = 0; i < smoke.length; i++) {
      var m = smoke[i];
      if (!m.on) {
        if (Math.random() < dt * 0.7) {
          m.on = true; m.age = 0; m.life = rnd(4, 7); m.x = cx + rnd(-20, 20) * S;
          m.y = by - hh * 0.85 - 10; m.s = rnd(0.7, 1.2); m.dx = rnd(2, 14);
        }
        continue;
      }
      m.age += dt;
      var u = m.age / m.life;
      if (u >= 1) { m.on = false; continue; }
      m.y -= 26 * dt * S; m.x += m.dx * dt;
      var sz = (70 + 150 * u) * m.s * S * (0.6 + 0.6 * Math.min(1, smooth + 0.3));
      ctx.globalAlpha = Math.sin(u * Math.PI) * 0.06;
      ctx.drawImage(smokeSprite, m.x - sz / 2, m.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---------- ana dongu ---------- */
  var costEma = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    // kare hizi siniri: kaydirirken ~60fps, ates durag'sa 30fps (zemin: 15fps); kalite >=2'de hep 30fps
    var settled = target === smooth;
    var minInt = quality >= 2 || settled ? (smooth < 0.08 && settled ? 64 : 32) : 15;
    var dtRaw = now - last;
    if (dtRaw < minInt - 2) return;
    last = now;
    var tStart = performance.now();
    var dt = dtRaw / 1000;
    if (dt > 0.1) dt = 0.033;               // sekme donusu / takilma
    var t = (now - t0) / 1000;

    // kalite izleme: kare araligi ve kare maliyeti (EMA); esik hedef araliga gore
    fcount++;
    if (fcount > 90) {
      if (dtRaw > minInt * 1.45 + 6 || costEma > 9) bad++; else bad = Math.max(0, bad - 1);
      if (bad >= 24 && quality < 3) { quality++; bad = 0; costEma = 0; fcount = 30; if (quality === 1) layout(); }
    }

    // lerp (kare hizindan bagimsiz)
    smooth += (target - smooth) * (1 - Math.pow(1 - lerpK, dt * 60));
    if (lerpK > 0.061) lerpK += (0.06 - lerpK) * 0.02;
    if (Math.abs(target - smooth) < 0.0002) smooth = target;
    if (smooth !== target) needSave = true;
    else if (needSave) { needSave = false; save(); }
    var st = stageOf(smooth);
    if (st !== stage) {
      var up = stage >= 0 && st > stage;
      stage = st;
      sizeCanvas(false);
      if (up) { burstAt(Math.round(rnd(6, 10))); if (st === 5) firstFlash(); }
    }

    applyLayers(false);

    // ates yakinligi (imlec)
    var c = window.__cursor, hTarget = 0;
    if (c && c.visible) {
      var dx = c.x - cx, dy = c.y - (vh - BASE), dd = Math.sqrt(dx * dx + dy * dy);
      hTarget = clamp(1 - dd / 220, 0, 1);
    }
    heat += (hTarget - heat) * 0.1;

    // flare
    var ms = now - t0;
    if (smooth > 0.92 && ms > nextFlare) { flareT = now; nextFlare = ms + 3500; burstAt(8); }
    flare = flareT ? Math.max(0, 1 - (now - flareT) / 600) : 0; flare *= flare;

    // flicker
    var amp = quality >= 3 ? 0 : (0.03 + 0.03 * smooth) * (1 + heat * 0.2);
    var fl = amp * (Math.sin(t * TAU * 5.1) + 0.7 * Math.sin(t * TAU * 8.3 + 1) + 0.5 * Math.sin(t * TAU * 13 + 2)) / 2.2;
    var glowBase = cur.ga * (isDark ? 1 : 0.55);
    var go = clamp(glowBase * (1 + fl * 3 + 0.15 * flare + heat * 0.08), 0, 1);
    if (Math.abs(go - lastGlow) > 0.004) { lastGlow = go; glowEl.style.opacity = go.toFixed(3); }

    // alev yuksekligi + nefes
    var hh = curHH();
    var breath = sstep(smooth, 0.9, 0.96);
    hh *= 1 + breath * (0.08 * Math.sin(t * TAU / 2.2)) + 0.12 * flare * breath;

    // cizim: once alev (bos tuval), sonra parlama ornegi, sonra alt katmanlar (destination-over), ustte parlama/kor/kivilcim
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, CH);
    drawFlame(t, hh, 1 + fl * 2);
    var bl = quality < 2 && hh > 4;
    if (bl && (fcount & 1) === 0) {   // parlama tamponu 2 karede bir yenilenir (6x kucuk, yumusak)
      blctx.clearRect(0, 0, bloom.width, bloom.height);
      blctx.drawImage(cv, 0, 0, bloom.width, bloom.height);
    }
    drawSmoke(dt, hh);
    drawCoals(t, fl);
    if (bl) {
      ctx.globalCompositeOperation = isDark ? 'lighter' : 'source-over';
      ctx.globalAlpha = (isDark ? 0.75 : 0.35) * (0.6 + 0.4 * smooth);
      ctx.drawImage(bloom, 0, 0, W, CH);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    drawEmbers(t);

    // kivilcim dogumu
    spawnAcc += cur.sp * dt * (0.75 + 0.25 * S) * (1 + heat * 0.15);
    while (spawnAcc >= 1) { spawnAcc -= 1; spawn(false, cx, CH - BASE, hh, cur.w * S); }
    drawSparks(dt, t);
    costEma += (performance.now() - tStart - costEma) * 0.1;
  }

  function start() {
    if (reduced || running || doc.hidden || !cv) return;
    running = true; last = performance.now(); if (!t0) t0 = last;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function firstFlash() {
    if (ssGet(SS_FLASH) || reduced) return;
    ssSet(SS_FLASH, '1');
    flashEl.classList.add('on');
    setTimeout(function () { flashEl.classList.remove('on'); }, 1100);
  }

  /* ---------- DOM kurulum ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function logsMarkupRich() {
    return '<defs>' +
      '<linearGradient id="fl-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2c1a"/><stop offset=".5" stop-color="#2a170e"/><stop offset="1" stop-color="#150b06"/></linearGradient>' +
      '<linearGradient id="fl-wood2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3520"/><stop offset="1" stop-color="#22130b"/></linearGradient>' +
      '<linearGradient id="fl-stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6054"/><stop offset="1" stop-color="#2a241f"/></linearGradient>' +
      '<radialGradient id="fl-ring" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb347"/><stop offset=".55" stop-color="#d13f12"/><stop offset="1" stop-color="#3a1608"/></radialGradient>' +
      '</defs>' +
      '<g class="fl-rich">' +
      '<rect class="fl-w2" x="92" y="30" width="140" height="15" rx="7.5" transform="rotate(-17 162 38)"/>' +
      '<rect class="fl-w2" x="88" y="30" width="140" height="15" rx="7.5" transform="rotate(17 158 38)"/>' +
      '<rect class="fl-rim" x="92" y="30" width="140" height="4" rx="2" transform="rotate(-17 162 38)"/>' +
      '<rect class="fl-rim" x="88" y="30" width="140" height="4" rx="2" transform="rotate(17 158 38)"/>' +
      '<rect class="fl-w1" x="96" y="47" width="128" height="17" rx="8.5"/>' +
      '<rect class="fl-rim" x="104" y="47" width="112" height="3.5" rx="1.75"/>' +
      '<ellipse class="fl-ring" cx="97" cy="55.5" rx="4" ry="7.5"/><ellipse class="fl-ring" cx="223" cy="55.5" rx="4" ry="7.5"/>' +
      '<ellipse class="fl-st" cx="62" cy="60" rx="18" ry="10"/><ellipse class="fl-st" cx="86" cy="64" rx="12" ry="7"/>' +
      '<ellipse class="fl-st" cx="256" cy="60" rx="18" ry="10"/><ellipse class="fl-st" cx="234" cy="65" rx="11" ry="6"/>' +
      '<ellipse class="fl-st" cx="40" cy="64" rx="9" ry="5.5"/></g>';
  }
  function logsMarkup() {
    return '<rect class="fl-log2" x="92" y="30" width="140" height="15" rx="7.5" transform="rotate(-17 162 38)"/>' +
      '<rect class="fl-log2" x="88" y="30" width="140" height="15" rx="7.5" transform="rotate(17 158 38)"/>' +
      '<rect class="fl-log" x="96" y="47" width="128" height="17" rx="8.5"/>' +
      '<ellipse class="fl-stone" cx="62" cy="60" rx="18" ry="10"/><ellipse class="fl-stone" cx="86" cy="64" rx="12" ry="7"/>' +
      '<ellipse class="fl-stone" cx="256" cy="60" rx="18" ry="10"/><ellipse class="fl-stone" cx="234" cy="65" rx="11" ry="6"/>' +
      '<ellipse class="fl-stone" cx="40" cy="64" rx="9" ry="5.5"/>';
  }
  function flamePathStr(x, by, w, h, lean) {
    var tx = x + lean * h, ty = by - h;
    return 'M' + (x - w / 2) + ' ' + by + 'C' + (x - w * .65) + ' ' + (by - h * .35) + ' ' + (tx - w * .35) + ' ' + (by - h * .7) + ' ' + tx + ' ' + ty +
      'C' + (tx + w * .35) + ' ' + (by - h * .68) + ' ' + (x + w * .65) + ' ' + (by - h * .35) + ' ' + (x + w / 2) + ' ' + by + 'Q' + x + ' ' + (by + w * .14) + ' ' + (x - w / 2) + ' ' + by + 'Z';
  }
  function buildStatic() {
    // 6 hazir kare (0 kor ... 5 cosku), viewBox 320x420, taban y=394
    var mid = [0.06, 0.21, 0.425, 0.665, 0.85, 0.96];
    var by = 394, html = '';
    for (var i = 0; i < 6; i++) {
      var p = mid[i]; interp(p);
      var hh = cur.h * 9, ww = cur.w, g = '';
      if (i === 0) {
        for (var e = 0; e < 5; e++) g += '<circle class="fs-ember" cx="' + (160 + (e - 2) * 17) + '" cy="' + (by - 3) + '" r="' + (4 + e % 3 * 1.5) + '" opacity=".85"/>';
      } else {
        for (var s = 0; s < SLOTS.length; s++) {
          var sl = SLOTS[s]; if (p < sl.min && s > 0) continue;
          var wf = s === 0 ? (i > 1 ? 0.55 : 1) : sl.wf;
          var x = 160 + sl.o * ww * 0.5, h = hh * sl.hf, w = ww * wf;
          g += '<path class="fs-deep" d="' + flamePathStr(x, by, w, h, 0.02) + '"/>' +
            '<path class="fs-flame" d="' + flamePathStr(x, by, w * .78, h * .82, 0.02) + '"/>' +
            '<path class="fs-mid" d="' + flamePathStr(x, by, w * .52, h * .62, 0.02) + '"/>' +
            '<path class="fs-hot" d="' + flamePathStr(x, by, w * .3, h * .4, 0.02) + '"/>';
        }
      }
      html += '<svg viewBox="0 0 320 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">' +
        '<g transform="translate(0 350)">' + logsMarkup() + '</g>' + g + '</svg>';
    }
    staticEl.innerHTML = html;
    staticSvgs = staticEl.querySelectorAll('svg');
  }
  var lastStatic = -1;
  function updateStatic() {
    var s = stageOf(smooth);
    if (s === lastStatic) return;
    lastStatic = s;
    for (var i = 0; i < staticSvgs.length; i++) staticSvgs[i].classList.toggle('on', i === s);
  }

  function build() {
    el = doc.createElement('div');
    el.id = 'campfire'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="fire-warm"></div><div class="fire-glow"></div>' +
      '<canvas class="fire-canvas"></canvas>' +
      '<svg class="fire-logs" viewBox="0 0 320 70" aria-hidden="true" focusable="false">' + logsMarkupRich() + '</svg>' +
      '<div class="fire-static"></div><div class="fire-vig"></div><div class="fire-flash"></div>';
    doc.body.insertBefore(el, doc.body.firstChild);
    cv = el.querySelector('canvas'); ctx = cv.getContext('2d');
    bloom = doc.createElement('canvas'); blctx = bloom.getContext('2d');
    glowEl = el.querySelector('.fire-glow'); warmEl = el.querySelector('.fire-warm'); vigEl = el.querySelector('.fire-vig'); flashEl = el.querySelector('.fire-flash');
    staticEl = el.querySelector('.fire-static');
    var svgLogs = el.querySelector('.fire-logs'); svgLogs.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  }

  function applyMode() {
    el.classList.toggle('fire-reduced', reduced);
    buildSprites();
    if (reduced) { stop(); smooth = target; lastStatic = -1; if (!staticSvgs.length) buildStatic(); applyLayers(true); }
    else { lastFire = -1; lastGs = -1; start(); }
  }

  function mobile0() {
    var n = navigator;
    return (n.hardwareConcurrency && n.hardwareConcurrency <= 4) || (n.deviceMemory && n.deviceMemory <= 4);
  }
  function init() {
    var cfg = (window.SITE_CONTENT || {}).settings;
    if (cfg && cfg.fire === false) return;   // content.js -> settings.fire: false ise ates baslamaz
    if (!doc.body) return;
    readMode();
    build();
    // kalicilik: kaldigi yerden basla
    var st = parseFloat(ssGet(SS_KEY));
    smooth = isNaN(st) ? 0 : clamp(st, 0, 1);
    saved = smooth;
    stage = stageOf(smooth);
    // dusuk guclu cihazda ucuz modda basla
    if (mobile0() ) quality = 1;
    layout();
    applyMode();

    var scrollTick = false;
    window.addEventListener('scroll', function () {
      if (scrollTick) return; scrollTick = true;
      requestAnimationFrame(function () { scrollTick = false; updateTarget(); });
    }, { passive: true });
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); }, { passive: true });
    window.addEventListener('load', function () { maxDirty = true; updateTarget(); });
    if (window.ResizeObserver) new ResizeObserver(function () { maxDirty = true; }).observe(doc.body);
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden) { stop(); save(); } else { start(); }
    });
    window.addEventListener('pagehide', save);

    new MutationObserver(function () {
      var wasDark = isDark, wasRed = reduced;
      readMode();
      if (wasDark !== isDark || wasRed !== reduced) applyMode();
    }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'data-motion'] });
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-reduced-motion: reduce)');
      var h = function () { var w = reduced; readMode(); if (w !== reduced) applyMode(); };
      if (mq.addEventListener) mq.addEventListener('change', h); else if (mq.addListener) mq.addListener(h);
    }

    window.addEventListener('fire:flare', function () { flareT = performance.now(); burstAt(10); });

    window.__fire = {
      get progress() { return smooth; },
      get x() { return cx; },
      get y() { return window.innerHeight - BASE; },
      setProgress: function (p) { target = clamp(p, 0, 1); if (reduced) updateTarget(); },
      fastLerp: function () { lerpK = 0.12; },
      flare: function () { window.dispatchEvent(new Event('fire:flare')); },
      heat: function (x, y) { var dx = x - cx, dy = y - (window.innerHeight - BASE); return clamp(1 - Math.sqrt(dx * dx + dy * dy) / 220, 0, 1); }
    };
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
