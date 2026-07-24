import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(repositoryRoot, 'dist');
const excludedPrefixes = ['_sites/', 'app/', 'api/', 'auth/', 'admin/', 'data/', 'yoni/'];
const excludedFiles = new Set(['admin.html', 'login.html', 'signup.html', 'reset-password.html', 'confirm-email.html']);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative = (file) => path.relative(dist, file).replaceAll(path.sep, '/');
const publicHtml = (await walk(dist)).filter((file) => {
  const name = relative(file);
  if (!name.endsWith('.html') || excludedFiles.has(name)) return false;
  return !excludedPrefixes.some((prefix) => name.startsWith(prefix));
});

function resolveLocal(pageFile, html, href) {
  const clean = href.split(/[?#]/)[0];
  if (!clean || /^(?:https?:|data:|blob:|\/\/)/i.test(clean)) return;
  if (clean.startsWith('/')) return path.join(dist, clean.replace(/^\//, ''));
  const baseHref = html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if (baseHref && !/^https?:/i.test(baseHref)) {
    const base = baseHref.startsWith('/')
      ? path.join(dist, baseHref.replace(/^\//, ''))
      : path.resolve(path.dirname(pageFile), baseHref);
    return path.resolve(base, clean);
  }
  return path.resolve(path.dirname(pageFile), clean);
}

function publicUrl(file) {
  return `/${path.relative(dist, file).replaceAll(path.sep, '/')}`;
}

function rewriteCssUrls(css, sourceFile) {
  return css
    .replace(/^\s*@charset\s+[^;]+;\s*/gim, '')
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (full, quote, value) => {
      const trimmed = value.trim();
      if (!trimmed || /^(?:data:|https?:|blob:|\/\/|#)/i.test(trimmed)) return full;
      const split = trimmed.search(/[?#]/);
      const pathname = split >= 0 ? trimmed.slice(0, split) : trimmed;
      const suffix = split >= 0 ? trimmed.slice(split) : '';
      const resolved = pathname.startsWith('/')
        ? path.join(dist, pathname.replace(/^\//, ''))
        : path.resolve(path.dirname(sourceFile), pathname);
      return `url("${publicUrl(resolved)}${suffix}")`;
    });
}

function enforceImageBudget(html, eagerBudget = 4) {
  let eagerImages = 0;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (/\sloading=["']lazy["']/i.test(tag)) return tag;
    const priority = /\sfetchpriority=["']high["']/i.test(tag);
    if (priority || eagerImages < eagerBudget) {
      eagerImages += 1;
      return tag;
    }
    let next = tag.replace(/<img/i, '<img loading="lazy"');
    if (!/\sdecoding=/i.test(next)) next = next.replace(/<img/i, '<img decoding="async"');
    return next;
  });
}

let bundledPages = 0;
let imageBudgetPages = 0;

for (const pageFile of publicHtml) {
  const name = relative(pageFile);
  let html = await readFile(pageFile, 'utf8');
  const before = html;

  const stylesheetTags = [...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  if (stylesheetTags.length > 8) {
    const selected = [];
    for (const match of stylesheetTags) {
      const tag = match[0];
      const href = match[1];
      if (/\bmedia=["'](?!all["'])/i.test(tag)) continue;
      if (/^(?:https?:|\/\/)/i.test(href) || href.includes('fmb-unified-system.css')) continue;
      const file = resolveLocal(pageFile, html, href);
      if (!file) continue;
      try {
        selected.push({ tag, href, file, css: await readFile(file, 'utf8') });
      } catch {
        // The link audit reports a missing stylesheet separately.
      }
    }

    if (selected.length > 1) {
      const key = name.replace(/\/index\.html$/i, '').replace(/\.html$/i, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';
      const bundlePath = path.join(dist, 'assets', 'css', `fmb-functional-${key}.css`);
      const bundle = selected
        .map((item) => `/* ${item.href} */\n${rewriteCssUrls(item.css, item.file)}`)
        .join('\n\n');
      await writeFile(bundlePath, bundle, 'utf8');
      const link = `<link rel="stylesheet" href="${publicUrl(bundlePath)}?v=20260724-clean-release">`;
      let inserted = false;
      for (const item of selected) {
        if (!inserted) {
          html = html.replace(item.tag, link);
          inserted = true;
        } else {
          html = html.replace(item.tag, '');
        }
      }
      bundledPages += 1;
    }
  }

  const imageBudgeted = enforceImageBudget(html);
  if (imageBudgeted !== html) imageBudgetPages += 1;
  html = imageBudgeted;

  if (html !== before) await writeFile(pageFile, html, 'utf8');
}

console.log(`Performance cleanup consolidated legacy functional CSS on ${bundledPages} page(s) and enforced eager-image budgets on ${imageBudgetPages} page(s).`);
