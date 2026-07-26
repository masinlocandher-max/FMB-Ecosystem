import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(new URL('..', import.meta.url).pathname);
const newsRoot = path.join(repositoryRoot, 'dist', 'news');
const landingPath = path.join(newsRoot, 'index.html');
const cssRoot = path.join(repositoryRoot, 'dist', 'assets', 'css');
const sourceCssRoot = path.join(repositoryRoot, 'apps', 'withlovefmb', 'assets', 'css');

const [landingCss, polishCss, mastheadCss, approvalCss, professionalTypeCss] = await Promise.all([
  readFile(path.join(cssRoot, 'news-center-v2.css'), 'utf8'),
  readFile(path.join(cssRoot, 'fmb-news-polish-v3.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-masthead-v3.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-visual-approval.css'), 'utf8'),
  readFile(path.join(sourceCssRoot, 'fmb-news-professional-type.css'), 'utf8'),
]);

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
  }
  return files;
}

let count = 0;
for (const filePath of await walk(newsRoot)) {
  let html = await readFile(filePath, 'utf8');
  html = html
    .replace(/<link\b[^>]*href=["'][^"']*(?:news-center-v2|fmb-news-polish-v3|fmb-news-masthead-v3|fmb-news-visual-approval|fmb-news-professional-type)\.css[^"']*["'][^>]*>\s*/gi, '')
    .replace(/<style\b[^>]*data-fmb-news-final-styles[^>]*>[\s\S]*?<\/style>\s*/gi, '');

  const css = filePath === landingPath
    ? `${landingCss}\n${polishCss}\n${mastheadCss}\n${approvalCss}\n${professionalTypeCss}`
    : `${polishCss}\n${mastheadCss}\n${professionalTypeCss}`;
  const safeguard = /(<link\b[^>]*href=["'][^"']*fmb-sitewide-visual-fixes\.css[^"']*["'][^>]*>)/i;
  if (!safeguard.test(html)) throw new Error(`Newsroom masthead: missing sitewide safeguard in ${filePath}`);
  html = html.replace(safeguard, `$1\n<style data-fmb-news-final-styles>\n${css}\n</style>`);
  await writeFile(filePath, html, 'utf8');
  count += 1;
}

console.log(`Compiled final Newsroom styles and professional typography inline after the global safeguard on ${count} News pages.`);
