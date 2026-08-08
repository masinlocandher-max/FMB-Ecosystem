(() => {
  'use strict';

  const page = document.querySelector('.about-scroll-page');
  if (!page) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const progressWithin = (element) => {
    const rect = element.getBoundingClientRect();
    const travel = Math.max(1, rect.height - window.innerHeight);
    return clamp(-rect.top / travel);
  };

  const intro = document.getElementById('introSequence');
  const introSkip = document.getElementById('introSkip');
  const dismissIntro = () => {
    if (!intro) return;
    intro.classList.add('is-hidden');
    window.setTimeout(() => intro.remove(), 900);
    try { sessionStorage.setItem('fmbAboutIntroSeen', '1'); } catch (_) {}
  };
  if (intro) {
    let seen = false;
    try { seen = sessionStorage.getItem('fmbAboutIntroSeen') === '1'; } catch (_) {}
    if (seen || reducedMotion.matches) dismissIntro();
    else window.setTimeout(dismissIntro, 3100);
    introSkip?.addEventListener('click', dismissIntro);
  }

  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('siteNav');
  const closeMenu = () => {
    siteNav?.classList.remove('is-open');
    document.body.classList.remove('menu-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Open navigation');
  };
  menuToggle?.addEventListener('click', () => {
    const open = !siteNav?.classList.contains('is-open');
    siteNav?.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  const pageProgress = document.getElementById('pageProgress');
  const chapterIndex = document.getElementById('chapterIndex');
  const chapterTitle = document.getElementById('chapterTitle');
  const chapterLine = document.getElementById('chapterLine');
  const chapterLinks = [...document.querySelectorAll('#chapterNav a')];
  const chapters = [...document.querySelectorAll('[data-chapter]')];

  const activateChapter = (chapter) => {
    if (!chapter) return;
    const index = chapter.dataset.index || '01';
    const title = chapter.dataset.chapter || 'Identity';
    if (chapterIndex) chapterIndex.textContent = index;
    if (chapterTitle) chapterTitle.textContent = title;
    const activePosition = Math.max(1, Number.parseInt(index, 10));
    if (chapterLine) chapterLine.style.height = `${(activePosition / chapters.length) * 100}%`;
    chapterLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${chapter.id}`;
      if (active) link.setAttribute('aria-current', 'step');
      else link.removeAttribute('aria-current');
    });
  };

  const Observer = 'IntersectionObserver' in window ? IntersectionObserver : null;
  const chapterObserver = Observer ? new Observer((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) activateChapter(visible.target);
  }, { threshold: [0.22, 0.42, 0.66], rootMargin: '-15% 0px -45% 0px' }) : null;
  if (chapterObserver) chapters.forEach((chapter) => chapterObserver.observe(chapter));
  else activateChapter(chapters[0]);

  const revealTargets = [...document.querySelectorAll('.timeline-item, .manifesto p')];
  const revealObserver = Observer ? new Observer((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }) : null;
  if (revealObserver) revealTargets.forEach((target) => revealObserver.observe(target));
  else revealTargets.forEach((target) => target.classList.add('is-visible'));

  const ecosystemMap = document.getElementById('ecosystemMap');
  if (ecosystemMap) {
    if (!Observer) ecosystemMap.classList.add('is-active');
    else new Observer((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-active');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.28 }).observe(ecosystemMap);
  }

  const identitySection = document.querySelector('.identity-layers');
  const identitySteps = [...document.querySelectorAll('.identity-step')];
  const roleLabels = [...document.querySelectorAll('.identity-constellation span')];
  const identityPortrait = document.querySelector('.identity-portrait-wrap img');
  const principleSection = document.getElementById('philosophy');
  const principleSteps = [...document.querySelectorAll('.principle-steps i')];
  const principles = [...document.querySelectorAll('.principle')];
  const workSection = document.getElementById('work');
  const workTrack = document.getElementById('workTrack');

  let ticking = false;
  const updateScrollScenes = () => {
    ticking = false;
    const docTravel = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const documentProgress = clamp(window.scrollY / docTravel);
    if (pageProgress) pageProgress.style.width = `${documentProgress * 100}%`;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);

    const chapterFocusY = window.innerHeight * 0.38;
    const focusedChapter = chapters.find((chapter) => {
      const rect = chapter.getBoundingClientRect();
      return rect.top <= chapterFocusY && rect.bottom > chapterFocusY;
    }) || chapters.at(-1);
    activateChapter(focusedChapter);

    if (!reducedMotion.matches && identitySection && identitySteps.length) {
      const progress = progressWithin(identitySection);
      const stepIndex = Math.min(identitySteps.length - 1, Math.floor(progress * identitySteps.length));
      const activeRole = identitySteps[stepIndex]?.dataset.activeRole;
      roleLabels.forEach((label) => label.classList.toggle('is-active', label.dataset.role === activeRole));
      if (identityPortrait) {
        const drift = (progress - 0.5) * 24;
        identityPortrait.style.transform = `translate3d(${drift}px, ${Math.abs(drift) * -0.28}px, 0) scale(${1 + progress * 0.035})`;
      }
    }

    if (!reducedMotion.matches && principleSection && principles.length) {
      const progress = progressWithin(principleSection);
      const stepIndex = Math.min(principles.length - 1, Math.floor(progress * principles.length));
      principles.forEach((principle, index) => principle.classList.toggle('is-active', index === stepIndex));
    }

    if (!reducedMotion.matches && !mobile.matches && workSection && workTrack) {
      const progress = progressWithin(workSection);
      const trackWidth = workTrack.scrollWidth;
      const viewportWidth = window.innerWidth;
      const travel = Math.max(0, trackWidth - viewportWidth + viewportWidth * 0.08);
      workTrack.style.transform = `translate3d(${-progress * travel}px,0,0)`;
    } else if (workTrack) {
      workTrack.style.transform = '';
    }
  };

  const requestSceneUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollScenes);
  };
  window.addEventListener('scroll', requestSceneUpdate, { passive: true });
  window.addEventListener('resize', requestSceneUpdate, { passive: true });
  reducedMotion.addEventListener?.('change', requestSceneUpdate);
  mobile.addEventListener?.('change', requestSceneUpdate);
  requestSceneUpdate();

})();