import { readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const pages=['index.html','aboutfmb/index.html','withlovefmb/index.html','communityengagements/index.html','gethelp/index.html','news/index.html','music/index.html','ebooks/index.html','fmbandco/index.html','fmbandco/senz/index.html','fmbandco/cognita/index.html','app/install/index.html'];
const errors=[];
const results=[];

function resolveLocal(pageFile,html,value){
  const clean=value.replaceAll('&amp;','&').split(/[?#]/)[0];
  if(!clean||/^(?:https?:|data:|blob:|mailto:|tel:)/i.test(clean))return;
  if(clean.startsWith('/'))return path.join(root,clean.replace(/^\//,''));
  const baseHref=html.match(/<base\b[^>]*href=["']([^"']+)["']/i)?.[1];
  if(baseHref&&!/^https?:/i.test(baseHref)){
    const base=baseHref.startsWith('/')?path.join(root,baseHref.replace(/^\//,'')):path.resolve(path.dirname(pageFile),baseHref);
    return path.resolve(base,clean);
  }
  return path.resolve(path.dirname(pageFile),clean);
}
async function totalBytes(files){let total=0;for(const file of new Set(files)){try{const info=await stat(file);if(info.isFile())total+=info.size;}catch{}}return total;}

for(const page of pages){
  const pageFile=path.join(root,page);const html=await readFile(pageFile,'utf8');
  const styles=[...html.matchAll(/<link\b[^>]*rel=["'][^"']*stylesheet[^"']*["'][^>]*href=["']([^"']+)["'][^>]*>/gi)].map(match=>match[1]);
  const scripts=[...html.matchAll(/<script\b(?![^>]*type=["']application\/ld\+json["'])[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi)].map(match=>match[1]);
  const localStyles=styles.map(value=>resolveLocal(pageFile,html,value)).filter(Boolean);
  const localScripts=scripts.map(value=>resolveLocal(pageFile,html,value)).filter(Boolean);
  const cssBytes=await totalBytes(localStyles);const jsBytes=await totalBytes(localScripts);
  const preloadCount=(html.match(/<link\b[^>]*rel=["']preload["']/gi)||[]).length;
  const highPriorityImages=(html.match(/<img\b[^>]*fetchpriority=["']high["']/gi)||[]).length;
  const eagerImages=[...html.matchAll(/<img\b[^>]*>/gi)].filter(match=>!/\sloading=["']lazy["']/i.test(match[0])).length;
  const duplicateStyles=styles.filter((item,index)=>styles.indexOf(item)!==index);
  const duplicateScripts=scripts.filter((item,index)=>scripts.indexOf(item)!==index);
  const head=html.split('</head>')[0]||'';
  const blockingHeadScripts=[...head.matchAll(/<script\b(?![^>]*type=["']application\/ld\+json["'])(?![^>]*(?:defer|async|type=["']module["']))[^>]*src=["'][^"']+["'][^>]*>/gi)].length;
  const pageErrors=[];
  const fail=message=>{pageErrors.push(message);errors.push(`${page}: ${message}`);};
  if(styles.length>8)fail(`too many stylesheets (${styles.length}; budget 8)`);
  if(scripts.length>10)fail(`too many scripts (${scripts.length}; budget 10)`);
  if(cssBytes>600_000)fail(`local CSS payload is ${cssBytes} bytes; budget 600000`);
  if(jsBytes>900_000)fail(`local JavaScript payload is ${jsBytes} bytes; budget 900000`);
  if(Buffer.byteLength(html)>250_000)fail(`HTML payload is ${Buffer.byteLength(html)} bytes; budget 250000`);
  if(preloadCount>4)fail(`too many preloads (${preloadCount}; budget 4)`);
  if(highPriorityImages>1)fail(`more than one high-priority image (${highPriorityImages})`);
  if(eagerImages>8)fail(`too many eager images (${eagerImages}; budget 8)`);
  if(duplicateStyles.length)fail(`duplicate stylesheets: ${[...new Set(duplicateStyles)].join(', ')}`);
  if(duplicateScripts.length)fail(`duplicate scripts: ${[...new Set(duplicateScripts)].join(', ')}`);
  if(blockingHeadScripts)fail(`${blockingHeadScripts} render-blocking script(s) in head`);
  if(/<(?:audio|video)\b[^>]*\bautoplay\b/i.test(html))fail('autoplay media is not allowed');
  results.push({page,htmlBytes:Buffer.byteLength(html),stylesheets:styles.length,scripts:scripts.length,cssBytes,jsBytes,preloadCount,highPriorityImages,eagerImages,errors:pageErrors});
}
const report={standard:'FMB enterprise performance budget',generatedAt:new Date().toISOString(),summary:{pages:results.length,errors:errors.length,passed:errors.length===0},errors,results};
await writeFile(path.join(root,'performance-audit.json'),JSON.stringify(report,null,2),'utf8');
console.log(`Performance audit reviewed ${results.length} principal destinations: ${errors.length} errors.`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
