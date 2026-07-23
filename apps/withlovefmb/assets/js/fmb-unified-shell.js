(() => {
  'use strict';

  const body = document.body;
  if (!body || body.dataset.fmbUnifiedShell === 'true') return;

  const page = body.dataset.fmbPage || 'public';
  const pathname = window.location.pathname.replace(/\/index\.html$/, '/') || '/';
  const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;

  const routes = [
    { label: 'Home', href: '/', match: ['home'] },
    { label: 'About FMB', href: '/aboutfmb/', match: ['about'] },
    { label: 'News', href: '/news/', match: ['news'] },
    { label: 'Projects', href: '/projects/', match: ['projects', 'mabayani'] },
    { label: 'Reading', href: '/ebooks/', match: ['ebooks', 'reading'] },
    { label: 'Music', href: '/music/', match: ['music'] },
    { label: 'Get Involved', href: '/withlovefmb/#volunteer', match: ['withlove', 'community'] },
    { label: 'Get Help', href: '/gethelp/', match: ['help'] },
    { label: 'FMB&amp;CO.', href: '/fmbandco/', match: ['company'] },
  ];

  const shell = document.createElement('div');
  shell.className = 'fmb-unified-shell';
  shell.innerHTML = `
    <div class="fmb-unified-rail">
      <i aria-hidden="true"></i>
      <span>Francine Marie Bautista · Official Digital Headquarters</span>
      <a href="/news/">Open the latest bulletin</a>
    </div>
    <div class="fmb-unified-nav-shell">
      <a class="fmb-unified-brand" href="/" aria-label="Francine Marie Bautista home">
        <img src="/assets/images/fmb-approved/fmb-master-transparent.webp" width="1129" height="724" alt="FMB, Francine Marie Bautista">
      </a>
      <nav class="fmb-unified-nav" id="fmbUnifiedNav" aria-label="Primary navigation">
        ${routes.map((route) => {
          const isCurrent = route.match.includes(page) || (route.href !== '/' && normalizedPath.startsWith(route.href));
          return `<a href="${route.href}"${isCurrent ? ' aria-current="page"' : ''}>${route.label}</a>`;
        }).join('')}
      </nav>
      <div class="fmb-unified-actions">
        <a class="quiet" href="https://yoni.francinemariebautista.com/">Open Yoni</a>
        <a class="primary" href="/aboutfmb/#work-with-fmb">Work with FMB</a>
        <button class="fmb-unified-menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="fmbUnifiedNav">
          <span></span><span></span>
        </button>
      </div>
    </div>`;

  const footer = document.createElement('footer');
  footer.className = 'fmb-unified-footer';
  footer.innerHTML = `
    <div class="fmb-unified-footer-grid">
      <section class="fmb-unified-footer-brand" aria-labelledby="fmbFooterTitle">
        <img src="/assets/images/fmb-approved/fmb-master-transparent.webp" width="1129" height="724" alt="FMB">
        <h2 id="fmbFooterTitle">The vision behind the ecosystem.</h2>
        <p>The official public headquarters for Francine Marie Bautista, her projects, published work, advocacy, and the companies organized through FMB&amp;CO.</p>
      </section>
      <nav aria-label="Official website links">
        <strong>Official Site</strong>
        <a href="/">Home</a>
        <a href="/aboutfmb/">About FMB</a>
        <a href="/news/">News</a>
        <a href="/projects/">Projects</a>
        <a href="/aboutfmb/#work-with-fmb">Work with FMB</a>
      </nav>
      <nav aria-label="Public resources">
        <strong>Explore</strong>
        <a href="/ebooks/">Reading</a>
        <a href="/music/">Music</a>
        <a href="/withlovefmb/#volunteer">Get Involved</a>
        <a href="/gethelp/">Get Help</a>
        <a href="https://yoni.francinemariebautista.com/">Open Yoni</a>
      </nav>
      <nav aria-label="Ecosystem links">
        <strong>Ecosystem</strong>
        <a href="/fmbandco/">FMB&amp;CO.</a>
        <a href="https://senzpr.com/">SENZ</a>
        <a href="https://thecognitainstitute.com/">Cognita</a>
        <a href="/withlovefmb/">With Love, FMB</a>
        <a href="/mabayani/">Mabayani</a>
      </nav>
    </div>
    <div class="fmb-unified-footer-bottom">
      <span>© 2026 Francine Marie Bautista. All rights reserved.</span>
      <span><a href="/privacy-policy.html">Privacy</a> · <a href="/sitemap.xml">Sitemap</a> · <a href="mailto:withlovefmb@gmail.com?subject=Accessibility%20Support">Accessibility</a></span>
    </div>`;

  const backToTop = document.createElement('button');
  backToTop.className = 'fmb-back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.textContent = '↑';

  body.dataset.fmbUnifiedShell = 'true';
  body.prepend(shell);
  body.append(footer, backToTop);

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

  const menuButton = shell.querySelector('.fmb-unified-menu-button');
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

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const updateBackToTop = () => {
    backToTop.classList.toggle('is-visible', window.scrollY > 680);
  };
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  updateBackToTop();

  body.style.visibility = 'visible';
})();
