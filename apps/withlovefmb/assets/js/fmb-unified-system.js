(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('.fmb-shell-header');
  const nav = document.querySelector('.fmb-shell-nav');
  const menu = document.querySelector('.fmb-shell-menu');

  if (!body || !header || !nav || !menu) return;

  const closeMenu = () => {
    nav.classList.remove('is-open');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Open navigation');
    body.classList.remove('fmb-menu-open');
  };

  const openMenu = () => {
    nav.classList.add('is-open');
    menu.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-label', 'Close navigation');
    body.classList.add('fmb-menu-open');
  };

  menu.addEventListener('click', () => {
    if (menu.getAttribute('aria-expanded') === 'true') closeMenu();
    else openMenu();
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!nav.classList.contains('is-open')) return;
    if (header.contains(event.target)) return;
    closeMenu();
  });

  const setHeaderState = () => {
    header.classList.toggle('is-condensed', window.scrollY > 24);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const normalizedPath = `${window.location.pathname.replace(/index\.html$/i, '') || '/'}${window.location.hash}`;
  const navLinks = [...nav.querySelectorAll('a[href]')];

  const pathMatch = (href) => {
    if (!href || href.startsWith('http') || href.startsWith('mailto:')) return false;
    const url = new URL(href, window.location.origin);
    const targetPath = url.pathname.replace(/index\.html$/i, '') || '/';
    const currentPath = window.location.pathname.replace(/index\.html$/i, '') || '/';
    if (targetPath === '/') return currentPath === '/';
    return currentPath.startsWith(targetPath);
  };

  navLinks.forEach((link) => {
    if (pathMatch(link.getAttribute('href'))) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });

  const revealTargets = [
    ...document.querySelectorAll(
      'main > section > :is(article, div, header, figure, aside), main > article, .fmb-strategy-head, .fmb-capability, .fmb-company-depth article, .fmb-impact-grid article, .fmb-journey-options article',
    ),
  ].filter((node) => !node.closest('.fmb-shell-header, .fmb-shell-footer'));

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    revealTargets.forEach((target, index) => {
      target.classList.add('fmb-reveal');
      target.style.transitionDelay = `${Math.min(index % 4, 3) * 55}ms`;
      observer.observe(target);
    });
  } else {
    revealTargets.forEach((target) => target.classList.add('fmb-reveal', 'is-visible'));
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 960) closeMenu();
  });

  body.dataset.fmbUnifiedReady = 'true';
  void normalizedPath;
})();
