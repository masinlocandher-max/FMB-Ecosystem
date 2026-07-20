(function(){
'use strict';
const isYoni=/(^yoni\.francinemariebautista\.com$)|(^app\.francinemariebautista\.com$)/i.test(location.hostname)||/^\/app(?:\/|$)/.test(location.pathname);if(!isYoni)return;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const K={lang:'yoni-language-v2',sound:'yoni-sound-effects-v2',mode:'yoni-response-mode-v1'};
const read=(k,f)=>{try{const v=localStorage.getItem(k);return v===null?f:JSON.parse(v)}catch{return f}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const isTaglish=()=>read(K.lang,'taglish')==='taglish';
const safety=/\b(911|1553|NCMH|emergency|immediate danger|immediate safety|safety comes first|cannot contact emergency services|harm yourself|kill yourself)\b/i;
const patterns={
  sad:/lungkot|sad|iyak|crying|mabigat|heartbroken|broken|namimiss|miss ko|iniwan/i,
  anxious:/kabado|anx|worried|takot|overthink|praning|panic|nervous|what if/i,
  tired:/pagod|puyat|hapo|exhaust|drained|antok|ubos/i,
  overwhelmed:/overwhelm|too much|sabay.?sabay|di ko na kaya lahat|ang dami|everything at once/i,
  lonely:/lonely|alone|mag-isa|walang kausap|isolated|left out/i
};
const openings=[
  'Okay, nandito lang ako. Hindi mo kailangang ayusin muna yung kwento.',
  'Go lang. Kahit magulo or paulit-ulit, pwede mong sabihin dito.',
  'Salamat sa pagsabi. Hindi kita mamadaliin.',
  'You can give me the unfiltered version. Walang pressure maging okay.',
  'Gets. Hindi natin kailangang gawing solution agad yung nararamdaman mo.'
];
const replies={
  listen:[
    'Sige lang, kwento mo pa. Hindi muna kita bibigyan ng lecture.',
    'Sometimes kailangan lang may makinig without turning everything into advice.',
    'No fixing muna. Ano yung part na pinaka-masakit sabihin?',
    'Hindi mo kailangang i-defend bakit ka naapektuhan. Naapektuhan ka, and that matters.',
    'I’m still here. Ano yung part na paulit-ulit bumabalik sa isip mo?'
  ],
  comfort:[
    'Ang bigat nun. Be extra gentle with yourself tonight, please.',
    'Hindi ka weak dahil malalim yung nararamdaman mo. May mahalaga lang talagang nasaktan.',
    'Hindi mo kailangang mag-explain perfectly para deserving ka ng comfort.',
    'For now, water muna, one slow breath, then one safe next step.',
    'Pwede munang hindi productive. Getting through this moment counts.'
  ],
  think:[
    'Okay, hatiin natin: ano yung fact, ano yung fear, at ano talaga yung kailangan mo next?',
    'Ano yung kaya mong kontrolin today, at ano yung pwedeng ipagpabukas without guilt?',
    'What do you know for sure, versus ano yung kinakatakutan mong baka mangyari?',
    'Ano yung smallest next move na respectful pa rin sa sarili mo?',
    'Ano yung pinaka-urgent, hindi yung pinaka-maingay sa utak mo?'
  ],
  ground:[
    'Feet on the floor muna. Feel the pressure under your feet, then exhale slowly.',
    'Look around. Name three colors na nakikita mo right now.',
    'Small inhale, longer exhale. Hindi kailangang sobrang lalim.',
    'Relax your jaw and shoulders. Hayaan mong saluhin ka ng chair or bed.',
    'Touch something near you. Warm ba, cool, rough, or soft?'
  ],
  sad:[
    'Hindi mo kailangang gawing lesson yung lungkot tonight. Pwedeng malungkot ka lang muna.',
    'Pwede kang umiyak, tumahimik, or magkwento pa. None of those make you dramatic.',
    'I’m sorry ang sakit nito. Ano yung pinaka-miss mo or pinaka-mabigat mawala?'
  ],
  anxious:[
    'Okay, bagalan natin. Anxiety can make “baka” feel like “sigurado.”',
    'Hindi mo kailangang sagutin lahat ng future scenarios. Next ten minutes lang muna.',
    'Ano yung one thing na totoo right now, hindi yung worst-case scenario?'
  ],
  tired:[
    'Mukhang ubos ka. Baka rest ang task, hindi another productivity lecture.',
    'Okay lang na minimum version lang ang kaya mo today.',
    'You sound drained. Ano yung pwede mong hindi gawin today?'
  ],
  overwhelmed:[
    'Hindi mo kailangang buhatin lahat sabay-sabay. One thing muna.',
    'Kapag overwhelmed, parang lahat urgent. Pili tayo ng isang totoong urgent lang.',
    'Pwede nating gawing tatlo lang: now, later, and not yours to carry.'
  ],
  lonely:[
    'Hindi mo kailangang maging entertaining para deserving ka ng company.',
    'Being lonely does not mean unwanted ka. It means importante sa’yo ang connection.',
    'May safe person ba na pwede mong i-message ng “Can you stay with me for a bit?”'
  ]
};
let lastUserText='';
function choose(list,seed=''){const score=[...String(seed)].reduce((n,c)=>n+c.charCodeAt(0),Date.now());return list[Math.abs(score)%list.length]}
function classify(text){for(const [key,pattern] of Object.entries(patterns))if(pattern.test(text))return key;return null}
function humanReply(text){
  const mode=read(K.mode,'listen');
  const feeling=classify(text);
  let bank=mode==='comfort'?replies.comfort:mode==='think'?replies.think:mode==='ground'?replies.ground:replies.listen;
  if(feeling&&mode==='listen')bank=[...replies[feeling],...replies.listen];
  if(feeling&&mode==='comfort')bank=[...replies[feeling],...replies.comfort];
  const answer=choose(bank,text+mode);
  return Math.random()>.38?`${choose(openings,text)} ${answer}`:answer;
}
function capture(){
  document.addEventListener('submit',event=>{if(event.target?.id==='chatForm')lastUserText=$('#chatInput')?.value.trim()||''},true);
  document.addEventListener('click',event=>{const chip=event.target.closest?.('.chat-chip');if(chip)lastUserText=chip.textContent.trim()},true);
}
function enhanceChat(){
  const log=$('#chatLog');if(!log)return;
  const apply=node=>{
    if(!isTaglish()||!lastUserText||node.classList.contains('user')||node.dataset.yoniHumanized==='1')return;
    const bubble=node.querySelector('.bubble');if(!bubble||bubble.classList.contains('typing'))return;
    const current=bubble.textContent.trim();if(!current||safety.test(current))return;
    node.dataset.yoniHumanized='1';
    const replace=()=>{if(!safety.test(bubble.textContent))bubble.childNodes[0].textContent=humanReply(lastUserText)};
    if(node.classList.contains('yoni-new-message'))setTimeout(replace,20);
    else{
      const watch=new MutationObserver(()=>{if(node.classList.contains('yoni-new-message')){watch.disconnect();setTimeout(replace,20)}});
      watch.observe(node,{attributes:true,attributeFilter:['class']});
      setTimeout(()=>watch.disconnect(),5000);
    }
  };
  $$('.bubble-row').forEach(apply);
  new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node instanceof HTMLElement&&node.classList.contains('bubble-row'))apply(node)}))).observe(log,{childList:true});
}
function chime(){
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
  const audio=new Audio(),now=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
  osc.type='sine';osc.frequency.setValueAtTime(523.25,now);osc.frequency.exponentialRampToValueAtTime(659.25,now+.13);
  gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.3);
  osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+.32);
}
function soundInvite(){
  if(localStorage.getItem(K.sound)!==null||sessionStorage.getItem('yoni-sound-invite-v2'))return;
  sessionStorage.setItem('yoni-sound-invite-v2','1');
  const show=()=>{
    if(!$('#appShell')||$('#appShell').hidden||$('.post-login-layer.visible'))return false;
    document.body.insertAdjacentHTML('beforeend',`<div class="yoni-sound-invite" id="yoniSoundInvite" role="dialog" aria-modal="true" aria-labelledby="yoniSoundInviteTitle"><section><img src="/app/assets/yoni/yoni-music.png" width="92" height="92" alt="Yoni enjoying music"><div><p>Optional sound</p><h2 id="yoniSoundInviteTitle">Gusto mo ng gentle sounds?</h2><span>May soft chime kapag may reply or saved moment. Ikaw pa rin ang may control.</span></div><div class="yoni-sound-actions"><button id="yoniEnableSound">Turn on sounds</button><button id="yoniKeepQuiet">Keep it quiet</button></div></section></div>`);
    const close=()=>$('#yoniSoundInvite')?.remove();
    $('#yoniEnableSound').onclick=()=>{write(K.sound,true);chime();close();setTimeout(()=>$('#yoniSoundSwitch')?.classList.add('active'),120)};
    $('#yoniKeepQuiet').onclick=()=>{write(K.sound,false);close()};
    return true;
  };
  let tries=0;const timer=setInterval(()=>{tries++;if(show()||tries>25)clearInterval(timer)},700);
}
function install(){capture();enhanceChat();setTimeout(soundInvite,2100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
