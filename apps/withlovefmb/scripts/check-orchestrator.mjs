import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(siteRoot, '..', '..');

const [
  adminHtml,
  orchestratorSource,
  commandCenterSource,
  adminSource,
  vercelSource,
  migrationSource,
  operationsMigrationSource,
  secureConnectionsMigrationSource,
  connectionLockMigrationSource,
  integrationFunctionSource,
] = await Promise.all([
  readFile(path.join(siteRoot, 'admin.html'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/orchestrator.js'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/command-center.js'), 'utf8'),
  readFile(path.join(siteRoot, 'assets/js/admin.js'), 'utf8'),
  readFile(path.join(repoRoot, 'vercel.json'), 'utf8'),
  readFile(path.join(siteRoot, 'supabase/migrations/20260723120000_add_orchestrator_workspace.sql'), 'utf8'),
  readFile(path.join(siteRoot, 'supabase/migrations/20260726120000_add_operations_command_center.sql'), 'utf8'),
  readFile(path.join(siteRoot, 'supabase/migrations/20260726160000_add_secure_api_connections.sql'), 'utf8'),
  readFile(path.join(siteRoot, 'supabase/migrations/20260726162000_lock_api_connection_registry.sql'), 'utf8'),
  readFile(path.join(repoRoot, 'supabase/functions/automation-integrations/index.ts'), 'utf8'),
]);

const requiredPanels = [
  'overviewPanel',
  'inboxPanel',
  'knowledgePanel',
  'replyPanel',
  'workQueuePanel',
  'plannerPanel',
  'evidencePanel',
  'analyticsPanel',
  'automationPanel',
  'qaPanel',
  'moderationPanel',
  'contentPanel',
  'mediaPanel',
  'messagesPanel',
];
for (const id of requiredPanels) assert.match(adminHtml, new RegExp(`id=["']${id}["']`), `Missing panel ${id}`);

const ids = [...adminHtml.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'admin.html contains duplicate element IDs');
assert.match(adminHtml, /Human approval is the final step\./);
assert.match(adminHtml, /Nothing is sent automatically\./);
assert.match(adminHtml, /Instructions & Work Queue/);
assert.match(adminHtml, /Evidence & Approvals/);
assert.match(adminHtml, /Passwords and recovery codes are never accepted\./);
assert.doesNotMatch(adminHtml, /assets\/js\/(site|live-hotfix)\.js/);

const publicFiles = [
  'index.html',
  'aboutfmb/index.html',
  'news/index.html',
  'projects/index.html',
  'withlovefmb/index.html',
  'communityengagements/index.html',
  'volunteer.html',
  'gethelp/index.html',
  'fmbandco/index.html',
  'mabayani/index.html',
  'freedom-wall.html',
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
assert.match(adminSource, /admin-login\.html/);
assert.match(adminSource, /\['admin','moderator'\]\.includes\(profile\.role\)/);
assert.match(commandCenterSource, /from\('work_orders'\)/);
assert.match(commandCenterSource, /from\('work_evidence'\)/);
assert.match(commandCenterSource, /from\('automation_connections'\)/);
assert.match(commandCenterSource, /rpc\('transition_work_order'/);
assert.match(commandCenterSource, /rpc\('review_work_evidence'/);
assert.match(commandCenterSource, /rpc\('review_work_order'/);
assert.match(commandCenterSource, /storage\.from\('work-evidence'\)/);
assert.match(commandCenterSource, /postgres_changes/);
assert.match(commandCenterSource, /Passwords and recovery codes do not belong here\./);
assert.match(commandCenterSource, /functions\/v1\/automation-integrations/);
assert.match(commandCenterSource, /Enter app credentials/);
assert.match(commandCenterSource, /Enter API key manually/);
assert.match(commandCenterSource, /Connect account/);
assert.match(commandCenterSource, /Verify now/);
assert.match(adminHtml, /Manual API connection/);
assert.match(adminHtml, /Revenue activation/);
assert.match(adminHtml, /https:\/\/www\.senzpr\.com\/services\.html/);
assert.match(adminHtml, /https:\/\/www\.senzpr\.com\/contact\.html/);
assert.match(commandCenterSource, /data-revenue-action/);
assert.match(commandCenterSource, /Prepare a seven-day SENZ client acquisition sprint/);
assert.doesNotMatch(commandCenterSource, /data-connection-manage/);
assert.doesNotMatch(commandCenterSource, /fetch\(\s*["']https?:\/\//i, 'Command Center must not transmit records to an undeclared external API');

const vercel = JSON.parse(vercelSource);
assert.ok(vercel.rewrites.some((rule) => rule.source === '/' && rule.destination === '/admin.html' && rule.has?.some((condition) => condition.value === 'data.francinemariebautista.com')));
assert.ok(vercel.headers.some((rule) => rule.has?.some((condition) => condition.value === 'data.francinemariebautista.com') && rule.headers?.some((header) => header.key === 'Cache-Control' && header.value.includes('no-store'))));
assert.match(migrationSource, /enable row level security/i);
assert.match(migrationSource, /private\.is_fmb_admin\(\)/);
assert.doesNotMatch(migrationSource, /grant\s+delete/i);
assert.match(operationsMigrationSource, /create table if not exists public\.work_orders/i);
assert.match(operationsMigrationSource, /create table if not exists public\.work_evidence/i);
assert.match(operationsMigrationSource, /create table if not exists public\.automation_connections/i);
assert.match(operationsMigrationSource, /private\.is_fmb_staff\(\)/i);
assert.match(operationsMigrationSource, /Evidence is required before this work can be submitted/i);
assert.match(operationsMigrationSource, /Accept at least one evidence item before approving the work/i);
assert.doesNotMatch(operationsMigrationSource, /insert into public\.work_orders\s*\(/i, 'The command center must not seed fake work orders');
assert.match(secureConnectionsMigrationSource, /private\.automation_integration_credentials/i);
assert.match(secureConnectionsMigrationSource, /private\.automation_provider_tokens/i);
assert.match(secureConnectionsMigrationSource, /private\.automation_oauth_states/i);
assert.match(secureConnectionsMigrationSource, /vault\.decrypted_secrets/i);
assert.match(secureConnectionsMigrationSource, /create or replace function public\.ops_store_provider_token/i);
assert.match(secureConnectionsMigrationSource, /set status = 'connected_api'/i);
assert.match(secureConnectionsMigrationSource, /grant execute on function public\.ops_store_provider_token[\s\S]+to service_role/i);
assert.doesNotMatch(secureConnectionsMigrationSource, /grant execute on function public\.ops_store_provider_token[\s\S]+to authenticated/i);
assert.doesNotMatch(secureConnectionsMigrationSource, /insert into private\.automation_provider_tokens[\s\S]+sk-/i, 'The secure migration must not contain provider credentials');
assert.match(connectionLockMigrationSource, /revoke insert,update on table public\.automation_connections\s+from authenticated/i);
assert.match(connectionLockMigrationSource, /grant update\(processing_status,processed_at\)/i);
assert.match(integrationFunctionSource, /admin\.auth\.getUser\(token\)/);
assert.match(integrationFunctionSource, /ops_issue_oauth_state/);
assert.match(integrationFunctionSource, /ops_consume_oauth_state/);
assert.match(integrationFunctionSource, /ops_store_provider_token/);
assert.match(integrationFunctionSource, /verifyOpenAI/);
assert.match(integrationFunctionSource, /X-Hub-Signature-256/);
assert.match(integrationFunctionSource, /timingSafeEqual/);
assert.doesNotMatch(integrationFunctionSource, /console\.(?:log|debug)\(/, 'The integration gateway must not log tokens or payloads');

console.log(`FMB&CO. Orchestrator check passed: ${requiredPanels.length} panels and ${publicFiles.length} protected public routes.`);
