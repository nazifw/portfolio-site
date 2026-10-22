'use strict';
const fs = require('fs');
const path = require('path');
const { safeJoin } = require('./config');

const NAME_RE = /^content-\d{8}-\d{6}(-\d+)?\.js$/;
const KEEP = 30;

function pad(n) { return String(n).padStart(2, '0'); }
function stamp(d = new Date()) {
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

/** Copy the current content file into backups/ and prune to the newest KEEP. Returns name or null. */
function createBackup(paths) {
  if (!fs.existsSync(paths.contentFile)) return null;
  fs.mkdirSync(paths.backupsDir, { recursive: true });
  let name = 'content-' + stamp() + '.js';
  for (let i = 1; fs.existsSync(path.join(paths.backupsDir, name)); i++) name = 'content-' + stamp() + '-' + i + '.js';
  fs.copyFileSync(paths.contentFile, path.join(paths.backupsDir, name), fs.constants.COPYFILE_EXCL);
  prune(paths);
  return name;
}

function listBackups(paths) {
  if (!fs.existsSync(paths.backupsDir)) return [];
  return fs.readdirSync(paths.backupsDir).filter((n) => NAME_RE.test(n)).map((name) => {
    const st = fs.statSync(path.join(paths.backupsDir, name));
    return { name, size: st.size, mtime: st.mtime.toISOString(), key: stampKey(name) };
  }).sort((a, b) => (a.key < b.key ? 1 : -1)).map(({ key, ...r }) => r);
}

// sortable key: date-time then numeric suffix
function stampKey(name) {
  const m = /^content-(\d{8}-\d{6})(?:-(\d+))?\.js$/.exec(name);
  return m[1] + '-' + String(m[2] || 0).padStart(4, '0');
}

function prune(paths) {
  listBackups(paths).slice(KEEP).forEach((b) => {
    try { fs.unlinkSync(path.join(paths.backupsDir, b.name)); } catch (_) { /* ignore */ }
  });
}

function backupPath(paths, name) {
  if (!NAME_RE.test(String(name))) return null;
  return safeJoin(paths.backupsDir, name);
}

module.exports = { NAME_RE, KEEP, createBackup, listBackups, backupPath, prune };
