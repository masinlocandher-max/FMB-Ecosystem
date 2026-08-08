(() => {
  'use strict';
  const hero = document.querySelector('.hero-chapter');
  const visual = document.querySelector('.hero-visual');
  const portrait = document.querySelector('.hero-portrait img');
  const mobile = window.matchMedia('(max-width: 720px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!hero || !visual || !portrait) return;

  let ticking = false;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const update = () => {
    ticking = false;
    if (!mobile.matches || reduced.matches) {
      visual.style.removeProperty('--hero-mobile-x');
      visual.style.removeProperty('--hero-mobile-y');
      visual.style.removeProperty('--hero-mobile-scale');
      portrait.style.removeProperty('--hero-img-y');
      return;
    }
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    const x = `${progress * -18}px`;
    const y = `${progress * -28}px`;
    const scale = (1 + progress * 0.045).toFixed(3);
    const imgY = `${progress * -12}px`;
    visual.style.setProperty('--hero-mobile-x', x);
    visual.style.setProperty('--hero-mobile-y', y);
    visual.style.setProperty('--hero-mobile-scale', scale);
    portrait.style.setProperty('--hero-img-y', imgY);
  };
  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  mobile.addEventListener?.('change', requestUpdate);
  reduced.addEventListener?.('change', requestUpdate);
  requestUpdate();
})();
