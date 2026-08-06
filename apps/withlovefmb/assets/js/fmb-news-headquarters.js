(() => {
  const body = document.body;
  if (!body?.classList.contains('news-route')) return;

  body.classList.add('fmb-headquarters');

  const replacements = new Map([
    ['Live', 'Newsroom'],
    ['Live desk', 'News desk'],
    ['Live newsroom wire', 'Newsroom wire'],
    ['Live now', 'Latest'],
    ['Watch live', 'Explore news'],
    ['Live TV', 'FMB News'],
    ['On air', 'Newsroom'],
    ['Broadcast status', 'Editorial standards'],
    ['Live feed', 'Latest coverage'],
    ['Streaming', 'Publishing'],
    ['Uplink', 'Verification'],
  ]);

  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const original = node.nodeValue;
    let value = original;
    for (const [from, to] of replacements) {
      value = value.replace(new RegExp(`\\b${from.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\b`, 'gi'), to);
    }
    if (value !== original) node.nodeValue = value;
  }

  document.querySelectorAll('[aria-label]').forEach((el) => {
    const value = el.getAttribute('aria-label');
    if (!value) return;
    let next = value;
    for (const [from, to] of replacements) next = next.replace(new RegExp(from, 'gi'), to);
    el.setAttribute('aria-label', next);
  });

  document.querySelectorAll('[data-news-clock]').forEach((el) => {
    el.removeAttribute('data-news-clock');
    el.textContent = 'Philippine Standard Time';
  });

  const updated = document.querySelector('[data-news-updated]');
  if (updated) updated.textContent = updated.textContent.replace(/^Updated\s*/i, 'Published ');

  const revealItems = document.querySelectorAll('.nc-reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const menuButton = document.querySelector('[data-news-menu]');
  const menu = document.getElementById('newsNav');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close news menu' : 'Open news menu');
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', () => {
      menu?.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });
})();
