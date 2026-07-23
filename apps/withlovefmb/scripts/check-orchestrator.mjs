import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(siteRoot, '..', '..');

const [adminHtml, orchestratorSource, adminSource, authSource, vercelSource, migrationSource] = await Promise.all([
  readFile(path.join(siteRoot, 'admin.html'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/orchestrator.js'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/admin.js'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/auth.js'), 'utf8'),
  readFile(path.join(repoRoot, 'vercel.json'), 'utf8'),
  readFile(path.join(siteRoot, 'supabase/migrations/20260723120000_add_orchestrator_workspace.sql'), 'utf8'),
]);

const requiredPanels = [
  'overviewPanel',
  'inboxPanel',
  'knowledgePanel',
  'replyPanel',
  'plannerPanel',
  'analyticsPanel',
  'automationPanel',
  'qaPanel',
  'membersCommunityPanel',
  'membersPanel',
  'moderationPanel',
  'contentPanel',
  'musicPanel',
  'mediaPanel',
  'messagesPanel',
];
for (const id of requiredPanels) assert.match(adminHtml, new RegExp(`id=["']${id}["']`), `Missing panel ${id}`);

const ids = [...adminHtml.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'admin.html contains duplicate element IDs');
assert.match(adminHtml, /Human approval is the final step\./);
assert.match(adminHtml, /Nothing is sent automatically\./);
assert.doesNotMatch(adminHtml, /assets\/js\/(site|live-hotfix)\.js/);

const publicFiles = [
  'index.html',
  'aboutfmb/index.html',
  'news/index.html',
  'projects/index.html',
  'ebooks/index.html',
  'music/index.html',
  'withlovefmb/index.html',
  'communityengagements/index.html',
  'volunteer.html',
  'gethelp/index.html',
  'fmbandco/index.html',
  'mabayani/index.html',
  'freedom-wall.html',
  'profile/index.html',
  'app/index.html',
];
for (const relativePath of publicFiles) {
  const filePath = path.join(siteRoot, relativePath);
  await access(filePath);
  assert.ok((await stat(filePath)).size > 500, `${relativePath} is unexpectedly small`);
}
assert.match(await readFile(path.join(siteRoot, 'volunteer.html'), 'utf8'), /communityengagements\//i);
const volunteerPage = await readFile(path.join(siteRoot, 'communityengagements/index.html'), 'utf8');
assert.match(volunteerPage, /participation inquiry/i);
assert.match(volunteerPage, /id=["']participate["']/i);

const instrumentedSource = orchestratorSource.replace(
  /\n\s*renderIcons\(\);\n\}\)\(\);\s*$/,
  `\n  state=createDefaultState();\n  globalThis.__opsTest={redactQuestion,classifyQuestion,createDefaultState};\n})();`,
);
assert.notEqual(instrumentedSource, orchestratorSource, 'Could not instrument orchestrator source for unit checks');

const context = {
  console,
  URL,
  Blob,
  Intl,
  setTimeout,
  clearTimeout,
  requestAnimationFrame() {},
  document: {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return { textContent: '', innerHTML: '' }; },
  },
  window: { addEventListener() {}, FMB: null },
};
context.globalThis = context;
vm.runInNewContext(instrumentedSource, context, { filename: 'orchestrator.js' });
const operations = context.__opsTest;
assert.ok(operations, 'Orchestrator test API was not created');

const redacted = operations.redactQuestion('Email owner@example.com, call +63 917 123 4567, or message @private_handle.');
assert.equal(redacted, 'Email [email removed], call [phone removed], or message [handle removed].');
assert.deepEqual(
  JSON.parse(JSON.stringify(operations.classifyQuestion('How much is the Cognita scholarship enrollment fee?'))),
  { brand: 'Cognita', intent: 'Pricing', status: 'uncovered' },
);
assert.deepEqual(
  JSON.parse(JSON.stringify(operations.classifyQuestion('Is Yoni a therapist during a crisis?'))),
  { brand: 'Yoni', intent: 'Support and safety', status: 'covered' },
);

const initialState = operations.createDefaultState();
assert.equal(initialState.questions.length, 0, 'Question analytics must start without fabricated records');
assert.equal(initialState.contentPlan.length, 0, 'Content planning must start without fabricated records');
assert.ok(initialState.replySets.every((set) => set.status !== 'approved'), 'Seed replies must require human review');
assert.ok(initialState.qaRoutes.some((route) => route.path === '/volunteer.html'), 'Volunteer must remain in every QA run');

assert.match(orchestratorSource, /navigator\.clipboard\.writeText/);
assert.match(orchestratorSource, /It has no send control/);
assert.match(orchestratorSource, /from\('orchestrator_workspaces'\)/);
assert.doesNotMatch(orchestratorSource, /fetch\(\s*["']https?:\/\//i, 'Orchestrator must not send records to an external API');
assert.match(adminSource, /auth\.html\?next=%2Fadmin\.html#signin/);
assert.match(authSource, /target\.origin===location\.origin/);

const vercel = JSON.parse(vercelSource);
assert.ok(vercel.rewrites.some((rule) => rule.source === '/' && rule.destination === '/admin.html' && rule.has?.some((condition) => condition.value === 'data.francinemariebautista.com')));
assert.ok(vercel.headers.some((rule) => rule.has?.some((condition) => condition.value === 'data.francinemariebautista.com') && rule.headers?.some((header) => header.key === 'Cache-Control' && header.value.includes('no-store'))));
assert.match(migrationSource, /enable row level security/i);
assert.match(migrationSource, /private\.is_fmb_admin\(\)/);
assert.doesNotMatch(migrationSource, /grant\s+delete/i);

console.log(`FMB&CO. Orchestrator check passed: ${requiredPanels.length} panels and ${publicFiles.length} protected public routes.`);
