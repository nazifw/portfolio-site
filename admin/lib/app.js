'use strict';
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { resolvePaths } = require('./config');
const { Auth, parseCookies, safeEqual } = require('./auth');
const contentio = require('./contentio');
const { validate, sanitize } = require('./validate');
const backups = require('./backups');
const uploads = require('./uploads');

const COOKIE = 'sid';
const HOST_RE = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i;
const ADMIN_CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self'",
  "frame-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

function httpError(status, code, extra) { return Object.assign(new Error(code), { status, code, extra }); }
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function createApp(options = {}) {
  const paths = resolvePaths(options);
  const auth = new Auth(paths, options.auth || {});
  const app = express();
  app.disable('x-powered-by');
  app.set('etag', 'strong');

  // simple mutex so content writes never interleave
  let chain = Promise.resolve();
  const exclusive = (fn) => { const run = chain.then(fn, fn); chain = run.catch(() => {}); return run; };

  // ---- global: host allow-list (DNS rebinding) + base headers ----
  app.use((req, res, next) => {
    if (!HOST_RE.test(req.headers.host || '')) return res.status(403).type('text').send('Forbidden host');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    if (req.path === '/admin' || req.path.startsWith('/admin/')) {
      res.set('Content-Security-Policy', ADMIN_CSP);
      res.set('X-Frame-Options', 'DENY');
      res.set('Cache-Control', 'no-store');
    } else {
      res.set('X-Frame-Options', 'SAMEORIGIN'); // site preview iframe
    }
    next();
  });

  // ---- API ----
  const api = express.Router();
  api.use(express.json({ limit: options.jsonLimit || '4mb' }));

  // Origin / Fetch-Metadata check on every state-changing request
  api.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const origin = req.headers.origin;
    if (origin && origin !== 'http://' + req.headers.host) return next(httpError(403, 'bad_origin'));
    const site = req.headers['sec-fetch-site'];
    if (site && site !== 'same-origin' && site !== 'none') return next(httpError(403, 'bad_origin'));
    next();
  });

  // session lookup
  api.use((req, res, next) => {
    const sid = parseCookies(req.headers.cookie)[COOKIE];
    const s = auth.getSession(sid);
    req.sid = s ? sid : null;
    req.session = s;
    next();
  });

  const setCookie = (res, sid) => {
    const maxAge = Math.floor(auth.sessionTtlMs / 1000);
    res.set('Set-Cookie', COOKIE + '=' + sid + '; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=' + maxAge);
  };
  const clearCookie = (res) => res.set('Set-Cookie', COOKIE + '=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0');
  const requireJson = (req, res, next) => (req.is('application/json') ? next() : next(httpError(415, 'json_required')));
  const requireAuth = (req, res, next) => {
    if (!req.session) return next(httpError(401, 'unauthorized'));
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const token = req.headers['x-csrf-token'];
      if (!token || !safeEqual(token, req.session.csrf)) return next(httpError(403, 'csrf'));
    }
    next();
  };
  const clientIp = (req) => req.socket.remoteAddress || 'local';

  api.get('/session', (req, res) => {
    res.json({ configured: auth.isConfigured(), authenticated: !!req.session, csrf: req.session ? req.session.csrf : null });
  });

  api.post('/setup', requireJson, wrap(async (req, res) => {
    // Known/accepted limitation: whichever local process reaches /setup first picks the initial password.
    if (auth.isConfigured()) throw httpError(409, 'already_configured');
    const bad = Auth.checkPasswordRules((req.body || {}).password);
    if (bad) throw httpError(400, bad);
    // re-check inside the lock; the 'wx' write also fails if another setup won the race
    await exclusive(async () => {
      if (auth.isConfigured()) throw httpError(409, 'already_configured');
      try { await auth.setPassword(req.body.password, { create: true }); }
      catch (e) { throw e.code === 'EEXIST' ? httpError(409, 'already_configured') : e; }
    });
    const { id, csrf } = auth.createSession();
    setCookie(res, id);
    res.json({ ok: true, csrf });
  }));

  api.post('/login', requireJson, wrap(async (req, res) => {
    if (!auth.isConfigured()) throw httpError(409, 'not_configured');
    const ip = clientIp(req);
    const wait = auth.reserveAttempt(ip); // counts the attempt before verifying (parallel-safe)
    if (wait) { res.set('Retry-After', String(wait)); throw httpError(429, 'too_many_attempts', { retryAfter: wait }); }
    const ok = await auth.verify((req.body || {}).password);
    if (!ok) { await auth.registerFailure(ip); throw httpError(401, 'invalid_credentials'); }
    auth.registerSuccess(ip);
    if (req.sid) auth.destroySession(req.sid);
    const { id, csrf } = auth.createSession();
    setCookie(res, id);
    res.json({ ok: true, csrf });
  }));

  api.post('/logout', requireAuth, (req, res) => {
    auth.destroySession(req.sid);
    clearCookie(res);
    res.json({ ok: true });
  });

  api.post('/password', requireAuth, requireJson, wrap(async (req, res) => {
    const { current, next: nextPw } = req.body || {};
    const ip = clientIp(req);
    const wait = auth.reserveAttempt(ip);
    if (wait) { res.set('Retry-After', String(wait)); throw httpError(429, 'too_many_attempts', { retryAfter: wait }); }
    if (!(await auth.verify(current))) { await auth.registerFailure(ip); throw httpError(401, 'invalid_credentials'); }
    auth.registerSuccess(ip);
    const bad = Auth.checkPasswordRules(nextPw);
    if (bad) throw httpError(400, bad);
    await exclusive(() => auth.setPassword(nextPw));
    auth.destroyAllExcept(req.sid);
    res.json({ ok: true });
  }));

  // everything below needs a session
  api.use(requireAuth);

  api.get('/content', wrap(async (req, res) => {
    try { res.json({ content: contentio.readContent(paths.contentFile).data }); }
    catch (e) { throw httpError(500, 'content_unreadable'); }
  }));

  api.put('/content', requireJson, wrap(async (req, res) => {
    const clean = sanitize(req.body);
    const errors = validate(clean, { siteDir: paths.siteDir });
    if (errors.length) throw httpError(422, 'validation_failed', { errors });
    const result = await exclusive(() => {
      let header; let oldText = null;
      try { oldText = fs.readFileSync(paths.contentFile, 'utf8'); header = contentio.parseContent(oldText).header; } catch (_) { header = undefined; }
      const newText = contentio.serializeContent(clean, header);
      if (oldText === newText) return { unchanged: true, backup: null };
      const backup = backups.createBackup(paths);
      contentio.writeContentAtomic(paths.contentFile, clean, header);
      return { unchanged: false, backup };
    });
    res.json({ ok: true, ...result, savedAt: new Date().toISOString() });
  }));

  api.post('/validate', requireJson, (req, res) => {
    res.json({ errors: validate(sanitize(req.body), { siteDir: paths.siteDir }) });
  });

  api.get('/backups', (req, res) => res.json({ backups: backups.listBackups(paths) }));

  api.post('/backups/restore', requireJson, wrap(async (req, res) => {
    const { name, force } = req.body || {};
    const file = backups.backupPath(paths, name);
    if (!file || !fs.existsSync(file)) throw httpError(404, 'backup_not_found');
    let parsed;
    try { parsed = contentio.parseContent(fs.readFileSync(file, 'utf8')); } catch (_) { throw httpError(422, 'backup_unreadable'); }
    // force only skips the "referenced image file exists" checks; structure, keys, control chars and URL schemes are always enforced
    const data = sanitize(parsed.data);
    const errors = validate(data, { siteDir: paths.siteDir, skipFileChecks: force === true });
    if (errors.length) throw httpError(422, 'validation_failed', { errors });
    const backup = await exclusive(() => {
      const b = backups.createBackup(paths);
      contentio.writeContentAtomic(paths.contentFile, data, parsed.header);
      return b;
    });
    res.json({ ok: true, backup, restored: name });
  }));

  // ---- uploads ----
  const mult = multer({ storage: multer.memoryStorage(), limits: { fileSize: uploads.MAX_FILE, files: uploads.MAX_FILES, fields: 5 } });
  api.post('/upload', (req, res, next) => {
    mult.array('files', uploads.MAX_FILES)(req, res, (e) => {
      if (!e) return next();
      if (e.code === 'LIMIT_FILE_SIZE') return next(httpError(413, 'file_too_large'));
      if (e.code === 'LIMIT_FILE_COUNT' || e.code === 'LIMIT_UNEXPECTED_FILE') return next(httpError(400, 'too_many_files'));
      next(httpError(400, 'bad_upload'));
    });
  }, wrap(async (req, res) => {
    const saved = []; const rejected = [];
    for (const f of req.files || []) {
      // busboy hands multipart file names over as latin1; recover UTF-8 names
      const decoded = Buffer.from(String(f.originalname), 'latin1').toString('utf8');
      const original = decoded.includes('�') ? String(f.originalname) : decoded;
      try { saved.push(uploads.saveUpload(paths, original, f.buffer)); }
      catch (e) { rejected.push({ original: original.slice(0, 120), reason: e.reason || 'error' }); }
    }
    res.status(saved.length || !rejected.length ? 200 : 415).json({ uploaded: saved, rejected });
  }));

  api.get('/uploads', (req, res) => res.json({ uploads: uploads.listUploads(paths) }));
  api.get('/images', (req, res) => res.json({ images: uploads.listImages(paths) }));

  api.delete('/uploads/:name', wrap(async (req, res) => {
    const file = uploads.uploadPath(paths, req.params.name);
    if (!file || !fs.existsSync(file)) throw httpError(404, 'not_found');
    let usedBy = [];
    try { usedBy = uploads.findUsages(contentio.readContent(paths.contentFile).data, 'img/uploads/' + req.params.name); } catch (_) { /* ignore */ }
    if (usedBy.length && req.query.force !== '1') throw httpError(409, 'in_use', { usedBy });
    fs.unlinkSync(file);
    res.json({ ok: true, usedBy });
  }));

  api.use((req, res, next) => next(httpError(404, 'not_found')));
  app.use('/admin/api', api);

  // ---- admin UI + site ----
  app.use('/admin', express.static(paths.publicDir, { index: 'index.html', dotfiles: 'ignore' }));
  app.use(express.static(paths.siteDir, {
    dotfiles: 'ignore',
    setHeaders: (res) => res.set('Cache-Control', 'no-cache'),
  }));

  // ---- errors: never leak stack traces ----
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    let status = err.status || 500; let code = err.code;
    if (err.type === 'entity.too.large') { status = 413; code = 'payload_too_large'; }
    else if (err.type === 'entity.parse.failed') { status = 400; code = 'bad_json'; }
    else if (!err.status) { status = 500; code = 'server_error'; console.error('[admin] ' + err.message); }
    const body = { error: code || 'error' };
    if (err.extra) Object.assign(body, err.extra);
    if (req.path.startsWith('/admin/api') || req.path === '/admin/api') res.status(status).json(body);
    else res.status(status).type('text').send(body.error);
  });

  return { app, paths, auth };
}

module.exports = { createApp, ADMIN_CSP };
