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
    navigation.setAttribute('aria-label', 'Complete website navigation');
    navigation.innerHTML = [
      ['/', 'Home'],
      ['/aboutfmb/', 'About FMB'],
      ['/news/', 'News'],
      ['/ebooks/', 'eBooks'],
      ['/music/', 'Music'],
      ['/communityengagements/', 'Community'],
      ['/gethelp/', 'Get Help'],
      ['/fmbandco/', 'FMB&CO.'],
      ['#work-with-fmb', 'Work with FMB', 'fco-nav-cta']
    ].map(([href, label, className]) => `<a${className ? ` class="${className}"` : ''} href="${href}"${location.pathname.startsWith(href) && href !== '/' ? ' aria-current="page"' : ''}>${label}</a>`).join('');
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
