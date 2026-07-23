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
let patchedAuth=false;
let patchedSettings=false;
for(const name of scripts){
  const scriptPath=path.join(assetsDirectory,name);
  let source=await readFile(scriptPath,'utf8');
  let changed=false;

  const authPattern=/queryFn:async\(\)=>\{try\{return\{user:await ([A-Za-z_$][\w$]*)\.auth\.me\(\),isAuthenticated:!0\}\}catch\{return\{user:null,isAuthenticated:!1\}\}\}/;
  const authMatch=source.match(authPattern);
  if(authMatch){
    const client=authMatch[1];
    const authReplacement=`queryFn:async()=>window.__FMB_COGNITA_STATIC_PREVIEW__?{user:null,isAuthenticated:!1}:(async()=>{try{return{user:await ${client}.auth.me(),isAuthenticated:!0}}catch{return{user:null,isAuthenticated:!1}}})()`;
    source=source.replace(authPattern,authReplacement);
    patchedAuth=true;
    changed=true;
  }

  const settingsNeedle='z=async()=>{if(p(!0),g(null),!bn.appId){b({type:"backend_not_configured",message:"The public website is available while applicant services are being configured."});return}';
  const settingsReplacement='z=async()=>{if(p(!0),g(null),window.__FMB_COGNITA_STATIC_PREVIEW__){b({type:"backend_not_configured",message:"The public website is available while applicant services are being configured."});return}if(!bn.appId){b({type:"backend_not_configured",message:"The public website is available while applicant services are being configured."});return}';
  if(source.includes(settingsNeedle)){
    source=source.replace(settingsNeedle,settingsReplacement);
    patchedSettings=true;
    changed=true;
  }

  if(changed)await writeFile(scriptPath,source,'utf8');
}
if(!patchedAuth)throw new Error('Unable to isolate Cognita authentication in the combined static preview.');
if(!patchedSettings)throw new Error('Unable to isolate Cognita public-settings lookup in the combined static preview.');
console.log('Prepared Cognita combined-build preview to render its public root without production-only authentication or settings calls.');
