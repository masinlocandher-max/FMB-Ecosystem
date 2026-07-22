(() => {
  const init = () => {
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.site-nav');

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    nav.classList.remove('open');
    document.body.style.removeProperty('overflow');
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      menuButton.setAttribute('aria-label', open ? 'Open navigation' : 'Close navigation');
      nav.classList.toggle('open', !open);
      document.body.style.overflow = open ? '' : 'hidden';
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const areaContent = {
    brand: ['01', 'Brand Strategy and Identity', 'Building distinctive brands with clear positioning, purpose, personality, identity systems, and long-term direction.'],
    creative: ['02', 'Creative Direction', 'Developing visual and conceptual systems that make ideas feel coherent, recognizable, purposeful, and emotionally compelling.'],
    pr: ['03', 'Public Relations and Communications', 'Helping people and organizations shape narratives, strengthen credibility, clarify messages, and manage public perception.'],
    photo: ['04', 'Photography and Visual Storytelling', 'Using photography, writing, music, and multimedia to document identity, culture, people, and meaningful experiences.'],
    digital: ['05', 'Entrepreneurship and Digital Products', 'Creating companies, platforms, tools, and digital experiences that respond to real human and business needs.'],
    culture: ['06', 'Culture, Heritage, and Community', 'Supporting language preservation, cultural memory, identity, advocacy, and community-centered development.']
  };

  const rows = [...document.querySelectorAll('.area-row')];
  const number = document.querySelector('#area-number');
  const title = document.querySelector('#area-title');
  const description = document.querySelector('#area-description');

  rows.forEach((row) => {
    row.addEventListener('click', () => {
      const content = areaContent[row.dataset.area];
      if (!content || !number || !title || !description) return;
      rows.forEach((item) => {
        item.classList.remove('active');
        item.setAttribute('aria-selected', 'false');
      });
      row.classList.add('active');
      row.setAttribute('aria-selected', 'true');
      number.textContent = content[0];
      title.textContent = content[1];
      description.textContent = content[2];
    });
  });

  const reveals = document.querySelectorAll('.reveal:not(.is-visible)');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -7%'});
    reveals.forEach((item) => observer.observe(item));
  } else {
    reveals.forEach((item) => item.classList.add('is-visible'));
  }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, {once: true});
  } else {
    init();
  }
})();
