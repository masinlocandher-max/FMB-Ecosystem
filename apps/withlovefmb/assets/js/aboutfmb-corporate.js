(() => {
  const page = document.querySelector('.fmb-about-corporate');
  if (!page) return;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = [...page.querySelectorAll('.about-reveal')];

  root.classList.add('about-motion-ready');
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
