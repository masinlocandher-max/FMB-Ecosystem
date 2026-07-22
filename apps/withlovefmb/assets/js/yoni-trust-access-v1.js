(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const PRIVATE_KEYS = {
    checkins: 'yoni-checkins-v4',
    journals: 'yoni-journals-v4',
    chat: 'yoni-chat-v4',
    queue: 'yoni-wall-queue-v4',
    unknown: 'yoni-unknown-questions-v1',
    responseMode: 'yoni-response-mode-v1',
  };

  function readLocal(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function setText(selector, text) {
    const element = $(selector);
    if (element) element.textContent = text;
  }

  function hasMeaningfulPrivateRecords() {
    const checkins = readLocal(PRIVATE_KEYS.checkins, []);
    const journals = readLocal(PRIVATE_KEYS.journals, []);
    const queue = readLocal(PRIVATE_KEYS.queue, []);
    const chat = readLocal(PRIVATE_KEYS.chat, []);
    return Boolean(
      checkins.length ||
      journals.length ||
      queue.length ||
      chat.some((message) => message?.role === 'user')
    );
  }

  function addStorageDisclosure() {
    const card = $('.access-card');
    const security = $('.access-security', card || document);
    if (!card || !security || $('.access-data-map', card)) return;

    const disclosure = document.createElement('div');
    disclosure.className = 'access-data-map';
    disclosure.setAttribute('aria-label', 'How Yoni stores information');
    disclosure.innerHTML = `
      <article>
        <strong>Stored with your account</strong>
        <span>Email, preferred name, username, avatar, and theme settings.</span>
      </article>
      <article class="device-only">
        <strong>Private on this device</strong>
        <span>Check-ins, journal entries, conversations, and local history. These are not currently synchronized.</span>
      </article>`;
    security.before(disclosure);
    security.lastChild.textContent = ' Your account secures sign-in and profile settings. Private Yoni records remain in this browser on this device. Clearing browser data may remove them.';
  }

  function updatePreferredNameCopy() {
    const signupName = $('#signupName');
    const signupLabel = signupName?.closest('label')?.querySelector('span');
    if (signupLabel) signupLabel.textContent = 'Preferred name';
    if (signupName) {
      signupName.autocomplete = 'nickname';
      signupName.placeholder = 'What should Yoni call you?';
    }

    const accessHeading = $('.access-card-head p');
    if (accessHeading) accessHeading.textContent = 'Explore first, create a profile, or sign in securely. Existing members can use the same email and password.';

    const profileLede = $('#screen-profile .page-lede');
    if (profileLede) profileLede.textContent = 'Your preferred name personalizes your private account. It never appears on the Kind Wall. Your username is what the community sees.';

    const realName = $('#realName');
    const realNameLabel = realName?.closest('label')?.querySelector('span');
    if (realNameLabel) realNameLabel.textContent = 'Preferred name';
    const realNameHelp = realName?.closest('label')?.nextElementSibling;
    if (realNameHelp?.classList.contains('profile-help')) realNameHelp.textContent = 'Used only to personalize your private Yoni experience.';

    const wallLede = $('#screen-community .page-lede');
    if (wallLede) wallLede.textContent = 'Draft a positive story, small win, gratitude, or kind thought. Your preferred name stays private. A future public wall would show only your username.';
  }

  function addHomeMascot() {
    const stage = $('.home-yoni-stage');
    if (!stage || $('img', stage)) return;
    const mascot = document.createElement('img');
    mascot.src = window.YONI_ASSETS?.hero || '/app/assets/yoni/yoni-hero.webp';
    mascot.alt = '';
    mascot.width = 1254;
    mascot.height = 1254;
    mascot.decoding = 'async';
    mascot.setAttribute('aria-hidden', 'true');
    stage.appendChild(mascot);
  }

  function closeFounderModal() {
    const layer = $('#fmbWelcomeModal');
    if (!layer) return;
    layer.classList.remove('visible');
    document.body.classList.remove('modal-open');
    window.setTimeout(() => {
      layer.hidden = true;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 10 : 360);
  }

  function removeCommercialInterruption() {
    const continueButton = $('#fmbWelcomeContinue');
    const closeButton = $('#fmbWelcomeClose');
    if (continueButton) {
      continueButton.textContent = 'Enter Yoni';
      continueButton.onclick = closeFounderModal;
    }
    if (closeButton) {
      closeButton.setAttribute('aria-label', 'Close welcome message');
      closeButton.onclick = closeFounderModal;
    }
    $('#workWithFmbModal')?.remove();
  }

  function renderLocalDrafts() {
    const queue = $('#wallQueue');
    if (!queue) return;
    const drafts = readLocal(PRIVATE_KEYS.queue, []);
    queue.replaceChildren();

    if (!drafts.length) {
      const empty = document.createElement('div');
      empty.className = 'empty card';
      empty.textContent = 'Private drafts saved on this device will appear here.';
      queue.appendChild(empty);
      return;
    }

    drafts.forEach((draft) => {
      const article = document.createElement('article');
      article.className = 'queue-card';
      const title = document.createElement('strong');
      title.textContent = 'Private draft on this device';
      const copy = document.createElement('p');
      copy.textContent = String(draft?.text || '');
      article.append(title, copy);
      queue.appendChild(article);
    });
  }

  function makeKindWallHonest() {
    setText('#screen-community .kicker', 'Kind Wall preview');
    setText('#screen-community .page-title', 'Practice passing something good forward.');
    setText('.moderation-pill', 'Preview only');

    const meta = $$('.community-compose-meta span');
    if (meta[1]) meta[1].textContent = 'Saved only on this device';

    const consent = $('.community-consent span');
    if (consent) consent.textContent = 'I understand this is a private local draft. It is not sent to a moderator and is not public.';

    const submit = $('.community-submit');
    if (submit) submit.textContent = 'Save private draft';

    const headings = $$('#screen-community .section-heading');
    if (headings[0]) {
      const title = $('h2', headings[0]);
      const caption = $('span', headings[0]);
      if (title) title.textContent = 'Example stories';
      if (caption) caption.textContent = 'Illustrative content for the preview';
    }
    if (headings[1]) {
      const title = $('h2', headings[1]);
      const caption = $('span', headings[1]);
      if (title) title.textContent = 'Your private drafts';
      if (caption) caption.textContent = 'Stored only in this browser';
    }

    const compose = $('.community-compose');
    if (compose && !$('.local-preview-note', compose)) {
      const note = document.createElement('p');
      note.className = 'local-preview-note';
      note.textContent = 'Community moderation is not connected yet. Nothing written here is uploaded or published.';
      compose.prepend(note);
    }

    const notice = $('#screen-community > .notice');
    if (notice) notice.textContent = 'This is a local preview of the future Kind Wall. Drafts stay in this browser and are not reviewed, uploaded, or published.';

    const form = $('#wallForm');
    if (form) {
      form.onsubmit = (event) => {
        event.preventDefault();
        const input = $('#wallContent');
        const consentBox = $('#wallConsent');
        const status = $('#wallStatus');
        const text = input?.value.trim() || '';
        if (!text || !consentBox?.checked) {
          if (status) {
            status.textContent = 'Write a constructive draft and confirm the local-preview notice.';
            status.classList.add('visible');
          }
          return;
        }
        const drafts = readLocal(PRIVATE_KEYS.queue, []);
        drafts.unshift({ id: Date.now(), text, date: new Date().toISOString(), localOnly: true });
        writeLocal(PRIVATE_KEYS.queue, drafts);
        input.value = '';
        consentBox.checked = false;
        setText('#wallCount', '0 / 2000');
        if (status) {
          status.textContent = 'Saved privately on this device. It was not sent to a moderator.';
          status.classList.add('visible');
        }
        renderLocalDrafts();
      };
    }

    renderLocalDrafts();
  }

  function showGuestStatus(message) {
    let status = $('#guestStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'guestStatus';
      status.className = 'access-status';
      $('.access-guest-note')?.after(status);
    }
    status.textContent = message;
    status.dataset.type = 'error';
    status.classList.add('visible');
  }

  function exitGuestMode() {
    localStorage.removeItem(PRIVATE_KEYS.chat);
    localStorage.removeItem(PRIVATE_KEYS.unknown);
    localStorage.removeItem(PRIVATE_KEYS.responseMode);
    location.hash = '';
    location.reload();
  }

  function installGuestChrome() {
    const actions = $('.app-header-actions');
    if (actions && !$('#guestExit')) {
      const pill = document.createElement('span');
      pill.className = 'yoni-guest-pill';
      pill.textContent = 'Guest preview';
      const exit = document.createElement('button');
      exit.id = 'guestExit';
      exit.className = 'help-button';
      exit.type = 'button';
      exit.textContent = 'Exit guest';
      exit.onclick = exitGuestMode;
      actions.prepend(pill);
      actions.append(exit);
    }

    const footer = $('.app-footer p');
    if (footer) footer.innerHTML = '<strong>Guest preview.</strong> Journal, check-in history, community posting, and profile tools require an account. Use Exit guest to remove this preview conversation from the browser.';
  }

  function enterGuestMode() {
    if (hasMeaningfulPrivateRecords()) {
      showGuestStatus('This browser already contains private Yoni records. For safety, sign in to continue or open Yoni in a private browsing window to use the guest preview.');
      return;
    }

    document.body.dataset.yoniAccess = 'guest';
    $('#accessGate').hidden = true;
    $('#appShell').hidden = false;
    $('#tabbar').hidden = false;

    $$('.screen').forEach((screen) => screen.classList.toggle('active', screen.dataset.screen === 'home'));
    $$('[data-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === 'home'));
    setText('#homeDateLine', 'Guest preview');
    const homeTitle = $('#homeTitle');
    if (homeTitle) homeTitle.innerHTML = 'Welcome, friend <span aria-hidden="true">✦</span>';

    installGuestChrome();
    addHomeMascot();
    history.replaceState({ screen: 'home', guest: true }, '', '#home');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function addGuestEntry() {
    const card = $('.access-card');
    const security = $('.access-security', card || document);
    if (!card || !security || $('#guestAccess')) return;

    const button = document.createElement('button');
    button.id = 'guestAccess';
    button.className = 'access-guest';
    button.type = 'button';
    button.textContent = 'Explore without an account';
    button.onclick = enterGuestMode;

    const note = document.createElement('p');
    note.className = 'access-guest-note';
    note.textContent = 'Guest preview includes Yoni conversation, grounding, reading, music, and support. Private journal, check-ins, community, and profile tools stay account-only.';

    security.before(button, note);
  }

  function guardGuestRoutes() {
    const allowed = new Set(['home', 'companion', 'tools', 'listen', 'read', 'help']);
    window.addEventListener('hashchange', () => {
      if (document.body.dataset.yoniAccess !== 'guest') return;
      const requested = location.hash.replace('#', '');
      if (allowed.has(requested)) return;
      const home = $('[data-screen="home"]');
      $$('.screen').forEach((screen) => screen.classList.toggle('active', screen === home));
      history.replaceState({ screen: 'home', guest: true }, '', '#home');
    });
  }

  function init() {
    updatePreferredNameCopy();
    addStorageDisclosure();
    addGuestEntry();
    addHomeMascot();
    removeCommercialInterruption();
    makeKindWallHonest();
    guardGuestRoutes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
