'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { safeJoin, resolvePaths } = require('../lib/config');
const { detectImageType, saveUpload, slugifyName, uploadPath, findUsages } = require('../lib/uploads');
const { parseContent, serializeContent, writeContentAtomic } = require('../lib/contentio');
const backups = require('../lib/backups');
const { REPO_ROOT } = require('../lib/config');
const { makeTempEnv } = require('./helpers');

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(32)]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBPVP8 '), Buffer.alloc(16)]);
const AVIF = Buffer.concat([Buffer.from([0, 0, 0, 0x1c]), Buffer.from('ftypavif'), Buffer.alloc(32)]);

test('safeJoin keeps paths inside the root', () => {
  const root = path.resolve('/tmp/root-x');
  assert.ok(safeJoin(root, 'a/b.png'));
  for (const bad of ['../x', 'a/../../x', '..\\x', '/etc/passwd', 'C:\\Windows\\x', 'a\0b']) {
    assert.equal(safeJoin(root, bad), null, bad);
  }
  assert.equal(safeJoin(root, ''), root);
});

test('uploadPath only accepts plain file names', () => {
  const p = resolvePaths({ siteDir: path.join(REPO_ROOT, 'site') });
  assert.ok(uploadPath(p, 'ok-file_1.png'));
  for (const bad of ['../content.js', '..', 'a/b.png', 'a\\b.png', '.gitkeep', '.hidden', 'UPPER.png', '']) assert.equal(uploadPath(p, bad), null, bad);
});

test('magic-byte detection ignores extension and rejects SVG/HTML/exe', () => {
  assert.equal(detectImageType(PNG).ext, 'png');
  assert.equal(detectImageType(JPG).ext, 'jpg');
  assert.equal(detectImageType(GIF).ext, 'gif');
  assert.equal(detectImageType(WEBP).ext, 'webp');
  assert.equal(detectImageType(AVIF).ext, 'avif');
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')), null);
  assert.equal(detectImageType(Buffer.from('<?xml version="1.0"?><svg></svg>')), null);
  assert.equal(detectImageType(Buffer.from('<html><script>1</script></html>')), null);
  assert.equal(detectImageType(Buffer.from('MZ' + 'x'.repeat(40))), null);
  assert.equal(detectImageType(Buffer.alloc(4)), null);
});

test('saveUpload: safe unique name, detected extension, no overwrite, traversal in name neutralised', () => {
  const env = makeTempEnv();
  try {
    const p = resolvePaths({ siteDir: env.siteDir, dataRoot: env.dataRoot });
    const a = saveUpload(p, '../../Çok Güzel Foto!!.exe', PNG); // real type is PNG
    assert.match(a.name, /^cok-guzel-foto-[0-9a-f]{6}\.png$/);
    assert.equal(a.path, 'img/uploads/' + a.name);
    const b = saveUpload(p, '../../Çok Güzel Foto!!.exe', PNG);
    assert.notEqual(a.name, b.name);
    assert.ok(fs.existsSync(path.join(p.uploadsDir, a.name)));
    assert.throws(() => saveUpload(p, 'x.png', Buffer.from('<svg></svg>'.padEnd(40))), { reason: 'bad_type' });
    assert.throws(() => saveUpload(p, 'x.png', Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)])), { reason: 'too_large' });
    assert.deepEqual(fs.readdirSync(p.uploadsDir).sort(), [a.name, b.name].sort());
    assert.equal(slugifyName('....'), 'image');
  } finally { env.cleanup(); }
});

test('findUsages locates references', () => {
  const u = findUsages({ a: [{ image: 'img/uploads/x.png' }], b: 'img/uploads/x.png', c: 'other' }, 'img/uploads/x.png');
  assert.deepEqual(u.sort(), ['a[0].image', 'b']);
});

test('content round-trip is byte-identical', () => {
  const text = fs.readFileSync(path.join(REPO_ROOT, 'site', 'data', 'content.js'), 'utf8');
  const { header, data } = parseContent(text);
  assert.equal(serializeContent(data, header), text);
  const env = makeTempEnv();
  try {
    const f = path.join(env.siteDir, 'data', 'content.js');
    writeContentAtomic(f, data, header);
    assert.equal(fs.readFileSync(f, 'utf8'), text);
    assert.deepEqual(fs.readdirSync(path.dirname(f)), ['content.js'], 'no temp files left');
  } finally { env.cleanup(); }
});

test('backups: created, listed newest first, pruned to 30', () => {
  const env = makeTempEnv();
  try {
    const p = resolvePaths({ siteDir: env.siteDir, dataRoot: env.dataRoot });
    for (let i = 0; i < 34; i++) backups.createBackup(p);
    const list = backups.listBackups(p);
    assert.equal(list.length, 30);
    assert.equal(fs.readdirSync(p.backupsDir).length, 30);
    assert.equal(backups.backupPath(p, '../content.js'), null);
    assert.equal(backups.backupPath(p, 'content-20260101-000000.js/../../x'), null);
    assert.ok(backups.backupPath(p, list[0].name));
  } finally { env.cleanup(); }
});
