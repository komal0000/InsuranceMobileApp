const fs = require('node:fs');
const path = require('node:path');

const appDir = path.resolve(__dirname, '..', 'src', 'app');
const allowedExact = new Set([
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
]);
const allowedPattern = /^(?:OTP|NID|HIB|FCHV|HIV|MDR-TB|PDF|ID|[0-9X+\-\s./:]+)$/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return entry.isFile() && entry.name.endsWith('.html') ? [fullPath] : [];
  });
}

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function isAllowed(value) {
  const normalized = normalize(value);
  return !normalized
    || !/[A-Za-z]/.test(normalized)
    || normalized.includes('{{')
    || normalized.includes('}}')
    || allowedExact.has(normalized)
    || allowedPattern.test(normalized);
}

const findings = [];

for (const file of walk(appDir)) {
  const source = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const relative = path.relative(path.resolve(__dirname, '..'), file);

  const textPattern = />([^<>{}]*[A-Za-z][^<>{}]*)</g;
  for (const match of source.matchAll(textPattern)) {
    const value = normalize(match[1]);
    if (!isAllowed(value)) {
      findings.push(`${relative}: text "${value}"`);
    }
  }

  const attrPattern = /\s(?:label|placeholder|alt|title|aria-label)="([^"]*[A-Za-z][^"]*)"/g;
  for (const match of source.matchAll(attrPattern)) {
    const value = normalize(match[1]);
    if (!isAllowed(value)) {
      findings.push(`${relative}: attribute "${value}"`);
    }
  }
}

if (findings.length > 0) {
  console.error('Hardcoded English template strings found:\n' + findings.join('\n'));
  process.exit(1);
}

console.log('No hardcoded English template strings found.');
