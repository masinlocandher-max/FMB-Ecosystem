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

const facebookIcon = '<svg class="fn15-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.7 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5H17V3.6c-.7-.1-1.5-.2-2.3-.2-2.3 0-3.9 1.4-3.9 4.1v2.3H8.2V13h2.6v8h2.9Z"></path></svg>';
const xIcon = '<svg class="fn15-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 3H22l-6.8 7.8L23.2 21H17l-4.8-6.3L6.7 21H3.5l7.2-8.2L3 3h6.3l4.4 5.8L18.9 3Zm-1.1 16h1.7L8.4 4.9H6.6L17.8 19Z"></path></svg>';
const linkedinIcon = '<svg class="fn15-share-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5.3 7.6A2.3 2.3 0 1 0 5.3 3a2.3 2.3 0 0 0 0 4.6ZM3.4 21h3.8V9H3.4v12Zm6.1 0h3.8v-6.7c0-1.8.3-3.5 2.6-3.5 2.2 0 2.3 2.1 2.3 3.6V21H22v-7.5c0-3.7-.8-6.5-5.1-6.5-2 0-3.4 1.1-4 2.1h-.1V9H9.5v12Z"></path></svg>';
const nativeShareIcon = '<svg class="fn15-share-icon fn15-share-icon-stroke" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5"></path><path d="M6 10H4.8A1.8 1.8 0 0 0 3 11.8v7.4A1.8 1.8 0 0 0 4.8 21h14.4a1.8 1.8 0 0 0 1.8-1.8v-7.4a1.8 1.8 0 0 0-1.8-1.8H18"></path></svg>';

const logoStyles = `<style id="fmbNewsLogoVariants">
html body [data-fmb-news-logo]{display:inline-flex!important;align-items:center!important;justify-content:flex-start!important;min-width:0!important;text-decoration:none!important;background:transparent!important}
html body [data-fmb-news-logo]>:not([data-fmb-news-logo-light]){display:none!important}
html body [data-fmb-news-logo-light]{position:static!important;display:block!important;width:clamp(168px,16vw,230px)!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;clip:auto!important;clip-path:none!important;filter:none!important;transform:none!important;background:transparent!important}
html body [data-fmb-news-footer-logo],html body [data-fmb-news-logo-dark]{position:static!important;display:block!important;width:clamp(150px,18vw,210px)!important;max-width:100%!important;height:auto!important;min-height:0!important;margin:0!important;padding:0!important;object-fit:contain!important;opacity:1!important;visibility:visible!important;clip:auto!important;clip-path:none!important;filter:none!important;transform:none!important;background:transparent!important}
html body .fn11-footer-brand [data-fmb-news-logo-dark]{margin-bottom:18px!important}
html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links{display:flex!important;align-items:center!important;flex-wrap:wrap!important;gap:10px!important}
html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>a,html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>button{width:46px!important;min-width:46px!important;max-width:46px!important;height:46px!important;min-height:46px!important;padding:0!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border:1px solid rgba(70,21,131,.24)!important;border-radius:50%!important;background:#fff!important;color:#35105d!important;font-size:0!important;line-height:1!important;text-decoration:none!important;box-shadow:0 8px 22px rgba(39,6,76,.06)!important;transition:transform 160ms ease,border-color 160ms ease,background 160ms ease,color 160ms ease!important}
html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>button{border-color:#2b0755!important;background:#2b0755!important;color:#fff!important;cursor:pointer!important}
html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>a:hover,html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>a:focus-visible{transform:translateY(-2px)!important;border-color:#5f2ba0!important;background:#f8f3fc!important;color:#2b0755!important}
html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>button:hover,html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>button:focus-visible{transform:translateY(-2px)!important;background:#43107c!important}
html body .fn15-share-icon{width:20px!important;height:20px!important;display:block!important;flex:0 0 auto!important}
html body .fn15-share-icon-stroke{fill:none!important;stroke:currentColor!important;stroke-width:1.8!important;stroke-linecap:round!important;stroke-linejoin:round!important}
html body .fn15-share-text{position:absolute!important;width:1px!important;height:1px!important;margin:-1px!important;padding:0!important;overflow:hidden!important;clip:rect(0 0 0 0)!important;clip-path:inset(50%)!important;white-space:nowrap!important;border:0!important}
@media(max-width:720px){html body [data-fmb-news-logo-light]{width:158px!important}html body [data-fmb-news-logo-dark]{width:152px!important}html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>a,html body .fn10-share-bar[data-fmb-share-ready] .fn10-share-links>button{width:44px!important;min-width:44px!important;max-width:44px!important;height:44px!important;min-height:44px!important}}
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

function shareAnchorAttributes(inner, hostPattern) {
  return inner.match(new RegExp(`<a\\b([^>]*href=(['"])[^'"]*${hostPattern}[^'"]*\\2[^>]*)>[\\s\\S]*?<\\/a>`, 'i'))?.[1] || '';
}

function applyShareIcons(html) {
  return html.replace(
    /<aside\b([^>]*)class=(['"])([^'"]*\bfn10-share-bar\b[^'"]*)\2([^>]*)>([\s\S]*?)<\/aside>/gi,
    (match, before, quote, classes, after, inner) => {
      const facebookAttrs = shareAnchorAttributes(inner, 'facebook\\.com');
      const xAttrs = shareAnchorAttributes(inner, '(?:twitter|x)\\.com');
      const linkedinAttrs = shareAnchorAttributes(inner, 'linkedin\\.com');
      const buttonAttrs = inner.match(/<button\b([^>]*\bdata-fn10-share\b[^>]*)>[\s\S]*?<\/button>/i)?.[1] || '';
      const status = inner.match(/<span\b[^>]*\bdata-fn10-share-status\b[^>]*>[\s\S]*?<\/span>/i)?.[0]
        || '<span class="fn10-share-status" data-fn10-share-status aria-live="polite"></span>';
      if (!facebookAttrs || !xAttrs || !linkedinAttrs || !buttonAttrs) return match;

      const asideAttributes = `${before}class=${quote}${classes}${quote}${after}`
        .replace(/\s+data-fmb-share-ready(?:=(['"])[^'"]*\1)?/gi, '');
      const label = '<span class="fn10-share-label">Share this report</span>';
      const links = `<div class="fn10-share-links"><a${facebookAttrs} aria-label="Share on Facebook" title="Share on Facebook">${facebookIcon}<span class="fn15-share-text">Facebook</span></a><a${xAttrs} aria-label="Share on X" title="Share on X">${xIcon}<span class="fn15-share-text">X</span></a><a${linkedinAttrs} aria-label="Share on LinkedIn" title="Share on LinkedIn">${linkedinIcon}<span class="fn15-share-text">LinkedIn</span></a><button${buttonAttrs} aria-label="Share using your device" title="Share using your device">${nativeShareIcon}<span class="fn15-share-text">Share</span></button>${status}</div>`;
      return `<aside${asideAttributes} data-fmb-share-ready>${label}${links}</aside>`;
    },
  );
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
let articleShareBars = 0;
for (const file of files) {
  const relativeFile = path.relative(root, file);
  const original = await readFile(file, 'utf8');
  let next = convertLiveLinks(original);
  next = applyShareIcons(next);
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

  if (/\bnews-story-route\b/.test(next)) {
    const shareBar = next.match(/<aside\b[^>]*\bdata-fmb-share-ready\b[^>]*>[\s\S]*?<\/aside>/i)?.[0] || '';
    const iconCount = count(shareBar, /<svg\b[^>]*\bfn15-share-icon\b[^>]*>/gi);
    if (iconCount !== 4) {
      throw new Error(`FMB News article requires four SVG sharing controls in ${relativeFile}; found ${iconCount}`);
    }
    articleShareBars += 1;
  }

  if (next !== original) {
    await writeFile(file, next);
    changed += 1;
  }
}

if (!articleShareBars) throw new Error('FMB News final pass did not verify any article share bars.');
console.log(`FMB News story submission, supplied logo variants and four-icon sharing applied to ${changed}/${files.length} routes, including ${articleShareBars} article share bars.`);
