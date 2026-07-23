import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=[
  ['index.html','home'],['aboutfmb/index.html','about'],['withlovefmb/index.html','withlove'],
  ['communityengagements/index.html','community'],['gethelp/index.html','help'],['news/index.html','news'],
  ['music/index.html','music'],['ebooks/index.html','ebooks'],['fmb&co/index.html','company'],
  ['fmb&co/senz/index.html','senz-gateway'],['fmb&co/cognita/index.html','cognita-gateway'],['app/install/index.html','yoni-install']
];
const version='20260723-visual-integrity-v3';
const integrityFile=path.join(root,'assets','css','fmb-visual-integrity.css');
let integrityCss='';
try{integrityCss=await readFile(integrityFile,'utf8');}catch{}

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
function resolveCssImport(sourceFile,href){
  const clean=href.split(/[?#]/)[0];
  if(!clean||/^(?:https?:|data:|blob:|\/\/)/i.test(clean))return;
  return clean.startsWith('/')?path.join(root,clean.replace(/^\//,'')):path.resolve(path.dirname(sourceFile),clean);
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
async function expandLocalImports(css,sourceFile,seen=new Set()){
  const key=path.resolve(sourceFile);
  if(seen.has(key))return '';
  seen.add(key);
  const pattern=/@import\s+(?:url\(\s*)?["']([^"']+)["']\s*\)?\s*([^;]*);/gi;
  let result='';
  let cursor=0;
  for(const match of css.matchAll(pattern)){
    result+=css.slice(cursor,match.index);
    const href=match[1];
    const media=(match[2]||'').trim();
    const importedFile=resolveCssImport(sourceFile,href);
    if(!importedFile){
      result+=match[0];
    }else{
      try{
        const imported=await readFile(importedFile,'utf8');
        const expanded=await expandLocalImports(imported,importedFile,seen);
        const rewritten=rewriteCssUrls(expanded,importedFile);
        result+=media?`@media ${media}{\n${rewritten}\n}`:`${rewritten}\n`;
      }catch{
        result+=match[0];
      }
    }
    cursor=(match.index||0)+match[0].length;
  }
  result+=css.slice(cursor);
  return result;
}

for(const [relativePage,key] of pages){
  const pageFile=path.join(root,relativePage);let html=await readFile(pageFile,'utf8');
  const matches=[...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  const selected=[];
  for(const match of matches){
    const tag=match[0],href=match[1];
    if(/\bmedia=["'](?!all["'])/i.test(tag))continue;
    if(/^(?:https?:|\/\/)/i.test(href)||href.includes('fmb-network-optimized.css')||href.includes('fmb-visual-integrity.css')||href.includes(`fmb-page-${key}.css`))continue;
    const file=resolveLocal(pageFile,html,href);if(!file)continue;
    try{
      const raw=await readFile(file,'utf8');
      const expanded=await expandLocalImports(raw,file,new Set());
      selected.push({tag,href,file,css:rewriteCssUrls(expanded,file)});
    }catch{}
  }
  if(!selected.length&&!integrityCss)continue;
  const bundleParts=selected.map(item=>`/* ${item.href} */\n${item.css}`);
  if(integrityCss)bundleParts.push(`/* final approved-logo visual integrity */\n${rewriteCssUrls(integrityCss,integrityFile)}`);
  const outputFile=path.join(root,'assets','css',`fmb-page-${key}.css`);
  await writeFile(outputFile,bundleParts.join('\n\n'),'utf8');
  const link=`<link rel="stylesheet" href="/assets/css/fmb-page-${key}.css?v=${version}" data-fmb-page-bundle="${key}">`;
  for(const item of selected)html=html.replace(item.tag,'');
  html=html.replace(new RegExp(`<link\\b[^>]*href=["']/assets/css/fmb-page-${key}\\.css[^"']*["'][^>]*>`,`gi`),'');
  html=html.replace('</head>',`${link}\n</head>`);
  await writeFile(pageFile,html,'utf8');
  console.log(`Bundled ${selected.length} page stylesheet(s), expanded local imports, and placed final visual-integrity rules last for ${relativePage}.`);
}
