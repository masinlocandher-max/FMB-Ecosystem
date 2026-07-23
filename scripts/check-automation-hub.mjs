import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.cwd();
const libPath=path.join(root,'apps/withlovefmb/api/automation/_automation-lib.js');
const metaPath=path.join(root,'apps/withlovefmb/api/automation/meta-webhook.js');
const intakePath=path.join(root,'apps/withlovefmb/api/automation/intake.js');
const statusPath=path.join(root,'apps/withlovefmb/api/automation/status.js');
const scriptPath=path.join(root,'automation/google-apps-script/Code.gs');
const docsPath=path.join(root,'docs/FMB_AUTOMATION_HUB.md');

for(const file of [libPath,metaPath,intakePath,statusPath,scriptPath,docsPath]){
  assert.ok(fs.existsSync(file),`Missing Automation Hub file: ${path.relative(root,file)}`);
  assert.ok(fs.statSync(file).size>100,`Automation Hub file is unexpectedly empty: ${path.relative(root,file)}`);
}

const lib=await import(pathToFileURL(libPath).href);
for(const endpoint of [metaPath,intakePath,statusPath]){
  const module=await import(pathToFileURL(endpoint).href);
  assert.equal(typeof module.default,'function',`${path.relative(root,endpoint)} must export a default handler.`);
}

assert.deepEqual(lib.classify('Can you send your branding package and website proposal?'),{
  brand:'FMB&CO. / SENZ',owner:'Business Desk',intent:'business_general',priority:'Normal',unknown:false
});
assert.equal(lib.classify('I want to volunteer for an LGBTQIA+ community project').brand,'With Love, FMB');
assert.equal(lib.classify('I cannot sign in to my Yoni profile').brand,'Yoni');
assert.equal(lib.classify('Can Francine speak at our training workshop?').brand,'FMB');
assert.equal(lib.classify('What does this question mean?').unknown,true);
assert.equal(lib.classify('I am in immediate danger and need help').priority,'Urgent');

const raw=Buffer.from('{"object":"page","entry":[]}');
const secret='test-secret';
const signature='sha256='+crypto.createHmac('sha256',secret).update(raw).digest('hex');
assert.equal(lib.verifyMetaSignature(raw,signature,secret),true);
assert.equal(lib.verifyMetaSignature(raw,'sha256=bad',secret),false);

const events=lib.normalizeMetaEvents({
  object:'page',
  entry:[{messaging:[{
    sender:{id:'sender-1'},recipient:{id:'page-1'},timestamp:1784780000000,
    message:{mid:'mid.001',text:'May I request a social media proposal?'}
  },{
    sender:{id:'page-1'},recipient:{id:'sender-1'},timestamp:1784780000001,
    message:{mid:'mid.echo',text:'echo',is_echo:true}
  }]}]
});
assert.equal(events.length,1);
assert.equal(events[0].channel,'Messenger');
assert.equal(events[0].brand,'FMB&CO. / SENZ');
assert.equal(events[0].sourceEventId,'mid.001');
assert.equal(events[0].status,'Needs Review');

const generic=lib.normalizeGenericEvent({
  channel:'ChatGPT',senderId:'chat-1',message:'A question nobody has approved yet',sourceEventId:'chat-event-1'
});
assert.equal(generic.unknown,true);
assert.equal(generic.brand,'Unknown');
assert.equal(generic.sourceEventId,'chat-event-1');

const appScript=fs.readFileSync(scriptPath,'utf8');
for(const marker of ['FMB_AUTOMATION_SHEET_ID','FMB_AUTOMATION_SECRET','isDuplicate_','Unknown Questions','Automation Log']){
  assert.ok(appScript.includes(marker),`Apps Script receiver is missing ${marker}`);
}

const docs=fs.readFileSync(docsPath,'utf8');
for(const marker of ['HUMAN_REVIEW_ONLY=true','META_APP_SECRET','AUTOMATION_INGEST_URL','Supabase remains reserved for authenticated members','api/automation/meta-webhook']){
  assert.ok(docs.toLowerCase().includes(marker.toLowerCase()),`Automation documentation is missing ${marker}`);
}

console.log('Automation Hub ESM handlers, routing, signature verification, event normalization, Sheet receiver, and privacy-boundary checks passed.');
