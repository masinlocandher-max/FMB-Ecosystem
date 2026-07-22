import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=[
  ['index.html','home'],['aboutfmb/index.html','about'],['withlovefmb/index.html','withlove'],
  ['communityengagements/index.html','community'],['gethelp/index.html','help'],['news/index.html','news'],
  ['music/index.html','music'],['ebooks/index.html','ebooks'],['fmb&co/index.html','company'],
  ['fmb&co/senz/index.html','senz-gateway'],['fmb&co/cognita/index.html','cognita-gateway'],['app/install/index.html','yoni-install']
];
const version='20260722-enterprise-v1';

function resolveLocal(pageFile,html,href){
  const clean=href.split(/[?#]/)[0];
  if(!clean||/^(?:https?:|data:|blob:|\/\/)/i.test(clean))return;
  if(clean.startsWith('/'))return path.join(root,clean.replace(/^\//,''));
  const baseHref=html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if(baseHref&&!/^https?:/i.test(baseHref)){
    const base=baseHref.startsWith('/')?path.join(root,baseHref.replace(/^\//,'')):path.resolve(path.dirname(pageFile),baseHref);
    return path.resolve(base,clean);
  }
  return path.resolve(path.dirname(pageFile),clean);
}
function publicUrl(file){return `/${path.relative(root,file).replaceAll(path.sep,'/')}`;}
function rewriteCssUrls(css,sourceFile){
  return css
    .replace(/^\s*@charset\s+[^;]+;\s*/gim,'')
    .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi,(full,quote,value)=>{
      const trimmed=value.trim();
      if(!trimmed||/^(?:data:|https?:|blob:|\/\/|#)/i.test(trimmed))return full;
      const split=trimmed.search(/[?#]/);const pathname=split>=0?trimmed.slice(0,split):trimmed;const suffix=split>=0?trimmed.slice(split):'';
      const resolved=pathname.startsWith('/')?path.join(root,pathname.replace(/^\//,'')):path.resolve(path.dirname(sourceFile),pathname);
      return `url("${publicUrl(resolved)}${suffix}")`;
    });
}

for(const [relativePage,key] of pages){
  const pageFile=path.join(root,relativePage);let html=await readFile(pageFile,'utf8');
  const matches=[...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  const selected=[];
  for(const match of matches){
    const tag=match[0],href=match[1];
    if(/\bmedia=["'](?!all["'])/i.test(tag))continue;
    if(/^(?:https?:|\/\/)/i.test(href)||href.includes('fmb-network-optimized.css'))continue;
    const file=resolveLocal(pageFile,html,href);if(!file)continue;
    try{selected.push({tag,href,file,css:await readFile(file,'utf8')});}catch{}
  }
  if(selected.length<2)continue;
  const bundle=selected.map(item=>`/* ${item.href} */\n${rewriteCssUrls(item.css,item.file)}`).join('\n\n');
  const outputFile=path.join(root,'assets','css',`fmb-page-${key}.css`);
  await writeFile(outputFile,bundle,'utf8');
  const link=`<link rel="stylesheet" href="/assets/css/fmb-page-${key}.css?v=${version}">`;
  let inserted=false;
  for(const item of selected){
    if(!inserted){html=html.replace(item.tag,link);inserted=true;}
    else html=html.replace(item.tag,'');
  }
  await writeFile(pageFile,html,'utf8');
  console.log(`Bundled ${selected.length} stylesheets for ${relativePage}.`);
}
