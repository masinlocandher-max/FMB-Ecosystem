(() => {
  if (window.__senzChatSupportLoaded) return;
  window.__senzChatSupportLoaded = true;

  const answers = [
    {
      match: ['service', 'offer', 'what do you do', 'services'],
      reply: 'SENZ Strategic Communications helps with strategic communications, PR and public image, marketing and social media, call center solutions, websites and digital presence, creative production, and digital products.'
    },
    {
      match: ['price', 'pricing', 'cost', 'rate', 'budget'],
      reply: 'Pricing depends on the service path, scope, timeline, and level of production. For general inquiries, use Contact Us or email info.senz.pr@gmail.com. For a focused project discussion, use the consultation button in the Home, About, or Services hero.'
    },
    {
      match: ['website', 'digital presence', 'web'],
      reply: 'For websites and digital presence, SENZ focuses on clear messaging, premium design, service flow, and conversion paths so visitors understand and trust the brand faster.'
    },
    {
      match: ['pr', 'public image', 'reputation', 'media'],
      reply: 'For PR and public image, SENZ helps shape credibility, visibility, narrative, and reputation signals before the public forms an opinion.'
    },
    {
      match: ['marketing', 'social', 'campaign', 'content'],
      reply: 'For marketing and social media, SENZ builds campaign direction, content pillars, posting rhythm, and audience movement so the brand feels consistent and memorable.'
    },
    {
      match: ['call center', 'customer', 'inquiry', 'support'],
      reply: 'For call center solutions, SENZ helps organize inquiry flow, support scripts, lead handling, response standards, and customer communication routes.'
    },
    {
      match: ['ebook', 'reader', 'book'],
      reply: 'Books and resources are still being prepared. For now, please use Contact Us if you want to be notified about future SENZ Strategic Communications releases.'
    },
    {
      match: ['clone', 'assistant', 'representative', 'music', 'voting', 'tabulation', 'ticket'],
      reply: 'Digital products include SENZ FotoLab, Digital Assistants, client portals, event systems, consent-based Digital Representatives, and the SENZ Music platform. Current availability depends on the product stage and project scope. Inquiries go to info.senz.pr@gmail.com.'
    },
    {
      match: ['contact', 'email', 'message', 'book', 'consultation'],
      reply: 'For general questions, use the Contact Us page. For consultation requests, use the Book a Consultation button in the Home, About, or Services hero so SENZ Strategic Communications receives the right details.'
    }
  ];

  const quickPrompts = [
    'What services do you offer?',
    'How much does it cost?',
    'I need PR help',
    'I need a website',
    'Tell me about digital products'
  ];

  function getReply(text) {
    const normalized = text.toLowerCase();
    const found = answers.find((item) => item.match.some((word) => normalized.includes(word)));
    if (found) return found.reply;
    return 'I can answer general questions about SENZ Strategic Communications services and how to start. For project-specific advice, use Book a Consultation or send a general inquiry through Contact Us.';
  }

  function appendMessage(log, message, type) {
    const bubble = document.createElement('div');
    bubble.className = `senz-chat-message ${type}`;
    bubble.textContent = message;
    log.appendChild(bubble);
    log.scrollTop = log.scrollHeight;
  }

  function initChat() {
    const contactPath = 'contact.html';
    const root = document.createElement('aside');
    root.className = 'senz-chat';
    root.setAttribute('aria-label', 'Digital Assistant');
    root.innerHTML = `
      <div class="senz-chat-panel" role="dialog" aria-label="Digital Assistant" aria-hidden="true">
        <div class="senz-chat-head">
          <div>
            <span class="senz-chat-kicker">Digital Assistant</span>
            <h2 class="senz-chat-title">How can we help?</h2>
          </div>
          <button class="senz-chat-close" type="button" aria-label="Close digital assistant">&times;</button>
        </div>
        <div class="senz-chat-log" aria-live="polite"></div>
        <div class="senz-chat-prompts" aria-label="Suggested questions"></div>
        <p class="senz-chat-note">The Digital Assistant answers general questions. For project-specific details, continue to Contact Us or book through the hero consultation form.</p>
        <a class="senz-chat-cta" href="${contactPath}">Go to Contact Us</a>
        <form class="senz-chat-form">
          <input class="senz-chat-input" type="text" autocomplete="off" placeholder="Ask a general question..." aria-label="Ask a general question" />
          <button class="senz-chat-send" type="submit">Send</button>
        </form>
      </div>
      <button class="senz-chat-button" type="button" aria-label="Open digital assistant" aria-expanded="false">
        <span class="senz-chat-pulse" aria-hidden="true"></span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4h-3l-4 3v-3H9a4 4 0 0 1-4-4V8Z"/><path d="M9 10h.01M12 10h.01M15 10h.01"/></svg>
        <span class="senz-chat-label">Digital Assistant</span>
      </button>
    `;

    document.body.appendChild(root);

    const toggle = root.querySelector('.senz-chat-button');
    const panel = root.querySelector('.senz-chat-panel');
    const close = root.querySelector('.senz-chat-close');
    const log = root.querySelector('.senz-chat-log');
    const prompts = root.querySelector('.senz-chat-prompts');
    const form = root.querySelector('.senz-chat-form');
    const input = root.querySelector('.senz-chat-input');

    appendMessage(log, 'Hi, I can answer general questions about SENZ Strategic Communications and guide you to the right service path.', 'bot');

    quickPrompts.forEach((prompt) => {
      const button = document.createElement('button');
      button.className = 'senz-chat-chip';
      button.type = 'button';
      button.textContent = prompt;
      button.addEventListener('click', () => {
        appendMessage(log, prompt, 'user');
        appendMessage(log, getReply(prompt), 'bot');
      });
      prompts.appendChild(button);
    });

    function setOpen(open) {
      root.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
      if (open) setTimeout(() => input.focus(), 120);
    }

    toggle.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));
    close.addEventListener('click', () => setOpen(false));
    document.addEventListener('senz:open-chat', () => setOpen(true));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      appendMessage(log, value, 'user');
      appendMessage(log, getReply(value), 'bot');
      input.value = '';
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
