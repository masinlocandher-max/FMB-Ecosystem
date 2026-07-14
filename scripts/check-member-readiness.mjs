import fs from 'node:fs';

const source=fs.readFileSync(new URL('../assets/js/config.js',import.meta.url),'utf8');
const url=source.match(/SUPABASE_URL:\s*'([^']+)'/)?.[1];
const key=source.match(/SUPABASE_ANON_KEY:\s*'([^']+)'/)?.[1];
const requireOpen=process.argv.includes('--require-open');
const headers={
  apikey:key,
  Authorization:`Bearer ${key}`,
  'Content-Type':'application/json'
};

if(!url||!key){
  console.error('Supabase public configuration is missing.');
  process.exit(1);
}

const response=await fetch(`${url}/rest/v1/rpc/get_membership_status`,{
  method:'POST',
  headers,
  body:'{}'
});

if(!response.ok){
  const body=await response.text();
  console.error(`Membership readiness RPC failed (${response.status}).`);
  console.error(body);
  console.error('Run supabase/schema.sql and supabase/migrations/20260712_membership_readiness.sql in the live Supabase project.');
  process.exit(1);
}

const status=await response.json();
if(!status?.ready){
  console.error('The live membership service did not report ready.');
  process.exit(1);
}

console.log(`Live membership schema: ${status.schema_version||'unknown'}`);
console.log(`Registration open: ${status.registration_open===true?'yes':'no'}`);

if(requireOpen&&status.registration_open!==true){
  console.error('Registration is safely closed. Open it from the administrator dashboard only after completing member tests.');
  process.exit(1);
}

const adminProbe=await fetch(`${url}/rest/v1/rpc/admin_set_membership_open`,{
  method:'POST',
  headers,
  body:JSON.stringify({p_open:status.registration_open===true})
});

if(adminProbe.ok){
  console.error('Security check failed: anonymous visitors can change membership registration.');
  process.exit(1);
}

console.log('Anonymous membership-control mutation: denied');
