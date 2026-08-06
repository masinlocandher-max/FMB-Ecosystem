import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const newsRoot=path.join(root,'news');
const newsroom=await readFile(path.join(root,'fmbnews','index.html'),'utf8');
const alias=await readFile(path.join(newsRoot,'index.html'),'utf8');
const builtCss=await readFile(path.join(root,'assets','css','fmbnews-clean-v1.css'),'utf8');
const colorLogo='/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const whiteLogo='/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp';
const requiredStories=['western-visayas-ai-festival-2026','pax-silica-new-clark-city-jobs-2026','sb19-lollapalooza-filipino-heritage-branding','katrina-llegado-miss-supranational-2026','myanmar-min-aung-hlaing-thailand-visit-2026','san-marcelino-scholarship-requirements-august-2026'];
const retired=/fmb-shell-header|fmb-shell-footer|fmb-news-livebar|fmb-news-channel-command|fmb-v2-news-command|fmb-news-official-transparent\.webp/;
const fatal=message=>{throw new Error(`FMB News clean publication audit: ${message}`)};
const count=(html,token)=>(html.match(new RegExp(token,'g'))||[]).length;

function auditChrome(html,name){
  if(count(html,'data-fmb-news-logo-light')!==1)fatal(`${name} must contain exactly one supplied light-surface logo`);
  if(count(html,'data-fmb-news-logo-dark')!==1)fatal(`${name} must contain exactly one supplied dark-surface logo`);
  if(!html.includes(`src="${colorLogo}"`))fatal(`${name} is not using the exact supplied color masthead logo`);
  if(!html.includes(`src="${whiteLogo}"`))fatal(`${name} is not using the exact supplied white footer logo`);
  if(count(html,'data-fmb-story-submission')<2)fatal(`${name} is missing desktop or mobile story submission access`);
  if(!html.includes('withlovefmb@gmail.com'))fatal(`${name} is missing the newsroom submission email`);
}

function auditLanding(html,name){
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean publication system`);
  if(count(html,'class="fnc-header"')!==1)fatal(`${name} must contain exactly one newsroom masthead`);
  if(count(html,'class="fnc-footer"')!==1)fatal(`${name} must contain exactly one newsroom footer`);
  if(retired.test(html))fatal(`${name} still contains a retired corporate or newsroom shell`);
  if(!/Latest (?:reports|news)/i.test(html))fatal(`${name} is missing the latest-news desk`);
  if(!html.includes('data-news-updated'))fatal(`${name} is missing its update timestamp`);
  if(!html.includes('Today’s headlines for the Filipino'))fatal(`${name} is missing the approved newsroom promise`);
  if(!html.includes('fnc-livebar')||!html.includes('data-pht-time'))fatal(`${name} is missing moving headlines or PHT time`);
  auditChrome(html,name);
  for(const slug of requiredStories)if(!html.includes(`/news/${slug}/`))fatal(`${name} is missing ${slug}`);
}

auditLanding(newsroom,'fmbnews/index.html');
auditLanding(alias,'news/index.html');
if(!alias.includes('location.replace("/fmbnews/")'))fatal('news/index.html is not directing readers to the canonical newsroom');
for(const marker of ['[data-fmb-news-logo-light]','[data-fmb-news-logo-dark]','.fnc-share-actions','.fnc-submit-icon'])if(!builtCss.includes(marker))fatal(`built newsroom CSS is missing ${marker}`);

async function walk(dir){const out=[];for(const entry of await readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(file));else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(file)}return out}
let articles=0;
let sourceWarnings=0;
for(const file of await walk(newsRoot)){
  if(file===path.join(newsRoot,'index.html')||file===path.join(newsRoot,'about','index.html'))continue;
  const html=await readFile(file,'utf8');
  if(!html.includes('news-story-route'))continue;
  const name=path.relative(root,file).replaceAll(path.sep,'/');
  articles++;
  if(!html.includes('fmb-news-clean'))fatal(`${name} is not using the clean article shell`);
  if(count(html,'class="fnc-header"')!==1||count(html,'class="fnc-footer"')!==1)fatal(`${name} has duplicate or missing publication chrome`);
  if(retired.test(html))fatal(`${name} still contains a retired shell`);
  if(!/<main\b[^>]*>[\s\S]{300,}<\/main>/i.test(html))fatal(`${name} has no substantial readable article content`);
  if(!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html))fatal(`${name} has no article headline`);
  if(!/<link\b[^>]*rel=["']canonical["'][^>]*href=["'][^"']+["']/i.test(html))fatal(`${name} has no canonical URL`);
  auditChrome(html,name);
  if(count(html,'data-fmb-share-ready')!==1)fatal(`${name} must contain one report sharing panel`);
  if(count(html,'class="fnc-share-icon')!==4)fatal(`${name} must contain four SVG sharing controls`);
  if(count(html,'data-fnc-native-share')!==1)fatal(`${name} is missing the device sharing control`);
  if(!/nc-sources|nc-source-box|Sources and public record|Source:/i.test(html))sourceWarnings++;
}
if(articles<1)fatal('no article pages were audited');
console.log(`FMB News clean publication audit passed one canonical newsroom and ${articles} article pages with the exact supplied color/white logo pair, desktop and mobile submission access, and four sharing controls per report. ${sourceWarnings} legacy articles need future source-label normalization but remain readable.`);
