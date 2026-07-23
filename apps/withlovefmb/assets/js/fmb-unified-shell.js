(() => {
  'use strict';

  const body = document.body;
  const shell = document.querySelector('.fmb-unified-shell');
  if (!body || !shell) {
    if (body) body.style.visibility = 'visible';
    return;
  }

  const page = body.dataset.fmbPage || 'public';
  const brand = shell.querySelector('.fmb-unified-brand');
  const navigation = shell.querySelector('.fmb-unified-nav');
  const menuButton = shell.querySelector('.fmb-unified-menu-button');
  const backToTop = document.querySelector('.fmb-back-to-top');

  if (page === 'company') {
    shell.classList.add('fco-header');
    brand?.classList.add('fco-header-logo');
    navigation?.classList.add('fco-nav-links');

    const companyLinks = [
      { key: 'senz', label: 'SENZ', href: '/fmbandco/senz/' },
      { key: 'cognita', label: 'Cognita', href: '/fmbandco/cognita/' },
    ];

    companyLinks.forEach(({ key, label, href }) => {
      if (!navigation || navigation.querySelector(`[data-fmb-company-link="${key}"]`)) return;
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;
      link.dataset.fmbCompanyLink = key;
      navigation.append(link);
    });
  }

  if (page === 'news') {
    menuButton?.setAttribute('data-news-menu', 'true');
  }

  const syncMenu = (open) => {
    body.classList.toggle('fmb-menu-open', open);
    body.setAttribute('data-fmb-menu-state', open ? 'open' : 'closed');
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  };

  const closeMenu = () => syncMenu(false);

  menuButton?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    syncMenu(!body.classList.contains('fmb-menu-open'));
  }, { capture: true });

  shell.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) closeMenu();
  }, { passive: true });
  syncMenu(false);

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
