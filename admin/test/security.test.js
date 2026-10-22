'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { startServer, client } = require('./helpers');
const { parseCookies } = require('../lib/auth');
const { REPO_ROOT } = require('../lib/config');

const PW = 'correct horse battery';

test('rate limit holds under 40 parallel wrong logins', async () => {
  const srv = await startServer();
  try {
    const owner = client(srv.base);
    assert.equal((await owner.req('POST', '/admin/api/setup', { password: PW })).status, 200);
    const rs = await Promise.all(Array.from({ length: 40 }, () => client(srv.base).req('POST', '/admin/api/login', { password: 'wrong-password' })));
    const n401 = rs.filter((r) => r.status === 401).length;
    const n429 = rs.filter((r) => r.status === 429).length;
    assert.equal(n401 + n429, 40);
    assert.equal(n401, srv.auth.maxAttempts, 'only maxAttempts verifications are allowed');
    assert.ok(n429 > 0);
  } finally { await srv.close(); }
});

test('two concurrent setups: one wins (200), the other gets 409', async () => {
  const srv = await startServer();
  try {
    const [a, b] = await Promise.all([
      client(srv.base).req('POST', '/admin/api/setup', { password: 'first-password-1' }),
      client(srv.base).req('POST', '/admin/api/setup', { password: 'second-password-2' }),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  } finally { await srv.close(); }
});

test('malformed cookie yields 401, not 500', async () => {
  assert.deepEqual(parseCookies('sid=%; a=b'), { a: 'b' });
  const srv = await startServer();
  try {
    const c = client(srv.base);
    await c.req('POST', '/admin/api/setup', { password: PW });
    const r = await fetch(srv.base + '/admin/api/content', { headers: { cookie: 'sid=%E0%A4%A' } });
    assert.equal(r.status, 401);
  } finally { await srv.close(); }
});

test('force restore still rejects dangerous URLs but may skip missing-image checks', async () => {
  const srv = await startServer();
  try {
    const c = client(srv.base);
    await c.req('POST', '/admin/api/setup', { password: PW });
    const original = fs.readFileSync(srv.paths.contentFile, 'utf8');
    const content = (await c.req('GET', '/admin/api/content')).json.content;
    let seq = 0;
    const put = (mutate) => {
      const doc = structuredClone(content); mutate(doc);
      fs.mkdirSync(srv.paths.backupsDir, { recursive: true });
      const name = 'content-20200101-0000' + String(10 + seq++) + '.js';
      const text = original.replace(/window\.SITE_CONTENT = [\s\S]*$/, () => 'window.SITE_CONTENT = ' + JSON.stringify(doc, null, 2) + ';' + String.fromCharCode(10));
      fs.writeFileSync(path.join(srv.paths.backupsDir, name), text);
      return name;
    };
    // dangerous URL
    const bad = put((d) => { d.socials[0].url = 'javascript:alert(1)'; });
    let r = await c.req('POST', '/admin/api/backups/restore', { name: bad, force: true });
    assert.equal(r.status, 422);
    assert.ok(!fs.readFileSync(srv.paths.contentFile, 'utf8').includes('javascript:'));
    // missing image file: force is allowed to skip it
    const miss = put((d) => { d.projects[0].image = 'img/does-not-exist.png'; });
    r = await c.req('POST', '/admin/api/backups/restore', { name: miss });
    assert.equal(r.status, 422);
    r = await c.req('POST', '/admin/api/backups/restore', { name: miss, force: true });
    assert.equal(r.status, 200);
  } finally { await srv.close(); }
});

test('render.js safeUrl is a whitelist (http, https, mailto, tel, relative)', () => {
  const src = fs.readFileSync(path.join(REPO_ROOT, 'site', 'js', 'render.js'), 'utf8');
  const a = src.indexOf('function safeUrl'); const b = src.indexOf('function el(');
  assert.ok(a > 0 && b > a);
  const ctx = vm.createContext({});
  vm.runInContext(src.slice(a, b) + '\nthis.safeUrl = safeUrl; this.safeImg = safeImg;', ctx);
  const { safeUrl, safeImg } = ctx;
  for (const u of ['https://a.b/c?d=e:f', 'http://x.y', 'mailto:me@x.y', 'tel:+9055', 'img/a.png', 'blog.html?slug=a:b', '#top', '/x', 'a/b:c']) {
    assert.equal(safeUrl(u), u, u);
  }
  for (const u of ['javascript:alert(1)', 'java\tscript:alert(1)', '  javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'java\nscript:x', 'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', '\u0001javascript:x', 'ftp://x']) {
    assert.equal(safeUrl(u), '', JSON.stringify(u));
  }
  assert.equal(safeUrl(null), '');
  assert.equal(safeImg('img/a.png'), 'img/a.png');
  assert.equal(safeImg('https://x.y/a.png'), 'https://x.y/a.png');
  assert.equal(safeImg('data:image/png;base64,AAAA'), '');
  assert.equal(safeImg('mailto:a@b.c'), '');
});
