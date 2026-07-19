import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const applicationsDirectory = path.join(repositoryRoot, 'apps');
const outputDirectory = path.join(repositoryRoot, 'dist');
const privateSitesDirectory = path.join(outputDirectory, '_sites');

const personalWebsite = path.join(applicationsDirectory, 'withlovefmb');
const senzWebsite = path.join(applicationsDirectory, 'senz');
const cognitaWebsite = path.join(applicationsDirectory, 'cognita');
const cognitaOutput = path.join(cognitaWebsite, 'dist');

async function requireFile(filePath) {
  const details = await stat(filePath);
  if (!details.isFile()) {
    throw new Error(`Expected a file at ${filePath}`);
  }
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed in ${cwd}`);
  }
}

await Promise.all([
  requireFile(path.join(personalWebsite, 'index.html')),
  requireFile(path.join(senzWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'index.html')),
  requireFile(path.join(cognitaWebsite, 'package.json')),
]);

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(privateSitesDirectory, { recursive: true });

await cp(personalWebsite, outputDirectory, { recursive: true });
await cp(senzWebsite, path.join(privateSitesDirectory, 'senz'), { recursive: true });

run('npm', ['ci'], cognitaWebsite);
run('npm', ['run', 'build'], cognitaWebsite);

await cp(cognitaOutput, path.join(privateSitesDirectory, 'cognita'), {
  recursive: true,
});

await Promise.all([
  requireFile(path.join(outputDirectory, 'index.html')),
  requireFile(path.join(outputDirectory, 'app', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'senz', 'index.html')),
  requireFile(path.join(privateSitesDirectory, 'cognita', 'index.html')),
]);

console.log('FMB ecosystem build completed successfully.');
