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
  description: 'Filipina brand strategist, creative director, communications practitioner, educator, entrepreneur, advocate, and founder of FMB&Co. from Masinloc, Zambales.',
  jobTitle: ['Founder of FMB&Co.', 'Brand Strategist', 'Creative Director', 'Communications Practitioner', 'Educator', 'Entrepreneur'],
  nationality: { '@type': 'Country', name: 'Philippines' },
  homeLocation: {
    '@type': 'Place',
    name: 'Masinloc, Zambales, Philippines',
    address: { '@type': 'PostalAddress', addressLocality: 'Masinloc', addressRegion: 'Zambales', addressCountry: 'PH' },
  },
  knowsAbout: ['Brand Strategy', 'Creative Direction', 'Strategic Communications', 'Public Relations', 'Reputation and Perception Management', 'Digital Strategy', 'Photography', 'Education', 'Culture', 'Community Development'],
  worksFor: { '@id': FMBCO_ID },
  sameAs: ['https://www.instagram.com/bb.fmb/'],
});

const fmbCoEntity = () => ({
  '@type': 'Organization',
  '@id': FMBCO_ID,
  name: 'FMB&Co.',
  alternateName: ['FMB and Company', 'FMB&CO.'],
  url: 'https://www.francinemariebautista.com/fmb&co/',
  description: 'The founder-led umbrella company and brand portfolio behind SENZ Marketing and Digital Solutions, Cognita Institute of AI, publishing, media, applications, and public-interest initiatives.',
  founder: { '@id': PERSON_ID },
  subOrganization: [
    { '@type': 'Organization', '@id': 'https://www.senzpr.com/#organization', name: 'SENZ Marketing and Digital Solutions', url: 'https://www.senzpr.com/' },
    { '@type': 'EducationalOrganization', '@id': 'https://thecognitainstitute.com/#organization', name: 'Cognita Institute of AI', url: 'https://thecognitainstitute.com/' },
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
    .replaceAll('FMB&amp;CO.', 'FMB&amp;Co.')
    .replaceAll('FMB&CO.', 'FMB&Co.')
    .replaceAll('FMB &amp; Co.', 'FMB&amp;Co.')
    .replaceAll('FMB & Co.', 'FMB&Co.');
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
  return `<p data-fmb-entity-relationship style="margin:18px auto 0;max-width:900px;padding:0 20px;text-align:center;font-size:12px;line-height:1.7;opacity:.72">${name} is part of the FMB&amp;Co. portfolio, founded by <a href="https://www.francinemariebautista.com/aboutfmb/">Francine Marie Bautista (FMB)</a>.</p>`;
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
    html = setMeta(html, 'name', 'description', 'Official website of Francine Marie Bautista (FMB), founder of FMB&Co. Explore SENZ, Cognita, Yoni, new applications, news, books, music and public work.');
    html = setMeta(html, 'property', 'og:title', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin');
    html = setMeta(html, 'property', 'og:description', 'The official ecosystem bulletin of Francine Marie Bautista (FMB), founder of FMB&Co., SENZ, Cognita and Yoni.');
    html = setMeta(html, 'name', 'twitter:title', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin');
    html = setMeta(html, 'name', 'twitter:description', 'New applications, company updates, news, books, music and public initiatives from Francine Marie Bautista (FMB) and FMB&Co.');
    html = html.replace(/<p class="hero-lede">[\s\S]*?<\/p>/i, '<p class="hero-lede">The official website and ecosystem bulletin of Francine Marie Bautista (FMB), founder of FMB&amp;Co. Discover what we build, what is new, and where SENZ, Cognita, Yoni, publishing, culture, media, and public support can help.</p>');
    return replaceFirstJsonLd(html, {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': 'https://www.francinemariebautista.com/#website', url: 'https://www.francinemariebautista.com/', name: 'Francine Marie Bautista (FMB) Official Ecosystem Bulletin', alternateName: ['The FMB Ecosystem Bulletin', 'Francine Marie Bautista Official Website'], description: 'The official website, portfolio, release desk, and public bulletin of Francine Marie Bautista (FMB) and the FMB&Co. ecosystem.', inLanguage: 'en-PH', publisher: { '@id': PERSON_ID } },
        personEntity(),
        fmbCoEntity(),
      ],
    });
  });

  const about = path.join(outputDirectory, 'aboutfmb', 'index.html');
  await transform(about, html => {
    html = standardizeFmbCo(html).replace('<html lang="en">', '<html lang="en-PH">');
    html = setTitle(html, 'Francine Marie Bautista (FMB) | Founder, Strategist &amp; Creative Director');
    html = setMeta(html, 'name', 'description', 'Official profile of Francine Marie Bautista (FMB), Filipina founder of FMB&Co., brand strategist, creative director, communications practitioner, educator and entrepreneur from Masinloc, Zambales.');
    html = setMeta(html, 'property', 'og:title', 'Francine Marie Bautista (FMB) | Official Profile');
    html = setMeta(html, 'property', 'og:description', 'The definitive profile, professional background, founder relationships, selected work and official channels of Francine Marie Bautista (FMB).');
    html = setMeta(html, 'name', 'twitter:title', 'Francine Marie Bautista (FMB) | Official Profile');
    html = setMeta(html, 'name', 'twitter:description', 'Founder of FMB&Co., strategist, creative director, communications practitioner, educator and entrepreneur from Masinloc, Zambales.');
    html = html.replace('<h1 id="about-title">Francine Marie Bautista</h1>', '<h1 id="about-title">Francine Marie Bautista <span>(FMB)</span></h1>');
    html = html.replace(/<p class="fco-lead">A Filipina transgender woman,[\s\S]*?<\/p>/i, '<p class="fco-lead">A Filipina strategist, creative director, communications practitioner, educator, entrepreneur, advocate, Zambale&ntilde;a, Masinloque&ntilde;a, and founder of FMB&amp;Co.</p>');
    html = html.replace('<h3>Clear work can still feel deeply human.</h3>', '<h3>The definitive public profile of Francine Marie Bautista (FMB).</h3>');
    html = html.replace('<p>Francine Marie Bautista turns complex ideas into clear stories, useful systems, and experiences people can understand. She studies what an audience needs to know, what a project must stand for, and how every part should work together.</p>', '<p>Francine Marie Bautista (FMB) is a Filipina brand strategist, creative director, communications practitioner, educator, entrepreneur, photographer, storyteller, and advocate from Masinloc, Zambales. She turns complex ideas into clear stories, useful systems, and experiences people can understand.</p><p>She founded FMB&amp;Co., the umbrella company and brand portfolio behind SENZ Marketing and Digital Solutions and Cognita Institute of AI. Her wider work includes Yoni, With love, FMB, publishing, music, cultural research, public-interest reporting, and community initiatives.</p>');
    return replaceFirstJsonLd(html, {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'ProfilePage', '@id': 'https://www.francinemariebautista.com/aboutfmb/#profile', url: 'https://www.francinemariebautista.com/aboutfmb/', name: 'Francine Marie Bautista (FMB) Official Profile', description: 'The definitive profile, professional background, founder relationships, selected work and official channels of Francine Marie Bautista (FMB).', inLanguage: 'en-PH', dateModified: RELEASE_DATE, mainEntity: { '@id': PERSON_ID }, isPartOf: { '@id': 'https://www.francinemariebautista.com/#website' } },
        personEntity(),
        fmbCoEntity(),
      ],
    });
  });

  const fmbCo = path.join(outputDirectory, 'fmb&co', 'index.html');
  await transform(fmbCo, html => {
    html = standardizeFmbCo(html).replaceAll('SENZ Strategic Communications', 'SENZ Marketing and Digital Solutions');
    html = setTitle(html, 'FMB&amp;Co. | Founder-Led Company and Brand Portfolio');
    html = setMeta(html, 'name', 'description', 'FMB&Co. is the founder-led umbrella company and brand portfolio of Francine Marie Bautista (FMB), connecting SENZ, Cognita, applications, publishing, media and public initiatives.');
    html = setMeta(html, 'property', 'og:title', 'FMB&Co. | Founder-Led Company and Brand Portfolio');
    html = setMeta(html, 'property', 'og:description', 'The founder-led umbrella company and brand portfolio behind SENZ Marketing and Digital Solutions, Cognita Institute of AI and the wider FMB ecosystem.');
    html = html.replace('The corporate company within the With Love, FMB platform', 'Founded by Francine Marie Bautista (FMB)');
    html = html.replace(/<p class="fco-lead">FMB&amp;Co\. is a strategy-led company[\s\S]*?<\/p>/i, '<p class="fco-lead">FMB&amp;Co. is the founder-led umbrella company and brand portfolio of Francine Marie Bautista (FMB). It connects SENZ Marketing and Digital Solutions, Cognita Institute of AI, applications, publishing, media, cultural work, and public initiatives while keeping each brand distinct.</p>');
    html = html.replace('Part of the With Love, FMB platform.', 'Founded by Francine Marie Bautista (FMB).');
    return replaceFirstJsonLd(html, { '@context': 'https://schema.org', '@graph': [fmbCoEntity(), personEntity()] });
  });

  const homepageJs = path.join(outputDirectory, 'assets', 'js', 'fmb-bulletin-home.js');
  let js = await readFile(homepageJs, 'utf8');
  js = js
    .replaceAll("document.title='Francine Marie Bautista | FMB Ecosystem Bulletin, SENZ, Cognita & Yoni';", "document.title='Francine Marie Bautista (FMB) | Official Ecosystem Bulletin';")
    .replaceAll('The official FMB Ecosystem Bulletin of Francine Marie Bautista. Discover what is new from FMB&CO., SENZ marketing and digital solutions, Cognita AI learning, Yoni, public-interest news, books, music, cultural work, offers, and future applications.', 'Official website of Francine Marie Bautista (FMB), founder of FMB&Co. Explore SENZ, Cognita, Yoni, new applications, news, books, music and public work.')
    .replaceAll('The FMB Ecosystem Bulletin | What We Build and How We Help', 'Francine Marie Bautista (FMB) | Official Ecosystem Bulletin')
    .replaceAll('FMB&CO.', 'FMB&Co.');
  if (!js.includes('function standardizeEntityLanguage()')) {
    const helper = `function standardizeEntityLanguage(){const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))node.nodeValue=node.nodeValue.split('FMB&CO.').join('FMB&Co.').split('FMB & Co.').join('FMB&Co.');const lede=document.querySelector('.hero-lede');if(lede)lede.textContent='The official website and ecosystem bulletin of Francine Marie Bautista (FMB), founder of FMB&Co. Discover what we build, what is new, and where SENZ, Cognita, Yoni, publishing, culture, media, and public support can help.';}\n`;
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
      html = setTitle(html, 'SENZ Marketing and Digital Solutions | FMB&amp;Co.');
      html = setMeta(html, 'name', 'description', 'SENZ Marketing and Digital Solutions, part of the FMB&Co. portfolio founded by Francine Marie Bautista (FMB), provides PR, branding, marketing, strategic communications and digital solutions.');
      return replaceFirstJsonLd(html, {
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'Organization', '@id': 'https://www.senzpr.com/#organization', name: 'SENZ Marketing and Digital Solutions', alternateName: ['SENZ', 'SENZ Strategic Communications'], url: 'https://www.senzpr.com/', logo: 'https://www.senzpr.com/assets/senz-original-mark.png', description: 'A founder-led marketing, public relations, strategic communications, branding, content, and digital solutions company in the Philippines.', email: 'info.senz.pr@gmail.com', founder: { '@id': PERSON_ID }, parentOrganization: { '@id': FMBCO_ID }, areaServed: { '@type': 'Country', name: 'Philippines' }, sameAs: ['https://www.instagram.com/senz.pr', 'https://www.facebook.com/share/1BM7Etwi9R/', 'https://www.tiktok.com/@senz.pr'] },
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
      html = setMeta(html, 'name', 'description', 'Cognita Institute of AI, part of the FMB&Co. portfolio founded by Francine Marie Bautista (FMB), provides practical, responsible and human-centered AI learning.');
      if (html.includes('https://thecognitainstitute.com/#organization')) return html;
      const data = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'EducationalOrganization', '@id': 'https://thecognitainstitute.com/#organization', name: 'Cognita Institute of AI', url: 'https://thecognitainstitute.com/', description: 'A professional learning platform for practical, responsible, and human-centered artificial intelligence education.', founder: { '@id': PERSON_ID }, parentOrganization: { '@id': FMBCO_ID } },
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
