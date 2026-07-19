// Cognita Institute — 10-Week Curriculum Data
// Output-based AI academy. Attendance does not earn certification. Outputs do.

export const RUBRIC_CRITERIA = [
  { key: "completeness", label: "Completeness", description: "All required elements are present" },
  { key: "relevance", label: "Relevance to Task", description: "Output addresses the specific task and objectives" },
  { key: "usability", label: "Practical Usability", description: "Output is usable in real-world scenarios" },
  { key: "clarity", label: "Clarity", description: "Output is clear, organized, and well-structured" },
  { key: "judgment", label: "Human Judgment", description: "Shows critical thinking and human oversight" },
  { key: "ethics", label: "Ethical Use of AI", description: "AI is used responsibly and transparently" },
  { key: "reflection", label: "Reflection Quality", description: "Demonstrates meaningful self-reflection" },
];

export const RUBRIC_SCORES = [
  { value: 3, label: "Strong", color: "text-emerald-400" },
  { value: 2, label: "Acceptable", color: "text-cyan-400" },
  { value: 1, label: "Needs Work", color: "text-yellow-400" },
  { value: 0, label: "Missing", color: "text-red-400" },
];

export const PORTFOLIO_CATEGORIES = [
  "Reflection Log",
  "Prompt Library",
  "Research and Verification",
  "Workflow Evidence",
  "Track Output",
  "Capstone",
  "Final Reflection",
];

export const LESSON_STATUSES = [
  "Locked", "Available", "In Progress", "Submitted", "Needs Revision", "Passed", "Failed"
];

export const SUBMISSION_STATUSES = [
  "Not Started", "Submitted", "Needs Revision", "Passed", "Failed"
];

export const CERTIFICATE_STATUSES = [
  "Not Eligible", "In Progress", "Ready for Review", "Approved", "Issued"
];

export const PORTFOLIO_STATUSES = [
  "Incomplete", "In Progress", "Ready for Review", "Approved"
];

export const CURRICULUM = [
  // ═══════════════════════════════════════════════════
  // WEEK 1 — AI Foundation
  // ═══════════════════════════════════════════════════
  {
    week: 1,
    phase: "AI Foundation",
    track: null,
    title: "AI Mindset and Practical Understanding",
    learningObjective: "Understand what AI is, what it is not, how it can support real work, and why human judgment remains essential.",
    lessonOverview: "Students are introduced to artificial intelligence as a practical tool for learning, work, creativity, business, and productivity. The lesson must correct common misconceptions and emphasize responsible use.",
    coreConcepts: [
      "What AI is",
      "What AI is not",
      "AI as a tool, not a replacement for thinking",
      "Human judgment",
      "Responsible AI use",
      "Practical use cases",
      "Risks of blind dependence",
    ],
    practicalActivity: "Ask students to test one AI tool using a simple task related to their real life, school, work, or creative interest.",
    requiredOutput: "Personal AI Use Reflection",
    submissionInstructions: "Submit a written reflection answering:\n\n• What do you currently understand about AI?\n• How can AI help your work, studies, business, or creative process?\n• What should humans still be responsible for?\n• What AI use makes you uncomfortable or cautious?\n• What is one skill you want to improve through Cognita?\n\nMinimum length: 300 words",
    rubric: {
      pass: "Clear reflection, practical understanding, honest self-assessment, and responsible view of AI.",
      needsRevision: "Too vague, too short, copied tone, lacks personal application, or does not answer all guide questions.",
      failed: "No submission, irrelevant submission, fake work, plagiarized work, or refusal to complete task.",
    },
    portfolioCategory: "Reflection Log",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 2 — AI Foundation
  // ═══════════════════════════════════════════════════
  {
    week: 2,
    phase: "AI Foundation",
    track: null,
    title: "Prompt Engineering Fundamentals",
    learningObjective: "Learn how to write clear, structured, and useful prompts that produce better AI outputs.",
    lessonOverview: "Students learn the anatomy of an effective prompt and practice improving weak prompts through context, role, task, constraints, format, and iteration.",
    coreConcepts: [
      "Role prompting",
      "Context",
      "Task clarity",
      "Output format",
      "Tone control",
      "Examples",
      "Constraints",
      "Iteration",
      "Prompt testing",
    ],
    practicalActivity: "Students rewrite weak prompts into stronger prompts and test them using an AI tool.",
    requiredOutput: "Personal Prompt Library",
    submissionInstructions: "Submit 10 tested prompts for your chosen use case.\n\nEach prompt must include:\n• Prompt title\n• Use case\n• Prompt text\n• Expected output\n• Actual result\n• Improvement note",
    rubric: {
      pass: "10 usable prompts, clear structure, specific use cases, tested outputs, and improvement notes.",
      needsRevision: "Prompts are too generic, untested, repetitive, unclear, or missing notes.",
      failed: "Less than 5 prompts, copied prompt list without testing, irrelevant prompts, or no submission.",
    },
    portfolioCategory: "Prompt Library",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 3 — AI Foundation
  // ═══════════════════════════════════════════════════
  {
    week: 3,
    phase: "AI Foundation",
    track: null,
    title: "AI Errors, Hallucinations, and Critical Thinking",
    learningObjective: "Learn how to identify weak AI outputs, hallucinations, bias, unsupported claims, and misleading answers.",
    lessonOverview: "Students are trained to question AI output and apply human judgment. They learn why AI should be reviewed before being used in school, work, business, or public communication.",
    coreConcepts: [
      "AI hallucination",
      "Unsupported claims",
      "Bias",
      "Overconfidence",
      "Source checking",
      "Fact-checking",
      "Human review",
      "Ethical AI use",
    ],
    practicalActivity: "Provide students with a sample AI-generated answer containing errors. Students must identify the errors and correct them.",
    requiredOutput: "AI Error Correction Exercise",
    submissionInstructions: "Submit a document with:\n\n• Original AI error\n• Why it is wrong or weak\n• Corrected version\n• How you verified or improved it\n• What this taught you about AI use\n\nMinimum: 3 errors corrected",
    rubric: {
      pass: "Identifies at least 3 meaningful errors, explains the problem clearly, improves the output, and shows judgment.",
      needsRevision: "Errors identified are too shallow, explanations are unclear, or corrections are unsupported.",
      failed: "No meaningful correction, blind acceptance of AI output, fake verification, or no submission.",
    },
    portfolioCategory: "Research and Verification",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 4 — AI Foundation
  // ═══════════════════════════════════════════════════
  {
    week: 4,
    phase: "AI Foundation",
    track: null,
    title: "Research, Verification, and Digital Organization",
    learningObjective: "Use AI to support research while still verifying information through credible sources and organizing files properly.",
    lessonOverview: "Students learn how to use AI for research assistance without treating AI as the final source of truth. They also learn basic digital organization for school, work, or business use.",
    coreConcepts: [
      "Research questions",
      "Source checking",
      "Basic citations",
      "File organization",
      "Cloud folders",
      "Privacy",
      "Safe AI use",
      "Confidential information",
    ],
    practicalActivity: "Students use AI to help outline a research brief, then verify information using credible sources.",
    requiredOutput: "One-Page Research Brief",
    submissionInstructions: "Submit a one-page research brief with:\n\n• Topic\n• Research question\n• Summary\n• Key findings\n• At least 2 verified sources\n• AI assistance note\n• Personal conclusion",
    rubric: {
      pass: "Clear research question, organized findings, credible sources, and honest AI assistance note.",
      needsRevision: "Sources are missing, weak, unverifiable, or the brief is unclear.",
      failed: "No sources, fake citations, copied AI output, unrelated topic, or no submission.",
    },
    portfolioCategory: "Research and Verification",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 5 — Specialization Track (shared)
  // ═══════════════════════════════════════════════════
  {
    week: 5,
    phase: "Specialization Track",
    track: null,
    title: "Track Setup and Workflow Mapping",
    learningObjective: "Map how the student will use AI in their chosen track and identify where AI can improve their current workflow.",
    lessonOverview: "Students transition from foundation learning into track-specific application. They map their current process and identify where AI can support execution.",
    coreConcepts: [
      "Workflow mapping",
      "Use case selection",
      "Repetitive tasks",
      "Output planning",
      "Tool selection",
      "Human review points",
    ],
    practicalActivity: "Students map their current workflow and identify where AI can support their process.",
    requiredOutput: "Personal AI Workflow Map",
    submissionInstructions: "Submit a workflow map showing:\n\n• Your chosen track\n• Current process\n• Pain points\n• Where AI can help\n• Tools you plan to use\n• Human review checkpoints\n• Expected output after 10 weeks",
    rubric: {
      pass: "Clear workflow, practical AI use, realistic process, and visible human review points.",
      needsRevision: "Workflow is vague, unrealistic, too broad, or lacks connection to the chosen track.",
      failed: "No workflow, unrelated work, copied template without personal use, or no submission.",
    },
    portfolioCategory: "Workflow Evidence",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 6 — AI for Creatives
  // ═══════════════════════════════════════════════════
  {
    week: 6,
    phase: "Specialization Track",
    track: "AI for Creatives",
    title: "Creative Prompting and Concept Development",
    learningObjective: "Use AI to develop stronger creative concepts, campaign ideas, content angles, and brand messages.",
    lessonOverview: "Students learn to use AI for creative ideation — generating concepts, exploring visual directions, and developing content angles that align with brand strategy and audience needs.",
    coreConcepts: [
      "Creative ideation with AI",
      "Concept development",
      "Brand messaging",
      "Visual mood and direction",
      "Content angles",
      "Audience alignment",
    ],
    practicalActivity: "Students use AI to generate and refine creative concepts for a brand, project, or campaign, then apply human judgment to select and improve the best direction.",
    requiredOutput: "Creative Concept Board",
    submissionInstructions: "Submit a creative concept board for a brand, project, advocacy, or personal campaign.\n\nIt must include:\n• Project title\n• Target audience\n• Core message\n• Creative direction\n• Visual mood\n• Content angles\n• AI prompts used\n• Human editing notes",
    rubric: {
      pass: "Clear concept, strong audience fit, usable creative direction, and visible human refinement.",
      needsRevision: "Concept is generic, unclear, cliché, or lacks strategy.",
      failed: "No coherent concept, copied AI output, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 6 — AI for Professionals and VAs
  // ═══════════════════════════════════════════════════
  {
    week: 6,
    phase: "Specialization Track",
    track: "AI for Professionals and Virtual Assistants",
    title: "AI for Communication and Admin Support",
    learningObjective: "Use AI to improve email writing, client communication, summaries, and professional documentation.",
    lessonOverview: "Students learn to leverage AI for professional communication — drafting emails, creating response templates, summarizing meetings, and producing clear documentation with appropriate tone and structure.",
    coreConcepts: [
      "Email drafting with AI",
      "Tone and professionalism",
      "Template creation",
      "Meeting summaries",
      "Client communication",
      "Documentation standards",
    ],
    practicalActivity: "Students create a set of professional communication templates using AI, then refine them with human editing for tone, clarity, and professionalism.",
    requiredOutput: "Professional Communication Template Set",
    submissionInstructions: "Submit a template set with:\n\n• 5 email templates\n• 3 client response templates\n• 2 meeting summary formats\n• AI prompts used\n• Tone guide\n• Human review checklist",
    rubric: {
      pass: "Templates are professional, clear, useful, and ready for real admin or client use.",
      needsRevision: "Templates are generic, too robotic, unclear, or incomplete.",
      failed: "No usable templates, copied output without editing, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 7 — AI for Creatives
  // ═══════════════════════════════════════════════════
  {
    week: 7,
    phase: "Specialization Track",
    track: "AI for Creatives",
    title: "AI-Assisted Content Campaign",
    learningObjective: "Create a practical content campaign using AI for ideation, structure, copy drafts, and planning.",
    lessonOverview: "Students build a multi-piece content campaign using AI at each stage — from ideation and structure to copy drafts and visual direction — while maintaining strategic coherence and brand voice.",
    coreConcepts: [
      "Campaign strategy",
      "Content pillars",
      "Copywriting with AI",
      "Visual direction",
      "Posting sequence",
      "Audience engagement",
    ],
    practicalActivity: "Students create a 5-piece content campaign using AI for ideation and drafts, then refine with human editing for coherence and brand alignment.",
    requiredOutput: "5-Piece Content Campaign",
    submissionInstructions: "Submit a 5-piece content campaign with:\n\n• Campaign objective\n• Audience\n• Main message\n• 5 content pieces\n• Caption drafts\n• Visual direction per piece\n• Posting sequence\n• AI prompts used\n• Editing notes",
    rubric: {
      pass: "Campaign is coherent, audience-aware, strategic, and usable.",
      needsRevision: "Content pieces feel disconnected, generic, weak, or unfinished.",
      failed: "No campaign logic, copied output, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 7 — AI for Professionals and VAs
  // ═══════════════════════════════════════════════════
  {
    week: 7,
    phase: "Specialization Track",
    track: "AI for Professionals and Virtual Assistants",
    title: "Client Onboarding and Task Management",
    learningObjective: "Design an AI-assisted onboarding and task workflow for a client, manager, or team.",
    lessonOverview: "Students learn to build structured onboarding systems using AI — from intake forms and welcome communications to task board setup and follow-up automation.",
    coreConcepts: [
      "Client intake",
      "Onboarding workflows",
      "Task board design",
      "File organization systems",
      "Communication rules",
      "Follow-up automation",
    ],
    practicalActivity: "Students design a complete client onboarding workflow using AI to assist with structure, templates, and process documentation.",
    requiredOutput: "Client Onboarding Workflow",
    submissionInstructions: "Submit a workflow with:\n\n• Client intake form\n• Welcome email\n• Task board structure\n• File organization system\n• Communication rules\n• Follow-up templates\n• AI prompts used",
    rubric: {
      pass: "Workflow is organized, professional, and usable for a real client or team.",
      needsRevision: "Workflow lacks detail, structure, or professional clarity.",
      failed: "No workflow, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 8 — AI for Creatives
  // ═══════════════════════════════════════════════════
  {
    week: 8,
    phase: "Specialization Track",
    track: "AI for Creatives",
    title: "Creative Workflow System",
    learningObjective: "Build a repeatable AI-assisted workflow for content creation, branding, photography, writing, or campaign planning.",
    lessonOverview: "Students transform their ad-hoc AI usage into a systematic, repeatable workflow that can be applied across projects — from input and AI prompting through review, quality check, and final delivery.",
    coreConcepts: [
      "Repeatable systems",
      "Workflow documentation",
      "Quality checklists",
      "Input-output mapping",
      "Review processes",
      "Delivery standards",
    ],
    practicalActivity: "Students document a step-by-step creative workflow that they can reuse across projects, showing where AI supports each stage.",
    requiredOutput: "Repeatable Creative Workflow",
    submissionInstructions: "Submit a step-by-step workflow showing:\n\n• Task type\n• Input needed\n• AI prompts\n• Review process\n• Output format\n• Quality checklist\n• Final delivery format",
    rubric: {
      pass: "Workflow is repeatable, clear, practical, and improves creative production.",
      needsRevision: "Workflow is confusing, incomplete, or not repeatable.",
      failed: "No system, unrelated submission, or no output.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 8 — AI for Professionals and VAs
  // ═══════════════════════════════════════════════════
  {
    week: 8,
    phase: "Specialization Track",
    track: "AI for Professionals and Virtual Assistants",
    title: "SOP Creation and Repeatable Systems",
    learningObjective: "Use AI to create standard operating procedures and repeatable admin systems.",
    lessonOverview: "Students learn to build standard operating procedures (SOPs) using AI — documenting processes, creating step-by-step procedures, and designing quality control systems that make administrative work repeatable and reliable.",
    coreConcepts: [
      "Standard operating procedures",
      "Process documentation",
      "Step-by-step procedures",
      "Quality control",
      "Common mistakes",
      "Output standards",
    ],
    practicalActivity: "Students create a complete SOP for an admin process using AI to assist with structure and documentation, then refine with human review.",
    requiredOutput: "Admin SOP System",
    submissionInstructions: "Submit one SOP system with:\n\n• Process name\n• Purpose\n• Step-by-step procedure\n• Tools needed\n• AI prompts\n• Quality control checklist\n• Common mistakes\n• Final output sample",
    rubric: {
      pass: "SOP is clear, repeatable, complete, and professionally useful.",
      needsRevision: "SOP is too vague, incomplete, or not usable.",
      failed: "No SOP, copied output without review, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 9 — AI for Creatives
  // ═══════════════════════════════════════════════════
  {
    week: 9,
    phase: "Specialization Track",
    track: "AI for Creatives",
    title: "Creative Portfolio Assembly",
    learningObjective: "Select, improve, and present AI-assisted creative work professionally.",
    lessonOverview: "Students compile their best work from the program into a cohesive draft portfolio. They review, refine, and present their outputs with context, process notes, and reflection on their growth.",
    coreConcepts: [
      "Portfolio curation",
      "Output selection",
      "Presentation standards",
      "Process documentation",
      "Growth narrative",
      "Capstone planning",
    ],
    practicalActivity: "Students assemble their draft portfolio, selecting their best foundation and track outputs, and write a capstone plan for Week 10.",
    requiredOutput: "Draft Creative Portfolio",
    submissionInstructions: "Submit a draft portfolio containing:\n\n• Best foundation output\n• Best prompt library samples\n• Creative concept board\n• 5-piece content campaign\n• Creative workflow\n• Capstone plan\n• Reflection note",
    rubric: {
      pass: "Portfolio is organized, presentable, and shows growth.",
      needsRevision: "Portfolio is messy, incomplete, weakly explained, or missing outputs.",
      failed: "No portfolio, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 9 — AI for Professionals and VAs
  // ═══════════════════════════════════════════════════
  {
    week: 9,
    phase: "Specialization Track",
    track: "AI for Professionals and Virtual Assistants",
    title: "Professional Portfolio Assembly",
    learningObjective: "Prepare a portfolio showing practical AI-assisted admin, communication, and workflow skills.",
    lessonOverview: "Students compile their best work from the program into a professional draft portfolio. They review, refine, and present their outputs with context, process notes, and reflection on their growth.",
    coreConcepts: [
      "Portfolio curation",
      "Output selection",
      "Presentation standards",
      "Process documentation",
      "Growth narrative",
      "Capstone planning",
    ],
    practicalActivity: "Students assemble their draft portfolio, selecting their best foundation and track outputs, and write a capstone plan for Week 10.",
    requiredOutput: "Draft Professional AI Portfolio",
    submissionInstructions: "Submit a draft portfolio containing:\n\n• Best foundation output\n• Prompt library samples\n• Communication template set\n• Client onboarding workflow\n• Admin SOP system\n• Capstone plan\n• Reflection note",
    rubric: {
      pass: "Portfolio is professional, organized, and shows practical skill.",
      needsRevision: "Portfolio is incomplete, messy, unclear, or lacks explanation.",
      failed: "No portfolio, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 10 — Capstone: AI for Creatives
  // ═══════════════════════════════════════════════════
  {
    week: 10,
    phase: "Final Review",
    track: "AI for Creatives",
    title: "Capstone, Portfolio Review, and Certification Decision",
    learningObjective: "Complete a final applied AI project and submit a finished portfolio for review.",
    lessonOverview: "Students complete a capstone project based on their track. They must present the final output, explain their process, show prompts used, and demonstrate human judgment. This is the gateway to certification.",
    coreConcepts: [
      "Capstone project execution",
      "Campaign strategy",
      "30-day content planning",
      "AI-assisted creative production",
      "Human judgment and editing",
      "Portfolio finalization",
      "Final reflection",
    ],
    practicalActivity: "Students create a 30-day AI-assisted content campaign for a brand, person, business, advocacy, or creative project, demonstrating all skills learned across the 10-week program.",
    requiredOutput: "Final Capstone Project and Complete Portfolio",
    submissionInstructions: "Create a 30-day AI-assisted content campaign for a brand, person, business, advocacy, or creative project.\n\nMust include:\n• Campaign title\n• Objective\n• Target audience\n• Brand or project context\n• Content pillars\n• 30-day content calendar\n• 5 sample captions\n• 5 visual direction notes\n• AI prompt samples\n• Human editing notes\n• Quality checklist\n• Final reflection\n\nFinal Portfolio Requirements:\n• Reflection Log\n• Prompt Library\n• Research Brief\n• Workflow Map\n• Track Outputs\n• Capstone Project\n• Process Notes\n• Final Reflection",
    rubric: {
      pass: "Capstone is complete, usable, organized, track-relevant, and shows human judgment.",
      needsRevision: "Capstone is incomplete, confusing, generic, or missing required sections.",
      failed: "No capstone, plagiarized work, fake work, harmful content, or major non-compliance.",
    },
    portfolioCategory: "Capstone",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 10 — Capstone: AI for Professionals and VAs
  // ═══════════════════════════════════════════════════
  {
    week: 10,
    phase: "Final Review",
    track: "AI for Professionals and Virtual Assistants",
    title: "Capstone, Portfolio Review, and Certification Decision",
    learningObjective: "Complete a final applied AI project and submit a finished portfolio for review.",
    lessonOverview: "Students complete a capstone project based on their track. They must present the final output, explain their process, show prompts used, and demonstrate human judgment. This is the gateway to certification.",
    coreConcepts: [
      "Capstone project execution",
      "Client support system design",
      "AI-assisted admin workflow",
      "Human judgment and review",
      "Portfolio finalization",
      "Final reflection",
    ],
    practicalActivity: "Students create a simulated AI-assisted client support system, demonstrating all skills learned across the 10-week program.",
    requiredOutput: "Final Capstone Project and Complete Portfolio",
    submissionInstructions: "Create a simulated AI-assisted client support system.\n\nMust include:\n• Client profile\n• Onboarding process\n• Email template set\n• Task board structure\n• SOP document\n• Meeting summary template\n• Follow-up system\n• AI prompt samples\n• Human review checklist\n• Final reflection\n\nFinal Portfolio Requirements:\n• Reflection Log\n• Prompt Library\n• Research Brief\n• Workflow Map\n• Track Outputs\n• Capstone Project\n• Process Notes\n• Final Reflection",
    rubric: {
      pass: "Capstone is complete, usable, organized, track-relevant, and shows human judgment.",
      needsRevision: "Capstone is incomplete, confusing, generic, or missing required sections.",
      failed: "No capstone, plagiarized work, fake work, harmful content, or major non-compliance.",
    },
    portfolioCategory: "Capstone",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 6 — AI for Entrepreneurs
  // ═══════════════════════════════════════════════════
  {
    week: 6,
    phase: "Specialization Track",
    track: "AI for Entrepreneurs",
    title: "AI for Business Ideation and Market Research",
    learningObjective: "Use AI to validate business ideas, research markets, and identify customer needs.",
    lessonOverview: "Students learn to leverage AI for entrepreneurial research — generating business concepts, analyzing market gaps, understanding customer segments, and validating ideas with structured prompts and critical evaluation.",
    coreConcepts: [
      "Business ideation with AI",
      "Market research",
      "Customer segmentation",
      "Competitor analysis",
      "Value proposition design",
      "Idea validation",
    ],
    practicalActivity: "Students use AI to generate and validate 3 business ideas, then select the strongest one based on market research and personal fit.",
    requiredOutput: "Business Idea Validation Report",
    submissionInstructions: "Submit a validation report for your strongest business idea.\n\nMust include:\n• Business concept\n• Problem being solved\n• Target customer\n• Market size estimate\n• Competitor overview\n• Unique value proposition\n• AI prompts used\n• Validation method\n• Human judgment notes",
    rubric: {
      pass: "Report is practical, well-researched, shows real market understanding, and demonstrates human judgment.",
      needsRevision: "Research is shallow, idea is unclear, or market analysis is missing.",
      failed: "No research, copied AI output without analysis, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 7 — AI for Entrepreneurs
  // ═══════════════════════════════════════════════════
  {
    week: 7,
    phase: "Specialization Track",
    track: "AI for Entrepreneurs",
    title: "AI-Assisted Marketing and Brand Building",
    learningObjective: "Build a brand identity and marketing strategy using AI for copy, visuals, and campaign planning.",
    lessonOverview: "Students learn to use AI for brand development — creating brand messaging, marketing copy, content calendars, and growth strategies while maintaining brand authenticity and human oversight.",
    coreConcepts: [
      "Brand messaging with AI",
      "Marketing copy generation",
      "Content calendar creation",
      "Social media strategy",
      "Growth tactics",
      "Brand consistency",
    ],
    practicalActivity: "Students create a brand identity and 30-day marketing plan using AI for ideation and drafts, then refine with human editing.",
    requiredOutput: "Brand and Marketing Plan",
    submissionInstructions: "Submit a brand and marketing plan including:\n\n• Brand name and tagline\n• Brand voice description\n• Target audience\n• 30-day content calendar\n• 5 marketing copy samples\n• Social media strategy\n• Growth tactics\n• AI prompts used\n• Editing notes",
    rubric: {
      pass: "Plan is strategic, brand-consistent, practical, and shows human judgment.",
      needsRevision: "Plan is generic, inconsistent, or lacks strategic thinking.",
      failed: "No plan, copied output without editing, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 8 — AI for Entrepreneurs
  // ═══════════════════════════════════════════════════
  {
    week: 8,
    phase: "Specialization Track",
    track: "AI for Entrepreneurs",
    title: "AI for Operations and Business Systems",
    learningObjective: "Build AI-assisted operational systems for business processes, customer support, and team workflows.",
    lessonOverview: "Students learn to use AI to create operational systems — SOPs, customer support workflows, financial tracking templates, and team communication frameworks that make their business repeatable and scalable.",
    coreConcepts: [
      "Business process automation",
      "SOP creation",
      "Customer support systems",
      "Financial tracking",
      "Team workflows",
      "Quality control",
    ],
    practicalActivity: "Students design an AI-assisted operations system for their business, covering at least 3 core processes.",
    requiredOutput: "Business Operations System",
    submissionInstructions: "Submit an operations system including:\n\n• Business overview\n• 3 core process SOPs\n• Customer support workflow\n• Financial tracking template\n• Team communication framework\n• AI prompts used\n• Quality control checklist\n• Human review notes",
    rubric: {
      pass: "System is practical, repeatable, and immediately usable in a real business.",
      needsRevision: "System is vague, incomplete, or not practical.",
      failed: "No system, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 9 — AI for Entrepreneurs
  // ═══════════════════════════════════════════════════
  {
    week: 9,
    phase: "Specialization Track",
    track: "AI for Entrepreneurs",
    title: "Entrepreneur Portfolio Assembly",
    learningObjective: "Compile a portfolio of AI-assisted business systems, marketing assets, and operational tools.",
    lessonOverview: "Students assemble their best work from the program into a professional entrepreneur portfolio. They review, refine, and present their outputs with context, process notes, and reflection on their growth.",
    coreConcepts: [
      "Portfolio curation",
      "Business asset selection",
      "Presentation standards",
      "Process documentation",
      "Growth narrative",
      "Capstone planning",
    ],
    practicalActivity: "Students assemble their draft entrepreneur portfolio, selecting their best foundation and track outputs, and write a capstone plan for Week 10.",
    requiredOutput: "Draft Entrepreneur Portfolio",
    submissionInstructions: "Submit a draft portfolio containing:\n\n• Best foundation output\n• Business idea validation report\n• Brand and marketing plan\n• Operations system\n• Capstone plan\n• Reflection note",
    rubric: {
      pass: "Portfolio is professional, organized, and shows practical business skill.",
      needsRevision: "Portfolio is incomplete, messy, or lacks explanation.",
      failed: "No portfolio, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 10 — Capstone: AI for Entrepreneurs
  // ═══════════════════════════════════════════════════
  {
    week: 10,
    phase: "Final Review",
    track: "AI for Entrepreneurs",
    title: "Capstone, Portfolio Review, and Certification Decision",
    learningObjective: "Complete a final applied AI project and submit a finished portfolio for review.",
    lessonOverview: "Students complete a capstone project based on their track. They must present the final output, explain their process, show prompts used, and demonstrate human judgment. This is the gateway to certification.",
    coreConcepts: [
      "Capstone project execution",
      "Business plan creation",
      "AI-assisted business building",
      "Human judgment and strategy",
      "Portfolio finalization",
      "Final reflection",
    ],
    practicalActivity: "Students create a complete AI-assisted business launch plan, demonstrating all skills learned across the 10-week program.",
    requiredOutput: "Final Capstone Project and Complete Portfolio",
    submissionInstructions: "Create a complete AI-assisted business launch plan.\n\nMust include:\n• Executive summary\n• Business model\n• Market analysis\n• Brand identity\n• Marketing strategy\n• Operations plan\n• Financial projections\n• AI prompt samples\n• Human strategy notes\n• Final reflection\n\nFinal Portfolio Requirements:\n• Reflection Log\n• Prompt Library\n• Research Brief\n• Workflow Map\n• Track Outputs\n• Capstone Project\n• Process Notes\n• Final Reflection",
    rubric: {
      pass: "Capstone is complete, usable, organized, track-relevant, and shows human judgment.",
      needsRevision: "Capstone is incomplete, confusing, generic, or missing required sections.",
      failed: "No capstone, plagiarized work, fake work, harmful content, or major non-compliance.",
    },
    portfolioCategory: "Capstone",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 6 — AI for Students
  // ═══════════════════════════════════════════════════
  {
    week: 6,
    phase: "Specialization Track",
    track: "AI for Students",
    title: "AI for Academic Research and Study",
    learningObjective: "Use AI responsibly for academic research, study aids, and learning enhancement.",
    lessonOverview: "Students learn to use AI as a study companion — generating study guides, creating flashcards, summarizing readings, and developing research outlines while maintaining academic integrity and proper citation practices.",
    coreConcepts: [
      "AI-assisted research",
      "Study guide creation",
      "Reading comprehension",
      "Note-taking with AI",
      "Academic integrity",
      "Citation practices",
    ],
    practicalActivity: "Students use AI to create a comprehensive study guide for a real subject they are currently studying.",
    requiredOutput: "AI-Assisted Study Guide",
    submissionInstructions: "Submit a study guide for a real academic subject.\n\nMust include:\n• Subject and topic\n• Learning objectives\n• Key concepts summary\n• Study questions (10+)\n• Flashcard set (15+)\n• Memory aids\n• AI prompts used\n• Academic integrity notes\n• How you verified AI output",
    rubric: {
      pass: "Study guide is comprehensive, accurate, well-organized, and maintains academic integrity.",
      needsRevision: "Guide is shallow, inaccurate, or lacks academic integrity practices.",
      failed: "No guide, copied AI output without verification, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 7 — AI for Students
  // ═══════════════════════════════════════════════════
  {
    week: 7,
    phase: "Specialization Track",
    track: "AI for Students",
    title: "AI for Academic Writing and Critical Analysis",
    learningObjective: "Use AI to improve academic writing, develop arguments, and strengthen critical thinking.",
    lessonOverview: "Students learn to use AI for academic writing support — outlining essays, developing thesis statements, checking logic, and improving clarity while maintaining original thought and proper attribution.",
    coreConcepts: [
      "Essay outlining with AI",
      "Thesis development",
      "Argument analysis",
      "Logic checking",
      "Writing improvement",
      "Academic attribution",
    ],
    practicalActivity: "Students use AI to help outline and draft an academic essay, then refine it with human judgment and original analysis.",
    requiredOutput: "Academic Essay with AI Process Notes",
    submissionInstructions: "Submit an academic essay (minimum 800 words) with process notes.\n\nMust include:\n• Essay topic and thesis\n• Full essay with introduction, body, conclusion\n• Annotated bibliography (3+ sources)\n• AI process notes (how AI was used)\n• Original analysis sections\n• Editing log\n• Academic integrity statement",
    rubric: {
      pass: "Essay is well-structured, shows original thinking, uses AI as a tool not a replacement, and maintains academic integrity.",
      needsRevision: "Essay is generic, lacks original thought, or has weak structure.",
      failed: "Plagiarized work, no original analysis, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 8 — AI for Students
  // ═══════════════════════════════════════════════════
  {
    week: 8,
    phase: "Specialization Track",
    track: "AI for Students",
    title: "AI for Learning Systems and Exam Preparation",
    learningObjective: "Build AI-assisted learning systems for exam preparation, knowledge retention, and skill mastery.",
    lessonOverview: "Students learn to create systematic AI-assisted learning workflows — spaced repetition systems, practice test generators, concept maps, and review schedules that improve long-term retention and exam performance.",
    coreConcepts: [
      "Spaced repetition systems",
      "Practice test generation",
      "Concept mapping",
      "Review scheduling",
      "Knowledge retention",
      "Active recall techniques",
    ],
    practicalActivity: "Students build a complete AI-assisted exam preparation system for a real subject.",
    requiredOutput: "AI-Assisted Exam Preparation System",
    submissionInstructions: "Submit an exam preparation system including:\n\n• Subject and exam type\n• Study schedule (2-week plan)\n• Practice test (20+ questions)\n• Concept map\n• Flashcard set (20+)\n• Review notes\n• AI prompts used\n• Active recall techniques\n• Performance tracking method",
    rubric: {
      pass: "System is comprehensive, practical, and immediately usable for real exam preparation.",
      needsRevision: "System is incomplete, disorganized, or not practical.",
      failed: "No system, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 9 — AI for Students
  // ═══════════════════════════════════════════════════
  {
    week: 9,
    phase: "Specialization Track",
    track: "AI for Students",
    title: "Student Portfolio Assembly",
    learningObjective: "Compile a portfolio of AI-assisted academic work showing research, writing, and learning systems.",
    lessonOverview: "Students assemble their best work from the program into a professional academic portfolio. They review, refine, and present their outputs with context, process notes, and reflection on their growth as AI-literate learners.",
    coreConcepts: [
      "Portfolio curation",
      "Academic output selection",
      "Presentation standards",
      "Process documentation",
      "Growth narrative",
      "Capstone planning",
    ],
    practicalActivity: "Students assemble their draft academic portfolio, selecting their best foundation and track outputs, and write a capstone plan for Week 10.",
    requiredOutput: "Draft Academic Portfolio",
    submissionInstructions: "Submit a draft portfolio containing:\n\n• Best foundation output\n• AI-assisted study guide\n• Academic essay with process notes\n• Exam preparation system\n• Capstone plan\n• Reflection note",
    rubric: {
      pass: "Portfolio is organized, academic, and shows growth in AI literacy.",
      needsRevision: "Portfolio is messy, incomplete, or lacks reflection.",
      failed: "No portfolio, unrelated work, or no submission.",
    },
    portfolioCategory: "Track Output",
  },

  // ═══════════════════════════════════════════════════
  // WEEK 10 — Capstone: AI for Students
  // ═══════════════════════════════════════════════════
  {
    week: 10,
    phase: "Final Review",
    track: "AI for Students",
    title: "Capstone, Portfolio Review, and Certification Decision",
    learningObjective: "Complete a final applied AI project and submit a finished portfolio for review.",
    lessonOverview: "Students complete a capstone project based on their track. They must present the final output, explain their process, show prompts used, and demonstrate human judgment. This is the gateway to certification.",
    coreConcepts: [
      "Capstone project execution",
      "Research project design",
      "AI-assisted learning demonstration",
      "Human judgment and analysis",
      "Portfolio finalization",
      "Final reflection",
    ],
    practicalActivity: "Students create a complete AI-assisted research project, demonstrating all skills learned across the 10-week program.",
    requiredOutput: "Final Capstone Project and Complete Portfolio",
    submissionInstructions: "Create a complete AI-assisted research project.\n\nMust include:\n• Research question\n• Literature review\n• Methodology\n• Data analysis\n• Findings and discussion\n• AI usage documentation\n• Verification of AI output\n• Reflection on AI as a learning tool\n• Final reflection\n\nFinal Portfolio Requirements:\n• Reflection Log\n• Prompt Library\n• Research Brief\n• Workflow Map\n• Track Outputs\n• Capstone Project\n• Process Notes\n• Final Reflection",
    rubric: {
      pass: "Capstone is complete, well-researched, academically rigorous, and shows human judgment.",
      needsRevision: "Capstone is incomplete, lacks rigor, or missing required sections.",
      failed: "No capstone, plagiarized work, fake work, or no submission.",
    },
    portfolioCategory: "Capstone",
  },
];

export const ACTIVE_TRACKS = [
  "AI for Creatives",
  "AI for Professionals and Virtual Assistants",
  "AI for Entrepreneurs",
  "AI for Students",
];

export const TRACKS = [
  "AI for Creatives",
  "AI for Professionals and Virtual Assistants",
  "AI for Entrepreneurs",
  "AI for Students"
];

export const TRACK_DETAILS = [
  {
    name: "AI for Creatives",
    description: "Master AI tools for creative work — design, content creation, visual storytelling, and creative workflows.",
    focusAreas: ["AI-assisted design", "Content generation", "Visual storytelling", "Creative automation"],
    targetProfile: "Designers, writers, content creators, artists, and creative professionals",
    comingSoon: false,
  },
  {
    name: "AI for Professionals and Virtual Assistants",
    description: "Build AI-powered productivity systems for professional work, client management, and virtual assistance.",
    focusAreas: ["Workflow automation", "Client communication", "Document processing", "Task management"],
    targetProfile: "Virtual assistants, administrative professionals, project managers, and office workers",
    comingSoon: false,
  },
  {
    name: "AI for Entrepreneurs",
    description: "Leverage AI to build, grow, and scale your business — from ideation to operations to marketing.",
    focusAreas: ["Business strategy", "Market research", "Operations automation", "Growth systems"],
    targetProfile: "Founders, business owners, solo entrepreneurs, and startup teams",
    comingSoon: false,
  },
  {
    name: "AI for Students",
    description: "Develop AI literacy and research skills for academic excellence and future career readiness.",
    focusAreas: ["Research methods", "Study automation", "Academic writing", "Critical thinking"],
    targetProfile: "University students, researchers, and lifelong learners",
    comingSoon: false,
  },
];

export const FAQ_DATA = [
  {
    q: "What is Cognita Institute?",
    a: "Cognita is a selective AI academy that trains students through a structured 10-week program. We don't sell courses — we accept students into a competency-based learning system where every certificate is earned through verified outputs."
  },
  {
    q: "How is Cognita different from other AI courses?",
    a: "Most AI academies sell access. Cognita requires application, acceptance, and completion of real outputs reviewed by facilitators. Certificates are issued only after all requirements are met and reviewed — never automatically."
  },
  {
    q: "How do I apply?",
    a: "Submit an application through our website. Our admissions team reviews every application individually. You'll be notified whether you're accepted, waitlisted, or if we need more information."
  },
  {
    q: "What happens after I'm accepted?",
    a: "You'll receive enrollment instructions and be assigned to a batch and specialization track. Your 10-week program begins on your batch's start date. Only enrolled students can access the learning dashboard."
  },
  {
    q: "Can I choose my specialization track?",
    a: "You indicate your preferred track during application. Final track assignment considers your background, goals, and available spots. We currently offer two active tracks: AI for Creatives, and AI for Professionals & VAs. Additional tracks are coming soon."
  },
  {
    q: "What if I fail a weekly output?",
    a: "Your facilitator will provide detailed feedback and revision instructions. You'll have the opportunity to resubmit. Persistent failures may affect your progress status and certificate eligibility."
  },
  {
    q: "How are certificates issued?",
    a: "Certificates are issued manually by admin after confirming all 10 weekly outputs are submitted and passed, including the final capstone. There is no automatic certification. Every certificate must mean something."
  },
  {
    q: "Can employers verify my certificate?",
    a: "Yes. Every certificate has a unique serial number that can be verified on our public verification page. The verification confirms the student's name, track, batch, and completion date."
  },
  {
    q: "What is the time commitment?",
    a: "Plan for 8-12 hours per week including lesson review, output creation, and revisions. The program runs for 10 consecutive weeks with no breaks."
  },
  {
    q: "Is there a refund policy?",
    a: "Due to the selective nature of admissions and limited batch sizes, refunds are handled on a case-by-case basis. Contact us before your batch starts if you need to defer."
  }
];