(() => {
  'use strict';

  const MANIFEST_URL = '/assets/data/fmbnews-manifest.json';
  const MANILA = 'Asia/Manila';
  const body = document.body;
  const main = document.querySelector('[data-main-content]');
  const scrim = document.querySelector('[data-drawer-scrim]');
  const sidebar = document.querySelector('[data-sidebar]');
  const openButton = document.querySelector('[data-drawer-open]');
  const closeButton = document.querySelector('[data-drawer-close]');
  const archiveToggle = document.querySelector('[data-archive-toggle]');
  const archiveLinks = document.querySelector('[data-archive-links]');
  const searchForm = document.querySelector('[data-search-form]');
  const searchInput = document.querySelector('[data-search-input]');
  const searchToggle = document.querySelector('[data-search-toggle]');
  const wireTrack = document.querySelector('[data-wire-track]');
  const wireToggle = document.querySelector('[data-wire-toggle]');
  const timeNodes = document.querySelectorAll('[data-pht-time]');

  const CATEGORY_LABELS = {
    philippines: 'Philippines',
    world: 'World',
    business: 'Business',
    lifestyle: 'Lifestyle',
    technology: 'Technology',
    'politics-government': 'Politics & Government',
    environment: 'Environment',
    health: 'Health',
    education: 'Education',
    science: 'Science',
    sports: 'Sports',
    culture: 'Culture',
  };

  const FACTS = [
    {
      title: 'The Philippines officially counts 7,641 islands.',
      copy: 'The total changed after improved mapping identified hundreds of additional islands. The figure is maintained by the National Mapping and Resource Information Authority.',
      source: 'NAMRIA',
      url: 'https://www.namria.gov.ph/',
    },
    {
      title: 'The Philippine eagle is found nowhere else in the wild.',
      copy: 'This critically endangered raptor is endemic to the Philippines, making the survival of its forest habitat a responsibility that cannot be transferred to another country.',
      source: 'Philippine Eagle Foundation',
      url: 'https://www.philippineeaglefoundation.org/',
    },
    {
      title: 'Tubbataha protects one of the world’s richest marine ecosystems.',
      copy: 'The reefs in the Sulu Sea are recognized as a UNESCO World Heritage Site and support exceptional concentrations of marine life.',
      source: 'UNESCO World Heritage Centre',
      url: 'https://whc.unesco.org/en/list/653/',
    },
    {
      title: 'The Rice Terraces are a living cultural landscape.',
      copy: 'The UNESCO-listed terraces are not simply ancient scenery. They remain connected to indigenous knowledge, ritual, community, and generations of careful farming.',
      source: 'UNESCO World Heritage Centre',
      url: 'https://whc.unesco.org/en/list/722/',
    },
    {
      title: 'Sunlight takes a little over eight minutes to reach Earth.',
      copy: 'Light travels about 150 million kilometers from the Sun before it reaches us, so every sunrise is technically showing us the Sun as it was minutes earlier.',
      source: 'NASA',
      url: 'https://science.nasa.gov/sun/facts/',
    },
    {
      title: 'Earth’s oceans cover about 71 percent of the planet.',
      copy: 'Most of the water on Earth is saltwater, while the freshwater people depend on represents only a small fraction of the total.',
      source: 'United States Geological Survey',
      url: 'https://www.usgs.gov/special-topics/water-science-school/science/how-much-water-there-earth',
    },
    {
      title: 'An octopus has three hearts.',
      copy: 'Two hearts move blood through the gills, while another circulates it through the rest of the body. Its blood also uses a copper-rich protein that gives it a bluish color.',
      source: 'Smithsonian Ocean',
      url: 'https://ocean.si.edu/ocean-life/invertebrates/octopus',
    },
    {
      title: 'The Puerto Princesa Underground River flows directly into the sea.',
      copy: 'Its cave system contains an underground river influenced by tides, along with major limestone formations and important habitats.',
      source: 'UNESCO World Heritage Centre',
      url: 'https://whc.unesco.org/en/list/652/',
    },
  ];

  const LOTTO_SCHEDULE = [
    { game: 'Ultra Lotto 6/58', days: ['Tuesday', 'Friday', 'Sunday'], time: '9:00 p.m.' },
    { game: 'Grand Lotto 6/55', days: ['Monday', 'Wednesday', 'Saturday'], time: '9:00 p.m.' },
    { game: 'Super Lotto 6/49', days: ['Tuesday', 'Thursday', 'Sunday'], time: '9:00 p.m.' },
    { game: 'Mega Lotto 6/45', days: ['Monday', 'Wednesday', 'Friday'], time: '9:00 p.m.' },
    { game: 'Lotto 6/42', days: ['Tuesday', 'Thursday', 'Saturday'], time: '9:00 p.m.' },
    { game: '6D Lotto', days: ['Tuesday', 'Thursday', 'Saturday'], time: '9:00 p.m.' },
    { game: '4D Lotto', days: ['Monday', 'Wednesday', 'Friday'], time: '9:00 p.m.' },
    { game: '3D Lotto', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], time: '2:00, 5:00 and 9:00 p.m.' },
    { game: '2D Lotto', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], time: '2:00, 5:00 and 9:00 p.m.' },
  ];

  const ZODIAC = [
    { id: 'aries', symbol: '♈', name: 'Aries', dates: 'Mar 21–Apr 19', focus: 'initiative', strength: 'decisive energy' },
    { id: 'taurus', symbol: '♉', name: 'Taurus', dates: 'Apr 20–May 20', focus: 'stability', strength: 'patient judgment' },
    { id: 'gemini', symbol: '♊', name: 'Gemini', dates: 'May 21–Jun 20', focus: 'communication', strength: 'quick perspective' },
    { id: 'cancer', symbol: '♋', name: 'Cancer', dates: 'Jun 21–Jul 22', focus: 'emotional clarity', strength: 'protective instinct' },
    { id: 'leo', symbol: '♌', name: 'Leo', dates: 'Jul 23–Aug 22', focus: 'creative confidence', strength: 'warm leadership' },
    { id: 'virgo', symbol: '♍', name: 'Virgo', dates: 'Aug 23–Sep 22', focus: 'discernment', strength: 'careful preparation' },
    { id: 'libra', symbol: '♎', name: 'Libra', dates: 'Sep 23–Oct 22', focus: 'balance', strength: 'social intelligence' },
    { id: 'scorpio', symbol: '♏', name: 'Scorpio', dates: 'Oct 23–Nov 21', focus: 'transformation', strength: 'focused resolve' },
    { id: 'sagittarius', symbol: '♐', name: 'Sagittarius', dates: 'Nov 22–Dec 21', focus: 'expansion', strength: 'optimistic courage' },
    { id: 'capricorn', symbol: '♑', name: 'Capricorn', dates: 'Dec 22–Jan 19', focus: 'long-term progress', strength: 'disciplined ambition' },
    { id: 'aquarius', symbol: '♒', name: 'Aquarius', dates: 'Jan 20–Feb 18', focus: 'original thinking', strength: 'independent vision' },
    { id: 'pisces', symbol: '♓', name: 'Pisces', dates: 'Feb 19–Mar 20', focus: 'intuition', strength: 'empathetic imagination' },
  ];

  const HOROSCOPE_OPENINGS = [
    'Your best move is to simplify the next decision instead of trying to solve the whole month today.',
    'A quiet adjustment will carry more influence than a dramatic announcement.',
    'Pay attention to what feels repeatedly unfinished. That is where your energy is asking for structure.',
    'A useful conversation becomes possible when you stop rehearsing the perfect answer.',
    'Protect the part of your day that lets you think without interruption.',
    'Progress arrives through consistency, not intensity.',
    'Let evidence guide you before emotion turns one moment into a permanent conclusion.',
  ];
  const HOROSCOPE_ACTIONS = [
    'Finish one practical task before opening another.',
    'Ask one direct question instead of making three assumptions.',
    'Review your budget, calendar, or commitments before agreeing to more.',
    'Choose the response that protects both your dignity and your peace.',
    'Give an idea a small real-world test instead of waiting for certainty.',
    'Make room for rest before fatigue starts making decisions for you.',
    'Document what is working so you can repeat it deliberately.',
  ];
  const HOROSCOPE_RELATIONSHIPS = [
    'In relationships, clarity is kinder than mixed signals.',
    'Someone may need your honesty more than your ability to keep everything comfortable.',
    'Listen for the concern beneath the wording.',
    'Do not confuse familiarity with genuine alignment.',
    'A small act of consideration can reset the emotional tone.',
    'Leave space for another person to surprise you.',
    'Boundaries work best when they are calm, specific, and consistent.',
  ];

  let manifest = { articles: [] };
  let lastFocusedElement = null;
  let activeHoroscopePeriod = 'today';
  let activeSign = 'aries';

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const normalize = (value = '') => String(value).replace(/\s+/g, ' ').trim().toLowerCase();
  const safeExternal = (url) => /^https:\/\//i.test(url) ? url : '#';

  const formatPhtDateTime = (value) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: MANILA,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
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
  const currentPhtDateLabel = () => new Intl.DateTimeFormat('en-PH', {
    timeZone: MANILA,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const currentPhtWeekday = () => new Intl.DateTimeFormat('en-PH', { timeZone: MANILA, weekday: 'long' }).format(new Date());
  const daySeed = () => {
    const key = phtDayKey();
    return [...key].reduce((total, character) => total + character.charCodeAt(0), 0);
  };

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
  const openSearch = () => {
    body.classList.add('search-open');
    searchToggle?.setAttribute('aria-expanded', 'true');
    searchToggle?.setAttribute('aria-label', 'Close search');
    requestAnimationFrame(() => searchInput?.focus({ preventScroll: true }));
  };
  const closeSearch = () => {
    body.classList.remove('search-open');
    searchToggle?.setAttribute('aria-expanded', 'false');
    searchToggle?.setAttribute('aria-label', 'Open search');
  };
  const updateClock = () => {
    const now = new Date();
    const label = `${formatPhtDateTime(now)} PHT`;
    timeNodes.forEach((node) => {
      node.textContent = label;
      node.setAttribute('datetime', now.toISOString());
    });
  };
  const setWire = (articles) => {
    const source = articles.length ? articles : sortedArticles();
    const headlines = source.slice(0, 7).map((article) => article.title).filter(Boolean);
    if (!headlines.length) headlines.push('FMB News is preparing the next verified report.');
    const doubled = [...headlines, ...headlines];
    wireTrack.innerHTML = doubled.map((headline, index) =>
      `<span${index >= headlines.length ? ' aria-hidden="true"' : ''}>${escapeHtml(headline)}</span>`
    ).join('');
  };
  const articleSearchText = (article) => normalize([article.title, article.description, article.categoryLabel, article.label, article.segment].join(' '));
  const sortedArticles = () => [...manifest.articles].sort((a, b) => (Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0));
  const currentDayArticles = () => {
    const today = phtDayKey();
    return sortedArticles().filter((article) => phtDayKey(article.publishedAt) === today);
  };
  const storyMeta = (article) => {
    const category = article.categoryLabel || CATEGORY_LABELS[article.category] || 'FMB News';
    const published = article.publishedAt ? formatPhtTime(article.publishedAt) : article.readTime || 'Read report';
    return `<div class="story-meta"><span>${escapeHtml(category)}</span><span>${escapeHtml(published)}</span></div>`;
  };
  const imageDimensions = (article) => {
    const width = Number(article.imageWidth) || 1600;
    const height = Number(article.imageHeight) || 1000;
    return `width="${width}" height="${height}"`;
  };
  const storyCard = (article) => `<article class="story-card" data-story-route="${escapeHtml(article.route)}">
    <a href="${escapeHtml(article.route)}">
      <div class="story-image"><img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.imageAlt || article.title)}" ${imageDimensions(article)} loading="lazy" decoding="async" data-story-image></div>
      <div class="story-body">${storyMeta(article)}<h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.description || 'Read the complete FMB News report.')}</p></div>
    </a>
  </article>`;
  const storyGrid = (articles, emptyCopy) => articles.length
    ? `<div class="story-list">${articles.map(storyCard).join('')}</div>`
    : `<div class="empty-card"><h2>No report is filed here yet.</h2><p>${escapeHtml(emptyCopy)}</p><a class="secondary-button" href="?archive=all" data-route-link>Open All Archives</a></div>`;

  const renderHome = () => {
    const today = currentDayArticles();
    setWire(today);
    const hero = today[0];
    const brief = today.slice(1, 6);
    const more = today.slice(1);
    const lead = hero ? `<div class="hero-layout">
      <article class="hero-card">
        <img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.imageAlt || hero.title)}" ${imageDimensions(hero)} fetchpriority="high" decoding="async" data-story-image>
        <div class="hero-copy">${storyMeta(hero)}<h2>${escapeHtml(hero.title)}</h2><p>${escapeHtml(hero.description || 'Read the complete FMB News report.')}</p><a class="primary-button" href="${escapeHtml(hero.route)}">Read Full Story</a></div>
      </article>
      <aside class="today-panel" aria-label="Today's brief">
        <div class="panel-head"><h2>Today’s Brief</h2><p>Published today in Philippine Standard Time.</p></div>
        ${brief.length ? `<ol class="brief-list">${brief.map((article) => `<li><a href="${escapeHtml(article.route)}"><time>${escapeHtml(formatPhtTime(article.publishedAt))}</time><span>${escapeHtml(article.title)}</span></a></li>`).join('')}</ol>` : '<div class="empty-card"><p>More verified reports will appear here as they are published.</p></div>'}
      </aside>
    </div>` : `<section class="empty-card"><h2>Today’s newsroom is ready.</h2><p>No report has been published yet for ${escapeHtml(currentPhtDateLabel())}. New stories will appear here from 12:00 a.m. to 11:59 p.m. Philippine time. Older reports remain preserved in the archives.</p><a class="primary-button" href="?archive=all" data-route-link>Open News Archives</a></section>`;
    main.innerHTML = `<header class="page-heading"><div><h1>Today’s FMB News</h1><p>The latest verified reports published today. At midnight, they move into their permanent archives without being deleted.</p></div><span class="date-badge">${escapeHtml(currentPhtDateLabel())}</span></header>${lead}<div class="section-head"><h2>Latest News Today</h2><a href="?archive=all" data-route-link>Browse all archives</a></div>${storyGrid(more, 'Today’s reports will be added here as they are published.')}`;
  };

  const renderAlamMoBa = () => {
    setWire(currentDayArticles());
    const articles = sortedArticles().filter((article) => article.segment === 'alam-mo-ba');
    main.innerHTML = `<section class="segment-hero">
      <div><h1>Alam Mo Ba?</h1><p>Useful, surprising and verified facts made easy to remember.</p></div>
    </section>
    <section class="content-panel">
      <h2>Today’s curiosity desk</h2>
      <p>Every fact below includes a source so readers can go beyond the headline and verify the information for themselves.</p>
      <div class="fact-grid">${FACTS.map((fact, index) => `<article class="fact-card">
        <span class="fact-number">${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(fact.title)}</h3>
        <p>${escapeHtml(fact.copy)}</p>
        <a class="fact-source" href="${safeExternal(fact.url)}" target="_blank" rel="noopener noreferrer">Source: ${escapeHtml(fact.source)}</a>
      </article>`).join('')}</div>
    </section>
    <div class="section-head"><h2>Alam Mo Ba? Reports</h2><a href="?archive=all" data-route-link>Explore the newsroom</a></div>
    ${storyGrid(articles, 'Original Alam Mo Ba? reports will appear here while the verified fact desk remains available every day.')}`;
  };

  const renderLotto = () => {
    setWire(currentDayArticles());
    const weekday = currentPhtWeekday();
    const todayGames = LOTTO_SCHEDULE.filter((item) => item.days.includes(weekday));
    const articles = sortedArticles().filter((article) => article.segment === 'lotto');
    main.innerHTML = `<section class="segment-hero gold">
      <div><h1>Lotto</h1><p>A clear gateway to official PCSO results, today’s draw schedule and responsible-play information.</p></div>
    </section>
    <div class="lotto-status">
      <section class="lotto-official">
        <h2>Check official winning numbers</h2>
        <p>FMB News does not invent, predict or republish unconfirmed winning combinations. Open the official PCSO-supported results page for the latest verified numbers and jackpot information.</p>
        <a class="primary-button" href="https://lottomatik.pcso.gov.ph/lotto-results" target="_blank" rel="noopener noreferrer">Open Official Results</a>
      </section>
      <aside class="lotto-notice">
        <h3>${escapeHtml(weekday)} draws</h3>
        <p>${todayGames.length ? todayGames.map((game) => game.game).join(', ') : 'Digit-game schedules remain available through PCSO.'}</p>
        <a class="text-button" href="https://www.pcso.gov.ph/" target="_blank" rel="noopener noreferrer">Visit PCSO</a>
      </aside>
    </div>
    <section class="content-panel">
      <h2>Official draw schedule</h2>
      <p>Schedules may be changed by PCSO. Always confirm through the official source before relying on a draw time.</p>
      <div class="schedule-grid">${LOTTO_SCHEDULE.map((item) => `<article class="schedule-card${item.days.includes(weekday) ? ' is-today' : ''}">
        <strong>${escapeHtml(item.game)}</strong>
        <span>${escapeHtml(item.days.join(', '))}<br>${escapeHtml(item.time)}</span>
      </article>`).join('')}</div>
      <h3>Play responsibly</h3>
      <p>Set a spending limit, never borrow money to play, and remember that lottery games are chance-based entertainment, not an income plan.</p>
      <a class="secondary-button" href="https://lottomatik.pcso.gov.ph/responsible-gaming" target="_blank" rel="noopener noreferrer">Responsible Gaming Guide</a>
    </section>
    <div class="section-head"><h2>Lotto Updates</h2><a href="?archive=all" data-route-link>Open news archives</a></div>
    ${storyGrid(articles, 'Verified lotto-related reports will be preserved here. Official winning numbers remain linked directly to PCSO-supported sources.')}`;
  };

  const horoscopeMessage = (sign, period) => {
    const seed = daySeed() + ZODIAC.findIndex((item) => item.id === sign.id) * 3 + (period === 'week' ? 11 : period === 'month' ? 23 : 0);
    const opening = HOROSCOPE_OPENINGS[seed % HOROSCOPE_OPENINGS.length];
    const action = HOROSCOPE_ACTIONS[(seed + 2) % HOROSCOPE_ACTIONS.length];
    const relationship = HOROSCOPE_RELATIONSHIPS[(seed + 4) % HOROSCOPE_RELATIONSHIPS.length];
    const periodLead = period === 'week'
      ? 'This week rewards patient sequencing: decide what matters first, then protect enough time to finish it properly.'
      : period === 'month'
        ? 'This month is less about dramatic reinvention and more about building a pattern you will still respect later.'
        : opening;
    return `${periodLead} Your natural ${sign.strength} is most useful when directed toward ${sign.focus}. ${action} ${relationship}`;
  };

  const horoscopeDetailHtml = () => {
    const sign = ZODIAC.find((item) => item.id === activeSign) || ZODIAC[0];
    const periodLabel = activeHoroscopePeriod === 'week' ? 'This Week' : activeHoroscopePeriod === 'month' ? 'This Month' : 'Today';
    const luckyNumber = ((daySeed() + ZODIAC.indexOf(sign) * 7) % 41) + 1;
    const colorOptions = ['Deep plum', 'Navy blue', 'Soft gold', 'Pearl white', 'Lavender', 'Forest green'];
    const focusOptions = ['clarity', 'courage', 'rest', 'communication', 'money discipline', 'creative work'];
    return `<section class="horoscope-detail" aria-live="polite">
      <h2>${escapeHtml(sign.symbol)} ${escapeHtml(sign.name)} · ${escapeHtml(periodLabel)}</h2>
      <p>${escapeHtml(horoscopeMessage(sign, activeHoroscopePeriod))}</p>
      <div class="horoscope-meta">
        <span>Dates: ${escapeHtml(sign.dates)}</span>
        <span>Reflection number: ${luckyNumber}</span>
        <span>Color cue: ${escapeHtml(colorOptions[(daySeed() + ZODIAC.indexOf(sign)) % colorOptions.length])}</span>
        <span>Focus: ${escapeHtml(focusOptions[(daySeed() + ZODIAC.indexOf(sign) * 2) % focusOptions.length])}</span>
      </div>
    </section>`;
  };

  const renderHoroscope = () => {
    setWire(currentDayArticles());
    const articles = sortedArticles().filter((article) => article.segment === 'horoscope');
    main.innerHTML = `<section class="segment-hero plum">
      <div><h1>Horoscope</h1><p>A beautifully edited daily reflection for entertainment, perspective and intentional living.</p></div>
    </section>
    <section class="content-panel">
      <h2>Your zodiac reflection</h2>
      <p>Select a sign and timeframe. The reading refreshes with the Philippine calendar day and is clearly presented as editorial entertainment, not factual prediction.</p>
      <div class="horoscope-toolbar" role="group" aria-label="Horoscope timeframe">
        <button type="button" data-horoscope-period="today" aria-pressed="${activeHoroscopePeriod === 'today'}">Today</button>
        <button type="button" data-horoscope-period="week" aria-pressed="${activeHoroscopePeriod === 'week'}">This Week</button>
        <button type="button" data-horoscope-period="month" aria-pressed="${activeHoroscopePeriod === 'month'}">This Month</button>
      </div>
      <div class="zodiac-grid" role="group" aria-label="Choose a zodiac sign">
        ${ZODIAC.map((sign) => `<button class="zodiac-button" type="button" data-zodiac="${escapeHtml(sign.id)}" aria-pressed="${sign.id === activeSign}">
          <span class="zodiac-symbol" aria-hidden="true">${escapeHtml(sign.symbol)}</span>
          <span class="zodiac-name">${escapeHtml(sign.name)}</span>
        </button>`).join('')}
      </div>
      <div data-horoscope-detail>${horoscopeDetailHtml()}</div>
      <p class="editorial-note">FMB Horoscope is written for reflection and entertainment. It should not replace medical, legal, financial or mental-health advice.</p>
    </section>
    <div class="section-head"><h2>Horoscope Archive</h2><a href="?archive=lifestyle" data-route-link>Browse Lifestyle</a></div>
    ${storyGrid(articles, 'Published horoscope features will be preserved here while the interactive daily reflection remains available.')}`;
  };

  const renderArchive = (slug) => {
    setWire(currentDayArticles());
    if (slug === 'all') {
      const all = sortedArticles();
      const directory = Object.entries(CATEGORY_LABELS).map(([key, label]) => {
        const count = all.filter((article) => article.category === key).length;
        return `<a href="?archive=${escapeHtml(key)}" data-route-link><strong>${escapeHtml(label)}</strong><span>${count} preserved report${count === 1 ? '' : 's'}</span></a>`;
      }).join('');
      main.innerHTML = `<header class="page-heading"><div><h1>News Archives</h1><p>Every preserved FMB News report, organized by subject without removing or rewriting its original article URL.</p></div><span class="date-badge">${all.length} reports</span></header><nav class="archive-directory" aria-label="News archive categories">${directory}</nav>${storyGrid(all, 'The archive is ready for the first preserved report.')}`;
      return;
    }
    const label = CATEGORY_LABELS[slug] || 'News Archive';
    const articles = sortedArticles().filter((article) => article.category === slug);
    main.innerHTML = `<header class="page-heading"><div><h1>${escapeHtml(label)} Archive</h1><p>Preserved FMB News reports filed under ${escapeHtml(label)}. Existing article URLs, images, credits and sourcing remain unchanged.</p></div><span class="date-badge">${articles.length} report${articles.length === 1 ? '' : 's'}</span></header>${storyGrid(articles, `No preserved report is currently tagged ${label}. Open All Archives to continue reading.`)}`;
  };

  const renderAbout = () => {
    setWire(currentDayArticles());
    main.innerHTML = `<section class="segment-hero"><div><h1>About FMB News</h1><p>Who we are, what we stand for, and why our work is centered on Filipinos.</p></div></section>
    <section class="content-panel">
      <h2>Who We Are</h2>
      <p>FMB News is the public-interest newsroom of the FMB ecosystem. We publish reports, explainers and clearly labeled perspective designed to make important information easier to understand and more useful in everyday Filipino life.</p>
      <div class="mission-grid">
        <article class="mission-card"><h3>Our Mission</h3><p>To deliver credible information with clarity, context and responsibility, and to explain why each important story matters to us Filipinos.</p></article>
        <article class="mission-card"><h3>Our Vision</h3><p>A more informed Filipino public that can understand events, make stronger decisions and participate more confidently in community life.</p></article>
      </div>
      <h3>Our Editorial Promise</h3>
      <p>We distinguish reporting from opinion, identify sources and image credits, correct meaningful errors, preserve published archives, and avoid presenting unverified claims as fact.</p>
      <h3>Ownership and Contact</h3>
      <p>FMB News is part of the FMB ecosystem and is connected to FMB&amp;CO. Editorial questions, corrections and story submissions may be sent to <a href="mailto:withlovefmb@gmail.com">withlovefmb@gmail.com</a>.</p>
    </section>`;
  };

  const renderFmbMessage = () => {
    setWire(currentDayArticles());
    main.innerHTML = `<section class="segment-hero plum"><div><h1>FMB Message</h1><p>Messages from FMB about the newsroom, our readers and the work of making information clearer.</p></div></section>
    <section class="content-panel">
      <h2>A newsroom built around understanding</h2>
      <p>FMB News should never make readers work harder just to understand what happened. Our responsibility is to report carefully, explain the context, and show the real effect of a story on Filipino families, workers and communities.</p>
      <p>We will treat serious news with seriousness, keep our original segments easy to return to, and protect the published record as the newsroom evolves.</p>
      <p><strong>With love, FMB.</strong></p>
    </section>`;
  };

  const renderSubmit = () => {
    setWire(currentDayArticles());
    const mailto = 'mailto:withlovefmb@gmail.com?subject=Story%20Submission%20for%20FMB%20News&body=Please%20include%3A%0A-%20A%20short%20description%20of%20your%20story%0A-%20Where%20and%20when%20it%20happened%0A-%20Your%20name%20or%20anonymous%20preference%0A-%20Attach%20the%20original%20photos%20or%20videos';
    main.innerHTML = `<section class="segment-hero"><div><h1>Submit Your Story</h1><p>Share a community story, investigative tip, photo or local concern with FMB News.</p></div></section>
    <section class="content-panel submit-grid">
      <div><h2>What to send</h2><ul class="submit-checklist"><li>A short description of what happened</li><li>Where and when it happened</li><li>Original photos or videos you own or have permission to share</li><li>Your name, or a request to remain anonymous</li></ul></div>
      <div><h2>Before you submit</h2><p>Never place yourself in danger to capture a story. FMB News reviews every submission but cannot guarantee publication. Submitted media may be verified before use and credited according to your preference.</p><a class="primary-button" href="${mailto}">Email Your Story</a></div>
    </section>`;
  };

  const renderSearch = (query) => {
    const q = normalize(query);
    const results = sortedArticles().filter((article) => articleSearchText(article).includes(q));
    setWire(currentDayArticles());
    main.innerHTML = `<header class="page-heading"><div><h1>Search FMB News</h1><p>Results for “${escapeHtml(query)}” across the preserved news archive.</p></div><span class="date-badge">${results.length} result${results.length === 1 ? '' : 's'}</span></header>${storyGrid(results, 'Try another title, topic, place or category.')}`;
  };

  const routeState = () => {
    const params = new URLSearchParams(location.search);
    return { view: params.get('view') || 'home', archive: params.get('archive') || '', search: params.get('search') || '' };
  };
  const updateSelectedNavigation = ({ view, archive }) => {
    document.querySelectorAll('[data-view-link]').forEach((link) =>
      link.dataset.viewLink === view && !archive ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')
    );
    document.querySelectorAll('[data-archive-link]').forEach((link) =>
      link.dataset.archiveLink === archive ? link.setAttribute('aria-current', 'page') : link.removeAttribute('aria-current')
    );
  };
  const renderNow = ({ focus = false } = {}) => {
    const state = routeState();
    updateSelectedNavigation(state);
    if (state.search) renderSearch(state.search);
    else if (state.archive) renderArchive(state.archive);
    else if (state.view === 'alam-mo-ba') renderAlamMoBa();
    else if (state.view === 'lotto') renderLotto();
    else if (state.view === 'horoscope') renderHoroscope();
    else if (state.view === 'about') renderAbout();
    else if (state.view === 'fmb-message') renderFmbMessage();
    else if (state.view === 'submit') renderSubmit();
    else renderHome();
    if (focus) main.focus({ preventScroll: true });
  };
  const render = (options = {}) => {
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(() => renderNow(options));
    } else {
      renderNow(options);
    }
  };
  const navigate = (href) => {
    const target = new URL(href, location.href);
    history.pushState({}, '', `${target.pathname}${target.search}${target.hash}`);
    closeDrawer({ restoreFocus: false });
    closeSearch();
    render({ focus: true });
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const updateHoroscopeDetail = () => {
    const container = document.querySelector('[data-horoscope-detail]');
    if (container) container.innerHTML = horoscopeDetailHtml();
    document.querySelectorAll('[data-zodiac]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.zodiac === activeSign)));
    document.querySelectorAll('[data-horoscope-period]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.horoscopePeriod === activeHoroscopePeriod)));
  };
  const fallbackImage = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b1034"/><stop offset=".58" stop-color="#4a2785"/><stop offset="1" stop-color="#6d1f5d"/></linearGradient></defs><rect width="1600" height="1000" fill="url(#g)"/><g fill="none" stroke="#f2c958" opacity=".55"><circle cx="1220" cy="210" r="80"/><circle cx="1220" cy="210" r="145"/><circle cx="1220" cy="210" r="210"/></g><text x="110" y="460" fill="#fff" font-family="Georgia,serif" font-size="112">FMB NEWS</text><text x="115" y="535" fill="#f2c958" font-family="Arial,sans-serif" font-size="30" letter-spacing="9">CLEARER • SHARPER • MATTERS</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  document.addEventListener('click', (event) => {
    const routeLink = event.target.closest('[data-route-link]');
    if (routeLink) {
      const target = new URL(routeLink.href, location.href);
      if (target.origin === location.origin) {
        event.preventDefault();
        navigate(routeLink.getAttribute('href'));
        return;
      }
    }
    const periodButton = event.target.closest('[data-horoscope-period]');
    if (periodButton) {
      activeHoroscopePeriod = periodButton.dataset.horoscopePeriod;
      updateHoroscopeDetail();
      return;
    }
    const signButton = event.target.closest('[data-zodiac]');
    if (signButton) {
      activeSign = signButton.dataset.zodiac;
      updateHoroscopeDetail();
    }
  });

  document.addEventListener('error', (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches('[data-story-image]') || image.dataset.fallbackApplied) return;
    image.dataset.fallbackApplied = 'true';
    image.src = fallbackImage();
  }, true);

  openButton?.addEventListener('click', openDrawer);
  closeButton?.addEventListener('click', () => closeDrawer());
  scrim?.addEventListener('click', () => closeDrawer());
  searchToggle?.addEventListener('click', () => body.classList.contains('search-open') ? closeSearch() : openSearch());
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (body.classList.contains('search-open')) closeSearch();
      else if (body.classList.contains('drawer-open')) closeDrawer();
    }
    if (event.key === 'Tab' && body.classList.contains('drawer-open') && sidebar) {
      const focusable = [...sidebar.querySelectorAll('a[href],button:not([disabled])')].filter((node) => !node.hidden);
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
    }
  });
  archiveToggle?.addEventListener('click', () => {
    const expanded = archiveToggle.getAttribute('aria-expanded') === 'true';
    archiveToggle.setAttribute('aria-expanded', String(!expanded));
    archiveLinks.hidden = expanded;
  });
  wireToggle?.addEventListener('click', () => {
    const paused = body.classList.toggle('wire-paused');
    wireToggle.setAttribute('aria-pressed', String(paused));
    wireToggle.setAttribute('aria-label', paused ? 'Play moving headlines' : 'Pause moving headlines');
  });
  searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (query) navigate(`?search=${encodeURIComponent(query)}`);
  });
  window.addEventListener('popstate', () => render());
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && body.classList.contains('drawer-open')) closeDrawer({ restoreFocus: false });
    if (window.innerWidth > 860 && body.classList.contains('search-open')) closeSearch();
  });

  const load = async () => {
    updateClock();
    setInterval(updateClock, 15000);
    try {
      const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Manifest request failed with ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload.articles)) throw new Error('Manifest articles are missing.');
      manifest = payload;
      render();
    } catch (error) {
      console.error(error);
      main.innerHTML = `<section class="error-state"><h1>The newsroom index could not be loaded.</h1><p>No article has been deleted. Please open the preserved <a href="/news/">news archive</a> while the index refreshes.</p></section>`;
      setWire([]);
    }
  };

  load();
})();