(() => {
  const body = document.body;
  if (!body?.classList.contains('news-center-v3')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.querySelector('.nc3-progress span');
  const menuButton = document.querySelector('[data-news-menu]');
  const newsNav = document.querySelector('#newsNav');
  const searchForm = document.querySelector('[data-news-search]');
  const searchInput = searchForm?.querySelector('input[type="search"]');
  const clearButton = searchForm?.querySelector('[data-search-clear]');
  const searchStatus = searchForm?.querySelector('[data-search-status]');
  const searchableStories = [...document.querySelectorAll('.nc3-searchable')];

  const formatEdition = () => {
    const now = new Date();
    const date = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);
    document.querySelectorAll('[data-news-date]').forEach((element) => {
      element.textContent = date;
      element.setAttribute('datetime', new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now));
    });
  };

  const closeNewsMenu = () => {
    if (!menuButton || !newsNav) return;
    newsNav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open News Center menu');
  };

  if (menuButton && newsNav) {
    menuButton.addEventListener('click', () => {
      const shouldOpen = !newsNav.classList.contains('open');
      newsNav.classList.toggle('open', shouldOpen);
      menuButton.setAttribute('aria-expanded', String(shouldOpen));
      menuButton.setAttribute('aria-label', shouldOpen ? 'Close News Center menu' : 'Open News Center menu');
    });
    newsNav.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeNewsMenu();
    });
    document.addEventListener('click', (event) => {
      if (newsNav.classList.contains('open') && !event.target.closest('#newsNav, [data-news-menu]')) {
        closeNewsMenu();
      }
    });
  }

  const normalize = (value) => value.toLocaleLowerCase('en-PH').trim().replace(/\s+/g, ' ');

  const filterStories = (rawQuery, shouldFocus = false) => {
    const query = normalize(rawQuery);
    let matches = 0;
    let firstMatch;

    searchableStories.forEach((story) => {
      const haystack = normalize(`${story.dataset.search || ''} ${story.textContent || ''}`);
      const visible = !query || haystack.includes(query);
      story.hidden = !visible;
      if (visible) {
        matches += 1;
        firstMatch ||= story;
      }
    });

    if (clearButton) clearButton.hidden = !query;
    if (searchStatus) {
      searchStatus.textContent = query
        ? `${matches} ${matches === 1 ? 'story' : 'stories'} found`
        : '';
    }
    if (shouldFocus && query && firstMatch) {
      firstMatch.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      firstMatch.querySelector('a')?.focus({ preventScroll: true });
    }
    return matches;
  };

  if (searchForm && searchInput) {
    searchInput.addEventListener('input', () => filterStories(searchInput.value));
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      filterStories(searchInput.value, true);
    });
    clearButton?.addEventListener('click', () => {
      searchInput.value = '';
      filterStories('');
      searchInput.focus();
    });
  }

  const revealElements = [...document.querySelectorAll('.nc-reveal')];
  if (!reducedMotion && 'IntersectionObserver' in window) {
    body.classList.add('js-nc3-motion');
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -5% 0px' });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('in-view'));
  }

  const sectionLinks = [...document.querySelectorAll('.nc-site-links a[href^="#"]')];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      sectionLinks.forEach((link) => {
        const selected = link.getAttribute('href') === `#${active.target.id}`;
        if (selected) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { threshold: [0, .1, .35], rootMargin: '-25% 0px -62% 0px' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  let scrollFrame = 0;
  const updateScrollProgress = () => {
    scrollFrame = 0;
    if (!progress) return;
    const maximum = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.transform = `scaleX(${Math.min(1, window.scrollY / maximum)})`;
  };
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateScrollProgress);
  }, { passive: true });
  window.addEventListener('resize', () => {
    closeNewsMenu();
    updateScrollProgress();
  }, { passive: true });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNewsMenu();
  });

  formatEdition();
  updateScrollProgress();
})();
