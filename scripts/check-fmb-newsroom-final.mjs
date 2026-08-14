import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const newsRoot=path.join(root,'news');
const newsroom=await readFile(path.join(root,'fmbnews','index.html'),'utf8');
const about=await readFile(path.join(root,'fmbnews','about','index.html'),'utf8');
const alias=await readFile(path.join(newsRoot,'index.html'),'utf8');
const genericVisual=/(?:fmb-news-editorial-fallback|newsroom-editorial-fallback|fmb-news-(?:primary-logo|white-transparent|official)|(?:^|[-_/])(?:logo|wordmark|masthead)(?:[-_.?/]|$))/i;
const nonEditorialCompatibilityPages=new Set(['news/why-websites-cost-and-how-senz-makes-them-accessible/index.html','news/filipino-centered-training-institution-cognita-vision/index.html']);
const retired=/fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command|fmb-v2-news-command/;
const fatal=m=>{throw new Error(`FMB News clean publication audit: ${m}`)};
const count=(html,token)=>(html.match(new RegExp(token,'g'))||[]).length;

function imageSources(html){
  const out=[];
  for(const match of String(html||'').matchAll(/<(?:img|source)\b[^>]*>/gi)){
    const tag=match[0];
    for(const name of ['src','srcset']){
      const value=tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`,'i'))?.[2]||'';
      for(const candidate of value.split(',').map(part=>part.trim().split(/\\s+/)[0]).filter(Boolean))out.push(candidate);
    }
  }
  return out;
}
function genuineAttachedImage(html){
  return imageSources(html).some(value=>{
    try{
      const parsed=new URL(value,'https://www.francinemariebautista.com');
      return parsed.origin==='https://www.francinemariebautista.com'&&parsed.pathname.startsWith('/assets/')&&!genericVisual.test(parsed.pathname);
    }catch{return false}
  });
}
function hasGenericImageDelivery(html){return imageSources(html).some(value=>genericVisual.test(value))}
function auditStoryCollection(html,name){
  if(hasGenericImageDelivery(html))fatal(`${name} exposes generic editorial artwork`);
  for(const match of html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/gi)){
    if(!/href=(["'])\/news\/[^"'#?]+\/\1/i.test(match[0]))continue;
    if(!genuineAttachedImage(match[0]))fatal(`${name} lists a report without a genuine attached image`);
  }
}

function auditLanding(html,name){
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean publication system`);
  if(count(html,'class="fnc-header"')!==1)fatal(`${name} must contain exactly one newsroom masthead`);
  if(count(html,'class="fnc-footer"')!==1)fatal(`${name} must contain exactly one newsroom footer`);
  if(retired.test(html))fatal(`${name} still contains a retired corporate or newsroom shell`);
  if(!/Latest (?:reports|news)/i.test(html))fatal(`${name} is missing the latest-news desk`);
  if(!html.includes('data-news-updated'))fatal(`${name} is missing its update timestamp`);
  if(!html.includes('The news that matters.')||!html.includes('Made clear for Filipinos.'))fatal(`${name} is missing the approved newsroom positioning`);
  if(!html.includes('fnc-livebar')||!html.includes('data-pht-time'))fatal(`${name} is missing moving headlines or PHT time`);
  if(!html.includes('Moving headlines'))fatal(`${name} is missing the moving-headlines label`);
  if(!html.includes('/assets/images/news/fmb-news-primary-logo-2026.webp'))fatal(`${name} is missing the supplied FMB News logo`);
  if(!html.includes('/assets/images/news/fmb-news-white-transparent-2026.webp'))fatal(`${name} is missing the supplied white footer identity`);
  if(!html.includes('News menu')||!html.includes('News categories'))fatal(`${name} does not distinguish site navigation from news categories`);
  if(!html.includes('data-fnc-menu-close')||!html.includes('aria-controls="fncNav"'))fatal(`${name} is missing accessible menu controls`);
  if(!html.includes('fnc-identity-band'))fatal(`${name} is missing the compact FMB News identity band`);
  if(!html.includes('fnc-desk-grid')||!html.includes('fnc-developing')||!html.includes('fnc-briefings'))fatal(`${name} is missing the intentional lead, developing, or briefings columns`);
  if(!html.includes('fnc-report-columns')||!html.includes('fnc-context'))fatal(`${name} is missing balanced report columns or the context rail`);
  if(!html.includes('data-fnc-result-card'))fatal(`${name} is missing the complete searchable report index`);
  const editorial=html.replace(/<header\b[\s\S]*?<\/header>/gi,'').replace(/<footer\b[\s\S]*?<\/footer>/gi,'');
  if(hasGenericImageDelivery(editorial))fatal(`${name} contains generic editorial artwork`);
  for(const match of html.matchAll(/<article\b[^>]*class=(["'])[^"']*\b(?:fnc-desk-lead|fnc-support-story|fnc-report-card)\b[^"']*\1[^>]*>[\s\S]*?<\/article>/gi)){if(!genuineAttachedImage(match[0]))fatal(`${name} lists a report card without a genuine attached image`)}
}

auditLanding(newsroom,'fmbnews/index.html');
auditLanding(alias,'news/index.html');
// /fmbnews/ is canonical; /news/ remains a noindex compatibility surface for
// old bookmarks and article navigation.

async function walk(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(file));else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(file)}return out}
let articles=0;
let sourceWarnings=0;
for(const file of await walk(newsRoot)){
  if(file===path.join(newsRoot,'index.html')||file===path.join(newsRoot,'about','index.html'))continue;
  const html=await readFile(file,'utf8');
  if(/http-equiv=(["'])refresh\1/i.test(html)||/<meta\b[^>]*(?:name|property)=(["'])robots\1[^>]*content=(["'])[^"']*noindex/i.test(html))continue;
  if(!html.includes('news-story-route'))continue;
  const name=path.relative(root,file).replaceAll(path.sep,'/');
  if(nonEditorialCompatibilityPages.has(name))continue;
  const route='/' + name.replace(/index\.html$/,'');
  if(!newsroom.includes(`href="${route}"`)&&!alias.includes(`href="${route}"`))continue;
  articles++;
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean article shell`);
  if(count(html,'class="fnc-header"')!==1||count(html,'class="fnc-footer"')!==1)fatal(`${name} has duplicate or missing publication chrome`);
  if(retired.test(html))fatal(`${name} still contains a retired shell`);
  if(!/<main\b[^>]*>[\s\S]{300,}<\/main>/i.test(html))fatal(`${name} has no substantial readable article content`);
  if(!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html))fatal(`${name} has no article headline`);
  if(!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html))fatal(`${name} has no canonical URL`);
  const editorialMedia=html.match(/<section\b[^>]*class=(["'])[^"']*\bnc-story-media\b[^"']*\1[^>]*>[\s\S]*?<\/section>/i)?.[0]||'';
  if(!genuineAttachedImage(editorialMedia))fatal(`${name} has no genuine attached editorial image`);
  if(!html.includes('/assets/images/news/fmb-news-primary-logo-2026.webp'))fatal(`${name} is missing the supplied FMB News identity`);
  if(!/nc-sources|nc-source-box|class=(["'])[^"']*\bsources\b[^"']*\1|Sources and (?:public record|documents)|Source:/i.test(html))sourceWarnings++;
}
if(articles<1)fatal('no article pages were audited');
for(const [relative,name] of [
  ['archive/index.html','news/archive/index.html'],
  ['morning-special/index.html','news/morning-special/index.html'],
]){
  try{auditStoryCollection(await readFile(path.join(newsRoot,relative),'utf8'),name)}
  catch(error){if(error?.code!=='ENOENT')throw error}
}
for(const marker of ['Our mission','Our vision','What happened?','What is the context?','Why does it matter to Filipinos?','What should readers watch next?','Evidence first','Context always']){
  if(!about.includes(marker))fatal(`fmbnews/about/index.html is missing ${marker}`);
}
console.log(`FMB News clean publication audit passed one canonical newsroom and ${articles} editorial article pages with ${sourceWarnings} source-label warning(s).`);
