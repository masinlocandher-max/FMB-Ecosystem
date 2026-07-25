export const EDITORIAL_FALLBACK = `${import.meta.env.BASE_URL}images/cognita-editorial-fallback.svg`;

export const EDITORIAL_ASSETS = {
  hero: "https://images.pexels.com/photos/34046709/pexels-photo-34046709.jpeg?auto=compress&cs=tinysrgb&w=1800",
  openLearning: "https://images.pexels.com/photos/34046709/pexels-photo-34046709.jpeg?auto=compress&cs=tinysrgb&w=1400",
  professionalPrograms: "https://images.pexels.com/photos/19895774/pexels-photo-19895774.jpeg?auto=compress&cs=tinysrgb&w=1400",
  assessmentCredentialing: "https://images.pexels.com/photos/7983552/pexels-photo-7983552.jpeg?auto=compress&cs=tinysrgb&w=1400",
  institutionalTraining: "https://images.pexels.com/photos/34774357/pexels-photo-34774357.jpeg?auto=compress&cs=tinysrgb&w=1400",
};

export const PROGRAM_PORTFOLIO = [
  {
    id: "open-learning",
    name: "Cognita Open Learning",
    shortName: "Open Learning",
    eyebrow: "Self-paced learning",
    description:
      "Flexible AI learning for people who need structured lessons without a fixed cohort schedule.",
    explanation:
      "Open Learning is Cognita's scalable, self-paced pathway. Learners move through curated lessons and practical exercises independently. Facilitator review and formal credentialing are separate services unless explicitly included in a course package.",
    audience: "Independent learners, career shifters, educators, and professionals building foundational AI confidence.",
    includes: [
      "Self-paced lessons and guided learning paths",
      "Practical exercises and downloadable resources",
      "Access to the Learning Resource Center",
      "Optional assessment and credentialing pathway",
    ],
    actionLabel: "Join the Open Learning waitlist",
    actionPath: "/waitlist",
    availability: "Phased launch",
    icon: "open-learning",
    image: EDITORIAL_ASSETS.openLearning,
    imageAlt: "Editorial stock photograph of adults participating in a laptop-based professional learning workshop.",
  },
  {
    id: "professional-programs",
    name: "Cognita Professional Programs",
    shortName: "Professional Programs",
    eyebrow: "Guided cohort training",
    description:
      "Instructor-guided professional development with structured schedules, outputs, feedback, and completion standards.",
    explanation:
      "Professional Programs is the home of Cognita's high-touch, facilitator-led training. The flagship offering is the 10-Week Professional AI Program, delivered through a fixed cohort with weekly outputs, human review, revisions, portfolio development, and final completion approval.",
    audience: "Learners who want accountability, guided practice, facilitator feedback, and a professional portfolio.",
    includes: [
      "Fixed cohort and structured 10-week schedule",
      "Weekly practical outputs and progressive access",
      "Human facilitator review and revision guidance",
      "Portfolio development and certificate review",
    ],
    actionLabel: "Apply to the 10-week program",
    actionPath: "/apply",
    availability: "Flagship program",
    icon: "professional-programs",
    image: EDITORIAL_ASSETS.professionalPrograms,
    imageAlt: "Editorial stock photograph of adult learners discussing a technical project around laptops.",
  },
  {
    id: "assessment-credentialing",
    name: "Cognita Assessment and Credentialing",
    shortName: "Assessment and Credentialing",
    eyebrow: "Evidence-based verification",
    description:
      "Independent review of submitted work, demonstrated competence, and completion evidence.",
    explanation:
      "This division separates learning access from formal evaluation. Learners may submit eligible work for portfolio assessment, skills verification, and completion review. Credentials are issued only when published requirements are satisfied and the evidence has been reviewed.",
    audience: "Self-paced learners, professionals with existing work, and graduates requiring formal verification.",
    includes: [
      "Portfolio and output review",
      "Competency-based assessment",
      "Verified training and completion records",
      "Certificate verification through Cognita records",
    ],
    actionLabel: "View credential verification",
    actionPath: "/verify",
    availability: "Review-based service",
    icon: "assessment-credentialing",
    image: EDITORIAL_ASSETS.assessmentCredentialing,
    imageAlt: "Editorial stock photograph of adults receiving guided support during a computer learning session.",
  },
  {
    id: "institutional-training",
    name: "Cognita Institutional Training",
    shortName: "Institutional Training",
    eyebrow: "Programs for organizations",
    description:
      "Group AI training and customized learning delivery for institutions and professional teams.",
    explanation:
      "Institutional Training is designed for schools, companies, NGOs, LGUs, and other organizations. Programs may use Cognita's existing curriculum or a scoped training plan based on the organization's audience, schedule, capability goals, and reporting needs.",
    audience: "Schools, businesses, government offices, NGOs, associations, and workforce-development partners.",
    includes: [
      "Group enrollment and coordinated onboarding",
      "Customized schedule and delivery format",
      "Institution-specific learning objectives",
      "Completion reporting and optional credentialing",
    ],
    actionLabel: "Discuss institutional training",
    actionPath: "/partner",
    availability: "By consultation",
    icon: "institutional-training",
    image: EDITORIAL_ASSETS.institutionalTraining,
    imageAlt: "Editorial stock photograph of a professional concentrating on laptop-based training in a shared learning space.",
  },
];

export const FLAGSHIP_PROGRAM = {
  name: "10-Week Professional AI Program",
  parent: "Cognita Professional Programs",
  description:
    "A guided cohort program combining AI foundations, specialization, weekly practical outputs, facilitator review, portfolio development, and a final completion decision.",
};
