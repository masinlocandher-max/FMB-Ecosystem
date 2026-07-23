import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PERSON_ID = 'https://www.francinemariebautista.com/#francine';
const FMBCO_ID = 'https://www.francinemariebautista.com/#fmbandco';
const RELEASE_DATE = '2026-07-21';

const personEntity = () => ({
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Francine Marie Bautista',
  alternateName: ['Francine Marie Bautista (FMB)', 'FMB', 'Binibining Francine Marie Bautista'],
  url: 'https://www.francinemariebautista.com/aboutfmb/',
  image: 'https://www.francinemariebautista.com/assets/images/fmb/francine-founder-front-cutout-900-v1.webp',
  description: 'Founder, strategist, creative director, and storyteller behind the FMB ecosystem.',
  jobTitle: ['Founder', 'Strategist', 'Creative Director', 'Storyteller'],
  sameAs: ['https://www.instagram.com/bb.fmb/'],
});

const fmbCoEntity = () => ({
  '@type': 'Organization',
  '@id': FMBCO_ID,
  name: 'FMB&CO.',
  alternateName: ['FMB and Company'],
  url: 'https://www.francinemariebautista.com/fmbandco/',
  description: 'The founder-led company of SENZ and Cognita.',
  founder: { '@id': PERSON_ID },
  subOrganization: [
    { '@type': 'Organization', '@id': 'https://senzpr.com/#organization', name: 'SENZ', url: 'https://senzpr.com/' },
    { '@type': 'Organization', '@id': 'https://thecognitainstitute.com/#organization', name: 'Cognita', url: 'https://thecognitainstitute.com/' },
  ],
});

function setTitle(html, title) {
  const tag = `<title>${title}</title>`;
  return /<title>[\s\S]*?<\/title>/i.test(html) ? html.replace(/<title>[\s\S]*?<\/title>/i, tag) : html.replace('</head>', `${tag}\n</head>`);
}

function setMeta(html, attribute, key, content) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+[^>]*${attribute}=["']${escaped}["'][^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${content}">`;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}\n</head>`);
}

function replaceFirstJsonLd(html, data) {
  const tag = `<script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n</script>`;
  const pattern = /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}\n</head>`);
}

function standardizeFmbCo(html) {
  return html
    .replaceAll('FMB&amp;Co.', 'FMB&amp;CO.')
    .replaceAll('FMB&Co.', 'FMB&CO.')
    .replaceAll('FMB &amp; Co.', 'FMB&amp;CO.')
    .replaceAll('FMB & Co.', 'FMB&CO.');
}

async function transform(filePath, fn) {
  const html = await readFile(filePath, 'utf8');
  await writeFile(filePath, fn(html), 'utf8');
}

async function htmlFiles(directory, results = []) {
  let entries = [];
  try { entries = await readdir(directory, { withFileTypes: true }); } catch { return results; }
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await htmlFiles(fullPath, results);
    else if (entry.isFile() && entry.name.endsWith('.html')) results.push(fullPath);
  }
  return results;
}

function relationshipNote(name) {
  return `<p data-fmb-entity-relationship style="margin:18px auto 0;max-width:900px;padding:0 20px;text-align:center;font-size:12px;line-height:1.7;opacity:.72">${name} is part of FMB&amp;CO., founded by <a href="https://www.francinemariebautista.com/aboutfmb/">Francine Marie Bautista (FMB)</a>.</p>`;
}

function addRelationship(html, name) {
  if (html.includes('data-fmb-entity-relationship')) return html;
  const note = relationshipNote(name);
  return html.includes('</footer>') ? html.replace('</footer>', `${note}\n</footer>`) : html.replace('</body>', `${note}\n</body>`);
}

export async function applyEntityAuthority({ outputDirectory, privateSitesDirectory }) {
  const homepage = path.join(outputDirectory, 'index.html');
  await transform(homepage, html => {
    html = standardizeFmbCo(html);
    html = setTitle(html, 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin');
    html = setMeta(html, 'name', 'description', 'Official website of Francine Marie Bautista (FMB), founder of FMB&CO. Explore verified news, projects, reading, music, and ecosystem destinations.');
    html = setMeta(html, 'property', 'og:title', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin');
    html = setMeta(html, 'property', 'og:description', 'The official bulletin and ecosystem gateway of Francine Marie Bautista (FMB).');
    html = setMeta(html, 'name', 'twitter:title', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin');
    html = setMeta(html, 'name', 'twitter:description', 'Verified news, projects, reading, music, and ecosystem destinations from the official website of Francine Marie Bautista.');
    return replaceFirstJsonLd(html, {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': 'https://www.francinemariebautista.com/#website', url: 'https://www.francinemariebautista.com/', name: 'Francine Marie Bautista Official Digital Headquarters', alternateName: ['Official FMB Bulletin', 'Francine Marie Bautista Official Website'], description: 'The official website and public bulletin of Francine Marie Bautista.', inLanguage: 'en-PH', publisher: { '@id': PERSON_ID } },
        personEntity(),
        fmbCoEntity(),
      ],
    });
  });

  const about = path.join(outputDirectory, 'aboutfmb', 'index.html');
  await transform(about, html => {
    html = standardizeFmbCo(html).replace('<html lang="en">', '<html lang="en-PH">');
    html = setTitle(html, 'About Francine Marie Bautista (FMB) | Official Profile');
    html = setMeta(html, 'name', 'description', 'Official profile of Francine Marie Bautista (FMB), founder, strategist, creative director, and storyteller behind the FMB ecosystem.');
    html = setMeta(html, 'property', 'og:title', 'Francine Marie Bautista (FMB) | Official Profile');
    html = setMeta(html, 'property', 'og:description', 'The confirmed roles, projects, business relationships, and official inquiry route of Francine Marie Bautista (FMB).');
    html = setMeta(html, 'name', 'twitter:title', 'Francine Marie Bautista (FMB) | Official Profile');
    html = setMeta(html, 'name', 'twitter:description', 'Founder, strategist, creative director, and storyteller behind the FMB ecosystem.');
    html = html.replace('<h1 id="about-title">Francine Marie Bautista</h1>', '<h1 id="about-title">Francine Marie Bautista <span>(FMB)</span></h1>');
    return replaceFirstJsonLd(html, {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'ProfilePage', '@id': 'https://www.francinemariebautista.com/aboutfmb/#profile', url: 'https://www.francinemariebautista.com/aboutfmb/', name: 'Francine Marie Bautista (FMB) Official Profile', description: 'The confirmed roles, projects, business relationships, and official inquiry route of Francine Marie Bautista (FMB).', inLanguage: 'en-PH', dateModified: RELEASE_DATE, mainEntity: { '@id': PERSON_ID }, isPartOf: { '@id': 'https://www.francinemariebautista.com/#website' } },
        personEntity(),
        fmbCoEntity(),
      ],
    });
  });

  const fmbCo = path.join(outputDirectory, 'fmbandco', 'index.html');
  await transform(fmbCo, html => {
    html = standardizeFmbCo(html);
    html = setTitle(html, 'FMB&amp;CO. | Shaping What Comes Next.');
    html = setMeta(html, 'name', 'description', 'FMB&CO. is the founder-led company of SENZ and Cognita.');
    html = setMeta(html, 'property', 'og:title', 'FMB&CO. | Shaping What Comes Next.');
    html = setMeta(html, 'property', 'og:description', 'Meet FMB&CO., SENZ, and Cognita, with clear roles across one company.');
    return replaceFirstJsonLd(html, { '@context': 'https://schema.org', '@graph': [fmbCoEntity(), personEntity()] });
  });

  const homepageJs = path.join(outputDirectory, 'assets', 'js', 'fmb-bulletin-home.js');
  let js = await readFile(homepageJs, 'utf8');
  js = js
    .replaceAll("document.title='Francine Marie Bautista | FMB Ecosystem Bulletin, SENZ, Cognita & Yoni';", "document.title='Francine Marie Bautista (FMB) | Official Ecosystem Bulletin';")
    .replaceAll('The official FMB Ecosystem Bulletin of Francine Marie Bautista. Discover what is new from FMB&CO., SENZ marketing and digital solutions, Cognita AI learning, Yoni, public-interest news, books, music, cultural work, offers, and future applications.', 'Official website of Francine Marie Bautista (FMB), with verified news, projects, reading, music, and ecosystem destinations.')
    .replaceAll('The FMB Ecosystem Bulletin | What We Build and How We Help', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin')
    .replaceAll('FMB&Co.', 'FMB&CO.');
  if (!js.includes('function standardizeEntityLanguage()')) {
    const helper = `function standardizeEntityLanguage(){const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))node.nodeValue=node.nodeValue.split('FMB&Co.').join('FMB&CO.').split('FMB & Co.').join('FMB&CO.');}\n`;
    js = js.replace('async function apply(){', `${helper}async function apply(){`);
  }
  js = js.replace("document.body.classList.add('fmb-home-polished');updateHead();activateInteractions();", "document.body.classList.add('fmb-home-polished');standardizeEntityLanguage();updateHead();activateInteractions();");
  await writeFile(homepageJs, js, 'utf8');

  for (const filePath of await htmlFiles(outputDirectory)) {
    if (filePath.startsWith(privateSitesDirectory)) continue;
    await transform(filePath, html => standardizeFmbCo(html)
      .replaceAll('By Francine Marie Bautista</', 'By Francine Marie Bautista (FMB)</')
      .replaceAll('>Francine Marie Bautista</a>', '>Francine Marie Bautista (FMB)</a>')
      .replaceAll('"author":{"@type":"Person","name":"Francine Marie Bautista"', `"author":{"@type":"Person","@id":"${PERSON_ID}","name":"Francine Marie Bautista (FMB)"`)
      .replaceAll('"author": {"@type": "Person", "name": "Francine Marie Bautista"', `"author": {"@type": "Person", "@id": "${PERSON_ID}", "name": "Francine Marie Bautista (FMB)"`));
  }

  const senzRoot = path.join(privateSitesDirectory, 'senz');
  for (const filePath of await htmlFiles(senzRoot)) {
    await transform(filePath, html => {
      html = addRelationship(standardizeFmbCo(html).replaceAll('SENZ Strategic Communications', 'SENZ Marketing and Digital Solutions'), 'SENZ Marketing and Digital Solutions');
      if (filePath !== path.join(senzRoot, 'index.html')) return html;
      html = setTitle(html, 'SENZ Marketing and Digital Solutions | FMB&amp;CO.');
      html = setMeta(html, 'name', 'description', 'SENZ is the marketing and digital solutions business of FMB&CO.');
      return replaceFirstJsonLd(html, {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': 'https://www.senzpr.com/#organization', name: 'SENZ Marketing and Digital Solutions', alternateName: 'SENZ', url: 'https://www.senzpr.com/', logo: 'https://www.senzpr.com/assets/senz-original-mark.png', description: 'The marketing and digital solutions business of FMB&CO.', founder: { '@id': PERSON_ID }, parentOrganization: { '@id': FMBCO_ID } },
          { '@type': 'WebSite', '@id': 'https://www.senzpr.com/#website', url: 'https://www.senzpr.com/', name: 'SENZ Marketing and Digital Solutions', publisher: { '@id': 'https://www.senzpr.com/#organization' }, inLanguage: 'en-PH' },
          personEntity(),
          fmbCoEntity(),
        ],
      });
    });
  }

  const cognitaRoot = path.join(privateSitesDirectory, 'cognita');
  for (const filePath of await htmlFiles(cognitaRoot)) {
    await transform(filePath, html => {
      html = addRelationship(standardizeFmbCo(html), 'Cognita Institute of AI');
      if (filePath !== path.join(cognitaRoot, 'index.html')) return html;
      html = setMeta(html, 'name', 'description', 'Cognita is the knowledge and learning arm of FMB&CO.');
      if (html.includes('https://thecognitainstitute.com/#organization')) return html;
      const data = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'Organization', '@id': 'https://thecognitainstitute.com/#organization', name: 'Cognita', url: 'https://thecognitainstitute.com/', description: 'The knowledge and learning arm of FMB&CO.', founder: { '@id': PERSON_ID }, parentOrganization: { '@id': FMBCO_ID } },
        personEntity(),
        fmbCoEntity(),
      ] };
      return html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(data)}</script>\n</head>`);
    });
  }

  const sitemap = path.join(outputDirectory, 'sitemap.xml');
  try {
    let xml = await readFile(sitemap, 'utf8');
    for (const url of ['https://www.francinemariebautista.com/', 'https://www.francinemariebautista.com/aboutfmb/']) {
      const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const block = new RegExp(`(<url>[\\s\\S]*?<loc>${escaped}<\\/loc>[\\s\\S]*?)(<lastmod>[^<]+<\\/lastmod>)?([\\s\\S]*?<\\/url>)`, 'i');
      xml = xml.replace(block, (_all, start, _old, end) => `${start}<lastmod>${RELEASE_DATE}</lastmod>${end}`);
    }
    await writeFile(sitemap, xml, 'utf8');
  } catch {
    // Sitemap is optional in local builds.
  }
}
