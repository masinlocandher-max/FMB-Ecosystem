import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const file=path.join(root,'_sites','cognita','index.html');
let html=await readFile(file,'utf8');
const marker='data-fmb-cognita-combined-preview';
if(!html.includes(marker)){
  const bootstrap=`<script ${marker}>(function(){
    if(!location.pathname.startsWith('/_sites/cognita'))return;
    var base=document.createElement('base');
    base.href='/_sites/cognita/';
    document.head.prepend(base);
    try{localStorage.setItem('analytics-enable','false')}catch(error){}
    history.replaceState(null,'','/?app_id=fmb-cognita-preview');
  })();</script>`;
  html=html.replace('<head>',`<head>${bootstrap}`);
  await writeFile(file,html,'utf8');
}
console.log('Prepared Cognita combined-build preview to render its public root while preserving internal asset paths.');
