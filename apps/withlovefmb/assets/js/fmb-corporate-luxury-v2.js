(() => {
  'use strict';

  const body = document.body;
  if (!body?.classList.contains('fmb-corporate-luxury-v2')) return;

  const modal = document.querySelector('[data-fmb-v2-modal]');
  const modalTitle = modal?.querySelector('[data-fmb-v2-modal-title]');
  const modalCopy = modal?.querySelector('[data-fmb-v2-modal-copy]');
  const modalColumns = modal?.querySelector('[data-fmb-v2-modal-columns]');
  const modalLink = modal?.querySelector('[data-fmb-v2-modal-link]');
  const closeButton = modal?.querySelector('[data-fmb-v2-modal-close]');

  const projectContent = {
    yoni: {
      title: 'Yoni',
      copy: 'A private digital companion from With Love, FMB for reflection, reading, listening, journaling, and support-oriented tools. Yoni is designed to feel warm, useful, and human while remaining clear that it does not replace professional care.',
      link: 'https://yoni.francinemariebautista.com/',
      linkLabel: 'Open Yoni',
      columns: [
        ['Purpose', 'A gentler digital space for existing members to pause, reflect, read, and listen.'],
        ['FMB role', 'Founder, creative director, experience strategist, storyteller, and product direction.'],
        ['Experience', 'Companion tools, music, reading, private progress, and a welcoming mobile-first interface.'],
      ],
    },
    mabayani: {
      title: 'Mabayani',
      copy: 'A developing cultural and historical project focused on Sambal identity, memory, language, heritage, and research. It is presented as work in progress, not as a finished public application.',
      link: '/mabayani/',
      linkLabel: 'Explore Mabayani',
      columns: [
        ['Purpose', 'Preserve and present history, expression, remembrance, language, and cultural identity.'],
        ['FMB role', 'Researcher, storyteller, creative director, cultural advocate, and project founder.'],
        ['Current stage', 'Research and editorial development. Public materials should remain evidence-led and clearly labeled.'],
      ],
    },
    volunteer: {
      title: 'Volunteer and Community Work',
      copy: 'The community side of the FMB ecosystem is visible through real participation, facilitation, advocacy, storytelling, and volunteer activity. These are not decorative photographs. They are proof of presence, responsibility, and follow-through.',
      link: '/get-involved/',
      linkLabel: 'See how to get involved',
      columns: [
        ['Purpose', 'Create access, support communities, preserve dignity, and make participation easier to understand.'],
        ['FMB role', 'Volunteer, facilitator, advocate, creative lead, trainer, and community builder.'],
        ['Approach', 'Real activities, transparent expectations, non-financial participation routes, and respectful documentation.'],
      ],
    },
    strategy: {
      title: 'Strategy that becomes direction',
      copy: 'FMB connects brand, communication, creativity, technology, learning, culture, and public meaning so the work does not become a collection of disconnected outputs.',
      link: '/work-with-fmb/',
      linkLabel: 'Start an inquiry',
      columns: [
        ['Clarity', 'Define the problem, audience, position, message, and role of every platform before producing more content.'],
        ['Direction', 'Translate the strategy into a coherent identity, campaign, experience, or communication system.'],
        ['Execution', 'Guide the visual, editorial, digital, and public-facing work until it feels intentional and consistent.'],
      ],
    },
    perception: {
      title: 'Public perception with substance',
      copy: 'FMB helps shape how people understand a person, organization, project, or issue without replacing facts with empty polish.',
      link: '/work-with-fmb/',
      linkLabel: 'Discuss your public positioning',
      columns: [
        ['Narrative', 'Identify what should be understood, what should be corrected, and what proof must support the message.'],
        ['Reputation', 'Build responsible communication around credibility, consistency, and public expectations.'],
        ['Visibility', 'Create content and experiences that are easier to notice because they are clearer, not merely louder.'],
      ],
    },
    creative: {
      title: 'Creative production with a reason',
      copy: 'Photography, design, content, music, websites, digital products, and campaigns work best when every visual choice supports a clear objective.',
      link: '/work-with-fmb/',
      linkLabel: 'Bring FMB into the project',
      columns: [
        ['Creative direction', 'Establish the visual idea, hierarchy, mood, and quality standard.'],
        ['Production', 'Coordinate imagery, content, design, motion, digital experience, and release materials.'],
        ['Consistency', 'Keep the final work aligned across screens, platforms, formats, and public touchpoints.'],
      ],
    },
  };

  const openModal = (key) => {
    const data = projectContent[key];
    if (!modal || !data) return;
    modalTitle.textContent = data.title;
    modalCopy.textContent = data.copy;
    modalColumns.innerHTML = data.columns.map(([title, copy]) => `<article><h3>${title}</h3><p>${copy}</p></article>`).join('');
    modalLink.href = data.link;
    modalLink.textContent = data.linkLabel;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.style.overflow = 'hidden';
    closeButton?.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    body.style.overflow = '';
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-fmb-v2-open]');
    if (trigger) {
      event.preventDefault();
      openModal(trigger.dataset.fmbV2Open);
      return;
    }
    if (event.target === modal || event.target.closest('[data-fmb-v2-modal-close]')) closeModal();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  const categoryButtons = document.querySelectorAll('[data-fmb-v2-book-category]');
  const ebookCards = document.querySelectorAll('[data-ebook-card]');
  categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const category = button.dataset.fmbV2BookCategory || 'all';
      categoryButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      ebookCards.forEach((card) => {
        const topics = `${card.dataset.topics || ''} ${card.dataset.access || ''}`;
        const visible = category === 'all' || topics.includes(category);
        card.hidden = !visible;
      });
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fmb-v2-project,.fmb-v2-value,.fmb-v2-volunteer-gallery figure').forEach((node) => observer.observe(node));
})();
