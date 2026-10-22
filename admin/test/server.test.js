'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startServer, client } = require('./helpers');

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const PW = 'correct horse battery';

async function loggedIn(srv) {
  const c = client(srv.base);
  const r = await c.req('POST', '/admin/api/setup', { password: PW });
  assert.equal(r.status, 200);
  return c;
}

test('auth flow: setup, session, logout, login, wrong password', async () => {
  const srv = await startServer();
  try {
    const c = client(srv.base);
    let r = await c.req('GET', '/admin/api/session');
    assert.deepEqual([r.json.configured, r.json.authenticated], [false, false]);
    r = await c.req('POST', '/admin/api/setup', { password: 'short' });
    assert.equal(r.status, 400);
    r = await c.req('POST', '/admin/api/setup', { password: PW });
    assert.equal(r.status, 200);
    assert.ok(fs.existsSync(srv.paths.authFile));
    const rec = JSON.parse(fs.readFileSync(srv.paths.authFile, 'utf8'));
    assert.equal(rec.algo, 'scrypt');
    assert.ok(!fs.readFileSync(srv.paths.authFile, 'utf8').includes(PW));
    r = await c.req('POST', '/admin/api/setup', { password: PW });
    assert.equal(r.status, 409, 'setup only once');
    r = await c.req('GET', '/admin/api/session');
    assert.equal(r.json.authenticated, true);
    r = await c.req('POST', '/admin/api/logout', {});
    assert.equal(r.status, 200);
    r = await c.req('GET', '/admin/api/content');
    assert.equal(r.status, 401);
    const c2 = client(srv.base);
    r = await c2.req('POST', '/admin/api/login', { password: 'wrong-password' });
    assert.equal(r.status, 401);
    r = await c2.req('POST', '/admin/api/login', { password: PW });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('set-cookie'), /HttpOnly/);
    assert.match(r.headers.get('set-cookie'), /SameSite=Strict/);
    r = await c2.req('GET', '/admin/api/content');
    assert.equal(r.status, 200);
  } finally { await srv.close(); }
});

test('CSRF: mutations without or with a wrong token are rejected', async () => {
  const srv = await startServer();
  try {
    const c = await loggedIn(srv);
    const { json } = await c.req('GET', '/admin/api/content');
    let r = await c.req('PUT', '/admin/api/content', json.content, { 'x-csrf-token': null });
    assert.equal(r.status, 403);
    r = await c.req('PUT', '/admin/api/content', json.content, { 'x-csrf-token': 'nope' });
    assert.equal(r.status, 403);
    r = await c.req('PUT', '/admin/api/content', json.content, { origin: 'http://evil.example' });
    assert.equal(r.status, 403, 'foreign Origin');
    r = await c.req('PUT', '/admin/api/content', json.content, { 'sec-fetch-site': 'cross-site' });
    assert.equal(r.status, 403);
    r = await c.req('PUT', '/admin/api/content', json.content);
    assert.equal(r.status, 200);
    r = await c.req('POST', '/admin/api/logout', {}, { 'x-csrf-token': null });
    assert.equal(r.status, 403);
    // login (no session yet) must not accept form posts / foreign origins
    const anon = client(srv.base);
    r = await anon.req('POST', '/admin/api/login', { password: PW }, { origin: 'http://evil.example' });
    assert.equal(r.status, 403);
    r = await anon.req('POST', '/admin/api/login', 'password=' + PW, { 'content-type': 'application/x-www-form-urlencoded' });
    assert.equal(r.status, 415);
  } finally { await srv.close(); }
});

test('login rate limiting after repeated failures', async () => {
  const srv = await startServer();
  try {
    await loggedIn(srv);
    const c = client(srv.base);
    for (let i = 0; i < 5; i++) assert.equal((await c.req('POST', '/admin/api/login', { password: 'bad-pass-' + i })).status, 401);
    const r = await c.req('POST', '/admin/api/login', { password: PW });
    assert.equal(r.status, 429, 'even the right password is blocked while limited');
    assert.ok(r.headers.get('retry-after'));
  } finally { await srv.close(); }
});

test('rejects unexpected Host headers (DNS rebinding)', async () => {
  const srv = await startServer();
  try {
    const http = require('http');
    const status = await new Promise((resolve) => {
      const u = new URL(srv.base);
      http.get({ host: u.hostname, port: u.port, path: '/admin/api/session', headers: { host: 'evil.example' } }, (res) => { res.resume(); resolve(res.statusCode); });
    });
    assert.equal(status, 403);
  } finally { await srv.close(); }
});

test('password change requires the current password and keeps working', async () => {
  const srv = await startServer();
  try {
    const c = await loggedIn(srv);
    let r = await c.req('POST', '/admin/api/password', { current: 'wrong-wrong', next: 'another-long-one' });
    assert.equal(r.status, 401);
    r = await c.req('POST', '/admin/api/password', { current: PW, next: 'short' });
    assert.equal(r.status, 400);
    r = await c.req('POST', '/admin/api/password', { current: PW, next: 'another-long-one' });
    assert.equal(r.status, 200);
    const c2 = client(srv.base);
    assert.equal((await c2.req('POST', '/admin/api/login', { password: PW })).status, 401);
    assert.equal((await c2.req('POST', '/admin/api/login', { password: 'another-long-one' })).status, 200);
  } finally { await srv.close(); }
});

test('content: PUT validates (field paths), backs up, writes atomically; backups restore', async () => {
  const srv = await startServer();
  try {
    const c = await loggedIn(srv);
    const original = fs.readFileSync(srv.paths.contentFile, 'utf8');
    const { json } = await c.req('GET', '/admin/api/content');
    const doc = json.content;

    // invalid -> 422 with path, file untouched
    const bad = structuredClone(doc); bad.projects[2].slug = 'Not Valid'; bad.socials[0].url = 'javascript:alert(1)';
    let r = await c.req('PUT', '/admin/api/content', bad);
    assert.equal(r.status, 422);
    const ps = r.json.errors.map((e) => e.path);
    assert.ok(ps.includes('projects[2].slug') && ps.includes('socials[0].url'));
    assert.equal(fs.readFileSync(srv.paths.contentFile, 'utf8'), original);

    // unchanged save is a no-op (no backup)
    r = await c.req('PUT', '/admin/api/content', doc);
    assert.equal(r.status, 200); assert.equal(r.json.unchanged, true);
    assert.equal((await c.req('GET', '/admin/api/backups')).json.backups.length, 0);

    // real change
    const edited = structuredClone(doc); edited.projects[0].title.tr = 'Yeni baslik\u0007';
    r = await c.req('PUT', '/admin/api/content', edited);
    assert.equal(r.status, 200); assert.ok(r.json.backup);
    const after = fs.readFileSync(srv.paths.contentFile, 'utf8');
    assert.ok(after.startsWith('/* ') && after.includes('\nwindow.SITE_CONTENT = {\n  "site"'));
    assert.ok(after.includes('"Yeni baslik"'), 'control chars stripped');
    const list = (await c.req('GET', '/admin/api/backups')).json.backups;
    assert.equal(list.length, 1);
    assert.equal(fs.readFileSync(path.join(srv.paths.backupsDir, list[0].name), 'utf8'), original);

    // restore
    r = await c.req('POST', '/admin/api/backups/restore', { name: list[0].name });
    assert.equal(r.status, 200);
    assert.equal(fs.readFileSync(srv.paths.contentFile, 'utf8'), original);
    r = await c.req('POST', '/admin/api/backups/restore', { name: '../../etc/passwd' });
    assert.equal(r.status, 404);
  } finally { await srv.close(); }
});

test('upload: signature check, SVG refused, listing, in-use delete warning', async () => {
  const srv = await startServer();
  try {
    const c = await loggedIn(srv);
    const form = new FormData();
    form.append('files', new Blob([PNG], { type: 'image/png' }), 'Benim Fotoğraf.png');
    form.append('files', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'.padEnd(40)], { type: 'image/svg+xml' }), 'evil.svg');
    form.append('files', new Blob([Buffer.from('<?php echo 1; ?>'.padEnd(40))], { type: 'image/png' }), 'shell.png');
    let r = await c.req('POST', '/admin/api/upload', form);
    assert.equal(r.status, 200);
    assert.equal(r.json.uploaded.length, 1);
    assert.equal(r.json.rejected.length, 2);
    const up = r.json.uploaded[0];
    assert.match(up.name, /^benim-fotograf-[0-9a-f]{6}\.png$/);
    assert.deepEqual(fs.readdirSync(srv.paths.uploadsDir), [up.name]);

    // CSRF on upload
    r = await c.req('POST', '/admin/api/upload', form, { 'x-csrf-token': null });
    assert.equal(r.status, 403);

    r = await c.req('GET', '/admin/api/uploads');
    assert.equal(r.json.uploads.length, 1);
    // served statically with nosniff
    const img = await fetch(srv.base + '/' + up.path);
    assert.equal(img.status, 200); assert.equal(img.headers.get('x-content-type-options'), 'nosniff');

    // reference it, then deletion must warn
    const doc = (await c.req('GET', '/admin/api/content')).json.content;
    doc.gallery[0].image = up.path;
    assert.equal((await c.req('PUT', '/admin/api/content', doc)).status, 200);
    r = await c.req('DELETE', '/admin/api/uploads/' + up.name);
    assert.equal(r.status, 409); assert.deepEqual(r.json.usedBy, ['gallery[0].image']);
    r = await c.req('DELETE', '/admin/api/uploads/' + up.name + '?force=1');
    assert.equal(r.status, 200);
    // traversal / non-upload targets
    for (const n of ['..%2Fcontent.js', '..%2F..%2Fdata%2Fcontent.js', 'portrait.svg']) {
      r = await c.req('DELETE', '/admin/api/uploads/' + n);
      assert.ok([404].includes(r.status), n + ' -> ' + r.status);
    }
    assert.ok(fs.existsSync(path.join(srv.paths.imgDir, 'portrait.svg')));
    assert.ok(fs.existsSync(srv.paths.contentFile));
  } finally { await srv.close(); }
});

test('security headers: admin DENY + CSP, site SAMEORIGIN, no x-powered-by, no stack traces', async () => {
  const srv = await startServer();
  try {
    let r = await fetch(srv.base + '/admin/');
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('x-frame-options'), 'DENY');
    assert.match(r.headers.get('content-security-policy'), /script-src 'self'(;|$)/);
    assert.equal(r.headers.get('x-powered-by'), null);
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
    assert.ok(r.headers.get('referrer-policy'));
    r = await fetch(srv.base + '/');
    assert.equal(r.headers.get('x-frame-options'), 'SAMEORIGIN');
    r = await fetch(srv.base + '/admin/api/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{bad json' });
    const t = await r.text();
    assert.ok(r.status >= 400 && r.status < 500);
    assert.ok(!/node_modules|\.js:\d+/.test(t));
    // admin source is not served from the site root
    assert.equal((await fetch(srv.base + '/admin/.auth.json')).status, 404);
  } finally { await srv.close(); }
});
