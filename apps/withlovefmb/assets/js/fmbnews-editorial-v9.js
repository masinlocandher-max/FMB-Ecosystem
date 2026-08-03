(() => {
  const body = document.body;
  if (!body?.classList.contains('news-editorial-v9')) return;

  const menuButton = document.querySelector('[data-fn9-menu]');
  const categoryNav = document.querySelector('.fn9-category-nav');

  if (menuButton && categoryNav) {
    menuButton.addEventListener('click', () => {
      const open = body.classList.toggle('fn9-menu-open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close news categories' : 'Open news categories');
    });
  }

  const searchButton = document.querySelector('[data-fn9-search-open]');
  const searchPanel = document.querySelector('[data-fn9-search-panel]');
  const searchInput = document.querySelector('[data-fn9-search-input]');
  const searchClose = document.querySelector('[data-fn9-search-close]');
  const searchStatus = document.querySelector('[data-fn9-search-status]');
  const searchableItems = [...document.querySelectorAll('[data-fn9-searchable]')];

  const setSearchOpen = (open) => {
    if (!searchPanel || !searchButton) return;
    searchPanel.hidden = !open;
    searchButton.setAttribute('aria-expanded', String(open));
    if (open) {
      window.requestAnimationFrame(() => searchInput?.focus());
    }
  };

  const runSearch = () => {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLocaleLowerCase('en-PH');
    let visible = 0;

    searchableItems.forEach((item) => {
      const match = !query || item.textContent.toLocaleLowerCase('en-PH').includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    });

    if (searchStatus) {
      searchStatus.textContent = query
        ? `${visible} report${visible === 1 ? '' : 's'} found for “${searchInput.value.trim()}”.`
        : 'Search report titles, topics, and categories.';
    }
  };

  searchButton?.addEventListener('click', () => setSearchOpen(searchPanel?.hidden !== false));
  searchClose?.addEventListener('click', () => setSearchOpen(false));
  searchInput?.addEventListener('input', runSearch);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchPanel && !searchPanel.hidden) {
      setSearchOpen(false);
      searchButton?.focus();
    }
  });

  const viewAllButton = document.querySelector('[data-fn9-view-all]');
  const moreReports = document.querySelector('[data-fn9-more-reports]');

  if (viewAllButton && moreReports) {
    viewAllButton.addEventListener('click', () => {
      const expanding = moreReports.hidden;
      moreReports.hidden = !expanding;
      viewAllButton.setAttribute('aria-expanded', String(expanding));
      viewAllButton.textContent = expanding ? 'Show fewer reports ↑' : 'View all reports →';

      if (expanding) {
        moreReports.querySelector('a')?.focus({ preventScroll: true });
      }
    });
  }
})();
