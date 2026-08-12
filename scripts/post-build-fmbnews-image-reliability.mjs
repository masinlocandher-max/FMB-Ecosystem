import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const distRoot = path.join(repositoryRoot, 'dist');
const newsRoot = path.join(distRoot, 'news');
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';
const fallbackAbsolute = path.join(distRoot, fallbackImage.slice(1));

async function listHtml(directory) {
  const files = [];
  let entries = [];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return files;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listHtml(full));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function addImageFallback(html) {
  return html.replace(/<img\b([^>]*?)>/gi, (tag, attrs) => {
    if (/\bonerror\s*=/i.test(attrs)) return tag;
    return `<img${attrs} onerror="this.onerror=null;this.src='${fallbackImage}';this.removeAttribute('srcset');">`;
  });
}

function addFigureFallbackSurface(html) {
  const style = `<style id="fmb-news-image-fallback-surface">.fnc-card figure,.fnc-lead-media,.nc-article-media,.ms-media figure,.news-card figure,.story-card figure{background:#241033 url('${fallbackImage}') center/cover no-repeat}.fnc-card img,.fnc-lead-media img,.nc-article-media img,.ms-media img,.news-card img,.story-card img{background:#241033 url('${fallbackImage}') center/cover no-repeat}</style>`;
  if (html.includes('id="fmb-news-image-fallback-surface"')) return html;
  return html.includes('</head>') ? html.replace('</head>', `${style}</head>`) : html;
}

async function repairNewsImages() {
  await access(fallbackAbsolute);
  const htmlFiles = await listHtml(newsRoot);
  let changed = 0;
  let imageCount = 0;

  for (const file of htmlFiles) {
    const before = await readFile(file, 'utf8');
    const beforeCount = (before.match(/<img\b/gi) || []).length;
    let after = addImageFallback(before);
    after = addFigureFallbackSurface(after);
    imageCount += beforeCount;
    if (after !== before) {
      await writeFile(file, after, 'utf8');
      changed += 1;
    }
  }

  console.log(`FMB News image reliability pass: protected ${imageCount} image(s) across ${htmlFiles.length} page(s); updated ${changed} page(s).`);
}

await repairNewsImages();
