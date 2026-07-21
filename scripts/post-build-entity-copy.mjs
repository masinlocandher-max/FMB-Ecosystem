import { readFile, writeFile } from 'node:fs/promises';
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

console.log('Final FMB entity relationship copy standardized.');
