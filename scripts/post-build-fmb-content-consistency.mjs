import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dist=path.resolve('dist');

async function update(relative, transform){
  const file=path.join(dist,relative);
  const original=await readFile(file,'utf8');
  const next=transform(original);
  if(next===original) throw new Error(`${relative}: expected legacy content was not found`);
  await writeFile(file,next,'utf8');
}

await update('index.html',html=>html
  .replaceAll('/aboutfmb/#work-with-fmb','/work-with-fmb/')
  .replaceAll('/withlovefmb/#volunteer','/get-involved/')
  .replace('Francine Marie Bautista is the founder, strategist, creative director, and storyteller behind the FMB ecosystem.','Francine Marie Bautista is a creative director, brand strategist, entrepreneur, photographer, storyteller, educator, trainer, PR practitioner, cultural advocate, and founder behind the FMB ecosystem.')
  .replace('"jobTitle": ["Founder", "Strategist", "Creative Director", "Storyteller"]','"jobTitle": ["Creative Director", "Brand Strategist", "Entrepreneur", "Photographer", "Storyteller", "Educator", "Trainer", "PR Practitioner", "Cultural Advocate", "Founder"]'));

for(const relative of ['aboutfmb/index.html','fmbandco/index.html']){
  await update(relative,html=>html.replaceAll('/aboutfmb/#work-with-fmb','/work-with-fmb/'));
}

const homepage=await readFile(path.join(dist,'index.html'),'utf8');
for(const legacy of ['/aboutfmb/#work-with-fmb','/withlovefmb/#volunteer','["Founder", "Strategist", "Creative Director", "Storyteller"]']){
  if(homepage.includes(legacy)) throw new Error(`Homepage still contains legacy value: ${legacy}`);
}
console.log('Removed all remaining legacy FMB routes and reduced-role metadata.');