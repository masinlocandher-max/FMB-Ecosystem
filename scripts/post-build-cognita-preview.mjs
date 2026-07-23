import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const cognitaRoot=path.join(root,'_sites','cognita');
const file=path.join(cognitaRoot,'index.html');
const assetsDirectory=path.join(cognitaRoot,'assets');
await mkdir(assetsDirectory,{recursive:true});

const learningVisual=`<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1125" viewBox="0 0 1800 1125" role="img" aria-labelledby="title desc">
<title id="title">Cognita artificial intelligence learning interface</title>
<desc id="desc">A dark blue learning workspace with a laptop, neural-network nodes, lesson cards, and structured AI study pathways.</desc>
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#030817"/><stop offset=".55" stop-color="#071426"/><stop offset="1" stop-color="#03101d"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="44%" r="58%"><stop stop-color="#35c7ff" stop-opacity=".22"/><stop offset="1" stop-color="#35c7ff" stop-opacity="0"/></radialGradient>
  <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0d2945"/><stop offset="1" stop-color="#071321"/></linearGradient>
  <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#40d6ff"/><stop offset="1" stop-color="#1a9be8"/></linearGradient>
  <filter id="blur"><feGaussianBlur stdDeviation="18"/></filter>
  <filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="32" flood-color="#000" flood-opacity=".55"/></filter>
</defs>
<rect width="1800" height="1125" rx="72" fill="url(#bg)"/>
<rect width="1800" height="1125" rx="72" fill="url(#glow)"/>
<g opacity=".18" stroke="#6edcff" stroke-width="1">
  <path d="M0 160H1800M0 320H1800M0 480H1800M0 640H1800M0 800H1800M0 960H1800"/>
  <path d="M180 0V1125M360 0V1125M540 0V1125M720 0V1125M900 0V1125M1080 0V1125M1260 0V1125M1440 0V1125M1620 0V1125"/>
</g>
<circle cx="900" cy="520" r="420" fill="#1ebeff" opacity=".08" filter="url(#blur)"/>
<g fill="none" stroke="#49d8ff" stroke-opacity=".48" stroke-width="4">
  <path d="M250 310L470 220L655 330L900 190L1120 315L1370 230L1560 390"/>
  <path d="M250 815L470 900L670 785L900 935L1120 790L1380 905L1570 750"/>
  <path d="M470 220L470 900M655 330L670 785M900 190L900 935M1120 315L1120 790M1370 230L1380 905" stroke-opacity=".22"/>
</g>
<g fill="#7ce5ff">
  <circle cx="250" cy="310" r="14"/><circle cx="470" cy="220" r="18"/><circle cx="655" cy="330" r="13"/><circle cx="900" cy="190" r="20"/><circle cx="1120" cy="315" r="14"/><circle cx="1370" cy="230" r="17"/><circle cx="1560" cy="390" r="13"/>
  <circle cx="250" cy="815" r="13"/><circle cx="470" cy="900" r="17"/><circle cx="670" cy="785" r="14"/><circle cx="900" cy="935" r="20"/><circle cx="1120" cy="790" r="14"/><circle cx="1380" cy="905" r="17"/><circle cx="1570" cy="750" r="13"/>
</g>
<g filter="url(#shadow)">
  <rect x="495" y="260" width="810" height="520" rx="38" fill="#020713" stroke="#3bcaff" stroke-opacity=".55" stroke-width="5"/>
  <rect x="535" y="302" width="730" height="435" rx="24" fill="url(#screen)"/>
  <rect x="438" y="780" width="924" height="65" rx="30" fill="#121b2a" stroke="#7bdfff" stroke-opacity=".24" stroke-width="3"/>
  <path d="M700 845H1100L1048 884H752Z" fill="#07111f"/>
</g>
<g transform="translate(585 350)">
  <rect width="630" height="76" rx="18" fill="#0a1d31" stroke="#50d7ff" stroke-opacity=".35"/>
  <circle cx="38" cy="38" r="13" fill="#45d6ff"/><rect x="72" y="22" width="190" height="13" rx="6.5" fill="#d8f7ff" opacity=".9"/><rect x="72" y="45" width="126" height="9" rx="4.5" fill="#77b4ce" opacity=".65"/>
  <rect x="492" y="20" width="110" height="36" rx="18" fill="url(#cyan)"/>
  <g transform="translate(0 108)">
    <rect width="300" height="205" rx="24" fill="#081827" stroke="#3dcfff" stroke-opacity=".28"/>
    <text x="28" y="42" fill="#6fe1ff" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="3">LEARNING PATH</text>
    <rect x="28" y="70" width="210" height="14" rx="7" fill="#ecfbff" opacity=".9"/><rect x="28" y="102" width="238" height="10" rx="5" fill="#61879b" opacity=".62"/><rect x="28" y="126" width="190" height="10" rx="5" fill="#61879b" opacity=".42"/>
    <rect x="28" y="166" width="244" height="14" rx="7" fill="#112d42"/><rect x="28" y="166" width="164" height="14" rx="7" fill="url(#cyan)"/>
    <g transform="translate(330 0)">
      <rect width="300" height="205" rx="24" fill="#081827" stroke="#3dcfff" stroke-opacity=".28"/>
      <circle cx="150" cy="94" r="55" fill="#0d2b43" stroke="#48d8ff" stroke-width="3"/>
      <circle cx="150" cy="94" r="18" fill="#58ddff"/><g fill="#90ebff"><circle cx="92" cy="61" r="8"/><circle cx="208" cy="61" r="8"/><circle cx="92" cy="127" r="8"/><circle cx="208" cy="127" r="8"/></g>
      <g stroke="#66e0ff" stroke-width="3"><path d="M104 68L135 86M196 68L165 86M104 120L135 102M196 120L165 102"/></g>
      <text x="92" y="180" fill="#d8f7ff" font-family="Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2">AI SYSTEMS</text>
    </g>
  </g>
</g>
<g font-family="Arial, sans-serif">
  <text x="92" y="103" fill="#83e5ff" font-size="24" font-weight="700" letter-spacing="7">COGNITA OPEN LEARNING</text>
  <text x="92" y="151" fill="#dff9ff" font-size="18" letter-spacing="4" opacity=".78">STRUCTURED • SELF-PACED • PURPOSE-DRIVEN</text>
  <text x="1350" y="1020" fill="#79def9" font-size="20" font-weight="700" letter-spacing="4">AI • ETHICS • SYSTEMS</text>
</g>
</svg>`;
await writeFile(path.join(assetsDirectory,'cognita-learning-visual.svg'),learningVisual,'utf8');

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

const scripts=(await readdir(assetsDirectory)).filter(name=>/^index-.*\.js$/.test(name));
let patchedAuth=false;
let patchedSettings=false;
let patchedVisual=false;
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

  const adobeVisual='https://platform-cs-jpn3.adobe.io/rendition/id/urn:aaid:sc:AP:a1a702e3-e43a-4327-af47-8185842cbdf4?size=1800';
  if(source.includes(adobeVisual)){
    source=source
      .replaceAll(adobeVisual,'./assets/cognita-learning-visual.svg')
      .replaceAll('Cognita self-paced learner studying artificial intelligence on an HP laptop in a focused home learning environment.','Cognita self-paced artificial intelligence learning interface.');
    patchedVisual=true;
    changed=true;
  }

  if(changed)await writeFile(scriptPath,source,'utf8');
}
if(!patchedAuth)throw new Error('Unable to isolate Cognita authentication in the combined static preview.');
if(!patchedSettings)throw new Error('Unable to isolate Cognita public-settings lookup in the combined static preview.');
if(!patchedVisual)throw new Error('Unable to replace the external Cognita hero visual with the local learning graphic.');
console.log('Prepared Cognita with a local AI learning visual and a combined preview free of production-only authentication or settings calls.');
