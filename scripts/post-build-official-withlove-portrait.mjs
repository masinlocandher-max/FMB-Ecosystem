import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const file=path.resolve(new URL('../dist/withlovefmb/index.html',import.meta.url).pathname);
let html=await readFile(file,'utf8');
const pattern=/(<div class="wlf-portrait-frame">)\s*<img\b[^>]*>(\s*<\/div>)/i;
if(!pattern.test(html))throw new Error('With Love founder portrait frame was not found. Volunteer imagery was not inspected or modified.');
html=html.replace(pattern,`$1<img class="wlf-portrait fmb-exact-founder-image" data-fmb-portrait="seated-landscape-exact" src="/assets/images/fmb-approved/francine-seated-landscape.webp" width="1364" height="768" loading="eager" decoding="async" fetchpriority="high" alt="Francine Marie Bautista in the exact supplied seated landscape portrait">$2`);
await writeFile(file,html,'utf8');
console.log('Applied the exact Adobe-verified seated landscape portrait only to the With Love founder frame. Volunteer imagery remains unchanged.');
