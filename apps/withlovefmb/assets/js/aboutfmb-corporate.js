(() => {
  const page = document.querySelector('.fmb-about-corporate');
  if (!page) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  [
    ['/assets/css/aboutfmb-seamless.css?v=20260721-seamless-v1', 'aboutfmb-seamless.css'],
    ['/assets/css/aboutfmb-responsive-final.css?v=20260721-screen-optimization-v1', 'aboutfmb-responsive-final.css']
  ].forEach(([href, marker]) => {
    if (document.querySelector(`link[href*="${marker}"]`)) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = href;
    document.head.appendChild(stylesheet);
  });

  document.querySelectorAll('a[href^="/fmb&co/"]').forEach(link => {
    link.href = link.getAttribute('href').replace('/fmb&co/', '/fmbandco/');
  });

  const routes = [
    ['/', 'Home'],
    ['/aboutfmb/', 'About FMB'],
    ['/news/', 'News'],
    ['/ebooks/', 'eBooks'],
    ['/music/', 'Music'],
    ['/communityengagements/', 'Community'],
    ['/gethelp/', 'Get Help'],
    ['/fmbandco/', 'FMB&CO.'],
    ['#work-with-fmb', 'Work with FMB', 'fco-nav-cta']
  ];

  const navigation = page.querySelector('.fco-nav-links');
  if (navigation) {
    navigation.setAttribute('aria-label', 'Complete website navigation');
    navigation.innerHTML = routes.map(([href, label, className]) => `<a${className ? ` class="${className}"` : ''} href="${href}"${location.pathname.startsWith(href) && href !== '/' ? ' aria-current="page"' : ''}>${label}</a>`).join('');
    const cue = document.createElement('span');
    cue.className = 'about-nav-swipe-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.textContent = 'Swipe';
    navigation.insertAdjacentElement('afterend', cue);
  }

  const dock = page.querySelector('.fco-mobile-dock');
  if (dock) {
    const dockRoutes = [
      ['/', 'Home'],
      ['/aboutfmb/', 'About'],
      ['/news/', 'News'],
      ['/ebooks/', 'eBooks'],
      ['/music/', 'Music']
    ];
    dock.setAttribute('aria-label', 'Complete website mobile navigation');
    dock.innerHTML = dockRoutes.map(([href, label]) => {
      const active = location.pathname.startsWith(href) && href !== '/';
      return `<a class="fco-dock-link${active ? ' active' : ''}" href="${href}"${active ? ' aria-current="page"' : ''}><span>${label}</span></a>`;
    }).join('');
  }

  const updateResponsiveState = () => {
    const header = page.querySelector('.fco-header');
    const topLine = page.querySelector('.fco-topline');
    root.style.setProperty('--about-header-stack', `${Math.ceil((header?.getBoundingClientRect().height || 0) + (topLine?.getBoundingClientRect().height || 0))}px`);
    if (navigation) {
      const overflow = navigation.scrollWidth > navigation.clientWidth + 4;
      const atEnd = navigation.scrollLeft + navigation.clientWidth >= navigation.scrollWidth - 8;
      navigation.classList.toggle('has-scroll-overflow', overflow);
      navigation.classList.toggle('is-scroll-end', atEnd);
    }
  };

  navigation?.addEventListener('scroll', updateResponsiveState, { passive: true });
  updateResponsiveState();
  if ('ResizeObserver' in window) {
    const resizeObserver = new ResizeObserver(updateResponsiveState);
    [page.querySelector('.fco-header'), page.querySelector('.fco-topline'), navigation].filter(Boolean).forEach(element => resizeObserver.observe(element));
  } else {
    window.addEventListener('resize', updateResponsiveState, { passive: true });
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
