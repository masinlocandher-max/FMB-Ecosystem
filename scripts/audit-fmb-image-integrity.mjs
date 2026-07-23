import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const textExtensions=new Set(['.html','.css','.js','.json','.webmanifest']);
const imageExtensions=new Set(['.png','.jpg','.jpeg','.webp','.gif','.svg']);
const protectedPrefixes=['_sites/senz/','_sites/cognita/'];
const forbiddenPathPatterns=[/placeholder/i,/ai-generated/i,/\/generated\//i,/\/mockups?\//i,/\/temp(?:orary)?\//i];

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

function relative(file){return path.relative(root,file).replaceAll(path.sep,'/');}
function png(bytes){if(bytes.length>=24&&bytes.subarray(1,4).toString('ascii')==='PNG')return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};}
function gif(bytes){if(bytes.length>=10&&bytes.subarray(0,3).toString('ascii')==='GIF')return {width:bytes.readUInt16LE(6),height:bytes.readUInt16LE(8)};}
function jpeg(bytes){
  if(bytes[0]!==0xff||bytes[1]!==0xd8)return;
  let offset=2;
  while(offset+9<bytes.length){
    if(bytes[offset]!==0xff){offset++;continue;}
    const marker=bytes[offset+1];
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)){
      return {height:bytes.readUInt16BE(offset+5),width:bytes.readUInt16BE(offset+7)};
    }
    const size=bytes.readUInt16BE(offset+2);
    if(!size)break;
    offset+=2+size;
  }
}
function webp(bytes){
  if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')return;
  let offset=12;
  while(offset+8<=bytes.length){
    const type=bytes.subarray(offset,offset+4).toString('ascii');
    const size=bytes.readUInt32LE(offset+4);
    const data=offset+8;
    if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};
    if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};
    if(type==='VP8L'&&bytes[data]===0x2f){
      const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];
      return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};
    }
    offset=data+size+(size%2);
  }
}
async function dimensions(file){
  const ext=path.extname(file).toLowerCase();
  if(ext==='.svg'){
    const svg=await readFile(file,'utf8');
    const width=Number(svg.match(/\bwidth=["']([\d.]+)/i)?.[1]);
    const height=Number(svg.match(/\bheight=["']([\d.]+)/i)?.[1]);
    if(width&&height)return {width:Math.round(width),height:Math.round(height),vector:true};
    const view=svg.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
    if(view)return {width:Math.round(Number(view[1])),height:Math.round(Number(view[2])),vector:true};
    return;
  }
  const bytes=await readFile(file);
  return png(bytes)||gif(bytes)||jpeg(bytes)||webp(bytes);
}

function extractReferences(text){
  const refs=new Set();
  const pattern=/((?:\/|\.\.\/|\.\/)?(?:assets|app\/assets)\/[A-Za-z0-9_@%+~.,&()\-\/]+\.(?:png|jpe?g|webp|gif|svg))(?:[?#][^"'`\s)]*)?/gi;
  for(const match of text.matchAll(pattern))refs.add(match[1]);
  return refs;
}

function resolveReference(sourceFile,reference){
  const clean=decodeURIComponent(reference.split(/[?#]/)[0]);
  if(clean.startsWith('/'))return path.join(root,clean.slice(1));
  return path.resolve(path.dirname(sourceFile),clean);
}

function requirementFor(name,size){
  const lower=name.toLowerCase();
  const long=Math.max(size.width,size.height);
  const short=Math.min(size.width,size.height);
  const result={long,short,minLong:720,minShort:480,label:'supporting raster'};

  if(size.vector)return {...result,minLong:0,minShort:0,label:'vector identity'};
  if(/(?:favicon|apple-touch|maskable|app-icon|icon-|\/icons?\/|avatar|emoji|badge|qr|seal|sprite)/i.test(lower)){
    return {...result,minLong:180,minShort:180,label:'icon or avatar'};
  }
  if(/(?:logo|wordmark|lockup|brandmark|fmb-music-official|fmb-ebook-official)/i.test(lower)){
    return {...result,minLong:512,minShort:96,label:'logo or wordmark'};
  }
  if(/(?:album|track|music-cover|ebook-cover|book-cover|reading-cover|pubmat)/i.test(lower)){
    return {...result,minLong:1080,minShort:720,label:'cover or publication artwork'};
  }
  if(/(?:francine|founder|hero|portrait|volunteer|community|project|article|story|news|campaign|event|feature|background)/i.test(lower)){
    return {...result,minLong:1200,minShort:720,label:'public photography or hero artwork'};
  }
  return result;
}

const allFiles=await walk(root);
const textFiles=allFiles.filter(file=>textExtensions.has(path.extname(file).toLowerCase())&&!protectedPrefixes.some(prefix=>relative(file).startsWith(prefix)));
const references=new Map();
for(const file of textFiles){
  const text=await readFile(file,'utf8');
  for(const reference of extractReferences(text)){
    const target=resolveReference(file,reference);
    const key=path.normalize(target);
    const record=references.get(key)||{target,reference,sources:new Set()};
    record.sources.add(relative(file));
    references.set(key,record);
  }
}

const errors=[];
const verified=[];
for(const record of references.values()){
  const name=relative(record.target);
  if(protectedPrefixes.some(prefix=>name.startsWith(prefix)))continue;
  if(forbiddenPathPatterns.some(pattern=>pattern.test(name))){
    errors.push(`${name}: production page references a placeholder, generated, mockup, or temporary image path`);
    continue;
  }
  const extension=path.extname(record.target).toLowerCase();
  if(!imageExtensions.has(extension))continue;
  try{
    const info=await stat(record.target);
    if(!info.isFile())throw new Error('not a file');
  }catch{
    errors.push(`${name}: referenced image is missing; used by ${[...record.sources].slice(0,3).join(', ')}`);
    continue;
  }
  const size=await dimensions(record.target);
  if(!size?.width||!size?.height){
    errors.push(`${name}: image dimensions or file integrity could not be verified`);
    continue;
  }
  const requirement=requirementFor(name,size);
  if(requirement.long<requirement.minLong||requirement.short<requirement.minShort){
    errors.push(`${name}: ${size.width}×${size.height} is below the ${requirement.label} release minimum of ${requirement.minLong}×${requirement.minShort} on long/short edges`);
    continue;
  }
  verified.push({name,width:size.width,height:size.height,label:requirement.label});
}

const exactRequired=[
  'assets/images/home/fmb-home-logo.webp',
  'assets/images/home/francine-home-hero-hd.webp',
  'assets/images/home/francine-home-founder-hd.webp',
  'assets/images/news/fmb-news-official.svg',
  'assets/images/fmb-approved/fmb-music-official-transparent.webp',
  'assets/images/fmb-approved/fmb-ebook-official-transparent.webp',
  'app/assets/yoni/yoni-hero.webp',
];
for(const required of exactRequired){
  if(!verified.some(asset=>asset.name===required))errors.push(`${required}: approved identity or hero asset was not HD-verified in the built public experience`);
}

if(errors.length){
  console.error(`FMB image integrity audit failed with ${errors.length} issue(s):`);
  for(const error of errors)console.error(`- ${error}`);
  process.exit(1);
}

const byLabel=verified.reduce((summary,asset)=>{
  summary[asset.label]=(summary[asset.label]||0)+1;
  return summary;
},{});
console.log(`FMB image integrity audit passed for ${verified.length} referenced local images with no placeholder or generated-image paths.`);
for(const [label,count] of Object.entries(byLabel).sort())console.log(`- ${label}: ${count}`);
