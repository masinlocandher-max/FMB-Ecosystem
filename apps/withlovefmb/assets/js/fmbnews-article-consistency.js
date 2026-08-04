(() => {
  'use strict';

  if (!document.body.classList.contains('news-story-route')) return;

  const MANILA = 'Asia/Manila';
  const MANIFEST_URL = '/assets/data/fmbnews-manifest.json';
  const body = document.body;
  const clock = document.querySelector('[data-philippine-time]');
  const wire = document.querySelector('[data-fmbn-wire-track]');
  const wireToggle = document.querySelector('[data-fmbn-wire-toggle]');
  const menuOpen = document.querySelector('[data-fmbn-menu-open]');
  const menuClose = document.querySelector('[data-fmbn-menu-close]');
  const drawer = document.querySelector('[data-fmbn-drawer]');
  const scrim = document.querySelector('[data-fmbn-scrim]');
  let lastFocused = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = `${new Intl.DateTimeFormat('en-PH', {
      timeZone: MANILA,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(now)} PHT`;
  };

  const setWire = (headlines) => {
    if (!wire) return;
    const source = headlines.filter(Boolean).slice(0, 7);
    if (!source.length) source.push(document.title.replace(/\s*[|·-]\s*FMB News.*$/i, '').trim());
    wire.innerHTML = [...source, ...source].map((headline, index) =>
      `<span${index >= source.length ? ' aria-hidden="true"' : ''}>${escapeHtml(headline)}</span>`
    ).join('');
  };

  const loadHeadlines = async () => {
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest returned ${response.status}`);
      const manifest = await response.json();
      setWire(Array.isArray(manifest.articles) ? manifest.articles.map((article) => article.title) : []);
    } catch (error) {
      console.warn('FMB News headline wire is using the current article title.', error);
      setWire([]);
    }
  };

  const openDrawer = () => {
    lastFocused = document.activeElement;
    body.classList.add('fmbn-drawer-open');
    menuOpen?.setAttribute('aria-expanded', 'true');
    menuClose?.focus({ preventScroll: true });
  };
  const closeDrawer = ({ restoreFocus = true } = {}) => {
    body.classList.remove('fmbn-drawer-open');
    menuOpen?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) (lastFocused || menuOpen)?.focus({ preventScroll: true });
  };

  menuOpen?.addEventListener('click', openDrawer);
  menuClose?.addEventListener('click', () => closeDrawer());
  scrim?.addEventListener('click', () => closeDrawer());
  wireToggle?.addEventListener('click', () => {
    const paused = body.classList.toggle('fmbn-wire-paused');
    wireToggle.setAttribute('aria-pressed', String(paused));
    wireToggle.setAttribute('aria-label', paused ? 'Play moving headlines' : 'Pause moving headlines');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && body.classList.contains('fmbn-drawer-open')) closeDrawer();
    if (event.key !== 'Tab' || !body.classList.contains('fmbn-drawer-open') || !drawer) return;
    const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980 && body.classList.contains('fmbn-drawer-open')) closeDrawer({ restoreFocus: false });
  });

  updateClock();
  setInterval(updateClock, 15000);
  loadHeadlines();
})();