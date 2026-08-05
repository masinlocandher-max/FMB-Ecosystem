(() => {
  'use strict';
  const wire = document.querySelector('[data-fmbn-wire]');
  if (!wire) return;
  const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  let headlines = [];
  const applyFallback = () => {
    if (!headlines.length || !/preparing the next verified report/i.test(wire.textContent || '')) return;
    wire.innerHTML = [...headlines, ...headlines].map((headline, index) => `<span${index >= headlines.length ? ' aria-hidden="true"' : ''}>${escapeHtml(headline)}</span>`).join('');
  };
  new MutationObserver(applyFallback).observe(wire, { childList: true, subtree: true, characterData: true });
  fetch('/assets/data/fmbnews-editorial-manifest.json', { cache: 'no-store' })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Manifest returned ${response.status}`)))
    .then((data) => { headlines = (data.articles || []).map((article) => article.title).filter(Boolean).slice(0, 7); applyFallback(); })
    .catch(() => {});
})();
