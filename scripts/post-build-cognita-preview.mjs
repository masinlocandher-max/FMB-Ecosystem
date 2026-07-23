import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const cognitaRoot=path.join(root,'_sites','cognita');
const file=path.join(cognitaRoot,'index.html');
let html=await readFile(file,'utf8');
const marker='data-fmb-cognita-combined-preview';
if(!html.includes(marker)){
  const bootstrap=`<script ${marker}>(function(){
    if(!location.pathname.startsWith('/_sites/cognita'))return;
    window.__FMB_COGNITA_STATIC_PREVIEW__=true;
    var base=document.createElement('base');
    base.href='/_sites/cognita/';
    document.head.prepend(base);
    history.replaceState(null,'','/?app_id=fmb-cognita-preview&analytics-enable=false');
  })();</script>`;
  html=html.replace('<head>',`<head>${bootstrap}`);
  await writeFile(file,html,'utf8');
}

const assetsDirectory=path.join(cognitaRoot,'assets');
const scripts=(await readdir(assetsDirectory)).filter(name=>/^index-.*\.js$/.test(name));
let patched=false;
for(const name of scripts){
  const scriptPath=path.join(assetsDirectory,name);
  let source=await readFile(scriptPath,'utf8');
  const pattern=/queryFn:async\(\)=>\{try\{return\{user:await ([A-Za-z_$][\w$]*)\.auth\.me\(\),isAuthenticated:!0\}\}catch\{return\{user:null,isAuthenticated:!1\}\}\}/;
  const match=source.match(pattern);
  if(!match)continue;
  const client=match[1];
  const replacement=`queryFn:async()=>window.__FMB_COGNITA_STATIC_PREVIEW__?{user:null,isAuthenticated:!1}:(async()=>{try{return{user:await ${client}.auth.me(),isAuthenticated:!0}}catch{return{user:null,isAuthenticated:!1}}})()`;
  source=source.replace(pattern,replacement);
  await writeFile(scriptPath,source,'utf8');
  patched=true;
  break;
}
if(!patched)throw new Error('Unable to isolate Cognita authentication in the combined static preview.');
console.log('Prepared Cognita combined-build preview to render its public root without production-only authentication calls.');
