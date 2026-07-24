(() => {
  'use strict';

  const body = document.body;
  if (!body?.classList.contains('fmb-approved-launch')) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const setPst = () => {
    const formatter = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const value = `${formatter.format(new Date())} PST`;
    document.querySelectorAll('[data-fmb-pst]').forEach((node) => {
      node.textContent = value;
      node.setAttribute('datetime', new Date().toISOString());
    });
  };

  setPst();
  const clockTimer = window.setInterval(setPst, 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) setPst();
  });

  const headerMenu = document.querySelector('.fmb-shell-menu');
  const dockMenu = document.querySelector('[data-fmb-dock-menu]');
  const nav = document.querySelector('.fmb-shell-nav');

  const syncDockMenu = () => {
    if (!dockMenu || !headerMenu) return;
    const expanded = headerMenu.getAttribute('aria-expanded') || 'false';
    dockMenu.setAttribute('aria-expanded', expanded);
    dockMenu.setAttribute('aria-label', expanded === 'true' ? 'Close navigation' : 'Open navigation');
  };

  dockMenu?.addEventListener('click', (event) => {
    event.stopPropagation();
    headerMenu?.click();
    syncDockMenu();
    window.requestAnimationFrame(syncDockMenu);
  });

  if (headerMenu) {
    const menuStateObserver = new MutationObserver(syncDockMenu);
    menuStateObserver.observe(headerMenu, { attributes: true, attributeFilter: ['aria-expanded'] });
    window.addEventListener('pagehide', () => menuStateObserver.disconnect(), { once: true });
  }

  headerMenu?.addEventListener('click', () => window.requestAnimationFrame(syncDockMenu));
  nav?.addEventListener('click', () => window.requestAnimationFrame(syncDockMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') window.requestAnimationFrame(syncDockMenu);
  });
  syncDockMenu();

  const currentPath = window.location.pathname.replace(/index\.html$/i, '') || '/';
  document.querySelectorAll('.fmb-mobile-dock a[href]').forEach((link) => {
    const target = new URL(link.getAttribute('href'), window.location.origin).pathname.replace(/index\.html$/i, '') || '/';
    const active = target === '/' ? currentPath === '/' : currentPath.startsWith(target);
    if (active) link.setAttribute('aria-current', 'page');
  });

  const updateParallax = () => {
    if (reduceMotion.matches || window.innerWidth < 961) {
      document.documentElement.style.setProperty('--fmb-parallax', '0px');
      return;
    }
    const offset = Math.max(-18, Math.min(18, window.scrollY * -0.018));
    document.documentElement.style.setProperty('--fmb-parallax', `${offset.toFixed(2)}px`);
  };

  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      updateParallax();
    });
  };

  updateParallax();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateParallax, { passive: true });
  reduceMotion.addEventListener?.('change', updateParallax);

  document.querySelectorAll('img').forEach((image) => {
    const markLoaded = () => image.classList.add('fmb-image-ready');
    if (image.complete) markLoaded();
    else image.addEventListener('load', markLoaded, { once: true });
  });

  const pauseTrack = (windowNode, paused) => {
    const track = windowNode?.querySelector('.fmb-announcement-track, .fmb-news-ticker-track');
    if (track) track.style.animationPlayState = paused ? 'paused' : '';
  };

  document.querySelectorAll('.fmb-announcement-window, .fmb-news-ticker-window').forEach((windowNode) => {
    windowNode.addEventListener('pointerenter', () => pauseTrack(windowNode, true));
    windowNode.addEventListener('pointerleave', () => pauseTrack(windowNode, false));
    windowNode.addEventListener('focusin', () => pauseTrack(windowNode, true));
    windowNode.addEventListener('focusout', () => pauseTrack(windowNode, false));
  });

  const cleanup = () => {
    window.clearInterval(clockTimer);
    if (frame) window.cancelAnimationFrame(frame);
  };
  window.addEventListener('pagehide', cleanup, { once: true });

  body.dataset.fmbApprovedLaunchReady = 'true';
})();
