import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','news/index.html','music/index.html','ebooks/index.html','fmbandco/index.html','fmbandco/senz/index.html','fmbandco/cognita/index.html'];
const contact=`<aside class="fmb-network-contact network-reveal" aria-label="Official FMB contact channels">
  <div><small>Official channels</small><strong>Stay connected with FMB.</strong><p>Use these public channels for verified updates, messages, and professional inquiries.</p></div>
  <a href="https://www.instagram.com/bb.fmb/" target="_blank" rel="noopener"><span>Instagram</span><b>@bb.fmb</b></a>
  <a href="https://www.facebook.com/BinibiningFrancineMarie" target="_blank" rel="noopener"><span>Facebook</span><b>/BinibiningFrancineMarie</b></a>
  <a href="mailto:withlovefmb@gmail.com"><span>Email</span><b>withlovefmb@gmail.com</b></a>
</aside>`;

for(const relative of pages){
  const file=path.join(root,relative);
  let html=await readFile(file,'utf8');
  if(html.includes('class="fmb-network-contact'))continue;
  html=html.includes('<footer')?html.replace('<footer',`${contact}\n<footer`):html.replace('</body>',`${contact}\n</body>`);
  await writeFile(file,html,'utf8');
}
console.log(`Added official FMB contact channels to ${pages.length} public pages.`);
