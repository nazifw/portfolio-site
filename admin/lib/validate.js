'use strict';
/**
 * Content validation: implements docs/04-content-schema.md section 7 literally.
 * validate(content, { siteDir?, skipFileChecks? }) -> [{ path, message }]   (empty array = valid)
 * sanitize(content) -> deep copy with control characters stripped from strings.
 */
const fs = require('fs');
const { safeJoin } = require('./config');

const CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const CTRL_RE_G = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;
const ID_RE = /^[a-z0-9][a-z0-9_-]*$/;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_ANY_RE = /^(https?:\/\/|mailto:|tel:)/i;
const URL_HTTP_RE = /^https?:\/\//i;
const IMG_RE = /^img\/[A-Za-z0-9._\/-]+\.(svg|png|jpe?g|webp|avif|gif)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ACCENT_RE = /^(#[0-9a-fA-F]{3,8}|(rgb|hsl)a?\([0-9 ,.%\/]+\))$/;
const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
const BLOCK_TYPES = ['heading', 'paragraph', 'image', 'code', 'quote', 'list'];
const MAX_TEXT = 20000;
const MAX_CODE = 50000;

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isEmpty = (v) => v === undefined || v === null || v === '';

function sanitize(value) {
  if (typeof value === 'string') return value.replace(CTRL_RE_G, '');
  if (Array.isArray(value)) return value.map(sanitize);
  if (isObj(value)) {
    const out = {};
    for (const k of Object.keys(value)) {
      if (DANGEROUS_KEYS.includes(k)) continue;
      out[k.replace(CTRL_RE_G, '')] = sanitize(value[k]);
    }
    return out;
  }
  return value;
}

function validate(content, opts = {}) {
  const errors = [];
  const err = (path, message) => errors.push({ path, message });
  const j = (p, k) => (p ? p + '.' + k : String(k));

  // ---- primitives ----
  function str(v, path, { required = false, max = MAX_TEXT, re, reMsg } = {}) {
    if (isEmpty(v)) { if (required) err(path, 'required'); return; }
    if (typeof v !== 'string') return err(path, 'must be a string');
    if (CTRL_RE.test(v)) err(path, 'contains control characters');
    if (v.length > max) err(path, 'too long (max ' + max + ')');
    if (re && !re.test(v)) err(path, reMsg || 'invalid format');
  }
  function loc(v, path, { required = false, max = MAX_TEXT } = {}) {
    if (isEmpty(v)) { if (required) err(j(path, 'tr'), 'required'); return; }
    if (!isObj(v)) return err(path, 'must be an object {tr, en}');
    for (const k of ['tr', 'en']) {
      if (typeof v[k] !== 'string') {
        if (v[k] === undefined && k === 'en' && !required) continue;
        err(j(path, k), v[k] === undefined ? 'required' : 'must be a string');
      } else str(v[k], j(path, k), { max });
    }
    if (required && typeof v.tr === 'string' && v.tr.trim() === '') err(j(path, 'tr'), 'required');
  }
  function bool(v, path, required = false) {
    if (v === undefined) { if (required) err(path, 'required'); return; }
    if (typeof v !== 'boolean') err(path, 'must be true or false');
  }
  function num(v, path, required = false) {
    if (v === undefined || v === null || v === '') { if (required) err(path, 'required'); return; }
    if (typeof v !== 'number' || !Number.isFinite(v)) err(path, 'must be a finite number');
  }
  function url(v, path, httpOnly) {
    if (isEmpty(v)) return;
    str(v, path, { max: 2000 });
    if (typeof v !== 'string') return;
    if (/[\s\u0000-\u001F]/.test(v)) return err(path, 'URL must not contain whitespace');
    if (!(httpOnly ? URL_HTTP_RE : URL_ANY_RE).test(v)) err(path, httpOnly ? 'must start with http:// or https://' : 'must start with http://, https://, mailto: or tel:');
  }
  function img(v, path, required) {
    if (isEmpty(v)) { if (required) err(path, 'required'); return; }
    if (typeof v !== 'string') return err(path, 'must be a string');
    if (!IMG_RE.test(v) || v.includes('..') || v.includes('//')) return err(path, 'must be a relative path under img/ (png, jpg, webp, avif, gif, svg)');
    if (opts.siteDir && !opts.skipFileChecks) {
      const full = safeJoin(opts.siteDir, v);
      if (!full) return err(path, 'path escapes site folder');
      let ok = false;
      try { ok = fs.statSync(full).isFile(); } catch (_) { ok = false; }
      if (!ok) err(path, 'file not found in site folder: ' + v);
    }
  }
  function arr(v, path, required, each) {
    if (v === undefined || v === null) { if (required) err(path, 'required'); return; }
    if (!Array.isArray(v)) return err(path, 'must be an array');
    if (v.length > 2000) return err(path, 'too many items');
    each(v);
  }
  function collection(c, key, required, itemFn, { slug = false } = {}) {
    arr(c[key], key, required, (list) => {
      const ids = new Set(); const slugs = new Set();
      list.forEach((it, i) => {
        const p = key + '[' + i + ']';
        if (!isObj(it)) return err(p, 'must be an object');
        if (isEmpty(it.id)) err(j(p, 'id'), 'required');
        else if (typeof it.id !== 'string' || !ID_RE.test(it.id) || it.id.length > 80) err(j(p, 'id'), 'invalid id (lowercase letters, digits, - and _)');
        else if (ids.has(it.id)) err(j(p, 'id'), 'duplicate id: ' + it.id);
        else ids.add(it.id);
        if (slug) {
          if (isEmpty(it.slug)) err(j(p, 'slug'), 'required');
          else if (typeof it.slug !== 'string' || it.slug.length > 80 || !SLUG_RE.test(it.slug)) err(j(p, 'slug'), 'invalid slug (lowercase letters, digits and single hyphens)');
          else if (slugs.has(it.slug)) err(j(p, 'slug'), 'duplicate slug: ' + it.slug);
          else slugs.add(it.slug);
        }
        itemFn(it, p);
      });
    });
  }
  function tags(v, path) {
    arr(v, path, false, (list) => list.forEach((t, i) => {
      const p = path + '[' + i + ']';
      if (typeof t === 'string') str(t, p, { required: true, max: 60 });
      else loc(t, p, { required: true, max: 60 });
    }));
  }
  function blocks(v, path, required) {
    arr(v, path, required, (list) => list.forEach((b, i) => {
      const p = path + '[' + i + ']';
      if (!isObj(b)) return err(p, 'must be an object');
      if (!BLOCK_TYPES.includes(b.type)) return err(j(p, 'type'), 'must be one of: ' + BLOCK_TYPES.join(', '));
      switch (b.type) {
        case 'heading':
          loc(b.text, j(p, 'text'), { required: true, max: 300 });
          if (b.level !== undefined && b.level !== 2 && b.level !== 3) err(j(p, 'level'), 'must be 2 or 3');
          break;
        case 'paragraph':
          loc(b.text, j(p, 'text'), { required: true }); bool(b.lead, j(p, 'lead')); break;
        case 'image':
          img(b.src, j(p, 'src'), true); loc(b.alt, j(p, 'alt'), { max: 500 }); loc(b.caption, j(p, 'caption'), { max: 500 });
          for (const k of ['width', 'height']) if (b[k] !== undefined && (!Number.isInteger(b[k]) || b[k] < 1 || b[k] > 10000)) err(j(p, k), 'must be an integer 1-10000');
          break;
        case 'code':
          if (typeof b.code !== 'string') err(j(p, 'code'), b.code === undefined ? 'required' : 'must be a string');
          else str(b.code, j(p, 'code'), { max: MAX_CODE });
          str(b.language, j(p, 'language'), { max: 40 });
          break;
        case 'quote':
          loc(b.text, j(p, 'text'), { required: true }); loc(b.cite, j(p, 'cite'), { max: 300 }); break;
        case 'list':
          arr(b.items, j(p, 'items'), true, (items) => items.forEach((it, n) => loc(it, p + '.items[' + n + ']', { required: true, max: 1000 })));
          bool(b.ordered, j(p, 'ordered'));
          break;
      }
    }));
  }

  // ---- root ----
  if (!isObj(content)) return [{ path: '', message: 'root must be an object' }];
  (function scanKeys(v, path, depth) {
    if (depth > 12) return err(path, 'nesting too deep');
    if (Array.isArray(v)) return v.forEach((x, i) => scanKeys(x, path + '[' + i + ']', depth + 1));
    if (!isObj(v)) return;
    for (const k of Object.keys(v)) {
      if (DANGEROUS_KEYS.includes(k)) err(j(path, k), 'forbidden key');
      else scanKeys(v[k], j(path, k), depth + 1);
    }
  })(content, '', 0);
  if (errors.length) return errors;

  for (const k of ['site', 'contact', 'settings']) if (!isObj(content[k])) err(k, 'required object');
  for (const k of ['projects', 'posts', 'gallery']) if (!Array.isArray(content[k])) err(k, 'required array');
  for (const k of ['socials', 'skills', 'interests', 'priorities', 'schedule', 'timeline', 'process', 'tools', 'faq', 'bio']) {
    if (content[k] !== undefined && !Array.isArray(content[k])) err(k, 'must be an array');
  }
  for (const k of ['principles', 'blogNote']) if (content[k] !== undefined && !isObj(content[k])) err(k, 'must be an object');
  if (errors.length) return errors;

  const s = content.site;
  loc(s.name, 'site.name', { required: true, max: 80 });
  if (isObj(s.name) && typeof s.name.tr === 'string' && s.name.tr.length < 1) err('site.name.tr', 'required');
  for (const k of ['role', 'tagline', 'university', 'department', 'year', 'city', 'avatarAlt', 'avatarCaption']) loc(s[k], 'site.' + k);
  img(s.avatar, 'site.avatar', false);

  const c = content.contact;
  str(c.email, 'contact.email', { max: 254, re: EMAIL_RE, reMsg: 'invalid e-mail address' });
  str(c.phone, 'contact.phone', { max: 60 });
  loc(c.address, 'contact.address'); loc(c.responseTime, 'contact.responseTime');
  url(c.mapUrl, 'contact.mapUrl', true);

  arr(content.bio, 'bio', false, (l) => l.forEach((p, i) => loc(p, 'bio[' + i + ']', { required: true })));

  collection(content, 'socials', false, (it, p) => {
    loc(it.label, j(p, 'label'), { required: true, max: 80 });
    if (isEmpty(it.url)) err(j(p, 'url'), 'required'); else url(it.url, j(p, 'url'), false);
    str(it.icon, j(p, 'icon'), { max: 40 });
  });
  collection(content, 'skills', false, (it, p) => {
    loc(it.label, j(p, 'label'), { required: true, max: 80 });
    if (!Number.isInteger(it.percent) || it.percent < 0 || it.percent > 100) err(j(p, 'percent'), 'must be an integer 0-100');
    if (it.type !== undefined && it.type !== 'bar' && it.type !== 'ring') err(j(p, 'type'), 'must be bar or ring');
  });
  for (const k of ['interests', 'priorities']) collection(content, k, false, (it, p) => loc(it.text, j(p, 'text'), { required: true, max: 300 }));
  collection(content, 'schedule', false, (it, p) => {
    loc(it.day, j(p, 'day'), { required: true, max: 60 }); str(it.time, j(p, 'time'), { max: 60 });
    loc(it.course, j(p, 'course'), { required: true, max: 200 }); str(it.room, j(p, 'room'), { max: 60 });
  });
  collection(content, 'timeline', false, (it, p) => {
    loc(it.period, j(p, 'period'), { max: 100 }); loc(it.title, j(p, 'title'), { required: true, max: 200 });
    loc(it.place, j(p, 'place'), { max: 200 });
    loc(it.text, j(p, 'text'));
  });
  collection(content, 'process', false, (it, p) => { loc(it.title, j(p, 'title'), { required: true, max: 200 }); loc(it.text, j(p, 'text')); });
  collection(content, 'tools', false, (it, p) => loc(it.label, j(p, 'label'), { required: true, max: 80 }));
  collection(content, 'faq', false, (it, p) => { loc(it.q, j(p, 'q'), { required: true, max: 500 }); loc(it.a, j(p, 'a'), { required: true }); });
  if (content.principles) { loc(content.principles.title, 'principles.title'); blocks(content.principles.blocks, 'principles.blocks', false); }
  if (content.blogNote) { loc(content.blogNote.title, 'blogNote.title'); loc(content.blogNote.text, 'blogNote.text'); }

  collection(content, 'projects', true, (it, p) => {
    loc(it.title, j(p, 'title'), { required: true, max: 200 }); loc(it.summary, j(p, 'summary'), { required: true, max: 1000 });
    loc(it.description, j(p, 'description')); img(it.image, j(p, 'image'), true); loc(it.imageAlt, j(p, 'imageAlt'), { max: 500 });
    loc(it.meta, j(p, 'meta'), { max: 200 }); tags(it.tags, j(p, 'tags'));
    if (!['done', 'wip', 'planned'].includes(it.status)) err(j(p, 'status'), 'must be done, wip or planned');
    if (it.links !== undefined) {
      if (!isObj(it.links)) err(j(p, 'links'), 'must be an object');
      else for (const k of ['github', 'demo']) url(it.links[k], p + '.links.' + k, true);
    }
    bool(it.featured, j(p, 'featured'), true); num(it.order, j(p, 'order'), true); bool(it.visible, j(p, 'visible'), true);
  }, { slug: true });

  collection(content, 'posts', true, (it, p) => {
    loc(it.title, j(p, 'title'), { required: true, max: 300 }); loc(it.excerpt, j(p, 'excerpt'), { required: true, max: 1000 });
    img(it.cover, j(p, 'cover'), true); loc(it.coverAlt, j(p, 'coverAlt'), { max: 500 }); loc(it.coverCaption, j(p, 'coverCaption'), { max: 500 });
    if (isEmpty(it.date)) err(j(p, 'date'), 'required');
    else if (typeof it.date !== 'string' || !DATE_RE.test(it.date)) err(j(p, 'date'), 'must be YYYY-MM-DD');
    else {
      const [y, m, d] = it.date.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d));
      if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) err(j(p, 'date'), 'not a valid calendar date');
    }
    if (!isEmpty(it.readMinutes) && (!Number.isInteger(it.readMinutes) || it.readMinutes < 1 || it.readMinutes > 600)) err(j(p, 'readMinutes'), 'must be an integer 1-600');
    tags(it.tags, j(p, 'tags')); bool(it.visible, j(p, 'visible'), true); blocks(it.blocks, j(p, 'blocks'), true);
  }, { slug: true });

  collection(content, 'gallery', true, (it, p) => {
    img(it.image, j(p, 'image'), true);
    for (const k of ['title', 'alt', 'caption', 'group']) loc(it[k], j(p, k), { max: 500 });
    num(it.order, j(p, 'order'), true); bool(it.visible, j(p, 'visible'), true);
  });

  const st = content.settings;
  if (st.defaultLang !== undefined && !['tr', 'en'].includes(st.defaultLang)) err('settings.defaultLang', 'must be tr or en');
  if (st.defaultTheme !== undefined && !['dark', 'light', 'system'].includes(st.defaultTheme)) err('settings.defaultTheme', 'must be dark, light or system');
  bool(st.fire, 'settings.fire'); bool(st.cursor, 'settings.cursor');
  str(st.accentOverride, 'settings.accentOverride', { max: 60, re: ACCENT_RE, reMsg: 'must be #hex, rgb(), rgba(), hsl() or hsla()' });
  loc(st.siteTitle, 'settings.siteTitle', { max: 200 }); loc(st.siteDescription, 'settings.siteDescription', { max: 500 });
  str(st.githubUsername, 'settings.githubUsername', { max: 100 });

  return errors;
}

module.exports = { validate, sanitize, SLUG_RE, IMG_RE, BLOCK_TYPES };
