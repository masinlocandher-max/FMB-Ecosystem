import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const excluded = new Set([
  'build.mjs',
  'dist',
  'node_modules',
  'package-lock.json',
  'package.json',
  'vercel.json',
]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name) || entry.name.startsWith('.env')) continue;
  await cp(path.join(root, entry.name), path.join(output, entry.name), {
    recursive: true,
    force: true,
  });
}

const musicScriptPath = path.join(output, 'assets', 'js', 'music.js');
let musicScript = await readFile(musicScriptPath, 'utf8');
const originalMusicScript = musicScript;
musicScript = musicScript
  .replace(
    "const timer=window.setTimeout(()=>done(false),7000);",
    "const timer=window.setTimeout(()=>done(false),2500);",
  )
  .replace(
    "function beginPlayback(){\n    playRequested=true;",
    "function beginPlayback(){\n    const track=tracks[currentIndex];\n    if(track&&!audio.getAttribute('src')&&!applySource(track,0)){note.textContent='This track does not have a playable audio file.';return Promise.resolve()}\n    playRequested=true;",
  )
  .replace(
    "    applySource(track,0);\n    title.textContent=track.title||'Untitled track';",
    "    audio.pause();\n    audio.removeAttribute('src');\n    currentSourceIndex=0;\n    if(shouldPlay)applySource(track,0);\n    title.textContent=track.title||'Untitled track';",
  );
if (musicScript === originalMusicScript) {
  throw new Error('Music performance patch did not match the current player source.');
}
await writeFile(musicScriptPath, musicScript, 'utf8');

console.log('Built the FMB public website and Yoni application with Music audio requests deferred until an explicit play action.');
