import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file=path.resolve('dist/fmbandco/index.html');
let html=await readFile(file,'utf8');
html=html
  .replace('<img src="/assets/images/projects/senz-logo-clean.png" alt="SENZ">','<img src="/assets/images/projects/senz-logo-clean.png" alt="SENZ" loading="lazy" decoding="async">')
  .replace('<img src="/assets/images/projects/cognita-logo-clean.png" alt="Cognita">','<img src="/assets/images/projects/cognita-logo-clean.png" alt="Cognita" loading="lazy" decoding="async">');
await writeFile(file,html,'utf8');
console.log('Kept strategic company logos within the eager-image performance budget.');