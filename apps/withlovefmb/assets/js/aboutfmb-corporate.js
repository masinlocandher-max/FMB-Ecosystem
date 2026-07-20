(() => {
  const page = document.querySelector('.fmb-about-corporate');
  if (!page) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.querySelector('link[href*="aboutfmb-seamless.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = '/assets/css/aboutfmb-seamless.css?v=20260721-seamless-v1';
    document.head.appendChild(stylesheet);
  }

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
      const onReceptionDesk = location.pathname.startsWith('/aboutfmb') && location.hash === '#work-with-fmb';
      const current = label === 'Reception Desk'
        ? onReceptionDesk
        : label === 'About FMB'
          ? location.pathname.startsWith('/aboutfmb') && !onReceptionDesk
          : href === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(href.split('#')[0]);
      return `<a${className ? ` class="${className}"` : ''} href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('');
  }

  const revealTargets = [...page.querySelectorAll('.about-reveal')];
  root.classList.add('about-motion-ready');
  page.classList.add('about-seamless-ready');

  revealTargets.forEach((element, index) => {
    element.style.setProperty('--about-reveal-delay', `${Math.min(index % 4, 3) * 65}ms`);
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
    threshold: 0.12,
    rootMargin: '0px 0px -7% 0px'
  });

  revealTargets.forEach(element => observer.observe(element));
})();
