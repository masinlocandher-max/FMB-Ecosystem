import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const submitHref = 'mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News&body=Please%20include%3A%0A-%20A%20short%20description%20of%20your%20story%0A-%20Where%20and%20when%20it%20happened%0A-%20Your%20name%20or%20anonymous%20preference%0A-%20Attach%20the%20original%20photos%20or%20videos';
const submitIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"></path><path d="m4 7 8 6 8-6"></path></svg>';
const colorLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo = '/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const colorLogoFile = path.join(dist, colorLogo.replace(/^\//, ''));
const whiteLogoFile = path.join(dist, whiteLogo.replace(/^\//, ''));

const lightLogoMarkup = `<img class="fn15-logo fn15-logo-light" data-fmb-news-logo-light src="${colorLogo}" width="576" height="202" alt="FMB News">`;
const darkLogoMarkup = `<img class="fn15-logo fn15-logo-dark" data-fmb-news-footer-logo data-fmb-news-logo-dark src="${whiteLogo}" width="575" height="203" loading="lazy" decoding="async" alt="FMB News">`;

const logoStyles = `<style id="fmbNewsLogoVariants">
html body [data-fmb-news-logo]{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;text-decoration:none!important;background:transparent!important}
html body [data-fmb-news-logo]>:not([data-fmb-news-logo-light]){display:none!important}
html body [data-fmb-news-logo-light]{position:static!important;display:block!important;width:clamp(168px,16vw,230px)!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;clip:auto!important;clip-path:none!important;filter:none!important;transform:none!important;background:transparent!important}
html body [data-fmb-news-footer-logo],html body [data-fmb-news-logo-dark]{position:static!important;display:block!important;width:clamp(150px,18vw,210px)!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;clip:auto!important;clip-path:none!important;filter:none!important;transform:none!important;background:transparent!important}
html body .fn11-footer-brand [data-fmb-news-logo-dark]{margin-bottom:18px!important}
@media(max-width:720px){html body [data-fmb-news-logo-light]{width:158px!important}html body [data-fmb-news-logo-dark]{width:152px!important}}
</style>`;

async function walk(directory) {
  const files = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await walk(absolute));
      else if (entry.isFile() && entry.name.endsWith('.html')) files.push(absolute);
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return files;
}

function stripTags(value) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function convertLiveLinks(html) {
  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, inner) => {
    const text = stripTags(inner);
    if (!/watch\s+live/i.test(text) && !/live_videos/i.test(attrs)) return match;

    const nextAttrs = attrs
      .replace(/\s+href=(['"])[^'"]*\1/i, '')
      .replace(/\s+target=(['"])[^'"]*\1/i, '')
      .replace(/\s+rel=(['"])[^'"]*\1/i, '')
      .replace(/\s+data-fmb-story-submission(?:=(['"])[^'"]*\1)?/i, '');

    return `<a${nextAttrs} href="${submitHref}" data-fmb-story-submission>Submit your story ${submitIcon}</a>`;
  });
}

function applyHeaderLogo(html, relativeFile) {
  const headerLogoPattern = /<a\b([^>]*\bdata-fmb-news-logo\b[^>]*)>[\s\S]*?<\/a>/i;
  if (!headerLogoPattern.test(html)) {
    throw new Error(`FMB News logo pass could not find the shared masthead in ${relativeFile}`);
  }
  return html.replace(headerLogoPattern, (match, attrs) => `<a${attrs}>${lightLogoMarkup}</a>`);
}

function applyFooterLogo(html, relativeFile) {
  const footerLogoPattern = /<img\b[^>]*\bdata-fmb-news-footer-logo\b[^>]*>/gi;
  if (footerLogoPattern.test(html)) return html.replace(footerLogoPattern, darkLogoMarkup);

  const footerBrandPattern = /<div\b([^>]*class=(['"])[^'"]*\bfn11-footer-brand\b[^'"]*\2[^>]*)>/i;
  if (footerBrandPattern.test(html)) {
    return html.replace(footerBrandPattern, (match) => `${match}${darkLogoMarkup}`);
  }

  const footerPattern = /<footer\b[^>]*>/i;
  if (footerPattern.test(html)) return html.replace(footerPattern, (match) => `${match}${darkLogoMarkup}`);

  throw new Error(`FMB News logo pass could not find a footer in ${relativeFile}`);
}

function applyLogoStyles(html, relativeFile) {
  const cleaned = html.replace(/<style\b[^>]*id=(['"])fmbNewsLogoVariants\1[^>]*>[\s\S]*?<\/style>\s*/gi, '');
  if (!/<\/head>/i.test(cleaned)) throw new Error(`FMB News logo pass could not find </head> in ${relativeFile}`);
  return cleaned.replace(/<\/head>/i, `${logoStyles}</head>`);
}

function count(value, pattern) {
  return [...value.matchAll(pattern)].length;
}

for (const asset of [colorLogoFile, whiteLogoFile]) {
  const details = await stat(asset).catch(() => null);
  if (!details?.isFile() || details.size < 1000) {
    throw new Error(`FMB News supplied logo asset is missing or empty: ${path.relative(root, asset)}`);
  }
}

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
if (!files.length) throw new Error('FMB News story-submission and logo pass found no generated routes.');

let changed = 0;
for (const file of files) {
  const relativeFile = path.relative(root, file);
  const original = await readFile(file, 'utf8');
  let next = convertLiveLinks(original);
  next = applyHeaderLogo(next, relativeFile);
  next = applyFooterLogo(next, relativeFile);
  next = applyLogoStyles(next, relativeFile);

  if (/watch\s+live/i.test(stripTags(next)) || /live_videos/i.test(next)) {
    throw new Error(`FMB News final pass left a live CTA in ${relativeFile}`);
  }
  if (!next.includes('data-fmb-story-submission') || !next.includes('withlovefmb@gmail.com')) {
    throw new Error(`FMB News final pass did not add the email CTA to ${relativeFile}`);
  }

  const lightCount = count(next, /<img\b[^>]*\bdata-fmb-news-logo-light\b[^>]*>/gi);
  const darkCount = count(next, /<img\b[^>]*\bdata-fmb-news-logo-dark\b[^>]*>/gi);
  if (lightCount !== 1 || darkCount !== 1) {
    throw new Error(`FMB News final pass expected one light and one dark logo in ${relativeFile}; found ${lightCount}/${darkCount}`);
  }

  const masthead = next.match(/<a\b[^>]*\bdata-fmb-news-logo\b[^>]*>[\s\S]*?<\/a>/i)?.[0] || '';
  const footerLogo = next.match(/<img\b[^>]*\bdata-fmb-news-logo-dark\b[^>]*>/i)?.[0] || '';
  if (!masthead.includes(colorLogo) || masthead.includes(whiteLogo) || masthead.includes('fn14-reference-logo')) {
    throw new Error(`FMB News final pass used the wrong masthead logo in ${relativeFile}`);
  }
  if (!footerLogo.includes(whiteLogo) || footerLogo.includes(colorLogo)) {
    throw new Error(`FMB News final pass used the wrong footer logo in ${relativeFile}`);
  }

  if (next !== original) {
    await writeFile(file, next);
    changed += 1;
  }
}

console.log(`FMB News story submission and supplied logo variants applied to ${changed}/${files.length} routes.`);
