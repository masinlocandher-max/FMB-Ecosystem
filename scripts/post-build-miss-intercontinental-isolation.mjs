import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file = path.resolve('dist/MissIntercontinental/index.html');
let html = await readFile(file, 'utf8');

// This is a deliberately isolated application profile. It lives on the FMB domain,
// but must not inherit the corporate ecosystem shell, navigation, footer or visual layer.
html = html
  .replace(/\n?<div class="fmb-shell-rail"[\s\S]*?<\/div>\s*(?=<header class="fmb-shell-header")/i, '\n')
  .replace(/\n?<header class="fmb-shell-header"[\s\S]*?<\/header>\s*/i, '\n')
  .replace(/\n?<footer class="fmb-shell-footer"[\s\S]*?<\/footer>\s*/i, '\n')
  .replace(/\n?<link[^>]+fmb-unified-system\.css[^>]*>\s*/gi, '\n')
  .replace(/\n?<link[^>]+fmb-sitewide-visual-fixes\.css[^>]*>\s*/gi, '\n')
  .replace(/\n?<script[^>]+fmb-unified-system\.js[^>]*><\/script>\s*/gi, '\n')
  .replace(/<body\s+class="fmb-unified-public fmb-approved-launch"\s+data-fmb-page="public">/i, '<body>')
  .replace(/<meta name="theme-color" content="[^"]*">/i, '<meta name="theme-color" content="#4b174c">');

// The rail can contain nested divs. If a hardening pass changes its internal markup,
// remove any remaining unified-shell blocks without touching the dedicated topbar/footer.
html = html.replace(/\n?<div class="fmb-shell-rail"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*/i, '\n');

await writeFile(file, html, 'utf8');
console.log('Miss Intercontinental application page isolated from the corporate FMB shell.');
