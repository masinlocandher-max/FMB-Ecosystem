(() => {
  'use strict';
  if (!document.body.classList.contains('fmbn-editorial-article')) return;
  const supportStyle = document.createElement('style');
  supportStyle.textContent = 'body.news-story-route.fmbn-editorial-article>.fmbn-article-header{display:block!important}body.news-story-route.fmbn-editorial-article>.fmbn-article-footer{display:grid!important}body.news-story-route.fmbn-editorial-article>div[class*="ticker"],body.news-story-route.fmbn-editorial-article>section[class*="ticker"],body.news-story-route.fmbn-editorial-article>nav[class*="ticker"],body.news-story-route.fmbn-editorial-article>div[class*="breaking"],body.news-story-route.fmbn-editorial-article>section[class*="breaking"],body.news-story-route.fmbn-editorial-article>div[class*="news-wire"],body.news-story-route.fmbn-editorial-article>section[class*="news-wire"],body.news-story-route.fmbn-editorial-article>div[class*="live-strip"]{display:none!important}';
  document.head.appendChild(supportStyle);
  const MANILA = 'Asia/Manila';
  const MANIFEST_URL = '/assets/data/fmbnews-editorial-manifest.json';
  const clock = document.querySelector('[data-fmbn-article-time]');
  const wire = document.querySelector('[data-fmbn-article-wire]');
  const menuOpen = document.querySelector('[data-fmbn-article-menu-open]');
  const menuClose = document.querySelector('[data-fmbn-article-menu-close]');
  const drawer = document.querySelector('[data-fmbn-article-drawer]');
  const scrim = document.querySelector('[data-fmbn-article-scrim]');
  let lastFocused = null;
  const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const updateClock = () => {
    if (!clock) return;
    const now = new Date();
    clock.dateTime = now.toISOString();
    clock.textContent = `${new Intl.DateTimeFormat('en-PH', { timeZone: MANILA, month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(now)} PHT`;
  };
  const setWire = (headlines) => {
    if (!wire) return;
    const clean = headlines.filter(Boolean).slice(0, 7);
    if (!clean.length) clean.push(document.title.replace(/\s*[|·-]\s*FMB.*$/i, '').trim());
    wire.innerHTML = [...clean, ...clean].map((headline, index) => `<span${index >= clean.length ? ' aria-hidden="true"' : ''}>${escapeHtml(headline)}</span>`).join('');
  };
  const openDrawer = () => {
    lastFocused = document.activeElement;
    document.body.classList.add('fmbn-drawer-open', 'fmbn-lock');
    drawer?.removeAttribute('inert');
    drawer?.setAttribute('aria-hidden', 'false');
    scrim?.setAttribute('aria-hidden', 'false');
    menuOpen?.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => menuClose?.focus({ preventScroll: true }));
  };
  const closeDrawer = ({ restore = true } = {}) => {
    document.body.classList.remove('fmbn-drawer-open', 'fmbn-lock');
    drawer?.setAttribute('inert', '');
    drawer?.setAttribute('aria-hidden', 'true');
    scrim?.setAttribute('aria-hidden', 'true');
    menuOpen?.setAttribute('aria-expanded', 'false');
    if (restore) (lastFocused || menuOpen)?.focus({ preventScroll: true });
  };
  menuOpen?.addEventListener('click', openDrawer);
  menuClose?.addEventListener('click', () => closeDrawer());
  scrim?.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('fmbn-drawer-open')) closeDrawer();
    if (event.key !== 'Tab' || !document.body.classList.contains('fmbn-drawer-open') || !drawer) return;
    const focusable = [...drawer.querySelectorAll('a[href],button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  updateClock();
  setInterval(updateClock, 30000);
  fetch(MANIFEST_URL, { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Manifest returned ${response.status}`)))
    .then((data) => setWire(Array.isArray(data.articles) ? data.articles.map((article) => article.title) : []))
    .catch(() => setWire([]));
})();
