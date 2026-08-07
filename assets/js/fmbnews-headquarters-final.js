(() => {
  const root = document.documentElement;
  const body = document.body;
  if (!body || !body.classList.contains('fmb-news-clean')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.add('fmb-hq-js');
  body.classList.add('fmb-hq-universe');

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const atmosphere = document.querySelector('.fmb-hq-atmosphere');
  const progress = document.querySelector('.fmb-hq-progress');
  const brandHeroMedia = document.querySelector('.fnc-brand-hero-media');

  const revealTargets = [
    ...document.querySelectorAll(
      '.fnc-lead, .fnc-section-head, .fnc-card, .fnc-archive, ' +
      '.fnc-lead-desk-head, ' +
      '.fnc-explainer-head, .fnc-explainer-grid > li, ' +
      '.nc-article-hero-grid, .nc-story-media, .nc-philippine-stakes, ' +
      '.nc-story-body > h2, .nc-factbox, .nc-pullquote, .nc-reflection, ' +
      '.nc-sources, .nc-next, .fnc-footer-grid'
    ),
  ];

  for (const target of revealTargets) target.classList.add('fmb-reveal');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    for (const target of revealTargets) target.classList.add('is-visible');
  } else {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    for (const target of revealTargets) observer.observe(target);
    window.setTimeout(() => {
      for (const target of revealTargets) target.classList.add('is-visible');
    }, 1200);
  }

  const focusSurfaces = [
    ...document.querySelectorAll('.fnc-lead, .fnc-card figure, .nc-story-media figure'),
  ];

  for (const surface of focusSurfaces) {
    surface.addEventListener('pointermove', (event) => {
      if (reducedMotion || event.pointerType === 'touch') return;
      const rect = surface.getBoundingClientRect();
      const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 30, 70);
      const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 28, 72);
      surface.style.setProperty('--fmb-focus-x', `${x.toFixed(2)}%`);
      surface.style.setProperty('--fmb-focus-y', `${y.toFixed(2)}%`);
    });
    surface.addEventListener('pointerleave', () => {
      surface.style.removeProperty('--fmb-focus-x');
      surface.style.removeProperty('--fmb-focus-y');
    });
  }

  const clocks = [...document.querySelectorAll('[data-fmb-hq-clock]')];
  const updateClock = () => {
    const value = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date());
    for (const clock of clocks) clock.textContent = value;
  };

  if (clocks.length) {
    updateClock();
    window.setInterval(updateClock, 1000);
  }

  let raf = 0;
  const updateScene = () => {
    raf = 0;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = clamp(window.scrollY / maxScroll, 0, 1);
    const viewportMid = window.scrollY + window.innerHeight * 0.42;
    const lightX = 44 + Math.sin(viewportMid / 760) * 14;
    const lightY = 8 + Math.cos(viewportMid / 920) * 6;

    root.style.setProperty('--fmb-scroll', ratio.toFixed(5));
    root.style.setProperty('--fmb-light-x', `${lightX.toFixed(2)}%`);
    root.style.setProperty('--fmb-light-y', `${lightY.toFixed(2)}%`);
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (atmosphere && !reducedMotion) {
      atmosphere.style.transform = `translate3d(0, ${(-ratio * 34).toFixed(2)}px, 0)`;
    }
    if (brandHeroMedia && !reducedMotion && window.innerWidth > 820) {
      const heroOffset = clamp(window.scrollY * 0.035, 0, 42);
      brandHeroMedia.style.transform = `scale(1.035) translate3d(0, ${heroOffset.toFixed(2)}px, 0)`;
    }
  };

  const queueScene = () => {
    if (raf) return;
    raf = window.requestAnimationFrame(updateScene);
  };

  window.addEventListener('scroll', queueScene, { passive: true });
  window.addEventListener('resize', queueScene, { passive: true });
  updateScene();

  const headlineTargets = [
    ...document.querySelectorAll(
      '.fnc-brand-hero h1, .fnc-lead h3, .fnc-section-head h2, .fnc-card-copy h3, ' +
      '.nc-article-hero h1, .nc-story-body h2, .nc-next h2'
    ),
  ];
  for (const headline of headlineTargets) headline.dataset.fmbTransmitted = 'true';

  window.requestAnimationFrame(() => body.classList.add('fmb-hq-ready'));
})();
