import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot=path.resolve(new URL('..',import.meta.url).pathname);
const file=path.join(repositoryRoot,'dist','index.html');
let html=await readFile(file,'utf8');

function findSectionEnd(source,start){
  const token=/<section\b|<\/section>/gi;
  token.lastIndex=start;
  let depth=0;
  let match;
  while((match=token.exec(source))){
    if(match[0].toLowerCase().startsWith('</'))depth-=1;
    else depth+=1;
    if(depth===0)return token.lastIndex;
  }
  return -1;
}

const start=html.indexOf('<section class="fmb-approved-control-center"');
if(start<0)throw new Error('Approved dashboard section is missing.');
const end=findSectionEnd(html,start);
if(end<0)throw new Error('Approved dashboard section is not balanced.');
const dashboard=html.slice(start,end);
html=`${html.slice(0,start)}${html.slice(end)}`;
const bottomGrid=html.search(/<section\b[^>]*class=["'][^"']*bottom-grid[^"']*["'][^>]*>/i);
if(bottomGrid<0)throw new Error('Homepage bottom grid insertion point is missing.');
html=`${html.slice(0,bottomGrid)}${dashboard}\n${html.slice(bottomGrid)}`;
await writeFile(file,html,'utf8');

const main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
if(!main.includes(dashboard))throw new Error('Approved dashboard is outside the homepage main content.');
console.log('Placed the approved dashboard as a balanced top-level homepage section.');
