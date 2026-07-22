import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = path.resolve('dist');
const oldCopy = 'The mother company for SENZ, Cognita, publishing, news, and founder-led ventures.';
const newCopy = 'The founder-led umbrella company and brand portfolio connecting SENZ, Cognita, publishing, news, applications, and public initiatives.';

for (const relativePath of ['index.html', 'assets/js/fmb-bulletin-home.js']) {
  const filePath = path.join(outputDirectory, relativePath);
  let content = await readFile(filePath, 'utf8');
  content = content.replaceAll(oldCopy, newCopy);
  await writeFile(filePath, content, 'utf8');
}

async function textFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await textFiles(full));
    else if (/\.(?:html|js|css|json|map)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const cognitaDirectory = path.join(outputDirectory, '_sites', 'cognita');
let cognitaFilesChanged = 0;
for (const filePath of await textFiles(cognitaDirectory)) {
  const before = await readFile(filePath, 'utf8');
  const after = before
    .replaceAll('"/assets/', '"/_sites/cognita/assets/')
    .replaceAll("'/assets/", "'/_sites/cognita/assets/")
    .replaceAll('url(/assets/', 'url(/_sites/cognita/assets/');
  if (after !== before) {
    await writeFile(filePath, after, 'utf8');
    cognitaFilesChanged += 1;
  }
}

console.log(`Final FMB entity relationship copy standardized and ${cognitaFilesChanged} copied Cognita file(s) were scoped to /_sites/cognita/.`);
