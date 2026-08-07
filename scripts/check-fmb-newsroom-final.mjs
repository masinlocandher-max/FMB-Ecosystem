import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const newsRoot=path.join(root,'news');
const newsroom=await readFile(path.join(root,'fmbnews','index.html'),'utf8');
const alias=await readFile(path.join(newsRoot,'index.html'),'utf8');
const requiredStories=['western-visayas-ai-festival-2026','pax-silica-new-clark-city-jobs-2026','sb19-lollapalooza-filipino-heritage-branding','katrina-llegado-miss-supranational-2026','myanmar-min-aung-hlaing-thailand-visit-2026','san-marcelino-scholarship-requirements-august-2026'];
const retired=/fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command|fmb-v2-news-command/;
const fatal=m=>{throw new Error(`FMB News clean publication audit: ${m}`)};
const count=(html,token)=>(html.match(new RegExp(token,'g'))||[]).length;

function auditLanding(html,name){
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean publication system`);
  if(count(html,'class="fnc-header"')!==1)fatal(`${name} must contain exactly one newsroom masthead`);
  if(count(html,'class="fnc-footer"')!==1)fatal(`${name} must contain exactly one newsroom footer`);
  if(retired.test(html))fatal(`${name} still contains a retired corporate or newsroom shell`);
  if(!/Latest (?:reports|news)/i.test(html))fatal(`${name} is missing the latest-news desk`);
  if(!html.includes('data-news-updated'))fatal(`${name} is missing its update timestamp`);
  if(!html.includes('Today’s headlines for the Filipino'))fatal(`${name} is missing the approved newsroom promise`);
  if(!html.includes('fnc-livebar')||!html.includes('data-pht-time'))fatal(`${name} is missing moving headlines or PHT time`);
  if(!html.includes('/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp'))fatal(`${name} is missing the official color masthead logo`);
  if(!html.includes('/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp'))fatal(`${name} is missing the official white footer logo`);
  for(const slug of requiredStories)if(!html.includes(`/news/${slug}/`))fatal(`${name} is missing ${slug}`);
}

auditLanding(newsroom,'fmbnews/index.html');
auditLanding(alias,'news/index.html');
// The final feed renderer promotes /news/ to the canonical publication and
// turns /fmbnews/ into the compatibility redirect after this legacy audit.

async function walk(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(file));else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(file)}return out}
let articles=0;
let sourceWarnings=0;
for(const file of await walk(newsRoot)){
  if(file===path.join(newsRoot,'index.html')||file===path.join(newsRoot,'about','index.html'))continue;
  const html=await readFile(file,'utf8');
  if(/http-equiv=(["'])refresh\1/i.test(html)||/<meta\b[^>]*(?:name|property)=(["'])robots\1[^>]*content=(["'])[^"']*noindex/i.test(html))continue;
  if(!html.includes('news-story-route'))continue;
  const name=path.relative(root,file).replaceAll(path.sep,'/');
  articles++;
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean article shell`);
  if(count(html,'class="fnc-header"')!==1||count(html,'class="fnc-footer"')!==1)fatal(`${name} has duplicate or missing publication chrome`);
  if(retired.test(html))fatal(`${name} still contains a retired shell`);
  if(!/<main\b[^>]*>[\s\S]{300,}<\/main>/i.test(html))fatal(`${name} has no substantial readable article content`);
  if(!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html))fatal(`${name} has no article headline`);
  if(!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html))fatal(`${name} has no canonical URL`);
  if(!html.includes('/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp')||!html.includes('/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp'))fatal(`${name} is missing an official logo variant`);
  if(!/nc-sources|nc-source-box|Sources and public record|Source:/i.test(html))sourceWarnings++;
}
if(articles<1)fatal('no article pages were audited');
console.log(`FMB News clean publication audit passed one canonical newsroom and ${articles} article pages. ${sourceWarnings} legacy articles need future source-label normalization but remain readable.`);
