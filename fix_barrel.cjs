// Fix barrel sort order using Node.js (ordinal/ASCII sort matching Dart's analyzer)
const fs = require('fs');
const path = require('path');

const domainDir = path.join(__dirname, 'lib', 'src', 'domain');
const barrelPath = path.join(domainDir, 'domain.dart');

const dartFiles = fs.readdirSync(domainDir)
  .filter((f) => f.endsWith('.dart') && f !== 'domain.dart')
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); // pure ordinal sort

const lines = dartFiles.map((f) => `export '${f}';`).join('\n') + '\n';
fs.writeFileSync(barrelPath, lines, 'utf8');
console.log('Barrel rebuilt: ' + dartFiles.length + ' exports');
// Fix barrel sort order using Node.js (ordinal/ASCII sort matching Dart's analyzer)
const fs = require('fs');
const path = require('path');

const domainDir = path.join(__dirname, 'lib', 'src', 'domain');
const barrelPath = path.join(domainDir, 'domain.dart');

const dartFiles = fs.readdirSync(domainDir)
  .filter((f) => f.endsWith('.dart') && f !== 'domain.dart')
  .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)); // pure ordinal sort

const lines = dartFiles.map((f) => `export '${f}';`).join('\n') + '\n';
fs.writeFileSync(barrelPath, lines, 'utf8');
console.log('Barrel rebuilt: ' + dartFiles.length + ' exports');
