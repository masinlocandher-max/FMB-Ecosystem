(() => {
  const divisions = {
    music: {
      name: "SENZ Music",
      subtitle: "Music, sound, and sonic identity",
      lead: "SENZ Music develops original sound for brands, campaigns, artists, events, and organizations that need to be heard with a clear identity, not just background audio.",
      bestFor: [
        "Brands and campaigns needing a memorable sonic identity",
        "Artists or organizations preparing original releases",
        "Events, pageants, schools, and institutions needing custom music",
        "Content teams that need professional audio direction"
      ],
      services: [
        "Original songs, themes, jingles, and campaign music",
        "Songwriting, arrangement, and music production",
        "Sonic branding and audio identity direction",
        "Vocal production, recording guidance, and creative supervision",
        "Music-led launch and promotional content"
      ],
      outputs: [
        "Creative and music brief",
        "Composition, arrangement, and production files",
        "Final mix and master in agreed formats",
        "Usage-ready campaign or release assets",
        "Rollout recommendations when included in scope"
      ]
    },
    digital: {
      name: "SENZ Digital",
      subtitle: "Websites, systems, and digital experiences",
      lead: "SENZ Digital turns strategy into usable digital platforms, from company websites and campaign pages to web applications, digital tools, and conversion pathways.",
      bestFor: [
        "Businesses and organizations that need a credible online presence",
        "Founders launching a website, portal, or digital product",
        "Teams replacing fragmented manual processes",
        "Campaigns that need a focused digital destination"
      ],
      services: [
        "Website strategy, information architecture, and UX direction",
        "Website and landing-page design and development",
        "Web applications, portals, and digital tools",
        "Forms, lead routing, integrations, and workflow automation",
        "Content structure, conversion planning, and launch support"
      ],
      outputs: [
        "Approved site or product structure",
        "Responsive interface and production-ready build",
        "Configured forms, integrations, or workflows",
        "Content and asset requirements",
        "Handover, deployment, and maintenance options"
      ]
    },
    marketing: {
      name: "SENZ Marketing",
      subtitle: "Campaigns, demand, and measurable growth",
      lead: "SENZ Marketing connects positioning with campaigns that attract attention, create demand, and move the right audience toward a clear action.",
      bestFor: [
        "Brands launching, relaunching, or entering a new market",
        "Businesses that need a coordinated campaign rather than random posting",
        "Organizations promoting an event, offer, advocacy, or initiative",
        "Teams that need clearer marketing priorities and measurement"
      ],
      services: [
        "Marketing strategy and campaign planning",
        "Offer positioning, audience segmentation, and funnel direction",
        "Content marketing and promotional systems",
        "Digital advertising direction and campaign coordination",
        "Launch calendars, channel roles, and performance review"
      ],
      outputs: [
        "Campaign strategy and messaging direction",
        "Channel and content plan",
        "Creative requirements and launch calendar",
        "Lead or conversion pathway",
        "Performance review and next-step recommendations"
      ]
    },
    imaging: {
      name: "SENZ Imaging",
      subtitle: "Photography, video, and visual production",
      lead: "SENZ Imaging creates deliberate visual assets for brands, people, campaigns, events, and organizations, guided by a clear communication purpose.",
      bestFor: [
        "Brands needing a professional visual library",
        "Leaders, founders, artists, and public figures",
        "Campaigns, launches, events, and institutional documentation",
        "Teams needing consistent photography and video direction"
      ],
      services: [
        "Brand, campaign, editorial, and portrait photography",
        "Video production, interviews, event coverage, and short-form content",
        "Creative direction, shot planning, and visual treatment",
        "Post-production, color grading, retouching, and editing",
        "Asset selection and multi-platform delivery"
      ],
      outputs: [
        "Creative treatment and production plan",
        "Shot list, schedule, and visual references",
        "Edited photography or video deliverables",
        "Platform-ready versions in agreed formats",
        "Organized final asset library"
      ]
    },
    kits: {
      name: "SENZ Kits",
      subtitle: "Branded kits, merchandise, and packaged experiences",
      lead: "SENZ Kits transforms a brand into tangible, coordinated materials for onboarding, events, campaigns, gifting, teams, and community programs.",
      bestFor: [
        "Schools, companies, organizations, and event teams",
        "Brands preparing onboarding, media, or launch kits",
        "Programs needing consistent physical and digital materials",
        "Campaigns that need memorable branded touchpoints"
      ],
      services: [
        "Onboarding, media, event, student, and campaign kit design",
        "Merchandise and branded-item direction",
        "Packaging, labels, inserts, and presentation systems",
        "Supplier coordination and production guidance",
        "Digital companion files and kit documentation"
      ],
      outputs: [
        "Kit concept and item architecture",
        "Branded artwork and production specifications",
        "Packaging and presentation direction",
        "Supplier-ready files or coordination plan",
        "Final digital companion assets when included"
      ]
    },
    pr: {
      name: "SENZ Strategic PR",
      subtitle: "Reputation, media, and public influence",
      lead: "SENZ Strategic PR helps leaders, brands, and organizations communicate with credibility, shape public understanding, and prepare for high-visibility moments or reputational risk.",
      bestFor: [
        "Founders, executives, leaders, and public figures",
        "Organizations preparing announcements, launches, or public campaigns",
        "Brands needing stronger media and stakeholder communication",
        "Teams facing sensitive issues, confusion, or reputation risk"
      ],
      services: [
        "Public positioning, narrative, and reputation strategy",
        "Media relations, press materials, and interview preparation",
        "Statements, speeches, talking points, and stakeholder messaging",
        "Issue response, crisis preparation, and narrative-risk review",
        "PR campaign planning and visibility opportunities"
      ],
      outputs: [
        "PR and reputation strategy",
        "Core narrative and approved messaging",
        "Press kit, statements, or media materials",
        "Spokesperson and interview preparation",
        "Response protocols and campaign recommendations"
      ]
    }
  };

  const modal = document.querySelector("#divisionModal");
  if (!modal) return;

  const title = modal.querySelector("[data-division-title]");
  const subtitle = modal.querySelector("[data-division-subtitle]");
  const lead = modal.querySelector("[data-division-lead]");
  const bestFor = modal.querySelector("[data-division-best-for]");
  const services = modal.querySelector("[data-division-services]");
  const outputs = modal.querySelector("[data-division-outputs]");
  const consultButton = modal.querySelector("[data-division-consult]");
  let activeDivision = null;
  let lastFocusedElement = null;

  const fillList = (element, items) => {
    element.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
  };

  const openModal = (key, trigger) => {
    const division = divisions[key];
    if (!division) return;
    activeDivision = division;
    lastFocusedElement = trigger || document.activeElement;
    title.textContent = division.name;
    subtitle.textContent = division.subtitle;
    lead.textContent = division.lead;
    fillList(bestFor, division.bestFor);
    fillList(services, division.services);
    fillList(outputs, division.outputs);
    modal.removeAttribute("inert");
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.setTimeout(() => modal.querySelector("[data-division-close]")?.focus(), 0);
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("inert", "");
    document.body.style.overflow = "";
    lastFocusedElement?.focus?.();
  };

  document.querySelectorAll("[data-division]").forEach((card) => {
    card.addEventListener("click", () => openModal(card.dataset.division, card));
  });

  modal.querySelectorAll("[data-division-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  consultButton?.addEventListener("click", () => {
    const selectedName = activeDivision?.name || "";
    closeModal();
    const consultationModal = document.querySelector("#consultModal");
    const serviceSelect = consultationModal?.querySelector('select[name="service"]');
    if (serviceSelect && selectedName) {
      const option = Array.from(serviceSelect.options).find((item) => item.textContent === selectedName);
      if (option) serviceSelect.value = option.value;
    }
    document.querySelector("[data-consult-open]")?.click();
  });
})();
