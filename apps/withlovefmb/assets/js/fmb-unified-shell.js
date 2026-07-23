(() => {
  'use strict';

  const body = document.body;
  const shell = document.querySelector('.fmb-unified-shell');
  if (!body || !shell) {
    if (body) body.style.visibility = 'visible';
    return;
  }

  const page = body.dataset.fmbPage || 'public';
  const menuButton = shell.querySelector('.fmb-unified-menu-button');
  const backToTop = document.querySelector('.fmb-back-to-top');

  const closeMenu = () => {
    body.classList.remove('fmb-menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open navigation');
  };

  menuButton?.addEventListener('click', () => {
    const open = !body.classList.contains('fmb-menu-open');
    body.classList.toggle('fmb-menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });

  shell.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  if (page === 'home') {
    const heroCopy = document.querySelector('.hero-copy');
    if (heroCopy && !heroCopy.querySelector('.fmb-hero-mark')) {
      const mark = document.createElement('img');
      mark.className = 'fmb-hero-mark';
      mark.src = '/assets/images/fmb-approved/fmb-master-transparent.webp';
      mark.width = 1129;
      mark.height = 724;
      mark.alt = 'FMB';
      mark.fetchPriority = 'high';
      heroCopy.prepend(mark);
    }
  }

  document.querySelectorAll('img[src*="francine-"]').forEach((image) => {
    image.dataset.fmbHdPhoto = 'true';
    image.decoding = 'async';
    if (!image.hasAttribute('sizes')) {
      image.sizes = image.width > image.height
        ? '(max-width: 960px) 100vw, 55vw'
        : '(max-width: 960px) 88vw, 44vw';
    }
  });

  backToTop?.addEventListener('click', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  });

  const updateBackToTop = () => {
    backToTop?.classList.toggle('is-visible', window.scrollY > 680);
  };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  body.style.visibility = 'visible';
})();
