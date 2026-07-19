(function(){
  'use strict';

  const installButton=document.getElementById('installNow');
  const shareButton=document.getElementById('sharePromotion');
  const status=document.getElementById('installStatus');
  const deviceLabel=document.getElementById('deviceLabel');
  const guideDevice=document.getElementById('guideDevice');
  const guide=document.getElementById('installGuide');
  const steps=document.getElementById('installSteps');
  if(!installButton||!shareButton||!status||!deviceLabel||!guideDevice||!guide||!steps)return;

  let deferredPrompt=null;
  const ua=navigator.userAgent||'';
  const iPadDesktop=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
  const isiOS=/iphone|ipad|ipod/i.test(ua)||iPadDesktop;
  const isAndroid=/android/i.test(ua);
  const standalone=window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const invitationUrl='https://app.francinemariebautista.com/app/install/';

  function setStatus(message,state=''){
    status.textContent=message;
    status.dataset.state=state;
  }

  function renderSteps(){
    if(isiOS){
      deviceLabel.textContent='For iPhone and iPad';
      guideDevice.textContent='iPhone or iPad';
      steps.innerHTML='<li><span>1</span><div><strong>Open this page in Safari</strong><p>Safari provides the clearest Add to Home Screen experience on iPhone and iPad.</p></div></li><li><span>2</span><div><strong>Tap Share</strong><p>Use the Share button, then scroll and choose Add to Home Screen.</p></div></li><li><span>3</span><div><strong>Tap Add</strong><p>The With love, FMB icon will open your registration-first wellbeing app.</p></div></li>';
      installButton.textContent='Show iPhone install steps';
      setStatus('In Safari, installation takes only a few taps.','attention');
      return;
    }
    if(isAndroid){
      deviceLabel.textContent='For Android';
      guideDevice.textContent='Android';
      steps.innerHTML='<li><span>1</span><div><strong>Use Chrome</strong><p>Open this official page in a current version of Chrome.</p></div></li><li><span>2</span><div><strong>Choose Install app</strong><p>Tap the browser menu, then choose Install app or Add to Home Screen.</p></div></li><li><span>3</span><div><strong>Confirm installation</strong><p>The With love, FMB icon will appear with your other apps.</p></div></li>';
      installButton.textContent='Show Android install steps';
      setStatus('Chrome may also show a direct installation prompt.');
      return;
    }
    deviceLabel.textContent='For phone and desktop';
    guideDevice.textContent='Desktop or laptop';
    steps.innerHTML='<li><span>1</span><div><strong>Use Chrome or Edge</strong><p>Open this page in a current browser that supports web app installation.</p></div></li><li><span>2</span><div><strong>Choose Install</strong><p>Use the install icon near the address bar or the Install app option in the browser menu.</p></div></li><li><span>3</span><div><strong>Keep it within reach</strong><p>Pin the app if you want faster access from your desktop or taskbar.</p></div></li>';
      installButton.textContent='Show installation steps';
      setStatus('You can also open this invitation on your phone.');
  }

  function revealGuide(){
    guide.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    window.setTimeout(()=>guide.focus({preventScroll:true}),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:420);
  }

  renderSteps();

  if(standalone){
    installButton.textContent='App already installed';
    installButton.disabled=true;
    setStatus('With love, FMB is already running as an installed app on this device.','success');
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    installButton.disabled=false;
    installButton.textContent='Install With love, FMB';
    setStatus('Your device is ready to install the app directly.','success');
  });

  installButton.addEventListener('click',async()=>{
    if(!deferredPrompt){
      setStatus(isiOS?'Follow the iPhone steps below, beginning with Safari and the Share button.':'Follow the device steps below to add the app.','attention');
      revealGuide();
      return;
    }
    installButton.disabled=true;
    const prompt=deferredPrompt;
    deferredPrompt=null;
    await prompt.prompt();
    const choice=await prompt.userChoice;
    installButton.disabled=false;
    if(choice.outcome==='accepted'){
      installButton.textContent='Installation started';
      setStatus('The app is being added to your device.','success');
    }else{
      installButton.textContent='Install With love, FMB';
      setStatus('Installation was not completed. You can try again from your browser menu.','attention');
    }
  });

  shareButton.addEventListener('click',async()=>{
    const data={title:'Install With love, FMB',text:'A private wellbeing space for check-ins, journaling, grounding, and kind community stories.',url:invitationUrl};
    try{
      if(navigator.share){
        await navigator.share(data);
        setStatus('The app invitation is ready to share.','success');
        return;
      }
      await navigator.clipboard.writeText(invitationUrl);
      setStatus('The official app invitation link was copied.','success');
    }catch(error){
      if(error?.name==='AbortError')return;
      setStatus('Copy this address to share the invitation: '+invitationUrl,'attention');
    }
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    installButton.disabled=true;
    installButton.textContent='App installed';
    setStatus('With love, FMB is now ready from your Home Screen.','success');
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('/service-worker.js').catch(()=>{}),{once:true});
  }
})();
