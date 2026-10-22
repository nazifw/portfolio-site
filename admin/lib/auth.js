'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 256;

function scrypt(password, salt, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, params.keylen, { N: params.N, r: params.r, p: params.p, maxmem: 128 * params.N * params.r * 2 }, (e, key) => (e ? reject(e) : resolve(key)));
  });
}

class Auth {
  constructor(paths, opts = {}) {
    this.file = paths.authFile;
    this.sessionTtlMs = opts.sessionTtlMs || 8 * 3600 * 1000;
    this.idleTtlMs = opts.idleTtlMs || 2 * 3600 * 1000;
    this.maxAttempts = opts.maxAttempts || 5;
    this.windowMs = opts.windowMs || 15 * 60 * 1000;
    this.failDelayMs = opts.failDelayMs === undefined ? 400 : opts.failDelayMs;
    this.sessions = new Map();
    this.attempts = new Map();
  }

  isConfigured() { return fs.existsSync(this.file); }

  _load() {
    try { return JSON.parse(fs.readFileSync(this.file, 'utf8')); } catch (_) { return null; }
  }

  /** opts.create: first-time setup, fails with EEXIST if an auth file already exists (flag 'wx'). */
  async setPassword(password, opts = {}) {
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, SCRYPT);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify({
      v: 1, algo: 'scrypt', N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, keylen: SCRYPT.keylen,
      salt: salt.toString('hex'), hash: hash.toString('hex'), updatedAt: new Date().toISOString(),
    }, null, 2), { mode: 0o600, flag: opts.create ? 'wx' : 'w' });
  }

  async verify(password) {
    const rec = this._load();
    if (!rec || typeof password !== 'string') return false;
    const expected = Buffer.from(rec.hash, 'hex');
    const got = await scrypt(password, Buffer.from(rec.salt, 'hex'), { N: rec.N, r: rec.r, p: rec.p, keylen: expected.length });
    return crypto.timingSafeEqual(expected, got);
  }

  static checkPasswordRules(pw) {
    if (typeof pw !== 'string') return 'invalid_password';
    if (pw.length < MIN_PASSWORD) return 'password_too_short';
    if (pw.length > MAX_PASSWORD) return 'password_too_long';
    return null;
  }

  // ---- rate limiting (per IP) ----
  _rec(ip) {
    const now = Date.now();
    let r = this.attempts.get(ip);
    if (!r || now - r.first > this.windowMs) { r = { count: 0, first: now }; this.attempts.set(ip, r); }
    return r;
  }
  /**
   * Returns seconds to wait if blocked, else 0 and RESERVES an attempt. Check and increment are
   * synchronous (no await in between), so parallel requests cannot slip past the limit.
   * Call registerSuccess() on success; registerFailure() only adds the growing delay.
   */
  reserveAttempt(ip) {
    const r = this._rec(ip);
    if (r.count >= this.maxAttempts) return Math.max(1, Math.ceil((r.first + this.windowMs - Date.now()) / 1000));
    r.count += 1;
    return 0;
  }
  async registerFailure(ip) {
    const r = this._rec(ip);
    if (this.failDelayMs > 0) await new Promise((res) => setTimeout(res, Math.min(this.failDelayMs * 2 ** (r.count - 1), 5000)));
  }
  registerSuccess(ip) { this.attempts.delete(ip); }

  // ---- sessions ----
  createSession() {
    const id = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const s = { csrf: crypto.randomBytes(24).toString('hex'), created: now, last: now };
    this.sessions.set(id, s);
    return { id, csrf: s.csrf };
  }
  getSession(id) {
    if (!id) return null;
    const s = this.sessions.get(id);
    if (!s) return null;
    const now = Date.now();
    if (now - s.created > this.sessionTtlMs || now - s.last > this.idleTtlMs) { this.sessions.delete(id); return null; }
    s.last = now;
    return s;
  }
  destroySession(id) { this.sessions.delete(id); }
  destroyAllExcept(id) { for (const k of [...this.sessions.keys()]) if (k !== id) this.sessions.delete(k); }
}

function parseCookies(header) {
  const out = {};
  String(header || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i <= 0) return;
    const raw = p.slice(i + 1).trim();
    try { out[p.slice(0, i).trim()] = decodeURIComponent(raw); } catch (_) { /* malformed cookie: treat as absent */ }
  });
  return out;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

module.exports = { Auth, parseCookies, safeEqual, MIN_PASSWORD };
