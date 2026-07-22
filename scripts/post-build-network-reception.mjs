import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmb&co/index.html','fmb&co/senz/index.html','fmb&co/cognita/index.html'];
const stylesheet='/assets/css/az-assistant.css?v=20260720-az-website-only-v1';
const script='/assets/js/az-assistant.js?v=20260722-pearly-network-v2';

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  if(!html.includes('/assets/css/az-assistant.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${stylesheet}">\n</head>`);
  if(!html.includes('/assets/js/az-assistant.js'))html=html.replace('</body>',`<script src="${script}" defer></script>\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`Enabled Pearly Reception Desk on ${pages.length} public pages.`);
