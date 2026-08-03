(() => {
  const page = document.querySelector('.fmb-about-corporate');
  if (!page) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loadStylesheet = (href, marker) => {
    if (document.querySelector(`link[href*="${marker}"]`)) return;

    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'style';
    preload.href = href;
    document.head.appendChild(preload);

    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = preload.href;
    stylesheet.fetchPriority = 'high';
    document.head.appendChild(stylesheet);
  };

  loadStylesheet('/assets/css/aboutfmb-seamless.css?v=20260721-responsive-v2', 'aboutfmb-seamless.css');
  loadStylesheet('/assets/css/aboutfmb-mobile-fix.css?v=20260731-mobile-fix-v1', 'aboutfmb-mobile-fix.css');

  page.querySelectorAll('a[href*="/fmb&co/"]').forEach(link => {
    link.href = link.getAttribute('href').replace('/fmb&co/', '/fmbandco/');
  });

  const addEntrepreneurReference = (element) => {
    if (!element || /\bentrepreneur\b/i.test(element.textContent)) return;
    element.innerHTML = element.innerHTML.replace(
      'founder, strategist, creative director, and storyteller',
      'founder, entrepreneur, strategist, creative director, and storyteller'
    );
  };

  addEntrepreneurReference(page.querySelector('.fmb-about-story > p:not(.fco-eyebrow)'));
  addEntrepreneurReference(page.querySelector('.fmb-about-footer-brand p'));

  const footerLinks = page.querySelector('.fco-footer-links');
  if (footerLinks) {
    const emailLink = footerLinks.querySelector('a[href^="mailto:"]');
    const addQuietFooterLink = ({ href, label, rel = '', ariaLabel }) => {
      if (footerLinks.querySelector(`a[href="${href}"]`)) return;
      const link = document.createElement('a');
      link.href = href;
      if (rel) link.rel = rel;
      link.textContent = label;
      link.setAttribute('aria-label', ariaLabel);
      if (emailLink) footerLinks.insertBefore(link, emailLink);
      else footerLinks.appendChild(link);
    };

    addQuietFooterLink({
      href: '/about-francine-marie-bautista/',
      label: 'Founder profile',
      rel: 'author',
      ariaLabel: 'Detailed founder and entrepreneur profile of Francine Marie Bautista'
    });
    addQuietFooterLink({
      href: '/transgender-woman-zambales-francine-marie-bautista/',
      label: 'Zambales profile',
      ariaLabel: 'Francine Marie Bautista, a transgender woman from Masinloc, Zambales'
    });
  }

  const mobileDock = page.querySelector('.fco-mobile-dock');
  if (mobileDock) {
    const dockLinks = [
      ['/', 'Home'],
      ['/aboutfmb/', 'About'],
      ['/news/', 'News'],
      ['/ebooks/', 'eBooks'],
      ['/music/', 'Music']
    ];
    mobileDock.setAttribute('aria-label', 'Complete website mobile navigation');
    mobileDock.innerHTML = dockLinks.map(([href, label]) => {
      const active = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
      return `<a class="fco-dock-link${active ? ' active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}><span class="fco-dock-site-dot" aria-hidden="true"></span><span>${label}</span></a>`;
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