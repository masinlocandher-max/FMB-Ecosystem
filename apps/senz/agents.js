const agents = [
  {
    id: "strategy-lead",
    name: "Strategy Lead",
    label: "Brand Direction Agent",
    focus: "Positioning, messaging, perception, and executive clarity.",
    priority: 10,
    keywords: ["brand", "strategy", "position", "message", "clarity", "reputation", "perception"]
  },
  {
    id: "pr-lead",
    name: "PR Lead",
    label: "Public Relations Agent",
    focus: "Media presence, credibility, public image, campaigns, and announcements.",
    priority: 20,
    keywords: ["pr", "public", "media", "press", "launch", "credibility", "influence", "politician", "public figure"]
  },
  {
    id: "creative-producer",
    name: "Creative Producer",
    label: "Creative Production Agent",
    focus: "Premium visuals, campaign direction, content systems, and motion-led storytelling.",
    priority: 30,
    keywords: ["creative", "photo", "video", "visual", "content", "shoot", "portfolio", "campaign"]
  },
  {
    id: "digital-products",
    name: "Digital Product Architect",
    label: "Digital Products Agent",
    focus: "Music, clone studio, voting, tabulation, ticketing, and AI assistant platforms.",
    priority: 40,
    keywords: ["digital", "platform", "app", "ai", "assistant", "clone", "music"]
  },
  {
    id: "events-systems",
    name: "Events Systems Lead",
    label: "Events Platform Agent",
    focus: "Event voting, tabulation, pageant operations, ticketing, and live dashboards.",
    priority: 50,
    keywords: ["event", "events", "pageant", "beauty", "queen", "king", "voting", "tabulation", "ticket"]
  },
  {
    id: "founder-office",
    name: "Founder Office",
    label: "Founder Review Agent",
    focus: "High-priority partnerships, leadership visibility, and sensitive reputation work.",
    priority: 60,
    keywords: ["founder", "urgent", "partnership", "leadership", "confidential", "vip"]
  }
];

function scoreAgent(agent, text) {
  return agent.keywords.reduce((score, keyword) => {
    return text.includes(keyword) ? score + 1 : score;
  }, 0);
}

function recommendAgent(inquiry) {
  const text = [
    inquiry.projectType,
    inquiry.message,
    inquiry.brand,
    inquiry.timeline,
    inquiry.budget
  ]
    .join(" ")
    .toLowerCase();

  const ranked = agents
    .map((agent) => ({ ...agent, score: scoreAgent(agent, text) }))
    .sort((a, b) => b.score - a.score || b.priority - a.priority);

  return ranked[0].score > 0 ? ranked[0] : agents[0];
}

module.exports = {
  agents,
  recommendAgent
};
