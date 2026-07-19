// Cognita Curriculum Utilities
// Week unlock logic, status computation, certificate eligibility, portfolio tracking

import { CURRICULUM } from "./curriculum";

/**
 * Get curriculum weeks for a specific track.
 * Foundation weeks (1-5) are shared; weeks 6-10 are track-specific.
 */
export function getCurriculumForTrack(track) {
  return CURRICULUM.filter(w => !w.track || w.track === track).sort((a, b) => a.week - b.week);
}

/**
 * Get a specific week's lesson for a track.
 */
export function getWeekLesson(weekNumber, track) {
  return CURRICULUM.find(w => w.week === weekNumber && (!w.track || w.track === track));
}

/**
 * Check if a submission counts as "has been submitted" (not just "Not Started").
 */
export function hasBeenSubmitted(submission) {
  return submission && ["Submitted", "Needs Revision", "Passed"].includes(submission.status);
}

/**
 * Check if a submission has been passed.
 */
export function hasPassed(submission) {
  return submission && submission.status === "Passed";
}

/**
 * Progressive week unlock logic.
 * - Week 1 is always unlocked (after enrollment).
 * - Week 2 unlocks after Week 1 is submitted.
 * - Weeks 3 and 4 unlock sequentially (previous week submitted).
 * - Week 5 unlocks after all foundation outputs (Weeks 1-4) are submitted.
 * - Weeks 6-9 unlock sequentially (previous week submitted).
 * - Week 10 unlocks after Weeks 1-9 are all submitted.
 */
export function isWeekUnlocked(weekNumber, submissions) {
  if (weekNumber === 1) return true;

  if (weekNumber <= 4) {
    const prevSub = submissions.find(s => s.week_number === weekNumber - 1);
    return hasBeenSubmitted(prevSub);
  }

  if (weekNumber === 5) {
    return [1, 2, 3, 4].every(w =>
      hasBeenSubmitted(submissions.find(s => s.week_number === w))
    );
  }

  if (weekNumber <= 9) {
    const prevSub = submissions.find(s => s.week_number === weekNumber - 1);
    return hasBeenSubmitted(prevSub);
  }

  if (weekNumber === 10) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9].every(w =>
      hasBeenSubmitted(submissions.find(s => s.week_number === w))
    );
  }

  return false;
}

/**
 * Compute the lesson status for a week.
 * Returns one of: Locked, Available, In Progress, Submitted, Needs Revision, Passed, Failed
 */
export function getWeekStatus(weekNumber, submissions) {
  const submission = submissions.find(s => s.week_number === weekNumber);

  if (submission) {
    if (submission.status === "Passed") return "Passed";
    if (submission.status === "Submitted") return "Submitted";
    if (submission.status === "Needs Revision") return "Needs Revision";
    if (submission.status === "Failed") return "Failed";
  }

  if (!isWeekUnlocked(weekNumber, submissions)) {
    return "Locked";
  }

  // Has content but not submitted yet = In Progress
  if (submission && submission.content && submission.status === "Not Started") {
    return "In Progress";
  }

  return "Available";
}

/**
 * Compute certificate eligibility based on submissions.
 * Returns one of: Not Eligible, In Progress, Ready for Review
 * (Approved and Issued are set by admin on the Student entity.)
 */
export function computeCertificateEligibility(submissions) {
  const passedCount = submissions.filter(s => s.status === "Passed").length;
  const capstoneSub = submissions.find(s => s.week_number === 10);
  const capstonePassed = capstoneSub?.status === "Passed";

  const hasFailed = submissions.some(s => s.status === "Failed");
  const hasNeedsRevision = submissions.some(s => s.status === "Needs Revision");
  const hasMissing = passedCount < 10;

  if (!hasFailed && !hasNeedsRevision && !hasMissing && capstonePassed) {
    return "Ready for Review";
  }

  if (passedCount > 0 || submissions.some(s => s.status !== "Not Started")) {
    return "In Progress";
  }

  return "Not Eligible";
}

/**
 * Compute the effective certificate status for a student.
 * If admin has set Approved or Issued, use that; otherwise compute from submissions.
 */
export function getEffectiveCertificateStatus(student, submissions) {
  if (student.certificate_status === "Issued") return "Issued";
  if (student.certificate_status === "Approved") return "Approved";
  return computeCertificateEligibility(submissions);
}

/**
 * Compute portfolio status based on passed submissions.
 */
export function computePortfolioStatus(submissions) {
  const portfolioItems = submissions.filter(s => s.is_portfolio_item && s.status === "Passed");
  const passedCount = submissions.filter(s => s.status === "Passed").length;

  if (portfolioItems.length === 0) return "Incomplete";
  if (passedCount >= 10) return "Ready for Review";
  return "In Progress";
}

/**
 * Get portfolio items grouped by category.
 */
export function getPortfolioByCategory(submissions) {
  const items = submissions.filter(s => s.is_portfolio_item && s.status === "Passed");
  const grouped = {};
  for (const item of items) {
    const cat = item.portfolio_category || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  return grouped;
}

/**
 * Get the recommended review decision based on rubric scores.
 */
export function getRubricRecommendation(scores) {
  if (!scores || Object.keys(scores).length === 0) return null;

  const values = Object.values(scores);
  const hasZero = values.some(v => v === 0);
  const hasOne = values.some(v => v === 1);

  if (hasZero) return "Failed";
  if (hasOne) return "Needs Revision";
  return "Passed";
}

/**
 * Compute student updates needed after a review (certificate_status, current_week).
 * The caller performs the actual database update.
 */
export function computeStudentUpdates(student, submissions) {
  const updates = {};

  // Update certificate status (only if not already Approved/Issued by admin)
  if (student.certificate_status !== "Approved" && student.certificate_status !== "Issued") {
    const newCertStatus = computeCertificateEligibility(submissions);
    if (newCertStatus !== student.certificate_status) {
      updates.certificate_status = newCertStatus;
    }
  }

  // Update current_week to the highest unlocked week
  let maxUnlocked = 1;
  for (let w = 1; w <= 10; w++) {
    if (isWeekUnlocked(w, submissions)) maxUnlocked = w;
  }
  if (maxUnlocked !== student.current_week) {
    updates.current_week = maxUnlocked;
  }

  return updates;
}

/**
 * Merge a Lesson entity override with static curriculum data.
 * Override fields take precedence when non-null/non-empty.
 */
export function mergeLessonOverride(staticLesson, override) {
  if (!override) return staticLesson;
  return {
    ...staticLesson,
    title: override.title || staticLesson.title,
    learningObjective: override.learning_objective || staticLesson.learningObjective,
    lessonOverview: override.lesson_overview || staticLesson.lessonOverview,
    requiredOutput: override.required_output || staticLesson.requiredOutput,
    submissionInstructions: override.submission_instructions || staticLesson.submissionInstructions,
    rubric: {
      pass: override.rubric_pass || staticLesson.rubric.pass,
      needsRevision: override.rubric_needs_revision || staticLesson.rubric.needsRevision,
      failed: override.rubric_failed || staticLesson.rubric.failed,
    },
    isLocked: override.is_locked ?? false,
  };
}

/**
 * Get all requirements for certificate eligibility for display.
 */
export function getCertificateRequirements(submissions) {
  const passed = submissions.filter(s => s.status === "Passed");
  const submitted = submissions.filter(s => s.status !== "Not Started");
  const capstoneSub = submissions.find(s => s.week_number === 10);
  const portfolioItems = submissions.filter(s => s.is_portfolio_item && s.status === "Passed");

  return [
    { label: "All outputs submitted", done: submitted.length === 10, value: `${submitted.length}/10` },
    { label: "All outputs passed", done: passed.length === 10, value: `${passed.length}/10` },
    { label: "Capstone passed", done: capstoneSub?.status === "Passed", value: capstoneSub?.status === "Passed" ? "Yes" : "No" },
    { label: "Portfolio complete", done: portfolioItems.length >= 7, value: `${portfolioItems.length}/7` },
  ];
}