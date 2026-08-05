await import('./post-build-fmb-news-august-4-noon.mjs');

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');

async function walkHtml(directory) {
  const files = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

function publicationBrand() {
  return `<a class="nc-publication-brand" href="/news/" aria-label="FMB News home">
    <span class="nc-publication-brand-mark" aria-hidden="true">FMB</span>
    <span class="nc-publication-brand-copy"><strong>News</strong><small>Public-interest reporting</small></span>
  </a>`;
}

function footerBrand() {
  return `<a class="nc-footer-brand" href="/news/" aria-label="FMB News home">FMB News</a>`;
}

const files = await walkHtml(newsRoot);
let normalizedHeaders = 0;
let normalizedFooters = 0;

for (const filePath of files) {
  let html = await readFile(filePath, 'utf8');
  if (!/\bnews-story-route\b/.test(html)) continue;
  const original = html;

  if (!/\bnc-publication-brand\b/.test(html)) {
    let headerPattern = /<header\b(?=[^>]*\bclass=["'][^"']*\bnc-site-header\b[^"']*["'])[^>]*>[\s\S]*?<\/header>/i;
    if (!headerPattern.test(html)) {
      html = html.replace(/<body\b([^>]*)>/i, '<body$1><header class="nc-site-header"></header>');
    }
    headerPattern = /<header\b(?=[^>]*\bclass=["'][^"']*\bnc-site-header\b[^"']*["'])[^>]*>[\s\S]*?<\/header>/i;
    if (!headerPattern.test(html)) throw new Error(`FMB News article masthead guard could not prepare a site header in ${filePath}`);
    html = html.replace(headerPattern, `<header class="nc-site-header"><div class="nc-brandline"><div class="wrap">${publicationBrand()}</div></div></header>`);
    normalizedHeaders += 1;
  }

  if (!/\bnc-footer-brand\b/.test(html)) {
    let footerPattern = /<footer\b(?=[^>]*\bclass=["'][^"']*\bnc-footer\b[^"']*["'])[^>]*>([\s\S]*?)<\/footer>/i;
    if (!footerPattern.test(html)) {
      html = html.replace('</body>', '<footer class="nc-footer"><div class="wrap"></div></footer></body>');
    }
    footerPattern = /<footer\b(?=[^>]*\bclass=["'][^"']*\bnc-footer\b[^"']*["'])[^>]*>([\s\S]*?)<\/footer>/i;
    if (!footerPattern.test(html)) throw new Error(`FMB News article masthead guard could not prepare a footer in ${filePath}`);
    html = html.replace(footerPattern, (match, inner) => {
      if (/<div\b(?=[^>]*\bclass=["'][^"']*\bwrap\b[^"']*["'])[^>]*>/i.test(inner)) {
        const nextInner = inner.replace(/(<div\b(?=[^>]*\bclass=["'][^"']*\bwrap\b[^"']*["'])[^>]*>)/i, `$1${footerBrand()}`);
        return `<footer class="nc-footer">${nextInner}</footer>`;
      }
      return `<footer class="nc-footer"><div class="wrap">${footerBrand()}${inner}</div></footer>`;
    });
    normalizedFooters += 1;
  }

  if (html !== original) await writeFile(filePath, html, 'utf8');
}

if (!normalizedHeaders) throw new Error('FMB News article masthead guard did not find any newly generated report mastheads to normalize.');
console.log(`Normalized ${normalizedHeaders} newly generated FMB News article masthead(s) and ${normalizedFooters} footer brand(s) before newsroom styling.`);
