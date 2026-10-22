'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_HEADER =
  'content.js: tek dogruluk kaynagi. Sema: docs/04-content-schema.md. Bicim: bu yorum satiri + SITE_CONTENT atamasi (JSON govde).';
const ASSIGN_RE = /^window\.SITE_CONTENT\s*=\s*/m;

/** Parse content.js text -> { header, data }. Header is the text inside the leading comment. */
function parseContent(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const m = ASSIGN_RE.exec(text);
  if (!m) throw new Error('window.SITE_CONTENT assignment not found');
  const headMatch = /^\s*\/\*\s?([\s\S]*?)\s?\*\/\s*/.exec(text.slice(0, m.index));
  const header = headMatch ? headMatch[1] : DEFAULT_HEADER;
  const body = text.slice(m.index + m[0].length).replace(/[;\s]+$/, '');
  return { header, data: JSON.parse(body) };
}

function serializeContent(data, header = DEFAULT_HEADER) {
  const safeHeader = String(header).replace(/\*\//g, '* /').replace(/[\r\n]+/g, ' ');
  return '/* ' + safeHeader + ' */\nwindow.SITE_CONTENT = ' + JSON.stringify(data, null, 2) + ';\n';
}

function readContent(file) {
  return parseContent(fs.readFileSync(file, 'utf8'));
}

function renameWithRetry(from, to) {
  for (let i = 0; ; i++) {
    try { return fs.renameSync(from, to); } catch (e) {
      if (i >= 5 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      const end = Date.now() + 40 * (i + 1);
      while (Date.now() < end) { /* short busy wait (Windows file locks) */ }
    }
  }
}

/** Atomic write: temp file in same dir, re-parse to verify, then rename over target. */
function writeContentAtomic(file, data, header) {
  const text = serializeContent(data, header);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, '.content.' + process.pid + '.' + Date.now() + '.tmp');
  try {
    fs.writeFileSync(tmp, text, 'utf8');
    parseContent(fs.readFileSync(tmp, 'utf8')); // verify
    renameWithRetry(tmp, file);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch (_) { /* ignore */ }
    throw e;
  }
  return text;
}

module.exports = { DEFAULT_HEADER, parseContent, serializeContent, readContent, writeContentAtomic };
