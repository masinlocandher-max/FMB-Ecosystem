(() => {
  const toggles = Array.from(document.querySelectorAll('.mobile-toggle'));
  if (!toggles.length) return;

  toggles.forEach((toggle, index) => {
    if (toggle.dataset.menuReady === 'true') return;

    const header = toggle.closest('.site-header, .nav') || document;
    const nav = header.querySelector('.nav-links') || document.querySelector('.nav-links');
    if (!nav) return;

    const id = nav.id || `site-menu-${index + 1}`;
    nav.id = id;
    toggle.dataset.menuReady = 'true';
    toggle.setAttribute('aria-controls', id);
    toggle.setAttribute('aria-expanded', 'false');

    if (!toggle.querySelector('.mobile-toggle__icon')) {
      toggle.innerHTML = '<span class="mobile-toggle__icon" aria-hidden="true"><span></span></span><span class="mobile-toggle__label">Menu</span>';
    }

    const closeMenu = () => {
      nav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    const openMenu = () => {
      nav.classList.add('is-open');
      document.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
    };

    toggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1120) closeMenu();
    }, { passive: true });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      closeMenu();
    });
  });
})();
