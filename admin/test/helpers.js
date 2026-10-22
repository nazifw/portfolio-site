'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { REPO_ROOT } = require('../lib/config');
const { createApp } = require('../lib/app');

/** Copy the real site (data + img) into a temp dir so tests never touch real content. */
function makeTempEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-test-'));
  const siteDir = path.join(root, 'site');
  const dataRoot = path.join(root, 'admin-data');
  fs.mkdirSync(path.join(siteDir, 'data'), { recursive: true });
  fs.mkdirSync(path.join(siteDir, 'img', 'uploads'), { recursive: true });
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.copyFileSync(path.join(REPO_ROOT, 'site', 'data', 'content.js'), path.join(siteDir, 'data', 'content.js'));
  for (const f of fs.readdirSync(path.join(REPO_ROOT, 'site', 'img'))) {
    const src = path.join(REPO_ROOT, 'site', 'img', f);
    if (fs.statSync(src).isFile()) fs.copyFileSync(src, path.join(siteDir, 'img', f));
  }
  return { root, siteDir, dataRoot, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

async function startServer(extra = {}) {
  const env = makeTempEnv();
  const { app, paths, auth } = createApp({ siteDir: env.siteDir, dataRoot: env.dataRoot, auth: { failDelayMs: 0 }, ...extra });
  const server = await new Promise((resolve) => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
  const base = 'http://127.0.0.1:' + server.address().port;
  return { base, paths, auth, env, close: async () => { await new Promise((r) => server.close(r)); env.cleanup(); } };
}

/** Tiny client that keeps the session cookie and CSRF token. */
function client(base) {
  const c = { cookie: '', csrf: null };
  c.req = async (method, url, body, headers = {}) => {
    const h = { ...headers };
    if (c.cookie) h.cookie = c.cookie;
    if (c.csrf && method !== 'GET' && h['x-csrf-token'] === undefined) h['x-csrf-token'] = c.csrf;
    if (h['x-csrf-token'] === null) delete h['x-csrf-token'];
    let payload = body;
    if (body !== undefined && !(body instanceof FormData)) { payload = JSON.stringify(body); h['content-type'] = h['content-type'] || 'application/json'; }
    const res = await fetch(base + url, { method, headers: h, body: payload });
    const sc = res.headers.get('set-cookie');
    if (sc) c.cookie = sc.split(';')[0];
    let json = null; const text = await res.text();
    try { json = JSON.parse(text); } catch (_) { /* not json */ }
    if (json && json.csrf) c.csrf = json.csrf;
    return { status: res.status, json, text, headers: res.headers };
  };
  return c;
}

module.exports = { makeTempEnv, startServer, client };
