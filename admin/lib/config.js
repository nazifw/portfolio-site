'use strict';
const path = require('path');

const ADMIN_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(ADMIN_DIR, '..');

/**
 * Resolve every filesystem location the admin touches.
 * siteDir : folder served at "/" (contains data/content.js and img/)
 * dataRoot: folder holding .auth.json and backups/
 * Both can be overridden (options or SITE_DIR / DATA_ROOT env) so tests never touch real data.
 */
function resolvePaths(opts = {}) {
  const siteDir = path.resolve(opts.siteDir || process.env.SITE_DIR || path.join(REPO_ROOT, 'site'));
  const dataRoot = path.resolve(opts.dataRoot || process.env.DATA_ROOT || ADMIN_DIR);
  return {
    siteDir,
    dataRoot,
    contentFile: path.join(siteDir, 'data', 'content.js'),
    imgDir: path.join(siteDir, 'img'),
    uploadsDir: path.join(siteDir, 'img', 'uploads'),
    authFile: path.join(dataRoot, '.auth.json'),
    backupsDir: path.join(dataRoot, 'backups'),
    publicDir: path.join(ADMIN_DIR, 'public'),
  };
}

/** Join rel onto root; return null if the result escapes root (path traversal guard). */
function safeJoin(root, rel) {
  if (typeof rel !== 'string' || rel.includes('\0')) return null;
  // Reject Windows-style separators and drive paths on every platform so behaviour is identical everywhere.
  if (rel.includes('\\') || /^[a-zA-Z]:/.test(rel)) return null;
  const base = path.resolve(root);
  const full = path.resolve(base, rel);
  if (full === base || full.startsWith(base + path.sep)) return full;
  return null;
}

module.exports = { resolvePaths, safeJoin, ADMIN_DIR, REPO_ROOT };
