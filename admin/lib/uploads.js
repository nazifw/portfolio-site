'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { safeJoin } = require('./config');

const MAX_FILE = 5 * 1024 * 1024;
const MAX_FILES = 20;
const IMG_EXT = /\.(png|jpe?g|webp|gif|avif|svg)$/i;
const FILE_RE = /^[a-z0-9][a-z0-9._-]*$/;
const TR_MAP = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'İ': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'Ö': 'o', 'Ş': 's', 'Ü': 'u' };

/** Detect image type from magic bytes. SVG is deliberately NOT supported (script injection risk). */
function detectImageType(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG' && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return { ext: 'png', mime: 'image/png' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  const h6 = buf.toString('latin1', 0, 6);
  if (h6 === 'GIF87a' || h6 === 'GIF89a') return { ext: 'gif', mime: 'image/gif' };
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' };
  if (buf.toString('latin1', 4, 8) === 'ftyp') {
    const size = Math.min(buf.readUInt32BE(0) || 32, buf.length, 64);
    const brands = buf.toString('latin1', 8, Math.max(size, 12));
    if (/avif|avis/.test(brands)) return { ext: 'avif', mime: 'image/avif' };
  }
  return null;
}

function slugifyName(original) {
  const o = String(original || '');
  const base = path.basename(o, path.extname(o));
  const s = base.replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => TR_MAP[c]).normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return s || 'image';
}

/** Validate + store one uploaded file. Returns {name, path, size, type}. Throws Error with .reason on rejection. */
function saveUpload(paths, original, buf) {
  if (buf.length > MAX_FILE) throw Object.assign(new Error('too_large'), { reason: 'too_large' });
  const type = detectImageType(buf);
  if (!type) throw Object.assign(new Error('bad_type'), { reason: 'bad_type' });
  fs.mkdirSync(paths.uploadsDir, { recursive: true });
  const slug = slugifyName(original);
  for (let attempt = 0; attempt < 8; attempt++) {
    const name = slug + '-' + crypto.randomBytes(3).toString('hex') + '.' + type.ext;
    const full = safeJoin(paths.uploadsDir, name);
    if (!full) throw Object.assign(new Error('bad_name'), { reason: 'bad_name' });
    try {
      fs.writeFileSync(full, buf, { flag: 'wx' }); // never overwrite
      return { name, path: 'img/uploads/' + name, size: buf.length, type: type.mime };
    } catch (e) { if (e.code !== 'EEXIST') throw e; }
  }
  throw new Error('could not allocate file name');
}

function listDir(dir, prefix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && IMG_EXT.test(d.name))
    .map((d) => {
      const st = fs.statSync(path.join(dir, d.name));
      return { name: d.name, path: prefix + d.name, size: st.size, mtime: st.mtime.toISOString() };
    }).sort((a, b) => (a.mtime < b.mtime ? 1 : -1));
}
const listUploads = (paths) => listDir(paths.uploadsDir, 'img/uploads/');
const listImages = (paths) => listDir(paths.imgDir, 'img/').concat(listUploads(paths));

/** Resolve an upload file name to an absolute path inside uploads/, or null. */
function uploadPath(paths, name) {
  if (typeof name !== 'string' || !FILE_RE.test(name)) return null;
  return safeJoin(paths.uploadsDir, name);
}

/** Return JSON paths of every string value equal to imgPath. */
function findUsages(content, imgPath) {
  const out = [];
  (function walk(v, p) {
    if (typeof v === 'string') { if (v === imgPath) out.push(p); }
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, p + '[' + i + ']'));
    else if (v && typeof v === 'object') for (const k of Object.keys(v)) walk(v[k], p ? p + '.' + k : k);
  })(content, '');
  return out;
}

module.exports = { MAX_FILE, MAX_FILES, detectImageType, slugifyName, saveUpload, listUploads, listImages, uploadPath, findUsages };
