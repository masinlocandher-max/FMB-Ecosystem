import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const dist = path.join(root, 'dist');
const newsRoots = [path.join(dist, 'news'), path.join(dist, 'fmbnews')];
const submitHref = 'mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News&body=Please%20include%3A%0A-%20A%20short%20description%20of%20your%20story%0A-%20Where%20and%20when%20it%20happened%0A-%20Your%20name%20or%20anonymous%20preference%0A-%20Attach%20the%20original%20photos%20or%20videos';
const submitIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"></path><path d="m4 7 8 6 8-6"></path></svg>';

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

    let nextAttrs = attrs
      .replace(/\s+href=(['"])[^'"]*\1/i, '')
      .replace(/\s+target=(['"])[^'"]*\1/i, '')
      .replace(/\s+rel=(['"])[^'"]*\1/i, '')
      .replace(/\s+data-fmb-story-submission(?:=(['"])[^'"]*\1)?/i, '');

    return `<a${nextAttrs} href="${submitHref}" data-fmb-story-submission>Submit your story ${submitIcon}</a>`;
  });
}

const files = [...new Set((await Promise.all(newsRoots.map(walk))).flat())];
if (!files.length) throw new Error('FMB News story-submission pass found no generated routes.');

let changed = 0;
for (const file of files) {
  const original = await readFile(file, 'utf8');
  const next = convertLiveLinks(original);

  if (/watch\s+live/i.test(stripTags(next)) || /live_videos/i.test(next)) {
    throw new Error(`FMB News story-submission pass left a live CTA in ${path.relative(root, file)}`);
  }
  if (!next.includes('data-fmb-story-submission') || !next.includes('withlovefmb@gmail.com')) {
    throw new Error(`FMB News story-submission pass did not add the email CTA to ${path.relative(root, file)}`);
  }

  if (next !== original) {
    await writeFile(file, next);
    changed += 1;
  }
}

console.log(`FMB News story submission CTA applied to ${changed}/${files.length} routes.`);
