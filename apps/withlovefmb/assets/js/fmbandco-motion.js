(() => {
  const page = document.querySelector('.fco-home');
  if (!page) return;

  const navigation = page.querySelector('.fco-nav-links');
  if (navigation) {
    const menu = [
      ['/', 'Home'],
      ['/aboutfmb/', 'About FMB'],
      ['/withlovefmb/', 'With love, FMB'],
      ['/music/', 'Music'],
      ['/ebooks/', 'eBook'],
      ['/news/', 'News'],
      ['/fmb&co/', 'FMB&CO.'],
      ['/aboutfmb/#work-with-fmb', 'Reception Desk', 'fco-nav-cta']
    ];
    navigation.setAttribute('aria-label', 'Main website navigation');
    navigation.innerHTML = menu.map(([href, label, className]) => {
      const current = href === '/fmb&co/' || href === '/fmbandco/';
      return `<a${className ? ` class="${className}"` : ''} href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('');
  }

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [...page.querySelectorAll([
    '.fco-section-head',
    '.fco-about-grid',
    '.fco-company-card',
    '.fco-pillar',
    '.fco-founder-copy',
    '.fco-founder-mark',
    '.fco-consultation .fco-wrap'
  ].join(','))];

  root.classList.add('fco-motion-ready');
  revealTargets.forEach((element, index) => {
    element.classList.add('fco-reveal-target');
    element.style.setProperty('--fco-reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(element => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.14,
    rootMargin: '0px 0px -8% 0px'
  });

  revealTargets.forEach(element => observer.observe(element));
})();
