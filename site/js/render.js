/* render.js - data/content.js (window.SITE_CONTENT) verisini sayfalara cizer.
   Kancalar: data-c="yol" (metin), data-c-attr="attr=yol;attr2=onek|yol" (oznitelik),
   data-render="isim" (bolge), data-optional (bos ise bolum gizlenir), data-if="yol" (bos ise gizle).
   Guvenlik: kullanici metni YALNIZCA textContent / createElement / setAttribute ile yazilir; innerHTML kullanilmaz.
   Dil: i18n.js 'langchange' olayini yayinlar; burada tum bolgeler yeniden cizilir. */
(function () {
  'use strict';
  var doc = document;
  var C = window.SITE_CONTENT || {};
  var S = C.settings || {};
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var booted = false;
  var activeTag = '';              // projeler etiket filtresi (dil degisiminde korunur)

  /* ---------- yardimcilar ---------- */
  function lang() { return (window.i18n && window.i18n.lang) || 'tr'; }
  function t(k, v) { return window.i18n ? window.i18n.t(k, v) : k; }
  /* Iki dilli deger: {tr,en} -> aktif dil, bos ise tr; duz string/sayi oldugu gibi */
  function L(v) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') {
      var s = v[lang()];
      if (s === undefined || s === null || s === '') s = v.tr;
      return s === undefined || s === null ? '' : String(s);
    }
    return '';
  }
  function get(path) {
    var o = C, p = String(path).split('.');
    for (var i = 0; i < p.length; i++) { if (o === null || o === undefined) return undefined; o = o[p[i]]; }
    return o;
  }
  function isEmpty(v) {
    if (v === null || v === undefined) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return L(v) === '' && !v.blocks;
    return String(v).trim() === '';
  }
  /* Beyaz liste: yalnizca goreli yollar + http(s)/mailto/tel. Tarayici sema icindeki tab/satir sonunu
     yok saydigi icin once tum bosluk ve kontrol karakterleri silinir. imgOnly: yalnizca http(s)/goreli. */
  function safeUrl(u, imgOnly) {
    u = String(u === null || u === undefined ? '' : u).replace(/[\s\x00-\x1F\x7F-\x9F]/g, '');
    if (!u) return '';
    var m = /^([^\/?#]*?):/.exec(u);      /* ilk '/', '?' veya '#' oncesinde ':' varsa sema vardir */
    if (!m) return u;                       /* goreli yol */
    var ok = imgOnly ? /^https?$/i : /^(https?|mailto|tel)$/i;
    return ok.test(m[1]) ? u : '';
  }
  function safeImg(u) { return safeUrl(u, true); }
  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function svgEl(tag, attrs) {
    var e = doc.createElementNS(SVG_NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function list(name) {
    var a = C[name];
    if (!Array.isArray(a)) return [];
    return a.map(function (x, i) { return { x: x, i: i }; })
      .filter(function (p) { return p.x && typeof p.x === 'object' && p.x.visible !== false; })
      .sort(function (a, b) {
        var oa = typeof a.x.order === 'number' ? a.x.order : 1e9, ob = typeof b.x.order === 'number' ? b.x.order : 1e9;
        return oa - ob || a.i - b.i;
      }).map(function (p) { return p.x; });
  }
  function plain(name) { return Array.isArray(C[name]) ? C[name].filter(function (x) { return x && typeof x === 'object'; }) : []; }
  function limitOf(host) { var n = parseInt(host.getAttribute('data-limit'), 10); return n > 0 ? n : Infinity; }
  function clear(host) { while (host.firstChild) host.removeChild(host.firstChild); }
  function slugOf(o) { return String(o.slug || o.id || ''); }
  function tagKey(tag) { return typeof tag === 'string' ? tag : (tag && (tag.tr || tag.en)) || ''; }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return String(iso || '');
    try {
      return new Intl.DateTimeFormat(lang() === 'en' ? 'en-US' : 'tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
        .format(new Date(+m[1], +m[2] - 1, +m[3]));
    } catch (e) { return String(iso); }
  }
  function img(src, alt, w, h, lazy) {
    var i = doc.createElement('img');
    i.setAttribute('src', safeImg(src));
    i.setAttribute('alt', alt || '');
    if (w) i.setAttribute('width', w);
    if (h) i.setAttribute('height', h);
    if (lazy !== false) i.setAttribute('loading', 'lazy');
    i.setAttribute('decoding', 'async');
    return i;
  }
  function name() { return L(get('site.name')) || 'Site'; }

  /* Bos durum: data-optional atasi varsa gizle; yoksa kibar mesaj goster */
  function finishList(host, count, emptyKey) {
    var sec = host.closest('[data-optional]');
    if (count === 0) {
      if (sec) { sec.hidden = true; return; }
      host.appendChild(el('p', 'empty-state', t(host.getAttribute('data-empty') || emptyKey || 'empty.generic')));
    } else if (sec) { sec.hidden = false; }
    afterRender(host);
  }
  function afterRender(host) {
    if (booted && window.SiteUI && window.SiteUI.scan) window.SiteUI.scan(host, true);
  }

  /* ---------- ikonlar (sosyal) ---------- */
  var ICONS = {
    github: 'M12 .5a11.500 11.500 0 0 0-3.640 22.410c.580.110.790-.250.790-.560v-2c-3.200.700-3.870-1.540-3.870-1.540-.520-1.330-1.280-1.690-1.280-1.690-1.040-.710.080-.700.080-.700 1.150.080 1.760 1.180 1.760 1.180 1.030 1.760 2.700 1.250 3.360.960.100-.750.400-1.250.730-1.540-2.560-.290-5.250-1.280-5.250-5.700 0-1.260.450-2.290 1.180-3.100-.120-.290-.510-1.470.110-3.060 0 0 .970-.310 3.170 1.180a11 11 0 0 1 5.780 0c2.200-1.490 3.170-1.180 3.170-1.180.630 1.590.230 2.770.110 3.060.740.810 1.180 1.840 1.180 3.100 0 4.430-2.700 5.410-5.270 5.690.410.360.780 1.060.780 2.140v3.170c0 .310.210.670.800.560A11.500 11.500 0 0 0 12 .5z',
    linkedin: 'M4.980 3.500a2.500 2.500 0 1 1 0 5 2.500 2.500 0 0 1 0-5zM3 9.750h4v11H3zm6.500 0h3.800v1.500h.100c.500-1 1.800-1.800 3.700-1.800 4 0 4.700 2.600 4.700 6v5.300h-4v-4.700c0-1.200 0-2.700-1.700-2.700s-2 1.300-2 2.600v4.800h-4z',
    mail: 'M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.500 2v.500l7.500 5 7.500-5V7zM4 9.900V17h16V9.900l-8 5.300z',
    x: 'M18.200 2.500h3.100l-6.800 7.700 8 10.600h-6.300l-4.900-6.400-5.600 6.400H2.600l7.300-8.300L2.200 2.500h6.400l4.400 5.900zM17.100 19h1.700L7.100 4.200H5.300z',
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.500a4.500 4.500 0 1 1 0 9 4.500 4.500 0 0 1 0-9zm0 2a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5zm5.500-3.700a1.200 1.200 0 1 1 0 2.400 1.200 1.200 0 0 1 0-2.400z',
    youtube: 'M21.600 7.200a2.500 2.500 0 0 0-1.800-1.800C18.200 5 12 5 12 5s-6.200 0-7.800.4A2.500 2.500 0 0 0 2.400 7.200C2 8.800 2 12 2 12s0 3.200.4 4.800a2.500 2.500 0 0 0 1.800 1.800C5.800 19 12 19 12 19s6.200 0 7.800-.4a2.500 2.500 0 0 0 1.800-1.800C22 15.200 22 12 22 12s0-3.200-.4-4.800zM10 15V9l5.200 3z',
    link: 'M10.600 13.400a1 1 0 0 1 0-1.400l3-3a3 3 0 1 1 4.200 4.200l-1.500 1.500-1.400-1.400 1.500-1.500a1 1 0 0 0-1.400-1.400l-3 3a1 1 0 0 1-1.400 0zm2.800-2.800a1 1 0 0 1 0 1.400l-3 3a3 3 0 1 1-4.200-4.200l1.500-1.500 1.400 1.400-1.500 1.500a1 1 0 0 0 1.400 1.400l3-3a1 1 0 0 1 1.400 0z'
  };
  function icon(id) {
    var s = svgEl('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' });
    s.appendChild(svgEl('path', { d: ICONS[String(id).toLowerCase()] || ICONS.link }));
    return s;
  }

  /* ---------- blog / icerik bloklari (HTML degil, yapilandirilmis veri) ---------- */
  function renderBlocks(blocks, frag) {
    (Array.isArray(blocks) ? blocks : []).forEach(function (b) {
      if (!b || typeof b !== 'object') return;
      var n;
      switch (b.type) {
        case 'heading':
          n = el(b.level === 3 ? 'h3' : 'h2', '', L(b.text)); break;
        case 'paragraph':
          n = el('p', b.lead ? 'lead' : '', L(b.text)); break;
        case 'image':
          n = el('figure');
          n.appendChild(img(b.src, L(b.alt), b.width || 1200, b.height || 675));
          if (L(b.caption)) n.appendChild(el('figcaption', '', L(b.caption)));
          break;
        case 'code':
          n = el('pre'); var c = el('code', b.language ? 'language-' + String(b.language).replace(/[^a-z0-9_-]/gi, '') : '', String(b.code == null ? '' : b.code));
          n.appendChild(c); break;
        case 'quote':
          n = el('blockquote'); n.appendChild(el('p', '', L(b.text)));
          if (L(b.cite)) { var f = el('footer'); f.appendChild(doc.createTextNode('— ')); f.appendChild(el('cite', '', L(b.cite))); n.appendChild(f); }
          break;
        case 'list':
          n = el(b.ordered ? 'ol' : 'ul');
          (Array.isArray(b.items) ? b.items : []).forEach(function (it) { n.appendChild(el('li', '', L(it))); });
          break;
        default: return;
      }
      frag.appendChild(n);
    });
  }

  /* ---------- bolge cizicileri ---------- */
  var R = {};

  R['hero-title'] = function (host) {
    clear(host);
    host.appendChild(doc.createTextNode(t('home.hi') + ' '));
    host.appendChild(el('em', '', name()));
    host.appendChild(doc.createTextNode('.'));
  };

  R.eyebrow = function (host) {
    var parts = [L(get('site.role')), L(get('site.university'))].filter(Boolean);
    host.textContent = parts.join(' · ');
    host.parentNode.hidden = parts.length === 0;
  };

  R.bio = function (host) {
    clear(host);
    var a = (Array.isArray(C.bio) ? C.bio : []).slice(0, limitOf(host)), frag = doc.createDocumentFragment();
    a.forEach(function (p) { if (L(p)) frag.appendChild(el('p', '', L(p))); });
    host.appendChild(frag);
    finishList(host, frag.childNodes.length === 0 && !a.length ? 0 : a.length);
  };

  R.facts = function (host) {
    clear(host);
    var rows = [];
    if (host.hasAttribute('data-name')) rows.push(['fact.name', L(get('site.name'))]);
    rows.push(['fact.dept', L(get('site.department'))], ['fact.year', L(get('site.year'))], ['fact.city', L(get('site.city'))]);
    var frag = doc.createDocumentFragment(), n = 0;
    rows.forEach(function (r) { if (!r[1]) return; frag.appendChild(el('dt', '', t(r[0]))); frag.appendChild(el('dd', '', r[1])); n++; });
    host.appendChild(frag);
    host.hidden = n === 0;
  };

  function projectCard(p, page) {
    var card = el('article', 'card reveal');
    var slug = slugOf(p);
    if (page && slug) card.id = slug;
    var fig = el('figure', 'card__media reveal--clip');
    fig.appendChild(img(p.image, L(p.imageAlt) || L(p.title), 800, 600));
    card.appendChild(fig);
    var body = el('div', 'card__body');
    if (page && p.status) {
      var br = el('p', 'badge-row');
      br.appendChild(el('span', 'badge badge--' + String(p.status).replace(/[^a-z]/g, ''), t('status.' + p.status)));
      body.appendChild(br);
    }
    var h = el('h3');
    if (page) h.textContent = L(p.title);
    else { var a = el('a', 'stretched', L(p.title)); a.setAttribute('href', 'projeler.html' + (slug ? '#' + encodeURIComponent(slug) : '')); h.appendChild(a); }
    body.appendChild(h);
    body.appendChild(el('p', '', L(p.summary)));
    if (page) {
      var links = p.links || {}, lk = el('p', 'card__links'), nl = 0;
      [['github', 'proj.github'], ['demo', 'proj.demo']].forEach(function (k) {
        var u = safeUrl(links[k[0]]); if (!u) return;
        var an = el('a', '', t(k[1])); an.setAttribute('href', u); an.setAttribute('target', '_blank'); an.setAttribute('rel', 'noopener noreferrer');
        lk.appendChild(an); nl++;
      });
      if (nl) body.appendChild(lk);
    }
    var meta = L(p.meta) || (Array.isArray(p.tags) ? p.tags.map(function (g) { return L(g); }).filter(Boolean).join(' · ') : '');
    if (meta) body.appendChild(el('p', 'card__meta', meta));
    card.appendChild(body);
    return card;
  }

  R.projects = function (host) {
    clear(host);
    var page = host.getAttribute('data-variant') === 'page';
    var all = list('projects');
    if (host.hasAttribute('data-featured')) {
      var f = all.filter(function (p) { return p.featured; });
      all = f.length ? f : all;      // hic "featured" yoksa ilk projeler gosterilir
    }
    var shown = all;
    if (page && activeTag) shown = all.filter(function (p) { return (p.tags || []).some(function (g) { return tagKey(g) === activeTag; }); });
    shown = shown.slice(0, limitOf(host));
    var frag = doc.createDocumentFragment();
    shown.forEach(function (p) { frag.appendChild(projectCard(p, page)); });
    host.appendChild(frag);
    finishList(host, shown.length, all.length && page ? 'empty.filter' : 'empty.projects');
  };

  R['project-filter'] = function (host) {
    clear(host);
    var seen = {}, tags = [];
    list('projects').forEach(function (p) {
      (Array.isArray(p.tags) ? p.tags : []).forEach(function (g) { var k = tagKey(g); if (k && !seen[k]) { seen[k] = 1; tags.push(g); } });
    });
    host.setAttribute('aria-label', t('filter.label'));
    if (!tags.some(function (g) { return tagKey(g) === activeTag; })) activeTag = '';
    var frag = doc.createDocumentFragment();
    [''].concat(tags).forEach(function (g) {
      var key = g === '' ? '' : tagKey(g);
      var li = el('li'), b = el('button', 'chip chip--btn', g === '' ? t('filter.all') : L(g));
      b.type = 'button';
      b.setAttribute('aria-pressed', key === activeTag ? 'true' : 'false');
      b.addEventListener('click', function () {
        activeTag = key;
        Array.prototype.forEach.call(host.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        Array.prototype.forEach.call(doc.querySelectorAll('[data-render="projects"]'), R.projects);
      });
      li.appendChild(b); frag.appendChild(li);
    });
    host.appendChild(frag);
    finishList(host, tags.length ? 1 : 0);
    if (!tags.length) host.hidden = true; else host.hidden = false;
  };

  function sortedPosts() {
    return list('posts').sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
  }
  function readMinutes(p) {
    if (typeof p.readMinutes === 'number' && p.readMinutes > 0) return Math.round(p.readMinutes);
    var words = 0;
    (p.blocks || []).forEach(function (b) { if (b && (b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote')) words += L(b.text).split(/\s+/).filter(Boolean).length; });
    return Math.max(1, Math.round(words / 200));
  }
  function postHref(p) { return 'post.html?slug=' + encodeURIComponent(slugOf(p)); }

  R.posts = function (host) {
    clear(host);
    var posts = sortedPosts().slice(0, limitOf(host)), frag = doc.createDocumentFragment();
    posts.forEach(function (p) {
      var card = el('article', 'card blogcard reveal');
      var fig = el('figure', 'card__media');
      fig.appendChild(img(p.cover, L(p.coverAlt) || L(p.title), 1200, 675));
      card.appendChild(fig);
      var body = el('div', 'card__body');
      var when = el('p', 'when'), tm = el('time', '', fmtDate(p.date));
      if (p.date) tm.setAttribute('datetime', p.date);
      when.appendChild(tm); when.appendChild(doc.createTextNode(' · ')); when.appendChild(el('span', '', t('post.readMin', { n: readMinutes(p) })));
      body.appendChild(when);
      var h = el('h3'), a = el('a', 'stretched', L(p.title)); a.setAttribute('href', postHref(p)); h.appendChild(a); body.appendChild(h);
      body.appendChild(el('p', '', L(p.excerpt)));
      var meta = el('p', 'card__meta'); meta.appendChild(el('span', '', t('blog.read'))); meta.appendChild(doc.createTextNode(' ')); meta.appendChild(el('span', '', '→')).setAttribute('aria-hidden', 'true');
      body.appendChild(meta);
      card.appendChild(body); frag.appendChild(card);
    });
    host.appendChild(frag);
    finishList(host, posts.length, 'empty.posts');
  };

  R.topics = function (host) {
    clear(host);
    var seen = {}, frag = doc.createDocumentFragment(), n = 0;
    sortedPosts().forEach(function (p) {
      (Array.isArray(p.tags) ? p.tags : []).forEach(function (g) {
        var k = tagKey(g); if (!k || seen[k]) return; seen[k] = 1;
        var li = el('li'); li.appendChild(el('span', 'chip', L(g))); frag.appendChild(li); n++;
      });
    });
    host.appendChild(frag); finishList(host, n);
  };

  function shot(g) {
    var f = el('figure', 'shot reveal');
    var a = el('a'); a.setAttribute('href', safeImg(g.image)); a.setAttribute('data-lightbox', '');
    a.appendChild(img(g.image, L(g.alt) || L(g.title) || L(g.caption), 800, 600));
    f.appendChild(a);
    var cap = L(g.caption) || L(g.title);
    if (cap) f.appendChild(el('figcaption', '', cap));
    return f;
  }
  R.gallery = function (host) {
    clear(host);
    var items = list('gallery').slice(0, limitOf(host)), frag = doc.createDocumentFragment();
    items.forEach(function (g) { frag.appendChild(shot(g)); });
    host.appendChild(frag); finishList(host, items.length, 'empty.gallery');
  };
  R['gallery-groups'] = function (host) {
    clear(host);
    var items = list('gallery'), groups = [], idx = {};
    items.forEach(function (g) {
      var k = L(g.group); if (!(k in idx)) { idx[k] = groups.length; groups.push({ name: k, items: [] }); }
      groups[idx[k]].items.push(g);
    });
    var frag = doc.createDocumentFragment();
    groups.forEach(function (gr) {
      var wrap = el('div', 'gallery-group');
      if (gr.name) { var hd = el('div', 'section__head reveal'); hd.appendChild(el('h2', '', gr.name)); wrap.appendChild(hd); }
      var grid = el('div', 'gallery'); grid.setAttribute('data-stagger', '');
      gr.items.forEach(function (g) { grid.appendChild(shot(g)); });
      wrap.appendChild(grid); frag.appendChild(wrap);
    });
    host.appendChild(frag); finishList(host, items.length, 'empty.gallery');
  };

  R.timeline = function (host) {
    clear(host);
    var a = plain('timeline'), frag = doc.createDocumentFragment();
    a.forEach(function (it) {
      var li = el('li', 'reveal'), tm = el('time', '', L(it.period));
      li.appendChild(tm); li.appendChild(el('h3', '', L(it.title)));
      var p = [L(it.place), L(it.text)].filter(Boolean).join(' · ');
      if (p) li.appendChild(el('p', '', p));
      frag.appendChild(li);
    });
    host.appendChild(frag); finishList(host, a.length);
  };

  R.schedule = function (host) {
    clear(host);
    var a = plain('schedule'), frag = doc.createDocumentFragment();
    a.forEach(function (r) {
      var tr = el('tr'), th = el('th', '', L(r.day)); th.setAttribute('scope', 'row');
      tr.appendChild(th); tr.appendChild(el('td', '', L(r.time))); tr.appendChild(el('td', '', L(r.course))); tr.appendChild(el('td', '', L(r.room)));
      frag.appendChild(tr);
    });
    host.appendChild(frag); finishList(host, a.length);
  };

  function textList(name) {
    return function (host) {
      clear(host);
      var a = plain(name).slice(0, limitOf(host)), frag = doc.createDocumentFragment();
      a.forEach(function (it) { frag.appendChild(el('li', '', L(it.text))); });
      host.appendChild(frag); finishList(host, a.length);
    };
  }
  R.interests = textList('interests');
  R.priorities = textList('priorities');

  function skillsOf(kind) {
    return plain('skills').filter(function (s) { return (s.type === 'ring' ? 'ring' : 'bar') === kind; });
  }
  function pct(s) { var n = Math.round(Number(s.percent)); return isNaN(n) ? 0 : Math.max(0, Math.min(100, n)); }
  R['skills-bars'] = function (host) {
    clear(host);
    var a = skillsOf('bar').slice(0, limitOf(host)), frag = doc.createDocumentFragment();
    a.forEach(function (s, i) {
      var id = 'sk-' + String(s.id || i).replace(/[^a-z0-9_-]/gi, ''), v = pct(s);
      var li = el('li'), head = el('div', 'skill__head');
      var nm = el('span', 'name', L(s.label)); nm.id = id;
      head.appendChild(nm); head.appendChild(el('span', 'skill__pct', v + '%'));
      var bar = el('div', 'bar');
      bar.setAttribute('role', 'progressbar'); bar.setAttribute('aria-labelledby', id);
      bar.setAttribute('aria-valuemin', '0'); bar.setAttribute('aria-valuemax', '100'); bar.setAttribute('aria-valuenow', v); bar.setAttribute('aria-valuetext', v + '%');
      bar.style.setProperty('--v', v);
      bar.appendChild(el('span', 'bar__fill'));
      li.appendChild(head); li.appendChild(bar); frag.appendChild(li);
    });
    host.appendChild(frag); finishList(host, a.length);
  };
  R['skills-rings'] = function (host) {
    clear(host);
    var a = skillsOf('ring').slice(0, limitOf(host)), frag = doc.createDocumentFragment();
    a.forEach(function (s, i) {
      var id = 'soft-' + String(s.id || i).replace(/[^a-z0-9_-]/gi, ''), v = pct(s);
      var li = el('li'), ring = el('div', 'ring');
      ring.setAttribute('role', 'progressbar'); ring.setAttribute('aria-labelledby', id);
      ring.setAttribute('aria-valuemin', '0'); ring.setAttribute('aria-valuemax', '100'); ring.setAttribute('aria-valuenow', v); ring.setAttribute('aria-valuetext', v + '%');
      ring.style.setProperty('--v', v);
      var box = el('div', 'ring__svg'), svg = svgEl('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' });
      svg.appendChild(svgEl('circle', { 'class': 'ring__bg', cx: 60, cy: 60, r: 52 }));
      svg.appendChild(svgEl('circle', { 'class': 'ring__val', cx: 60, cy: 60, r: 52 }));
      box.appendChild(svg);
      var num = el('span', 'ring__num', v + '%'); num.setAttribute('aria-hidden', 'true'); box.appendChild(num);
      ring.appendChild(box);
      var lb = el('p', 'ring__label', L(s.label)); lb.id = id; ring.appendChild(lb);
      li.appendChild(ring); frag.appendChild(li);
    });
    host.appendChild(frag); finishList(host, a.length);
  };

  R.socials = function (host) {
    clear(host);
    var a = plain('socials').filter(function (s) { return safeUrl(s.url); }), frag = doc.createDocumentFragment();
    a.forEach(function (s) {
      var li = el('li'), an = el('a');
      var u = safeUrl(s.url); an.setAttribute('href', u);
      if (/^https?:/i.test(u)) { an.setAttribute('target', '_blank'); an.setAttribute('rel', 'noopener noreferrer'); }
      an.appendChild(icon(s.icon || s.id));
      an.appendChild(el('span', '', L(s.label) || s.id));
      li.appendChild(an); frag.appendChild(li);
    });
    host.appendChild(frag); finishList(host, a.length);
  };

  R.process = function (host) {
    clear(host);
    var a = plain('process'), frag = doc.createDocumentFragment();
    a.forEach(function (s) { var li = el('li', 'reveal'); li.appendChild(el('h3', '', L(s.title))); li.appendChild(el('p', '', L(s.text))); frag.appendChild(li); });
    host.appendChild(frag); finishList(host, a.length);
  };
  R.tools = function (host) {
    clear(host);
    var a = plain('tools'), frag = doc.createDocumentFragment();
    a.forEach(function (s) { var li = el('li'); li.appendChild(el('span', 'chip', L(s.label || s.text))); frag.appendChild(li); });
    host.appendChild(frag); finishList(host, a.length);
  };
  R.faq = function (host) {
    clear(host);
    var a = plain('faq'), frag = doc.createDocumentFragment();
    a.forEach(function (q) { var d = el('details', 'reveal'); d.appendChild(el('summary', '', L(q.q))); d.appendChild(el('p', '', L(q.a))); frag.appendChild(d); });
    host.appendChild(frag); finishList(host, a.length);
  };
  R.principles = function (host) {
    clear(host);
    var frag = doc.createDocumentFragment(), p = C.principles || {};
    renderBlocks(p.blocks, frag);
    var n = frag.childNodes.length;
    host.appendChild(frag); finishList(host, n);
  };

  function infoRow(label, valueNode) {
    var li = el('li'); li.appendChild(el('span', 'label', label)); li.appendChild(valueNode); return li;
  }
  R['contact-info'] = function (host) {
    clear(host);
    var home = host.getAttribute('data-variant') === 'home', ct = C.contact || {}, frag = doc.createDocumentFragment();
    var addr = L(ct.address), phone = L(ct.phone), mail = L(ct.email), hours = L(ct.responseTime), map = safeUrl(ct.mapUrl);
    if (addr) frag.appendChild(infoRow(t('contact.addr'), doc.createTextNode(addr)));
    if (phone) {
      var ph = el('a', '', phone); ph.setAttribute('href', 'tel:' + phone.replace(/[^\d+]/g, ''));
      frag.appendChild(infoRow(t('contact.phone'), ph));
    }
    if (mail) {
      var li = el('li'); li.appendChild(el('span', 'label', t('contact.mail')));
      var ma = el('a', '', mail); ma.setAttribute('href', 'mailto:' + mail); li.appendChild(ma);
      var cb = el('button', 'copy-btn', t('copy.btn')); cb.type = 'button'; cb.setAttribute('data-copy', mail); li.appendChild(cb);
      frag.appendChild(li);
    }
    if (!home && hours) frag.appendChild(infoRow(t('contact.hours'), doc.createTextNode(hours)));
    if (!home && map) {
      var ml = el('a', '', t('contact.mapLink')); ml.setAttribute('href', map); ml.setAttribute('target', '_blank'); ml.setAttribute('rel', 'noopener noreferrer');
      frag.appendChild(infoRow(t('contact.map'), ml));
    }
    var n = frag.childNodes.length;
    host.appendChild(frag); finishList(host, n);
  };

  R['footer-contact'] = function (host) {
    clear(host);
    var ct = C.contact || {}, frag = doc.createDocumentFragment(), mail = L(ct.email), phone = L(ct.phone), city = L(get('site.city'));
    if (mail) { var li = el('li'), a = el('a', '', mail); a.setAttribute('href', 'mailto:' + mail); li.appendChild(a); frag.appendChild(li); }
    if (phone) { var l2 = el('li'), a2 = el('a', '', phone); a2.setAttribute('href', 'tel:' + phone.replace(/[^\d+]/g, '')); l2.appendChild(a2); frag.appendChild(l2); }
    if (city) frag.appendChild(el('li', '', city));
    host.appendChild(frag);
  };

  /* ---------- tek yazi sayfasi (post.html?slug=...) ---------- */
  R.post = function (host) {
    clear(host);
    var slug = '';
    try { slug = new URLSearchParams(location.search).get('slug') || ''; } catch (e) {}
    var posts = sortedPosts(), idx = -1;
    posts.forEach(function (p, i) { if (slugOf(p) === slug && slug) idx = i; });
    var frag = doc.createDocumentFragment();
    var back = el('p', 'eyebrow'), ba = el('a', '', t('post.back')); ba.setAttribute('href', 'blog.html'); back.appendChild(ba);
    frag.appendChild(back);

    if (idx < 0) {                                   // 404 gorunumu
      var h = el('h1', '', t('post.notFoundH')); h.id = 'h1'; h.style.fontSize = 'clamp(2.2rem,4.5vw+0.5rem,4rem)';
      frag.appendChild(h);
      frag.appendChild(el('p', 'lead', t('post.notFoundP')));
      var nav404 = el('nav', 'post-nav'); nav404.setAttribute('aria-label', t('post.navAria'));
      var b404 = el('a', 'btn'); b404.setAttribute('href', 'blog.html'); b404.appendChild(el('span', '', t('post.toBlog')));
      nav404.appendChild(b404); frag.appendChild(nav404);
      host.appendChild(frag);
      setMeta(t('post.notFoundH') + ' | ' + name(), '');
      return;
    }
    var p = posts[idx];
    var h1 = el('h1', '', L(p.title)); h1.id = 'h1'; h1.style.fontSize = 'clamp(2.2rem,4.5vw+0.5rem,4rem)';
    frag.appendChild(h1);
    var meta = el('div', 'post-meta'), tm = el('time', '', fmtDate(p.date));
    if (p.date) tm.setAttribute('datetime', p.date);
    meta.appendChild(tm); meta.appendChild(el('span', '', t('post.readMin', { n: readMinutes(p) })));
    (Array.isArray(p.tags) ? p.tags : []).forEach(function (g) { if (L(g)) meta.appendChild(el('span', 'tag', L(g))); });
    frag.appendChild(meta);
    if (safeImg(p.cover)) {
      var fig = el('figure'); fig.appendChild(img(p.cover, L(p.coverAlt) || L(p.title), 1200, 675, false));
      if (L(p.coverCaption)) fig.appendChild(el('figcaption', '', L(p.coverCaption)));
      frag.appendChild(fig);
    }
    renderBlocks(p.blocks, frag);

    var nav = el('nav', 'post-nav'); nav.setAttribute('aria-label', t('post.navAria'));
    function btn(href, ghost, labelKey, left) {
      var a = el('a', ghost ? 'btn btn--ghost' : 'btn'); a.setAttribute('href', href);
      if (left) { var ar = el('span', '', '←'); ar.setAttribute('aria-hidden', 'true'); a.appendChild(ar); a.appendChild(doc.createTextNode(' ')); a.appendChild(el('span', '', t(labelKey))); }
      else { a.appendChild(el('span', '', t(labelKey))); a.appendChild(doc.createTextNode(' ')); var ar2 = el('span', 'arrow', '→'); ar2.setAttribute('aria-hidden', 'true'); a.appendChild(ar2); }
      return a;
    }
    var prev = posts[idx - 1], next = posts[idx + 1];
    nav.appendChild(prev ? btn(postHref(prev), true, 'post.prevPost', true) : btn('blog.html', true, 'post.toBlog', true));
    if (next) nav.appendChild(btn(postHref(next), false, 'post.nextPost', false));
    else if (prev) nav.appendChild(btn('blog.html', false, 'post.toBlog', false));
    frag.appendChild(nav);
    host.appendChild(frag);
    setMeta(L(p.title) + ' | ' + name(), L(p.excerpt));
  };

  /* ---------- metin / oznitelik kancalari ---------- */
  function applyText() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-c]'), function (n) {
      var v = L(get(n.getAttribute('data-c')));
      n.textContent = v;
      if (n.hasAttribute('data-optional')) n.hidden = v === '';
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-c-attr]'), function (n) {
      n.getAttribute('data-c-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf('='); if (i < 1) return;
        var attr = pair.slice(0, i).trim(), rest = pair.slice(i + 1), j = rest.lastIndexOf('|');
        var prefix = j >= 0 ? rest.slice(0, j) : '', path = j >= 0 ? rest.slice(j + 1) : rest;
        var v = L(get(path.trim()));
        if (!v) { if (attr === 'alt') n.setAttribute('alt', ''); else n.removeAttribute(attr); return; }
        if (attr === 'href' || attr === 'src') v = attr === 'src' ? safeImg(prefix + v) : safeUrl(prefix + v);
        else v = prefix + v;
        if (v) n.setAttribute(attr, v);
      });
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-if]'), function (n) {
      var ok = n.getAttribute('data-if').split(',').some(function (p) { return !isEmpty(get(p.trim())); });
      n.hidden = !ok;
    });
  }

  function setMeta(title, desc) {
    if (title) document.title = title;
    var md = doc.querySelector('meta[name="description"]');
    if (md && desc) md.setAttribute('content', desc);
    var ot = doc.querySelector('meta[property="og:title"]');
    if (ot && title) ot.setAttribute('content', title);
    var od = doc.querySelector('meta[property="og:description"]');
    if (od && desc) od.setAttribute('content', desc);
    var au = doc.querySelector('meta[name="author"]');
    if (au) au.setAttribute('content', name());
  }
  function pageMeta() {
    var page = doc.body.getAttribute('data-page');
    if (page === 'post') return;                     // R.post kendi basligini yazar
    if (page === 'home') setMeta(L(S.siteTitle) || name(), L(S.siteDescription));
    else if (page) setMeta(t(page + '.title') + ' | ' + name(), t(page + '.desc'));
  }

  function renderAll() {
    applyText();
    Array.prototype.forEach.call(doc.querySelectorAll('[data-render]'), function (host) {
      var fn = R[host.getAttribute('data-render')];
      if (fn) { try { fn(host); } catch (e) { if (window.console) console.error('render:', host.getAttribute('data-render'), e); } }
    });
    // data-group: icindeki tum data-optional ogeler gizliyse grubun kendisi de gizlenir
    Array.prototype.forEach.call(doc.querySelectorAll('[data-group]'), function (g) {
      var opts = g.querySelectorAll('[data-optional]');
      g.hidden = opts.length > 0 && Array.prototype.every.call(opts, function (o) { return o.hidden; });
    });
    pageMeta();
    if (booted && window.SiteUI && window.SiteUI.scan) window.SiteUI.scan(doc.body, true);
  }

  function boot() {
    renderAll();
    booted = true;
    window.addEventListener('langchange', renderAll);
  }
  window.SiteRender = { render: renderAll };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
})();
