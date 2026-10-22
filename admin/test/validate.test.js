'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { validate, sanitize } = require('../lib/validate');
const { parseContent } = require('../lib/contentio');
const { REPO_ROOT } = require('../lib/config');

const real = () => parseContent(fs.readFileSync(path.join(REPO_ROOT, 'site', 'data', 'content.js'), 'utf8')).data;
const paths = (errs) => errs.map((e) => e.path);

test('the shipped content.js is valid (including image files on disk)', () => {
  assert.deepEqual(validate(real(), { siteDir: path.join(REPO_ROOT, 'site') }), []);
});

test('minimal valid document', () => {
  const doc = { site: { name: { tr: 'A', en: '' } }, contact: {}, settings: {}, projects: [], posts: [], gallery: [] };
  assert.deepEqual(validate(doc), []);
});

test('missing required roots are reported by name', () => {
  const p = paths(validate({ site: {} }));
  for (const k of ['contact', 'settings', 'projects', 'posts', 'gallery']) assert.ok(p.includes(k), k);
});

test('errors carry field paths', () => {
  const d = real();
  d.projects[2].slug = 'Bad Slug';
  d.projects[1].status = 'nope';
  d.skills[0].percent = 101;
  d.posts[0].blocks[1].type = 'video';
  const p = paths(validate(d));
  assert.ok(p.includes('projects[2].slug'));
  assert.ok(p.includes('projects[1].status'));
  assert.ok(p.includes('skills[0].percent'));
  assert.ok(p.includes('posts[0].blocks[1].type'));
});

test('duplicate ids and slugs', () => {
  const d = real();
  d.projects[1].id = d.projects[0].id;
  d.projects[1].slug = d.projects[0].slug;
  const p = paths(validate(d));
  assert.ok(p.includes('projects[1].id'));
  assert.ok(p.includes('projects[1].slug'));
});

test('dangerous URL schemes are rejected, safe ones accepted', () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,x', 'vbscript:x', '//evil.com', 'ftp://x']) {
    const d = real(); d.socials[0].url = bad;
    assert.ok(paths(validate(d)).includes('socials[0].url'), bad);
  }
  for (const ok of ['https://github.com/x', 'http://a.b', 'mailto:a@b.co', 'tel:+905551112233']) {
    const d = real(); d.socials[0].url = ok;
    assert.ok(!paths(validate(d)).includes('socials[0].url'), ok);
  }
  const d = real(); d.projects[0].links = { github: 'mailto:a@b.co' };
  assert.ok(paths(validate(d)).includes('projects[0].links.github'), 'links must be http(s) only');
  const e = real(); e.contact.mapUrl = 'javascript:1';
  assert.ok(paths(validate(e)).includes('contact.mapUrl'));
});

test('image paths: only relative img/ paths, no traversal', () => {
  for (const bad of ['../secret.png', 'img/../x.png', '/etc/passwd.png', 'img//x.png', 'http://x/y.png', 'img/x.exe', 'C:\\x.png', 'js/app.js', 'data:image/png;base64,AA']) {
    const d = real(); d.projects[0].image = bad;
    assert.ok(paths(validate(d)).includes('projects[0].image'), bad);
  }
  const d = real(); d.projects[0].image = 'img/missing.png';
  assert.ok(paths(validate(d, { siteDir: path.join(REPO_ROOT, 'site') })).includes('projects[0].image'), 'missing file');
});

test('dangerous keys are rejected at root and nested', () => {
  const d = real();
  Object.defineProperty(d, '__proto__', { value: { x: 1 }, enumerable: true, configurable: true, writable: true });
  assert.ok(paths(validate(d)).includes('__proto__'));
  const parsed = JSON.parse('{"site":{"name":{"tr":"a","en":""}},"contact":{},"settings":{},"projects":[],"posts":[],"gallery":[],"constructor":{"prototype":{}}}');
  assert.ok(paths(validate(parsed)).includes('constructor'));
  const nested = JSON.parse('{"site":{"__proto__":{"a":1},"name":{"tr":"a","en":""}},"contact":{},"settings":{},"projects":[],"posts":[],"gallery":[]}');
  assert.ok(paths(validate(nested)).includes('site.__proto__'));
  assert.equal(Object.prototype.polluted, undefined);
});

test('sanitize strips control characters but keeps newlines and tabs', () => {
  const out = sanitize({ a: 'x\u0000y\u0007z\nq\tr', b: ['\u001Fk'] });
  assert.equal(out.a, 'xyz\nq\tr');
  assert.equal(out.b[0], 'k');
  const d = real(); d.site.name.tr = 'a\u0001b';
  assert.ok(paths(validate(d)).includes('site.name.tr'));
});

test('block rules', () => {
  const d = real();
  d.posts[0].blocks = [
    { type: 'heading', text: { tr: 'x', en: 'y' }, level: 4 },
    { type: 'image', src: '../x.png' },
    { type: 'code', code: 5 },
    { type: 'list', items: 'no' },
    { type: 'quote', text: { tr: '', en: '' } },
  ];
  const p = paths(validate(d));
  assert.ok(p.includes('posts[0].blocks[0].level'));
  assert.ok(p.includes('posts[0].blocks[1].src'));
  assert.ok(p.includes('posts[0].blocks[2].code'));
  assert.ok(p.includes('posts[0].blocks[3].items'));
  assert.ok(p.includes('posts[0].blocks[4].text.tr'));
});

test('misc field rules: date, enums, accent, email, localized shape', () => {
  const d = real();
  d.posts[0].date = '2026-02-31';
  d.settings.defaultTheme = 'blue';
  d.settings.accentOverride = 'url(x)';
  d.contact.email = 'nope';
  d.site.name = 'plain string';
  d.projects[0].order = 'a';
  d.posts[0].readMinutes = 0;
  const p = paths(validate(d));
  for (const k of ['posts[0].date', 'settings.defaultTheme', 'settings.accentOverride', 'contact.email', 'site.name', 'projects[0].order', 'posts[0].readMinutes']) assert.ok(p.includes(k), k);
});

test('unknown fields are preserved by sanitize and not errors', () => {
  const d = real(); d.extraRoot = { a: 1 }; d.projects[0].custom = 'x';
  assert.deepEqual(validate(d), []);
  const s = sanitize(d);
  assert.equal(s.extraRoot.a, 1); assert.equal(s.projects[0].custom, 'x');
});
