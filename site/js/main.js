/* main.js — header, mobil menu, reveal, sayac, yetenek cubuklari, marquee, lightbox, form, sayfa gecisi */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var tr = function (k, v) { return window.i18n ? window.i18n.t(k, v) : k; };

  /* ---------- Header: scroll durumu + gizle/goster ---------- */
  var header = $('.site-header');
  var nav = $('#site-nav');
  var menuBtn = $('.menu-toggle');
  var lastY = window.scrollY;

  /* Tek pasif scroll dinleyicisi + tek rAF: tum scroll isleri burada toplanir (okuma -> yazma sirasi) */
  var scrollSubs = [], scrollQ = false;
  function onScrollFrame() { scrollQ = false; for (var i = 0; i < scrollSubs.length; i++) scrollSubs[i](); }
  window.addEventListener('scroll', function () {
    if (!scrollQ) { scrollQ = true; requestAnimationFrame(onScrollFrame); }
  }, { passive: true });

  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 40);
      var menuOpen = nav && nav.classList.contains('is-open');
      if (!menuOpen && y > 160 && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= 160 || menuOpen) header.classList.remove('is-hidden');
    }
    lastY = y;
  }
  onScroll();
  // Klavye ile odaklanan ogeler icin header geri gelsin
  if (header) header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });

  scrollSubs.push(onScroll);

  /* ---------- Mobil menu ---------- */
  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', tr(open ? 'ui.menuClose' : 'ui.menuOpen'));
  }
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); } });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 880) setMenu(false); });
    doc.addEventListener('i18nchange', function () { setMenu(nav.classList.contains('is-open')); });
  }

  /* ---------- Scroll reveal (IntersectionObserver) ----------
     render.js dinamik oge ekledikten sonra window.SiteUI.scan(kok, anlik) cagirir: stagger + gozlemci yeniden taranir. */
  var REVEAL_SEL = '.reveal, .reveal--clip, .stat, .bar, .ring';
  function show(el) { el.classList.add('is-visible'); }
  var io = null;
  if ('IntersectionObserver' in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  }
  function scanReveal(rootEl, instant) {
    rootEl = rootEl || doc.body;
    // Stagger: [data-stagger] icindeki .reveal cocuklarina --i ver
    var parents = $$('[data-stagger]', rootEl);
    if (rootEl.matches && rootEl.matches('[data-stagger]')) parents.push(rootEl);
    parents.forEach(function (p) { $$('.reveal', p).forEach(function (el, i) { el.style.setProperty('--i', i); }); });
    var targets = $$(REVEAL_SEL, rootEl);
    if (rootEl.matches && rootEl.matches(REVEAL_SEL)) targets.push(rootEl);
    targets.forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      if (instant || !io) show(el); else io.observe(el);
    });
  }
  window.SiteUI = { scan: scanReveal };
  scanReveal(doc.body, false);

  /* ---------- Sayac animasyonu ---------- */
  function easeOutExpo(t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
  function countUp(el) {
    var end = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = end + suffix; return; }
    var dur = 1600, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round(end * easeOutExpo(p)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (counters.length) {
    if (!('IntersectionObserver' in window)) counters.forEach(function (c) { c.textContent = c.getAttribute('data-count') + (c.getAttribute('data-suffix') || ''); });
    else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* ---------- Manifesto: kelime kelime isinma (scrub) ---------- */
  var manifesto = $('.manifesto');
  var words = [];
  function splitManifesto() {
    if (!manifesto) return;
    var text = manifesto.textContent.trim().split(/\s+/);
    manifesto.setAttribute('aria-label', text.join(' '));
    manifesto.innerHTML = '';
    words = text.map(function (w, i) {
      var s = doc.createElement('span');
      s.className = 'w'; s.setAttribute('aria-hidden', 'true'); s.textContent = w;
      manifesto.appendChild(s);
      if (i < text.length - 1) manifesto.appendChild(doc.createTextNode(' '));
      return s;
    });
    updateManifesto();
  }
  var manN = -1, manInView = true;
  function updateManifesto() {
    if (!words.length) return;
    if (reduce) { words.forEach(function (w) { w.classList.add('on'); }); return; }
    if (!manInView) return;
    var r = manifesto.getBoundingClientRect(), vh = window.innerHeight;
    var start = vh * 0.85, end = vh * 0.35;
    var p = (start - r.top) / (start - end + r.height * 0.6);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * words.length);
    if (n === manN) return;
    // yalnizca degisen kelimeler (fark araligi) guncellenir
    var a = manN < 0 ? 0 : Math.min(n, manN), b = manN < 0 ? words.length : Math.max(n, manN);
    for (var i = a; i < b; i++) words[i].classList.toggle('on', i < n);
    manN = n;
  }
  if (manifesto) {
    // i18n degisince metin sifirlanir; yeniden bol
    doc.addEventListener('i18nchange', function () {
      var k = manifesto.getAttribute('data-i18n'); if (k && window.I18N_DICT) { manifesto.textContent = window.I18N_DICT[window.i18n.lang][k]; }
      manN = -1; manInView = true; splitManifesto();
    });
    splitManifesto();
    // ekranda degilken scrub hesabi yapma (gorunurluk bayragi)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { manInView = en[0].isIntersecting; if (manInView) updateManifesto(); }, { rootMargin: '10% 0px' }).observe(manifesto);
    }
    scrollSubs.unshift(updateManifesto);   // okuma (rect) once, yazmalar sonra
    window.addEventListener('resize', function () { manN = -1; updateManifesto(); }, { passive: true });
  }

  /* ---------- Hero parallax (hafif) ---------- */
  var heroText = $('.hero [data-parallax]');
  if (heroText && !reduce) {
    var lastK = -1;
    scrollSubs.push(function () {
      var y = window.scrollY, ih = window.innerHeight;
      if (y > ih && lastK >= 1) return;               // hero tamamen disarida: is yok
      var k = Math.min(y, ih) / ih;
      if (Math.abs(k - lastK) < 0.002 && k < 1) return;
      lastK = k;
      heroText.style.transform = 'translate3d(0,' + (-k * 8).toFixed(2) + 'vh,0)';
      heroText.style.opacity = (1 - k * 0.9).toFixed(3);
    });
  }

  /* ---------- Marquee: scroll hizina gore hizlanir (dongu yalnizca hiz varken calisir) ---------- */
  var tracks = $$('.marquee__track');
  if (tracks.length && !reduce && tracks[0].getAnimations) {
    var vel = 0, rate = 1, prevY = window.scrollY, mLoop = 0, mVisible = true;
    var mAnims = null;
    function mTick() {
      mLoop = 0;
      var target = 1 + Math.min(vel * 0.08, 5);
      rate += (target - rate) * 0.1; vel *= 0.9;
      var settledM = vel < 0.05 && Math.abs(rate - 1) < 0.01;
      if (settledM) rate = 1;
      if (!mAnims) { mAnims = []; tracks.forEach(function (t) { t.getAnimations().forEach(function (a) { mAnims.push(a); }); }); }
      for (var i = 0; i < mAnims.length; i++) mAnims[i].playbackRate = rate;
      if (!settledM && mVisible) mLoop = requestAnimationFrame(mTick);
    }
    scrollSubs.push(function () {
      vel = Math.abs(window.scrollY - prevY); prevY = window.scrollY;
      if (!mLoop && mVisible && (vel > 0.05 || rate !== 1)) mLoop = requestAnimationFrame(mTick);
    });
    if ('IntersectionObserver' in window) {
      var mio = new IntersectionObserver(function (en) {
        mVisible = en.some(function (e) { return e.isIntersecting; });
        if (!mVisible) { /* gorunmuyorken CSS animasyonu da boyanmaz; oranı sifirla */ rate = 1; vel = 0; }
      });
      tracks.forEach(function (t) { mio.observe(t); });
    }
  }

  /* ---------- Lightbox (<dialog>) ---------- 
     Olay delegasyonu + tembel olusturma: render.js ile sonradan eklenen a[data-lightbox] ogeleri de calisir. */
  var dlg = null, lbImg, lbCap, bClose, bPrev, bNext, lbIdx = 0, lbOpener = null, lbItems = [];
  function lbLabels() {
    dlg.setAttribute('aria-label', tr('lb.label'));
    bClose.setAttribute('aria-label', tr('lb.close')); bClose.textContent = '×';
    bPrev.setAttribute('aria-label', tr('lb.prev')); bNext.setAttribute('aria-label', tr('lb.next'));
  }
  function lbRender() {
    var a = lbItems[lbIdx]; if (!a) return;
    var im = $('img', a), fc = a.parentNode.querySelector('figcaption');
    lbImg.src = a.getAttribute('href');
    lbImg.alt = im ? im.getAttribute('alt') : '';
    lbCap.textContent = fc ? fc.textContent : '';
  }
  function lbGo(d) { lbItems = $$('a[data-lightbox]'); lbIdx = (lbIdx + d + lbItems.length) % lbItems.length; lbRender(); }
  function lbEnsure() {
    if (dlg) return true;
    if (typeof HTMLDialogElement === 'undefined') return false;
    dlg = doc.createElement('dialog');
    dlg.className = 'lightbox';
    var fig = doc.createElement('figure'); fig.className = 'lightbox__figure';
    lbImg = doc.createElement('img'); lbImg.className = 'lightbox__img'; lbImg.alt = '';
    lbCap = doc.createElement('figcaption'); lbCap.className = 'lightbox__cap';
    fig.appendChild(lbImg); fig.appendChild(lbCap); dlg.appendChild(fig);
    function mk(cls, txt) { var b = doc.createElement('button'); b.type = 'button'; b.className = 'lightbox__btn ' + cls; if (txt) b.textContent = txt; dlg.appendChild(b); return b; }
    bClose = mk('lightbox__close'); bPrev = mk('lightbox__prev', '←'); bNext = mk('lightbox__next', '→');
    doc.body.appendChild(dlg);
    bClose.addEventListener('click', function () { dlg.close(); });
    bPrev.addEventListener('click', function () { lbGo(-1); });
    bNext.addEventListener('click', function () { lbGo(1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') lbGo(-1); else if (e.key === 'ArrowRight') lbGo(1);
    });
    dlg.addEventListener('close', function () { if (lbOpener && doc.contains(lbOpener)) lbOpener.focus(); });
    return true;
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-lightbox]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!lbEnsure()) return;
    e.preventDefault();
    lbItems = $$('a[data-lightbox]'); lbIdx = Math.max(0, lbItems.indexOf(a)); lbOpener = a;
    lbLabels(); lbRender(); if (!dlg.open) dlg.showModal();
  });
  doc.addEventListener('i18nchange', function () {
    if (!dlg) return;
    lbLabels();
    if (dlg.open) { lbItems = $$('a[data-lightbox]'); if (lbIdx >= lbItems.length) lbIdx = 0; lbRender(); }
  });

  /* ---------- Iletisim formu ---------- */
  var form = $('#contact-form');
  if (form) {
    var thanks = $('#form-thanks');
    var msg = $('#cf-message'), counter = $('#cf-counter');
    var rules = {
      'cf-name': function (v) { return v.trim().length >= 2 ? '' : 'form.err.name'; },
      'cf-email': function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'form.err.email'; },
      'cf-subject': function (v) { return v ? '' : 'form.err.subject'; },
      'cf-message': function (v) { return v.trim().length >= 10 ? '' : 'form.err.message'; },
      'cf-consent': function (v, el) { return el.checked ? '' : 'form.err.consent'; }
    };
    function check(id) {
      var el = doc.getElementById(id), err = doc.getElementById(id + '-err');
      var key = rules[id](el.value, el);
      if (key) { el.setAttribute('aria-invalid', 'true'); err.setAttribute('data-i18n', key); err.textContent = tr(key); }
      else { el.removeAttribute('aria-invalid'); err.removeAttribute('data-i18n'); err.textContent = ''; }
      return !key;
    }
    Object.keys(rules).forEach(function (id) {
      var el = doc.getElementById(id);
      el.addEventListener('blur', function () { check(id); });
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) check(id); });
      el.addEventListener('change', function () { if (el.getAttribute('aria-invalid')) check(id); });
    });
    function updateCounter() { if (counter) counter.textContent = tr('form.counter', { n: msg.value.length }); }
    msg.addEventListener('input', updateCounter); updateCounter();
    doc.addEventListener('i18nchange', updateCounter);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      Object.keys(rules).forEach(function (id) { if (!check(id)) { ok = false; if (!first) first = doc.getElementById(id); } });
      if (!ok) { first.focus(); return; }
      // Sahte handler: gercek gonderim yok; yalnizca tesekkur durumu gosterilir.
      form.hidden = true;
      thanks.hidden = false;
      thanks.setAttribute('tabindex', '-1');
      thanks.focus();
      form.reset(); updateCounter();
    });
    var again = $('#form-again');
    if (again) again.addEventListener('click', function () { thanks.hidden = true; form.hidden = false; $('#cf-name').focus(); });
  }

  /* ---------- E-posta kopyala (delegasyon) ---------- */
  doc.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-copy]');
    if (!b) return;
    var text = b.getAttribute('data-copy');
    var done = function () {
      b.textContent = tr('copy.ok');
      setTimeout(function () { b.textContent = tr('copy.btn'); }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else done();
  });

  /* ---------- Yolculuk: "sayfa ustune sayfa" (stacking cards) ----------
     Her bolum sticky; top = min(0, innerHeight - yukseklik) (uzun bolum once sonuna kadar akar, sonra sabitlenir).
     Scroll'a bagli tek isi: sonraki bolumun ustu viewport'ta ne kadar yukseldiyse (p 0..1) onceki bolum
     scale(1 -> .94) + dim overlay yapar. Okuma -> yazma sirasi; tek passive scroll + rAF (scrollSubs). */
  var secs = $$('[data-jsec]');
  if (secs.length) {
    var navLinks = $$('.nav__link[href^="#"]'), dots = $$('.jdots a[data-sec]');
    var current = '';
    function setActive(id) {
      if (id === current) return;
      current = id;
      navLinks.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
      dots.forEach(function (a) {
        var on = a.getAttribute('data-sec') === id;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    navLinks.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });

    // baslik: kelimeleri maskeli span'lara bol (satir sirasi refresh'te olculur); i18n yeniden yazinca tekrar bol
    var titles = secs.filter(function (s) { return !s.classList.contains('jsec--hero'); })
      .map(function (s) { return $('.jsec__title', s); }).filter(Boolean);
    function splitNode(node) {
      var frag = doc.createDocumentFragment();
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          c.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(' ')); return; }
            var w = doc.createElement('span'), wi = doc.createElement('span');
            w.className = 'w'; wi.className = 'wi'; wi.textContent = part; w.appendChild(wi); frag.appendChild(w);
          });
        } else if (c.nodeType === 1) { splitNode(c); frag.appendChild(c); }
      });
      node.textContent = ''; node.appendChild(frag);
    }
    function splitTitles() {
      titles.forEach(function (t) { if (!t.querySelector('.wi')) splitNode(t); });
    }
    function lineIndex() {
      titles.forEach(function (t) {
        var ws = $$('.w', t), lines = [], i, y, k;
        var tops = ws.map(function (w) { return w.offsetTop; });
        for (i = 0; i < ws.length; i++) {
          y = tops[i]; k = lines.indexOf(y); if (k < 0) { lines.push(y); k = lines.length - 1; }
          ws[i].firstChild.style.setProperty('--ln', k);
        }
      });
    }

    var stack = !reduce;
    var dims = [], last = [], covered = [], scl = [], oys = [], vh = window.innerHeight;
    var stuckRO = null, refreshQ = false;
    if (stack) {
      root.classList.add('stack');
      secs.forEach(function (s, i) {
        var d = doc.createElement('span'); d.className = 'jsec__dim'; d.setAttribute('aria-hidden', 'true');
        s.appendChild(d); dims[i] = d; last[i] = -1; covered[i] = false;
      });
    }
    function refresh() {
      refreshQ = false;
      vh = window.innerHeight;
      splitTitles();
      var hs = secs.map(function (s) { return s.offsetHeight; });
      lineIndex();
      if (stack) secs.forEach(function (s, i) {
        var top = Math.min(0, vh - hs[i]);
        s.style.top = top + 'px';
        oys[i] = Math.round(vh / 2 - top); s.style.transformOrigin = '50% ' + oys[i] + 'px';
      });
      frame(true);
    }
    function queueRefresh() { if (!refreshQ) { refreshQ = true; requestAnimationFrame(refresh); } }

    function frame(force) {
      var n = secs.length, tops = [], i;
      for (i = 0; i < n; i++) tops[i] = secs[i].getBoundingClientRect().top - (scl[i] ? (oys[i] || 0) * (1 - scl[i]) : 0);   // olceklenmemis konum
      // scrollspy: ekran ortasini gecen son bolum
      var act = 0;
      for (i = 0; i < n; i++) if (tops[i] <= vh * 0.5) act = i;
      setActive(secs[act].id);
      if (!stack) return;
      for (i = 0; i < n - 1; i++) {
        var p = Math.min(1, Math.max(0, 1 - tops[i + 1] / vh));
        var cov = tops[i + 1] <= 0;
        if (!force && p === last[i] && cov === covered[i]) continue;
        last[i] = p; covered[i] = cov;
        var s = secs[i];
        if (p > 0 && p < 1) s.classList.add('is-under'); else s.classList.remove('is-under');
        s.classList.toggle('is-covered', cov);
        scl[i] = p > 0 ? 1 - 0.06 * p : 0;
        s.style.transform = p > 0 ? 'scale(' + scl[i].toFixed(4) + ')' : '';
        dims[i].style.opacity = (0.55 * p).toFixed(3);
      }
    }
    scrollSubs.push(function () { frame(false); });

    if (!('IntersectionObserver' in window)) {
      secs.forEach(function (s) { s.classList.add('is-in'); });
    } else {
      // giris efekti: bolumun ustu goruntuye girince
      var inIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); inIO.unobserve(en.target); } });
      }, { threshold: 0, rootMargin: '0px 0px -20% 0px' });
      secs.forEach(function (s) { inIO.observe(s); });
    }

    window.addEventListener('resize', queueRefresh);
    window.addEventListener('load', queueRefresh);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(queueRefresh);
    doc.addEventListener('i18nchange', function () { requestAnimationFrame(function () { splitTitles(); queueRefresh(); }); });
    if ('ResizeObserver' in window) {
      stuckRO = new ResizeObserver(queueRefresh);
      secs.forEach(function (s) { stuckRO.observe(s); });
    }
    refresh();
  }

  /* ---------- Yukari cik ---------- */
  var top = $('#to-top');
  if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Yil ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Sayfa gecisi (fade-out) ---------- */
  if (!reduce) {
    doc.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.hasAttribute('data-lightbox')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^(mailto:|tel:|https?:|javascript:)/i.test(href)) return;
      e.preventDefault();
      doc.body.classList.add('is-leaving');
      setTimeout(function () { window.location.href = a.href; }, 260);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) doc.body.classList.remove('is-leaving'); });
  }
})();
