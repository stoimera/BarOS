import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'coverage']);
const skipFiles = new Set(['.env', '.env.local']);

const rules = [
  { name: 'supabase_project_ref', regex: /mrdateavxrymdbpqsmwc/g },
  { name: 'jwt_like_token', regex: /\beyJ[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\.[0-9A-Za-z_-]{10,}\b/g },
  { name: 'google_api_key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'resend_api_key', regex: /\bre_[0-9A-Za-z]{20,}\b/g },
  { name: 'known_db_password', regex: /Vik123St123/g },
];

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (skipDirs.has(entry.name)) continue;
      walk(full, out);
      continue;
    }
    if (skipFiles.has(entry.name)) continue;
    out.push({ full, rel });
  }
}

const files = [];
walk(root, files);

const findings = [];
for (const file of files) {
  if (file.rel === 'scripts/verify/secrets-scan.mjs') continue;
  let content = '';
  try {
    content = fs.readFileSync(file.full, 'utf8');
  } catch {
    continue;
  }
  for (const rule of rules) {
    if (rule.regex.test(content)) {
      findings.push({ file: file.rel, rule: rule.name });
    }
  }
}

if (findings.length) {
  console.error('secrets-scan: potential secrets found');
  for (const finding of findings) {
    console.error(`  - ${finding.file} (${finding.rule})`);
  }
  process.exit(1);
}

console.log(`secrets-scan: OK (${files.length} files scanned)`);
