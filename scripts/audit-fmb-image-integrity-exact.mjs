import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const sourceRoot=path.resolve(new URL('..',import.meta.url).pathname);
const manifest=JSON.parse(await readFile(path.join(sourceRoot,'config/fmb-approved-assets.json'),'utf8'));
const imageExtensions=new Set(['.png','.jpg','.jpeg','.webp','.gif','.svg']);
const textExtensions=new Set(['.html','.css','.js','.json','.webmanifest','.xml']);
const protectedPrefixes=['_sites/senz/','_sites/cognita/'];
const errors=[];
const verified=[];

async function walk(directory){
  const files=[];
  for(const entry of await readdir(directory,{withFileTypes:true})){
    const full=path.join(directory,entry.name);
    if(entry.isDirectory())files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function png(bytes){if(bytes.length>=24&&bytes.subarray(1,4).toString('ascii')==='PNG')return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};}
function gif(bytes){if(bytes.length>=10&&bytes.subarray(0,3).toString('ascii')==='GIF')return {width:bytes.readUInt16LE(6),height:bytes.readUInt16LE(8)};}
function jpeg(bytes){
  if(bytes[0]!==0xff||bytes[1]!==0xd8)return;
  let offset=2;
  while(offset+9<bytes.length){
    if(bytes[offset]!==0xff){offset+=1;continue;}
    const marker=bytes[offset+1];
    if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:bytes.readUInt16BE(offset+5),width:bytes.readUInt16BE(offset+7)};
    const size=bytes.readUInt16BE(offset+2);if(!size)break;offset+=2+size;
  }
}
function webp(bytes){
  if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')return;
  let offset=12;
  while(offset+8<=bytes.length){
    const type=bytes.subarray(offset,offset+4).toString('ascii');const size=bytes.readUInt32LE(offset+4);const data=offset+8;
    if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};
    if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};
    if(type==='VP8L'&&bytes[data]===0x2f){const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};}
    offset=data+size+(size%2);
  }
}
async function dimensions(file){
  if(path.extname(file).toLowerCase()==='.svg'){
    const text=await readFile(file,'utf8');
    const view=text.match(/\bviewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)/i);
    if(view)return {width:Number(view[1]),height:Number(view[2]),vector:true};
    const width=Number(text.match(/\bwidth=["']([\d.]+)/i)?.[1]);const height=Number(text.match(/\bheight=["']([\d.]+)/i)?.[1]);
    if(width&&height)return {width,height,vector:true};
    return;
  }
  const bytes=await readFile(file);return png(bytes)||gif(bytes)||jpeg(bytes)||webp(bytes);
}

for(const asset of manifest.assets){
  const name=`assets/images/fmb-approved/${asset.file}`;const file=path.join(root,name);
  try{
    const info=await stat(file);if(!info.isFile())throw new Error('not a file');
    const bytes=await readFile(file);const size=await dimensions(file);
    if(hash(bytes)!==asset.sha256)errors.push(`${name}: hash differs from uploaded master`);
    if(size?.width!==asset.width||size?.height!==asset.height)errors.push(`${name}: expected ${asset.width}×${asset.height}, found ${size?.width||0}×${size?.height||0}`);
    else verified.push({name,width:size.width,height:size.height,label:'exact uploaded master'});
  }catch{errors.push(`${name}: exact uploaded master is missing`);}
}

const all=await walk(root);
const references=new Map();
for(const file of all.filter(file=>textExtensions.has(path.extname(file).toLowerCase())&&!protectedPrefixes.some(prefix=>relative(file).startsWith(prefix)))){
  const text=await readFile(file,'utf8');
  const pattern=/((?:\/|\.\.\/|\.\/)?(?:assets|app\/assets)\/[A-Za-z0-9_@%+~.,&()\-\/]+\.(?:png|jpe?g|webp|gif|svg))(?:[?#][^"'`\s)]*)?/gi;
  for(const match of text.matchAll(pattern)){
    const reference=decodeURIComponent(match[1]);
    const target=reference.startsWith('/')?path.join(root,reference.slice(1)):reference.startsWith('assets/')||reference.startsWith('app/assets/')?path.join(root,reference):path.resolve(path.dirname(file),reference);
    const key=path.normalize(target);const record=references.get(key)||{target,reference,sources:new Set()};record.sources.add(relative(file));references.set(key,record);
  }
}
for(const record of references.values()){
  const name=relative(record.target);if(protectedPrefixes.some(prefix=>name.startsWith(prefix)))continue;
  if(/(?:placeholder|ai-generated|generated-(?:hero|image|portrait|photo)|\/mockups?\/|\/temp(?:orary)?\/)/i.test(name)){errors.push(`${name}: unapproved placeholder or generated-image path is referenced`);continue;}
  if(!imageExtensions.has(path.extname(record.target).toLowerCase()))continue;
  try{const info=await stat(record.target);if(!info.isFile())throw new Error();}catch{errors.push(`${name}: referenced image is missing`);continue;}
  const size=await dimensions(record.target);if(!size?.width||!size?.height){errors.push(`${name}: image integrity or dimensions are unreadable`);continue;}
  if(!verified.some(item=>item.name===name))verified.push({name,width:size.width,height:size.height,label:size.vector?'vector':'referenced raster'});
}

const required=manifest.assets.map(asset=>`assets/images/fmb-approved/${asset.file}`);
for(const name of required)if(!verified.some(asset=>asset.name===name))errors.push(`${name}: exact master was not verified`);
if(!verified.some(asset=>asset.name==='app/assets/yoni/yoni-hero.webp'))errors.push('app/assets/yoni/yoni-hero.webp: Yoni hero was not verified');

if(errors.length){console.error(`Exact image audit failed with ${errors.length} issue(s):`);for(const error of errors)console.error(`- ${error}`);process.exit(1);}
console.log(`Exact image integrity audit passed ${verified.length} referenced images, including ${manifest.assets.length} byte-identical uploaded masters.`);
