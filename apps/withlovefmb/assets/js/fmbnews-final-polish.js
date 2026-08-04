(() => {
  'use strict';

  const MANILA = 'Asia/Manila';
  const body = document.body;
  let polishing = false;

  const fullPhtLabel = (date) => new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  const compactPhtLabel = (date) => new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);

  const polishClocks = () => {
    const now = new Date();
    const full = `${fullPhtLabel(now)} PHT`;
    const compact = `${compactPhtLabel(now)} PHT`;
    const mobile = matchMedia('(max-width: 540px)').matches;
    document.querySelectorAll('[data-pht-time],[data-philippine-time]').forEach((node) => {
      const label = mobile ? compact : full;
      if (node.textContent !== label) node.textContent = label;
      node.setAttribute('datetime', now.toISOString());
      node.setAttribute('title', full);
      node.setAttribute('aria-label', `Philippine Standard Time: ${full}`);
    });
  };

  const polishEmptyHome = () => {
    const main = document.querySelector('[data-main-content]');
    if (!main) return;
    const title = main.querySelector('.page-heading h1')?.textContent?.trim();
    if (title !== 'Today’s FMB News' || main.querySelector('.hero-card')) return;
    const section = [...main.querySelectorAll('.section-head')].find((node) => node.querySelector('h2')?.textContent?.trim() === 'Latest News Today');
    if (!section) return;
    const next = section.nextElementSibling;
    section.remove();
    if (next?.classList.contains('empty-card')) next.remove();
  };

  const polishZodiac = () => {
    document.querySelectorAll('.zodiac-symbol').forEach((node) => {
      const clean = (node.textContent || '').replace(/\uFE0E|\uFE0F/g, '');
      const textVersion = `${clean}\uFE0E`;
      if (node.textContent !== textVersion) node.textContent = textVersion;
    });
  };

  const legacyDeskCandidate = (node) => {
    if (!(node instanceof HTMLElement)) return false;
    if (node.matches('.fmbn-story-shell,.fmbn-story-scrim,.fmbn-story-drawer,main,script,style,link')) return false;
    const text = (node.innerText || node.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return false;
    if (/Live Desk\s*Philippine Standard Time/i.test(text)) return true;
    const headlineCount = (text.match(/The Dumping Stopped|Remembering Amor Deloso|Calling Filipinos|Pax Silica|Binibining Pilipinas|Propaganda Becomes Dehumanization/gi) || []).length;
    return headlineCount >= 3 && text.length < 1800;
  };

  const polishLegacyArticleDesk = () => {
    if (!body.classList.contains('news-story-route')) return;
    const main = document.querySelector('main');
    if (!main) return;
    let node = main.previousElementSibling;
    while (node) {
      const previous = node.previousElementSibling;
      if (legacyDeskCandidate(node)) {
        node.classList.add('fmbn-legacy-live-desk');
        node.setAttribute('data-fmbn-legacy-live-desk', '');
        node.remove();
      }
      node = previous;
    }
  };

  const polish = () => {
    if (polishing) return;
    polishing = true;
    try {
      polishClocks();
      polishEmptyHome();
      polishZodiac();
      polishLegacyArticleDesk();
    } finally {
      polishing = false;
    }
  };

  const observer = new MutationObserver(() => queueMicrotask(polish));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('resize', polish, { passive: true });
  polish();
  setInterval(polishClocks, 1000);
})();