import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set([
  '.git',
  '.vercel',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.turbo',
]);
const textExtensions = new Set([
  '.cjs', '.css', '.env', '.html', '.js', '.json', '.jsx', '.mjs', '.md',
  '.sql', '.svg', '.ts', '.tsx', '.txt', '.webmanifest', '.xml', '.yaml', '.yml',
]);
const forbiddenFilePatterns = [
  { pattern: /^\.env(?!\.example$)/i, reason: 'environment files must never be committed' },
  { pattern: /\.(?:pem|p12|pfx|jks|keystore)$/i, reason: 'private key or certificate bundle detected' },
  { pattern: /(?:^|\/)(?:id_rsa|id_ed25519|credentials|service-account)\b/i, reason: 'credential file detected' },
  { pattern: /(?:\.bak|\.backup|\.orig|~)$/i, reason: 'backup file may expose unpublished content or secrets' },
];
const secretPatterns = [
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'GitHub token', pattern: /\bgh(?:p|o|u|s|r)_[A-Za-z0-9]{20,}\b/ },
  { name: 'OpenAI secret key', pattern: /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Stripe live secret key', pattern: /\bsk_live_[A-Za-z0-9]{16,}\b/ },
  { name: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: 'Supabase service-role key', pattern: /\bSUPABASE_SERVICE_ROLE_KEY\b\s*[:=]\s*['"`][^'"`]+['"`]/i },
];

const findings = [];
let scannedFiles = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');

    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }

    for (const rule of forbiddenFilePatterns) {
      if (rule.pattern.test(relative)) {
        findings.push(`${relative}: ${rule.reason}`);
      }
    }

    if (relative === 'tooling/security-audit.mjs') continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!textExtensions.has(extension) && entry.name !== '.env') continue;

    const info = await stat(absolute);
    if (info.size > 2_000_000) continue;

    const content = await readFile(absolute, 'utf8');
    scannedFiles += 1;
    for (const rule of secretPatterns) {
      if (rule.pattern.test(content)) {
        findings.push(`${relative}: possible ${rule.name}`);
      }
    }
  }
}

function assertHeader(config, key, file) {
  const values = (config.headers || [])
    .flatMap((entry) => entry.headers || [])
    .filter((header) => header.key.toLowerCase() === key.toLowerCase())
    .map((header) => header.value);
  if (!values.length) findings.push(`${file}: missing ${key}`);
  return values;
}

async function validateVercelConfig(relative) {
  const absolute = path.join(root, relative);
  const config = JSON.parse(await readFile(absolute, 'utf8'));
  const required = [
    'Content-Security-Policy',
    'Strict-Transport-Security',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Referrer-Policy',
    'Permissions-Policy',
  ];
  for (const header of required) assertHeader(config, header, relative);

  const cspValues = assertHeader(config, 'Content-Security-Policy', relative);
  if (cspValues.length && !cspValues.some((value) => value.includes("object-src 'none'"))) {
    findings.push(`${relative}: CSP must disable object embedding`);
  }
  if (cspValues.length && !cspValues.some((value) => value.includes("frame-ancestors 'none'"))) {
    findings.push(`${relative}: CSP must prevent clickjacking`);
  }
  if (cspValues.length && !cspValues.some((value) => value.includes('wjnavdpppnhxbuydkrkd.supabase.co'))) {
    findings.push(`${relative}: CSP must explicitly allow the FMB Supabase project`);
  }

  const broadCors = (config.headers || []).some((entry) =>
    (entry.headers || []).some((header) =>
      header.key.toLowerCase() === 'access-control-allow-origin' && !entry.has
    )
  );
  if (broadCors) findings.push(`${relative}: remove broad site-wide CORS headers`);
}

async function validateSecurityTxt() {
  const relative = 'apps/withlovefmb/.well-known/security.txt';
  const content = await readFile(path.join(root, relative), 'utf8');
  for (const field of ['Contact:', 'Expires:', 'Canonical:', 'Preferred-Languages:']) {
    if (!content.includes(field)) findings.push(`${relative}: missing ${field}`);
  }
}

await walk(root);
await validateVercelConfig('vercel.json');
await validateVercelConfig('apps/withlovefmb/vercel.json');
await validateSecurityTxt();

if (findings.length) {
  console.error('Security audit failed:\n');
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Security audit passed. Scanned ${scannedFiles} text files and validated FMB deployment protections.`);
