'use strict';
// Usage: npm run validate [path/to/content.js]
const fs = require('fs');
const { resolvePaths } = require('../lib/config');
const { parseContent } = require('../lib/contentio');
const { validate } = require('../lib/validate');

const paths = resolvePaths();
const file = process.argv[2] || paths.contentFile;
let data;
try {
  data = parseContent(fs.readFileSync(file, 'utf8')).data;
} catch (e) {
  console.error('FAIL: cannot read/parse ' + file + ': ' + e.message);
  process.exit(2);
}
const errors = validate(data, { siteDir: paths.siteDir });
if (errors.length) {
  console.error('FAIL: ' + errors.length + ' problem(s) in ' + file);
  errors.forEach((e) => console.error('  ' + (e.path || '(root)') + ': ' + e.message));
  process.exit(1);
}
console.log('OK: ' + file + ' is valid (' + (data.projects || []).length + ' projects, ' + (data.posts || []).length + ' posts, ' + (data.gallery || []).length + ' gallery items)');
