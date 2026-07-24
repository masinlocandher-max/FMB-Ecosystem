import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const dist=path.join(repositoryRoot,'dist');
const excludedPrefixes=['_sites/','app/','api/','auth/','admin/','data/','data-center/','yoni/'];
const excludedFiles=new Set(['admin.html','admin-activate.html','admin-login.html','login.html','signup.html','reset-password.html','confirm-email.html','auth.html','member.html','profile/index.html']);

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const relative=file=>path.relative(dist,file).replaceAll(path.sep,'/');
const isPublicFile=file=>{
  const name=relative(file);
  if(excludedFiles.has(name))return false;
  return !excludedPrefixes.some(prefix=>name.startsWith(prefix));
};

function removeMatchingElements(html,tagName,predicate){
  const openPattern=new RegExp(`<${tagName}\\b[^>]*>`,'ig');
  let cursor=0;
  while(true){
    openPattern.lastIndex=cursor;
    const opening=openPattern.exec(html);
    if(!opening)break;
    const start=opening.index;
    const tokenPattern=new RegExp(`<\\/?${tagName}\\b[^>]*>`,'ig');
    tokenPattern.lastIndex=openPattern.lastIndex;
    let depth=1;
    let closing;
    while(depth>0&&(closing=tokenPattern.exec(html))){
      if(new RegExp(`^<\\/${tagName}\\b`,'i').test(closing[0]))depth-=1;
      else depth+=1;
    }
    if(depth!==0)break;
    const end=tokenPattern.lastIndex;
    const block=html.slice(start,end);
    if(predicate(block,opening[0])){
      html=html.slice(0,start)+html.slice(end);
      cursor=start;
    }else{
      cursor=end;
    }
  }
  return html;
}

function removeMabayaniSurfaces(html){
  html=removeMatchingElements(html,'section',block=>/mabayani/i.test(block)&&(/class=["'][^"']*\bfeatured\b/i.test(block)||/id=["']featuredTitle["']/i.test(block)));
  html=removeMatchingElements(html,'article',block=>(/<h[1-6][^>]*>\s*Mabayani\s*<\/h[1-6]>/i.test(block)));
  html=removeMatchingElements(html,'a',(block,opening)=>/href=["']\/mabayani\/?["']/i.test(opening));
  return html;
}

function rewritePublicCopy(text){
  return text
    .replaceAll('Yoni, Mabayani, and With Love, FMB','Yoni and With Love, FMB')
    .replaceAll('Yoni, Mabayani and With Love, FMB','Yoni and With Love, FMB')
    .replaceAll('Yoni and Mabayani are separate FMB projects.','Yoni is a separate FMB project.')
    .replaceAll('Yoni and Mabayani','Yoni')
    .replaceAll('Mabayani and Sambal projects','Sambal cultural and language projects')
    .replaceAll('Mabayani or culture support','Sambal culture support')
    .replaceAll('Mabayani, heritage research','heritage research')
    .replaceAll('Mabayani, and future projects','future projects')
    .replaceAll('Mabayani, community programs','community programs')
    .replaceAll('Mabayani and With Love, FMB projects','With Love, FMB projects')
    .replaceAll('Yoni, Mabayani, FMB News','Yoni, FMB News')
    .replaceAll('Yoni, Mabayani, and With Love, FMB.','Yoni and With Love, FMB.')
    .replaceAll('Yoni, Mabayani, and With Love, FMB projects','Yoni and With Love, FMB projects')
    .replaceAll('Yoni, Mabayani, and With Love, FMB are presented','Yoni and With Love, FMB are presented')
    .replaceAll('SENZ, FMB&CO., With Love, FMB, Cognita, Mabayani, and Yoni','SENZ, FMB&CO., With Love, FMB, Cognita, and Yoni')
    .replaceAll('SENZ, FMB&amp;CO., With Love, FMB, Cognita, Mabayani, and Yoni','SENZ, FMB&amp;CO., With Love, FMB, Cognita, and Yoni')
    .replaceAll('Culture and heritage, Mabayani,','Culture and heritage,')
    .replaceAll('Mabayani, Sambal identity','Sambal identity')
    .replaceAll('Mabayani and Sambal','Sambal')
    .replaceAll('Mabayani or cultural','cultural')
    .replaceAll('Mabayani and cultural','cultural')
    .replaceAll('Mabayani, culture','culture')
    .replaceAll('Mabayani, heritage','heritage');
}

await rm(path.join(dist,'mabayani'),{recursive:true,force:true});

const allFiles=await walk(dist);
const publicFiles=allFiles.filter(isPublicFile);
let changed=0;

for(const file of publicFiles){
  const name=relative(file);
  if(name.endsWith('.html')){
    let html=await readFile(file,'utf8');
    const before=html;
    html=removeMabayaniSurfaces(html);
    html=rewritePublicCopy(html);
    html=html.replace(/<li[^>]*>\s*Mabayani\s*<\/li>/gi,'');
    html=html.replace(/<option[^>]*>\s*Mabayani\s*<\/option>/gi,'');
    if(name==='projects/index.html')html=html.replace(/(<a class="catalog-card[^>]*href="\/withlovefmb\/"[^>]*><span>)03(<\/span>)/i,'$102$2');
    if(html!==before){await writeFile(file,html,'utf8');changed+=1;}
    continue;
  }

  if(name.endsWith('.js')||name.endsWith('.json')||name.endsWith('.xml')){
    let text=await readFile(file,'utf8');
    const before=text;
    if(name==='sitemap.xml')text=text.replace(/\s*<url>[^<]*<loc>[^<]*\/mabayani\/?<\/loc>[\s\S]*?<\/url>/gi,'');
    text=rewritePublicCopy(text)
      .replace(/\{section:'Projects',title:'FMB Projects',href:'\/projects\/',summary:'[^']*',terms:'[^']*mabayani[^']*'\},?/gi,"{section:'Projects',title:'FMB Projects',href:'/projects/',summary:'Yoni and With Love, FMB.',terms:'projects yoni with love fmb'},")
      .replace(/mabayani\s*/gi,'');
    if(text!==before){await writeFile(file,text,'utf8');changed+=1;}
  }
}

for(const cssFile of allFiles.filter(file=>isPublicFile(file)&&relative(file).endsWith('.css'))){
  let css=await readFile(cssFile,'utf8');
  const before=css;
  css=css
    .replace(/body\.fmb-approved-launch \.brand-card\.mabayani-card\s*\{[^}]*\}/gi,'')
    .replace(/\.mabayani-project\s*\{[^}]*\}/gi,'')
    .replace(/\.mini-art\.mabayani\s*\{[^}]*\}/gi,'');
  if(css!==before){await writeFile(cssFile,css,'utf8');changed+=1;}
}

const remaining=[];
for(const file of (await walk(dist)).filter(isPublicFile)){
  const name=relative(file);
  if(!/\.(?:html|js|json|xml)$/i.test(name))continue;
  const text=await readFile(file,'utf8');
  if(/mabayani|\/mabayani\//i.test(text))remaining.push(name);
}
if(remaining.length)throw new Error(`Mabayani remains in current public launch output: ${remaining.join(', ')}`);

console.log(`Excluded Mabayani from the current public launch, removed its public route, and cleaned ${changed} generated file(s). Archived source files remain intact for a future release.`);
