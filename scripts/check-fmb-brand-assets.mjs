import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDirectory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(scriptDirectory,'..');
const source=path.join(root,'apps','withlovefmb');
const dist=path.join(root,'dist');
const fail=message=>{throw new Error(message)};
const exists=file=>{if(!fs.existsSync(file))fail(`Missing required brand asset: ${path.relative(root,file)}`);return file};

function readPng(file){
  const bytes=fs.readFileSync(exists(file));
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')fail(`${path.relative(root,file)} is not a PNG.`);
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20),bitDepth=bytes[24],colorType=bytes[25],interlace=bytes[28];
  const idat=[];let transparencyChunk=null;let offset=8;
  while(offset+12<=bytes.length){
    const length=bytes.readUInt32BE(offset);const type=bytes.toString('ascii',offset+4,offset+8);const data=bytes.subarray(offset+8,offset+8+length);
    if(type==='IDAT')idat.push(data);if(type==='tRNS')transparencyChunk=data;if(type==='IEND')break;offset+=12+length;
  }
  let hasTransparency=false;
  if(colorType===3&&transparencyChunk)hasTransparency=[...transparencyChunk].some(value=>value<255);
  if((colorType===4||colorType===6)&&bitDepth===8&&interlace===0){
    const channels=colorType===6?4:2;const rowBytes=width*channels;const raw=zlib.inflateSync(Buffer.concat(idat));
    const previous=Buffer.alloc(rowBytes);let cursor=0;let transparentPixels=0;let opaquePixels=0;
    const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c};
    for(let y=0;y<height;y+=1){
      const filter=raw[cursor++];const row=Buffer.from(raw.subarray(cursor,cursor+rowBytes));cursor+=rowBytes;
      for(let x=0;x<rowBytes;x+=1){
        const left=x>=channels?row[x-channels]:0;const up=previous[x];const upperLeft=x>=channels?previous[x-channels]:0;
        if(filter===1)row[x]=(row[x]+left)&255;
        else if(filter===2)row[x]=(row[x]+up)&255;
        else if(filter===3)row[x]=(row[x]+Math.floor((left+up)/2))&255;
        else if(filter===4)row[x]=(row[x]+paeth(left,up,upperLeft))&255;
        else if(filter!==0)fail(`${path.relative(root,file)} uses an unsupported PNG filter.`);
      }
      for(let x=channels-1;x<rowBytes;x+=channels){if(row[x]<255)transparentPixels+=1;else opaquePixels+=1}
      row.copy(previous);
    }
    hasTransparency=transparentPixels>0&&opaquePixels>0;
  }
  return {width,height,colorType,hasTransparency};
}

function assertTransparentPng(relative,minWidth,minHeight){
  const info=readPng(path.join(source,relative));
  if(info.width<minWidth||info.height<minHeight)fail(`${relative} is not HD enough: ${info.width}x${info.height}.`);
  if(!info.hasTransparency)fail(`${relative} does not contain real transparent pixels.`);
  return info;
}

function assertTransparentSvg(relative,minWidth,minHeight){
  const file=exists(path.join(source,relative));const svg=fs.readFileSync(file,'utf8');
  const viewBox=svg.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
  if(!viewBox)fail(`${relative} has no valid SVG viewBox.`);
  const width=Number(viewBox[3]),height=Number(viewBox[4]);
  if(width<minWidth||height<minHeight)fail(`${relative} is not HD/scalable enough: viewBox ${width}x${height}.`);
  if(!/<path\b/i.test(svg))fail(`${relative} contains no vector logo path.`);
  if(/<image\b/i.test(svg))fail(`${relative} embeds a raster image instead of a clean vector mark.`);
  if(/<rect\b[^>]*(?:width=["'](?:100%|[\d.]+)["'])[^>]*(?:height=["'](?:100%|[\d.]+)["'])/i.test(svg))fail(`${relative} contains a baked-in background rectangle.`);
  if(!/<title\b/i.test(svg))fail(`${relative} is missing an accessible title.`);
  return {width,height};
}

function readWebpDimensions(file){
  const bytes=fs.readFileSync(exists(file));
  if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')fail(`${path.relative(root,file)} is not a valid WebP.`);
  let offset=12;
  while(offset+8<=bytes.length){
    const type=bytes.subarray(offset,offset+4).toString('ascii');const size=bytes.readUInt32LE(offset+4);const data=offset+8;
    if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};
    if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};
    if(type==='VP8L'&&bytes[data]===0x2f){const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};}
    offset=data+size+(size%2);
  }
  fail(`${path.relative(root,file)} has unreadable WebP dimensions.`);
}

const pngLogos=[
  ['assets/images/fmbandco/fmbandco-primary-clean.png',1200,350],
  ['assets/images/fmbandco/fmbandco-primary-reversed.png',1200,350],
  ['assets/images/fmbandco/fmbandco-ampersand-gold.png',240,260],
  ['assets/images/projects/senz-logo-clean.png',1000,380],
  ['assets/images/projects/cognita-logo-clean.png',1250,440],
  ['assets/images/signature-transparent.png',900,400],
];
for(const args of pngLogos)assertTransparentPng(...args);

const svgLogos=[
  ['assets/images/brand/fmb-mark-purple-square-transparent.svg',512,512],
  ['assets/images/brand/fmb-mark-purple-transparent.svg',550,230],
  ['assets/images/brand/fmb-mark-white-transparent.svg',550,230],
];
for(const args of svgLogos)assertTransparentSvg(...args);

const founderHero=readWebpDimensions(path.join(dist,'assets/images/home/francine-home-hero-hd.webp'));
const founderOverview=readWebpDimensions(path.join(dist,'assets/images/home/francine-home-founder-hd.webp'));
for(const [name,info] of [['founder hero',founderHero],['founder overview',founderOverview]])if(info.width!==1364||info.height!==768)fail(`Approved ${name} must remain 1364x768; found ${info.width}x${info.height}.`);

const pageChecks={
  'index.html':['/assets/images/brand/fmb-mark-purple-square-transparent.svg','/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-theme="bulletin"'],
  'music/index.html':['fmb-channel-brand-lockup','/assets/images/brand/fmb-mark-white-transparent.svg','>MUSIC</strong>','data-fmb-theme="music"'],
  'ebooks/index.html':['fmb-channel-brand-lockup','/assets/images/brand/fmb-mark-white-transparent.svg','>EBOOK</strong>','data-fmb-theme="reading"'],
  'news/index.html':['/assets/images/fmbandco/fmbandco-primary-reversed.png','data-fmb-theme="news"'],
  'aboutfmb/index.html':['/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-theme="founder"'],
  'withlovefmb/index.html':['/assets/images/home/francine-home-hero-hd.webp','data-fmb-theme="care"'],
  'fmb&co/index.html':['/assets/images/home/francine-home-hero-hd.webp','/assets/images/home/francine-home-founder-hd.webp','data-fmb-theme="corporate"'],
};
for(const [relative,markers] of Object.entries(pageChecks)){
  const html=fs.readFileSync(exists(path.join(dist,relative)),'utf8');
  for(const marker of markers)if(!html.includes(marker))fail(`${relative} is missing verified brand marker: ${marker}`);
  if(!html.includes('/assets/css/fmb-brand-lock.css')||!html.includes('/assets/js/fmb-visual-refresh.js')||!html.includes('fmb-unified-page'))fail(`${relative} is outside the unified FMB design system.`);
  if(html.includes('fmb-music-horizontal.webp')||html.includes('fmb-ebook-horizontal.webp'))fail(`${relative} still references a flattened non-transparent channel logo.`);
}

console.log('FMB logos are HD/scalable and transparent, founder images are valid and correctly ordered, and all key pages use one themed design system.');
