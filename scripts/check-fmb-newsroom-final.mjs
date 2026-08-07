import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const newsRoot=path.join(root,'news');
const newsroom=await readFile(path.join(root,'fmbnews','index.html'),'utf8');
const about=await readFile(path.join(root,'fmbnews','about','index.html'),'utf8');
const alias=await readFile(path.join(newsRoot,'index.html'),'utf8');
const requiredStories=['magnitude-54-quake-hits-off-occidental-mindoro','enrique-razon-tops-forbes-philippines-50-richest-list','western-visayas-ai-festival-2026','pax-silica-new-clark-city-jobs-2026','sb19-lollapalooza-filipino-heritage-branding','katrina-llegado-miss-supranational-2026','myanmar-min-aung-hlaing-thailand-visit-2026','san-marcelino-scholarship-requirements-august-2026'];
const nonEditorialCompatibilityPages=new Set(['news/why-websites-cost-and-how-senz-makes-them-accessible/index.html','news/filipino-centered-training-institution-cognita-vision/index.html']);
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
  if(!html.includes('The news that matters.')||!html.includes('Made clear for Filipinos.'))fatal(`${name} is missing the approved newsroom positioning`);
  if(!html.includes('fnc-livebar')||!html.includes('data-pht-time'))fatal(`${name} is missing moving headlines or PHT time`);
  if(!html.includes('Moving headlines'))fatal(`${name} is missing the moving-headlines label`);
  if(!html.includes('/assets/images/news/fmb-news-purple-network-hero.webp'))fatal(`${name} is missing the supplied network hero`);
  if(!html.includes('/assets/images/news/fmb-news-primary-logo-2026.webp'))fatal(`${name} is missing the supplied FMB News logo`);
  if(!html.includes('/assets/images/news/fmb-news-white-transparent-2026.webp'))fatal(`${name} is missing the supplied white footer identity`);
  if(!html.includes('/assets/images/news/fmb-news-outline-logo-2026.webp'))fatal(`${name} is missing the supplied outline identity`);
  if(!html.includes('Every important story must answer four questions'))fatal(`${name} is missing the editorial lens`);
  if(!html.includes('News menu')||!html.includes('News categories'))fatal(`${name} does not distinguish site navigation from news categories`);
  if(!html.includes('data-fnc-menu-close')||!html.includes('aria-controls="fncNav"'))fatal(`${name} is missing accessible menu controls`);
  for(const slug of requiredStories)if(!html.includes(`/news/${slug}/`))fatal(`${name} is missing ${slug}`);
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
  articles++;
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean article shell`);
  if(count(html,'class="fnc-header"')!==1||count(html,'class="fnc-footer"')!==1)fatal(`${name} has duplicate or missing publication chrome`);
  if(retired.test(html))fatal(`${name} still contains a retired shell`);
  if(!/<main\b[^>]*>[\s\S]{300,}<\/main>/i.test(html))fatal(`${name} has no substantial readable article content`);
  if(!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html))fatal(`${name} has no article headline`);
  if(!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html))fatal(`${name} has no canonical URL`);
  if(!html.includes('/assets/images/news/fmb-news-primary-logo-2026.webp'))fatal(`${name} is missing the supplied FMB News identity`);
  if(!/nc-sources|nc-source-box|class=(["'])[^"']*\bsources\b[^"']*\1|Sources and (?:public record|documents)|Source:/i.test(html))sourceWarnings++;
}
if(articles<1)fatal('no article pages were audited');
for(const marker of ['Our mission','Our vision','What happened?','What is the context?','Why does it matter to Filipinos?','What should readers watch next?','Evidence first','Context always']){
  if(!about.includes(marker))fatal(`fmbnews/about/index.html is missing ${marker}`);
}
console.log(`FMB News clean publication audit passed one canonical newsroom and ${articles} editorial article pages with ${sourceWarnings} source-label warning(s).`);
