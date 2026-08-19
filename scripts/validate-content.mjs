import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const appRoot = path.join(repositoryRoot, 'apps', 'withlovefmb');
const contentRoot = path.join(appRoot, 'content', 'news', 'articles');

const allowedCategories = new Set([
  'National',
  'World',
  'Business',
  'Technology',
  'Culture',
  'Environment',
  'Health',
  'Community',
  'Pageantry',
]);
const allowedArticleTypes = new Set(['NewsArticle', 'AnalysisNewsArticle', 'ReportageNewsArticle']);
const allowedImageKinds = new Set([
  'open-license-photo',
  'public-domain-photo',
  'publisher-supplied-photo',
  'editorial-fallback',
]);
const fallbackImage = '/assets/images/news/fmb-news-editorial-fallback.svg';
const unsafeUsagePattern = /reference image only|publication rights not verified|rights not verified|permission not verified/i;

async function walkJson(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkJson(target));
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(target);
  }
  return files.sort();
}

function requiredString(value, label, errors) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${label} is required`);
    return '';
  }
  return value.trim();
}

function validDate(value, label, errors) {
  const text = requiredString(value, label, errors);
  if (text && Number.isNaN(new Date(text).getTime())) errors.push(`${label} is not a valid date`);
}

function validHttpUrl(value, label, errors, { nullable = false } = {}) {
  if (nullable && value === null) return;
  const text = requiredString(value, label, errors);
  if (!text) return;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) errors.push(`${label} must use HTTP or HTTPS`);
  } catch {
    errors.push(`${label} is not a valid URL`);
  }
}

function validateArticle(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['article must be a JSON object'];

  if (raw.schemaVersion !== 1) errors.push('schemaVersion must be 1');
  if (raw.status !== 'published') errors.push('only status "published" belongs in the public feed');

  requiredString(raw.bulletinKey, 'bulletinKey', errors);
  requiredString(raw.emailSubject, 'emailSubject', errors);
  const slug = requiredString(raw.slug, 'slug', errors);
  if (slug && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 90)) {
    errors.push('slug must be lowercase hyphen-case and no longer than 90 characters');
  }
  requiredString(raw.headline, 'headline', errors);
  if (raw.seoTitle !== undefined) requiredString(raw.seoTitle, 'seoTitle', errors);
  if (raw.seoDescription !== undefined) requiredString(raw.seoDescription, 'seoDescription', errors);
  const category = requiredString(raw.category, 'category', errors);
  if (category && !allowedCategories.has(category)) errors.push(`unsupported category ${category}`);
  requiredString(raw.kicker, 'kicker', errors);
  requiredString(raw.deck, 'deck', errors);
  validDate(raw.publishedAt, 'publishedAt', errors);
  validDate(raw.updatedAt, 'updatedAt', errors);

  const articleType = requiredString(raw.articleType, 'articleType', errors);
  if (articleType && !allowedArticleTypes.has(articleType)) errors.push(`unsupported articleType ${articleType}`);

  const headings = [];
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    errors.push('at least one section is required');
  } else {
    raw.sections.forEach((section, sectionIndex) => {
      const prefix = `sections[${sectionIndex}]`;
      const heading = requiredString(section?.heading, `${prefix}.heading`, errors);
      if (heading) headings.push(heading);
      if (!Array.isArray(section?.paragraphs) || section.paragraphs.length === 0) {
        errors.push(`${prefix}.paragraphs must not be empty`);
      } else {
        section.paragraphs.forEach((paragraph, paragraphIndex) => {
          requiredString(paragraph, `${prefix}.paragraphs[${paragraphIndex}]`, errors);
        });
      }
    });
  }

  const editorialLens = [
    ['what happened', (heading) => /^what happened\b/i.test(heading)],
    ['context', (heading) => /\b(?:context|background)\b/i.test(heading)],
    ['why this matters', (heading) => /^why (?:this )?matters\b/i.test(heading)],
    ['what comes next', (heading) => /^(?:what (?:happens|comes) next|what to watch next)\b/i.test(heading)],
  ];
  for (const [label, matches] of editorialLens) {
    if (!headings.some(matches)) errors.push(`FMB News editorial lens is missing ${label}`);
  }

  if (!Array.isArray(raw.sources) || raw.sources.length === 0) {
    errors.push('at least one source is required');
  } else {
    raw.sources.forEach((source, sourceIndex) => {
      const prefix = `sources[${sourceIndex}]`;
      requiredString(source?.publisher, `${prefix}.publisher`, errors);
      requiredString(source?.title, `${prefix}.title`, errors);
      validDate(source?.publishedAt, `${prefix}.publishedAt`, errors);
      if (source?.dateLabel !== undefined && source?.dateLabel !== null) requiredString(source.dateLabel, `${prefix}.dateLabel`, errors);
      validHttpUrl(source?.url, `${prefix}.url`, errors);
    });
  }

  if (raw.faq !== undefined) {
    if (!Array.isArray(raw.faq) || raw.faq.length === 0) {
      errors.push('faq must be a non-empty array when provided');
    } else {
      raw.faq.forEach((item, itemIndex) => {
        const prefix = `faq[${itemIndex}]`;
        requiredString(item?.question, `${prefix}.question`, errors);
        requiredString(item?.answer, `${prefix}.answer`, errors);
      });
    }
  }

  if (raw.keywords !== undefined) {
    if (!Array.isArray(raw.keywords) || raw.keywords.length === 0) {
      errors.push('keywords must be a non-empty array when provided');
    } else {
      raw.keywords.forEach((keyword, keywordIndex) => requiredString(keyword, `keywords[${keywordIndex}]`, errors));
    }
  }

  const image = raw.image;
  if (!image || typeof image !== 'object' || Array.isArray(image)) {
    errors.push('image is required');
  } else {
    const imageKind = requiredString(image.kind, 'image.kind', errors);
    if (imageKind && !allowedImageKinds.has(imageKind)) errors.push(`unsupported image.kind ${imageKind}`);
    const imageUrl = requiredString(image.url, 'image.url', errors);
    if (imageUrl && !imageUrl.startsWith('/') && !/^https?:\/\//i.test(imageUrl)) errors.push('image.url is invalid');
    validHttpUrl(image.sourceUrl, 'image.sourceUrl', errors, { nullable: imageKind === 'editorial-fallback' });
    const usageStatus = requiredString(image.usageStatus, 'image.usageStatus', errors);
    if (usageStatus && unsafeUsagePattern.test(usageStatus) && imageKind !== 'editorial-fallback') {
      errors.push('unverified image rights require editorial-fallback');
    }
    if (imageKind === 'editorial-fallback' && imageUrl !== fallbackImage) {
      errors.push(`editorial-fallback must use ${fallbackImage}`);
    }
    requiredString(image.creator, 'image.creator', errors);
    requiredString(image.license, 'image.license', errors);
    validHttpUrl(image.licenseUrl, 'image.licenseUrl', errors);
    requiredString(image.credit, 'image.credit', errors);
    requiredString(image.caption, 'image.caption', errors);
    requiredString(image.alt, 'image.alt', errors);
    if (imageKind !== 'editorial-fallback') {
      for (const [name, value] of [['focusX', image.focusX], ['focusY', image.focusY]]) {
        if (!Number.isFinite(value) || value < 0 || value > 100) errors.push(`image.${name} must be a number from 0 to 100 for social-safe cropping`);
      }
    }
  }

  const audit = raw.audit && typeof raw.audit === 'object' && !Array.isArray(raw.audit) ? raw.audit : {};
  validDate(audit.sourceCheckedAt, 'audit.sourceCheckedAt', errors);
  if (audit.photoReferenceUrl !== null && audit.photoReferenceUrl !== undefined) {
    validHttpUrl(audit.photoReferenceUrl, 'audit.photoReferenceUrl', errors);
  }

  return errors;
}

const files = await walkJson(contentRoot);
const failures = [];
const slugs = new Map();

for (const file of files) {
  const relative = path.relative(repositoryRoot, file);
  let raw;
  try {
    raw = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    failures.push({ file: relative, errors: [`invalid JSON: ${error.message}`] });
    continue;
  }

  const errors = validateArticle(raw);
  if (typeof raw.slug === 'string' && raw.slug.trim()) {
    const slug = raw.slug.trim();
    if (slugs.has(slug)) errors.push(`duplicate slug also used by ${slugs.get(slug)}`);
    else slugs.set(slug, relative);
  }
  if (errors.length) failures.push({ file: relative, errors });
}

if (failures.length) {
  console.error(`FMB content validation failed: ${failures.length} of ${files.length} article file(s) have violations.`);
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    for (const error of failure.errors) console.error(`  - ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(`FMB content validation passed across ${files.length} article file(s).`);
}
