(function(){
  'use strict';
  const config=window.FMB_CONFIG||{},feed=document.getElementById('communityFeed'),status=document.getElementById('communityStatus');
  const configured=Boolean(config.SUPABASE_URL&&config.SUPABASE_ANON_KEY&&window.supabase);
  const escapeHtml=value=>{const node=document.createElement('div');node.textContent=value||'';return node.innerHTML};
  if(!configured){status.textContent='The verified community service is being connected. No public posts are shown until review and account protection are ready.';status.className='status show';return}
  const client=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY);
  client.from('freedom_wall_posts').select('alias,content,published_at').eq('status','published').order('published_at',{ascending:false}).limit(60).then(({data,error})=>{if(error){status.textContent='The community could not be opened right now.';status.className='status show error';return}feed.innerHTML=data?.length?data.map(post=>`<article class="mini-card"><p class="eyebrow">${escapeHtml(post.alias||'Community member')}</p><h3>${escapeHtml(post.content)}</h3><small>${post.published_at?new Date(post.published_at).toLocaleDateString():''}</small></article>`).join(''):'<article class="mini-card"><p>No approved posts yet.</p></article>'});
})();
