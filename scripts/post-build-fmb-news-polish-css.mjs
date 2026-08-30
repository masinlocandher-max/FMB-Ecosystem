import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const polishSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-polish.css');
const polishOut = path.join(root,'dist','assets','css','fmb-news-reference-polish.css');
const hardfixSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-hardfix.css');
const hardfixOut = path.join(root,'dist','assets','css','fmb-news-reference-hardfix.css');
const finalSource = path.join(root,'apps','withlovefmb','assets','css','fmb-news-reference-final.css');
const finalOut = path.join(root,'dist','assets','css','fmb-news-reference-final.css');
const newsRoot = path.join(root,'dist','news');
const articleRoot = path.join(root,'apps','withlovefmb','content','news','articles');
const suppliedLogo = '/assets/images/fmb-approved/fmb-news-logo-color-supplied.webp';
const heroPhoto = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Rizal_Park,_PH_flag_-_Rizal_day_ceremony_(Manila)(2017-12-30).jpg';
const heroSource = 'https://commons.wikimedia.org/wiki/File:Rizal_Park,_PH_flag_-_Rizal_day_ceremony_(Manila)(2017-12-30).jpg';

await cp(polishSource,polishOut,{force:true});
await cp(hardfixSource,hardfixOut,{force:true});
await cp(finalSource,finalOut,{force:true});

const esc=(value='')=>String(value)
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'",'&#39;');

async function walkIndexHtml(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walkIndexHtml(p));
    else if(entry.isFile()&&entry.name==='index.html') files.push(p);
  }
  return files;
}

async function walkJson(dir){
  const files=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    const p=path.join(dir,entry.name);
    if(entry.isDirectory()) files.push(...await walkJson(p));
    else if(entry.isFile()&&entry.name.endsWith('.json')) files.push(p);
  }
  return files;
}

async function latestHeadlines(){
  const items=[];
  for(const file of await walkJson(articleRoot)){
    try{
      const story=JSON.parse(await readFile(file,'utf8'));
      if(story.status==='published'&&story.slug&&story.headline&&story.publishedAt){
        items.push(story);
      }
    }catch{}
  }
  return items
    .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
    .slice(0,7);
}

function tickerMarkup(stories){
  const run=stories.map((story,index)=>{
    const separator=index<stories.length-1?'<span class="ticker-dot" aria-hidden="true">◆</span>':'';
    return `<a href="/news/${esc(story.slug)}/">${esc(story.headline)}</a>${separator}`;
  }).join('');
  return `<div class="headline-ticker" role="region" aria-label="Latest FMB News headlines"><div class="ticker-track"><div class="ticker-run">${run}</div><div class="ticker-run" aria-hidden="true">${run}</div></div></div>`;
}

const headlines=await latestHeadlines();
const ticker=tickerMarkup(headlines);
const homeFile=path.join(newsRoot,'index.html');

for(const file of await walkIndexHtml(newsRoot)){
  let html=await readFile(file,'utf8');

  if(!html.includes('/assets/css/fmb-news-reference-polish.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-polish.css?v=20260830b"></head>');
  }
  if(!html.includes('/assets/css/fmb-news-reference-hardfix.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-hardfix.css?v=20260830a"></head>');
  }
  if(!html.includes('/assets/css/fmb-news-reference-final.css')){
    html=html.replace('</head>','<link rel="stylesheet" href="/assets/css/fmb-news-reference-final.css?v=20260830a"></head>');
  }

  html=html
    .replaceAll('/assets/images/fmb-approved/fmb-news-official-transparent.webp',suppliedLogo)
    .replaceAll('/assets/images/fmb-approved/fmb-news-logo-white-supplied.webp',suppliedLogo);

  if(!html.includes('class="headline-ticker"')){
    html=html.replace('<div class="utility">',`${ticker}<div class="utility">`);
  }

  if(path.resolve(file)===path.resolve(homeFile)){
    const hero=`<div class="hero-image"><img src="${heroPhoto}" alt="Philippine flag at Rizal Park in Manila" fetchpriority="high"><a class="hero-credit" href="${heroSource}" target="_blank" rel="noopener noreferrer">Photo: Patrick Roque / Wikimedia Commons · CC BY-SA 4.0</a></div>`;
    html=html.replace(/<div class="hero-image">[\s\S]*?<\/div>/,hero);
  }

  await writeFile(file,html);
}

console.log(`FMB News final reference pass applied: one supplied logo source, ${headlines.length} live ticker headlines, and Rizal Park Philippine flag hero.`);
