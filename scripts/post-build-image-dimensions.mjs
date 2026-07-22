import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(new URL('../dist/',import.meta.url).pathname);
const relative=file=>path.relative(root,file).replaceAll(path.sep,'/');

async function walk(directory){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const full=path.join(directory,entry.name);if(entry.isDirectory())files.push(...await walk(full));else files.push(full);}return files;}
function siteRootFor(name){if(name.startsWith('_sites/cognita/'))return path.join(root,'_sites','cognita');if(name.startsWith('_sites/senz/'))return path.join(root,'_sites','senz');return root;}
function png(bytes){if(bytes.subarray(1,4).toString('ascii')==='PNG')return {width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};}
function gif(bytes){if(bytes.subarray(0,3).toString('ascii')==='GIF')return {width:bytes.readUInt16LE(6),height:bytes.readUInt16LE(8)};}
function jpeg(bytes){if(bytes[0]!==0xff||bytes[1]!==0xd8)return;let offset=2;while(offset+9<bytes.length){if(bytes[offset]!==0xff){offset++;continue;}const marker=bytes[offset+1];if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {height:bytes.readUInt16BE(offset+5),width:bytes.readUInt16BE(offset+7)};const size=bytes.readUInt16BE(offset+2);if(!size)break;offset+=2+size;}}
function webp(bytes){if(bytes.subarray(0,4).toString('ascii')!=='RIFF'||bytes.subarray(8,12).toString('ascii')!=='WEBP')return;let offset=12;while(offset+8<=bytes.length){const type=bytes.subarray(offset,offset+4).toString('ascii');const size=bytes.readUInt32LE(offset+4);const data=offset+8;if(type==='VP8X')return {width:1+bytes[data+4]+(bytes[data+5]<<8)+(bytes[data+6]<<16),height:1+bytes[data+7]+(bytes[data+8]<<8)+(bytes[data+9]<<16)};if(type==='VP8 '&&bytes[data+3]===0x9d&&bytes[data+4]===0x01&&bytes[data+5]===0x2a)return {width:bytes.readUInt16LE(data+6)&0x3fff,height:bytes.readUInt16LE(data+8)&0x3fff};if(type==='VP8L'&&bytes[data]===0x2f){const b1=bytes[data+1],b2=bytes[data+2],b3=bytes[data+3],b4=bytes[data+4];return {width:1+(((b2&0x3f)<<8)|b1),height:1+(((b4&0x0f)<<10)|(b3<<2)|((b2&0xc0)>>6))};}offset=data+size+(size%2);}}
async function dimensions(file){const ext=path.extname(file).toLowerCase();if(ext==='.svg'){const svg=await readFile(file,'utf8');const width=Number(svg.match(/\bwidth=["']([\d.]+)/i)?.[1]);const height=Number(svg.match(/\bheight=["']([\d.]+)/i)?.[1]);if(width&&height)return {width:Math.round(width),height:Math.round(height)};const view=svg.match(/\bviewBox=["'][^"']*?([\d.]+)\s+([\d.]+)["']/i);if(view)return {width:Math.round(Number(view[1])),height:Math.round(Number(view[2]))};return;}const bytes=await readFile(file);return png(bytes)||gif(bytes)||jpeg(bytes)||webp(bytes);}

let updatedPages=0,updatedImages=0;
for(const file of (await walk(root)).filter(file=>file.endsWith('.html'))){
  const name=relative(file);const siteRoot=siteRootFor(name);let html=await readFile(file,'utf8');let changed=false;
  const tags=[...html.matchAll(/<img\b[^>]*>/gi)];
  for(const match of tags){const tag=match[0];if(/\swidth=/i.test(tag)&&/\sheight=/i.test(tag))continue;const src=tag.match(/\ssrc=["']([^"']+)["']/i)?.[1];if(!src||/^(?:https?:|data:|blob:)/i.test(src))continue;const clean=decodeURIComponent(src.split(/[?#]/)[0]);if(!clean.startsWith('/'))continue;const target=path.join(siteRoot,clean.replace(/^\//,''));try{if(!(await stat(target)).isFile())continue;const size=await dimensions(target);if(!size)continue;let replacement=tag;if(!/\swidth=/i.test(replacement))replacement=replacement.replace(/<img/i,`<img width="${size.width}"`);if(!/\sheight=/i.test(replacement))replacement=replacement.replace(/<img/i,`<img height="${size.height}"`);html=html.replace(tag,replacement);changed=true;updatedImages++;}catch{}}
  if(changed){await writeFile(file,html,'utf8');updatedPages++;}
}
console.log(`Added intrinsic dimensions to ${updatedImages} local images across ${updatedPages} HTML pages.`);
