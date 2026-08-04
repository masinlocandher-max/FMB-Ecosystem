(() => {
  'use strict';

  const MANIFEST_URL = '/assets/data/fmbnews-manifest.json';
  const MANILA = 'Asia/Manila';
  const body = document.body;
  const main = document.querySelector('[data-main-content]');
  const scrim = document.querySelector('[data-drawer-scrim]');
  const openButton = document.querySelector('[data-drawer-open]');
  const closeButton = document.querySelector('[data-drawer-close]');
  const archiveToggle = document.querySelector('[data-archive-toggle]');
  const archiveLinks = document.querySelector('[data-archive-links]');
  const searchForm = document.querySelector('[data-search-form]');
  const searchInput = document.querySelector('[data-search-input]');
  const wireTrack = document.querySelector('[data-wire-track]');
  const wireToggle = document.querySelector('[data-wire-toggle]');
  const timeNodes = document.querySelectorAll('[data-pht-time]');

  const CATEGORY_LABELS = {
    philippines: 'Philippines', world: 'World', business: 'Business', lifestyle: 'Lifestyle',
    technology: 'Technology', 'politics-government': 'Politics & Government', environment: 'Environment',
    health: 'Health', education: 'Education', science: 'Science', sports: 'Sports', culture: 'Culture', other: 'More Categories',
  };

  const SEGMENTS = {
    'alam-mo-ba': { title: 'Alam Mo Ba?', copy: 'Everyday facts and explainers that help you know more.', tone: '' },
    lotto: { title: 'Lotto', copy: 'Verified draw information and result archives, published only after official confirmation.', tone: 'gold' },
    horoscope: { title: 'Horoscope', copy: 'A light daily guide for reflection, planning and entertainment.', tone: 'plum' },
  };

  let manifest = { articles: [] };
  let lastFocusedElement = null;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim().toLowerCase();

  const formatPhtDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', { timeZone: MANILA, month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  };
  const formatPhtTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', { timeZone: MANILA, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  };
  const phtDayKey = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: MANILA, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const map = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
    return `${map.year}-${map.month}-${map.day}`;
  };
  const currentPhtDateLabel = () => new Intl.DateTimeFormat('en-PH', { timeZone: MANILA, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());

  const openDrawer = () => {
    lastFocusedElement = document.activeElement;
    body.classList.add('drawer-open');
    scrim.hidden = false;
    openButton?.setAttribute('aria-expanded', 'true');
    closeButton?.focus({ preventScroll: true });
  };
  const closeDrawer = ({ restoreFocus = true } = {}) => {
    body.classList.remove('drawer-open');
    scrim.hidden = true;
    openButton?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) (lastFocusedElement || openButton)?.focus({ preventScroll: true });
  };
  const updateClock = () => {
    const now = new Date();
    const label = `${formatPhtDateTime(now)} PHT`;
    timeNodes.forEach((node) => { node.textContent = label; node.setAttribute('datetime', now.toISOString()); });
  };
  const setWire = (articles) => {
    const headlines = articles.slice(0, 6).map((article) => article.title).filter(Boolean);
    if (!headlines.length) headlines.push('No new reports published yet today. Browse the preserved news archives.');
    const doubled = [...headlines, ...headlines];
    wireTrack.innerHTML = doubled.map((headline, index) => `<span${index >= headlines.length ? ' aria-hidden="true"' : ''}>${escapeHtml(headline)}</span>`).join('');
  };
  const articleSearchText = (article) => normalize([article.title, article.description, article.categoryLabel, article.label, article.segment].join(' '));
  const sortedArticles = () => [...manifest.articles].sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0));
  const currentDayArticles = () => { const today = phtDayKey(); return sortedArticles().filter((article) => phtDayKey(article.publishedAt) === today); };
  const storyMeta = (article) => {
    const category = article.categoryLabel || CATEGORY_LABELS[article.category] || 'FMB News';
    const published = article.publishedAt ? formatPhtTime(article.publishedAt) : article.readTime || 'Read report';
    return `<div class="story-meta"><span>${escapeHtml(category)}</span><span>${escapeHtml(published)}</span></div>`;
  };
  const storyCard = (article) => `<article class="story-card" data-story-route="${escapeHtml(article.route)}"><a href="${escapeHtml(article.route)}"><div class="story-image"><img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.imageAlt || article.title)}" loading="lazy" decoding="async"></div><div class="story-body">${storyMeta(article)}<h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.description || 'Read the complete FMB News report.')}</p></div></a></article>`;
  const storyGrid = (articles, emptyCopy) => articles.length
    ? `<div class="story-list">${articles.map(storyCard).join('')}</div>`
    : `<div class="empty-card"><h2>Nothing published here yet.</h2><p>${escapeHtml(emptyCopy)}</p><a class="secondary-button" href="?archive=philippines" data-route-link>Browse News Archives</a></div>`;

  const renderHome = () => {
    const today = currentDayArticles(); setWire(today);
    const hero = today[0]; const brief = today.slice(1, 6); const more = today.slice(1);
    const lead = hero ? `<div class="hero-layout"><article class="hero-card"><img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.imageAlt || hero.title)}" fetchpriority="high" decoding="async"><div class="hero-copy">${storyMeta(hero)}<h2>${escapeHtml(hero.title)}</h2><p>${escapeHtml(hero.description || 'Read the complete FMB News report.')}</p><a class="primary-button" href="${escapeHtml(hero.route)}">Read Full Story <span aria-hidden="true">→</span></a></div></article><aside class="today-panel" aria-label="Today's brief"><div class="panel-head"><h2>Today’s Brief</h2><p>Reports published today in Philippine Standard Time.</p></div>${brief.length ? `<ol class="brief-list">${brief.map((article) => `<li><a href="${escapeHtml(article.route)}"><time>${escapeHtml(formatPhtTime(article.publishedAt))}</time><span>${escapeHtml(article.title)}</span></a></li>`).join('')}</ol>` : '<div class="empty-card"><p>More reports will appear here as they are published.</p></div>'}</aside></div>`
      : `<section class="empty-card"><h2>Today’s newsroom is ready.</h2><p>No report has been published yet for ${escapeHtml(currentPhtDateLabel())}. New stories will appear here from 12:00 a.m. to 11:59 p.m. Philippine time. Older reports remain preserved in the archives.</p><a class="primary-button" href="?archive=philippines" data-route-link>Open News Archives</a></section>`;
    main.innerHTML = `<header class="page-heading"><div><h1>Today’s FMB News</h1><p>The latest reports published today. At midnight, they remain available in their permanent archives.</p></div><span class="date-badge">${escapeHtml(currentPhtDateLabel())}</span></header>${lead}<div class="section-head"><h2>Latest News Today</h2><a href="?archive=other" data-route-link>Browse all archives →</a></div>${storyGrid(more, 'Today’s reports will be added here as they are published.')}`;
  };
  const renderSegment = (key) => {
    const segment = SEGMENTS[key]; const articles = sortedArticles().filter((article) => article.segment === key); setWire(currentDayArticles());
    main.innerHTML = `<section class="segment-hero ${segment.tone}"><div><h1>${escapeHtml(segment.title)}</h1><p>${escapeHtml(segment.copy)}</p></div></section><div class="section-head"><h2>Latest ${escapeHtml(segment.title)} Entries</h2><span></span></div>${storyGrid(articles, `The ${segment.title} archive is ready for verified entries. The title hero remains the segment identity, not an individual article.`)}`;
  };
  const renderArchive = (slug) => {
    const label = CATEGORY_LABELS[slug] || 'News Archive';
    const known = Object.keys(CATEGORY_LABELS).filter((key) => key !== 'other');
    const articles = sortedArticles().filter((article) => slug === 'other' ? !known.includes(article.category) : article.category === slug); setWire(currentDayArticles());
    main.innerHTML = `<header class="page-heading"><div><h1>${escapeHtml(label)} Archive</h1><p>Preserved FMB News reports filed under ${escapeHtml(label)}. Existing article URLs, images and credits remain unchanged.</p></div><span class="date-badge">${articles.length} report${articles.length === 1 ? '' : 's'}</span></header>${storyGrid(articles, `No preserved report is currently tagged ${label}. Category overrides can be added without editing article content.`)}`;
  };
  const renderAbout = () => { setWire(currentDayArticles()); main.innerHTML = `<section class="segment-hero"><div><h1>About FMB News</h1><p>Who we are, what we stand for, and why our work is centered on Filipinos.</p></div></section><section class="content-panel"><h2>Who We Are</h2><p>FMB News is the public-interest newsroom of the FMB ecosystem. We publish reports, explainers and clearly labeled perspective designed to make important information easier to understand and more useful in everyday Filipino life.</p><div class="mission-grid"><article class="mission-card"><h3>Our Mission</h3><p>To deliver credible information with clarity, context and responsibility, and to explain why each important story matters to us Filipinos.</p></article><article class="mission-card"><h3>Our Vision</h3><p>A more informed Filipino public that can understand events, make stronger decisions and participate more confidently in community life.</p></article></div><h3>Our Editorial Promise</h3><p>We distinguish reporting from opinion, identify sources and image credits, correct meaningful errors, preserve published archives, and avoid presenting unverified claims as fact.</p><h3>Ownership and Contact</h3><p>FMB News is part of the FMB ecosystem and is connected to FMB&amp;CO. Editorial questions, corrections and story submissions may be sent to <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>.</p></section>`; };
  const renderFmbMessage = () => { setWire(currentDayArticles()); main.innerHTML = `<section class="segment-hero plum"><div><h1>FMB Message</h1><p>Messages from FMB about the newsroom, our readers and the work of making information clearer.</p></div></section><section class="content-panel"><h2>A newsroom built around understanding</h2><p>FMB News should never make readers work harder just to understand what happened. Our responsibility is to report carefully, explain the context, and show the real effect of a story on Filipino families, workers and communities.</p><p>We will treat serious news with seriousness, keep our original segments easy to return to, and protect the published record as the newsroom evolves.</p><p><strong>With love, FMB.</strong></p></section>`; };
  const renderSubmit = () => { setWire(currentDayArticles()); const mailto = 'mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News&body=Please%20include%3A%0A-%20A%20short%20description%20of%20your%20story%0A-%20Where%20and%20when%20it%20happened%0A-%20Your%20name%20or%20anonymous%20preference%0A-%20Attach%20the%20original%20photos%20or%20videos'; main.innerHTML = `<section class="segment-hero"><div><h1>Submit Your Story</h1><p>Share a community story, investigative tip, photo or local concern with FMB News.</p></div></section><section class="content-panel submit-grid"><div><h2>What to send</h2><ul class="submit-checklist"><li>A short description of what happened</li><li>Where and when it happened</li><li>Original photos or videos you own or have permission to share</li><li>Your name, or a request to remain anonymous</li></ul></div><div><h2>Before you submit</h2><p>Never place yourself in danger to capture a story. FMB News reviews every submission but cannot guarantee publication. Submitted media may be verified before use and credited according to your preference.</p><a class="primary-button" href="${mailto}">Email Your Story <span aria-hidden="true">→</span></a></div></section>`; };
  const renderSearch = (query) => { const q = normalize(query); const results = sortedArticles().filter((article) => articleSearchText(article).includes(q)); setWire(currentDayArticles()); main.innerHTML = `<header class="page-heading"><div><h1>Search FMB News</h1><p>Results for “${escapeHtml(query)}” across the preserved news archive.</p></div><span class="date-badge">${results.length} result${results.length === 1 ? '' : 's'}</span></header>${storyGrid(results, 'Try another title, topic, place or category.')}`; };
  const routeState = () => { const params = new URLSearchParams(location.search); return { view: params.get('view') || 'home', archive: params.get('archive') || '', search: params.get('search') || '' }; };
  const updateSelectedNavigation = ({ view, archive }) => { document.querySelectorAll('[data-view-link]').forEach((link) => link.dataset.viewLink === view && !archive ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')); document.querySelectorAll('[data-archive-link]').forEach((link) => link.dataset.archiveLink === archive ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')); };
  const render = ({ focus = false } = {}) => { const state = routeState(); updateSelectedNavigation(state); if (state.search) renderSearch(state.search); else if (state.archive) renderArchive(state.archive); else if (SEGMENTS[state.view]) renderSegment(state.view); else if (state.view === 'about') renderAbout(); else if (state.view === 'fmb-message') renderFmbMessage(); else if (state.view === 'submit') renderSubmit(); else renderHome(); if (focus) main.focus({ preventScroll: true }); };
  const navigate = (href) => { const target = new URL(href, location.href); history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`); closeDrawer({ restoreFocus: false }); render({ focus: true }); window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };

  document.addEventListener('click', (event) => { const routeLink = event.target.closest('[data-route-link]'); if (!routeLink) return; const target = new URL(routeLink.href, location.href); if (target.origin !== location.origin) return; event.preventDefault(); navigate(routeLink.getAttribute('href')); });
  openButton?.addEventListener('click', openDrawer); closeButton?.addEventListener('click', () => closeDrawer()); scrim?.addEventListener('click', () => closeDrawer());
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && body.classList.contains('drawer-open')) closeDrawer(); });
  archiveToggle?.addEventListener('click', () => { const expanded = archiveToggle.getAttribute('aria-expanded') === 'true'; archiveToggle.setAttribute('aria-expanded', String(!expanded)); archiveLinks.hidden = expanded; });
  wireToggle?.addEventListener('click', () => { const paused = body.classList.toggle('wire-paused'); wireToggle.setAttribute('aria-pressed', String(paused)); wireToggle.setAttribute('aria-label', paused ? 'Play moving headlines' : 'Pause moving headlines'); });
  searchForm?.addEventListener('submit', (event) => { event.preventDefault(); const query = searchInput.value.trim(); if (query) navigate(`?search=${encodeURIComponent(query)}`); });
  window.addEventListener('popstate', () => render());
  window.addEventListener('resize', () => { if (window.innerWidth > 860 && body.classList.contains('drawer-open')) closeDrawer({ restoreFocus: false }); });

  const load = async () => {
    updateClock(); setInterval(updateClock, 30000);
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest request failed with ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.articles)) throw new Error('Manifest articles are missing.');
      manifest = payload; render();
    } catch (error) {
      console.error(error);
      main.innerHTML = `<section class="error-state"><h1>Preview data could not be loaded.</h1><p>The current newsroom remains untouched. Build the protected manifest before reviewing this route.</p></section>`;
    }
  };
  load();
})();
