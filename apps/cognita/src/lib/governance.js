export const OFFICIAL_DOMAIN = "https://thecognitainstitute.com";

export const TEMPORARY_MANUAL_EMAIL = "info@thecognitainstitute.com";

export const OFFICIAL_EMAILS = {
  support: TEMPORARY_MANUAL_EMAIL,
  admissions: TEMPORARY_MANUAL_EMAIL,
  registrar: TEMPORARY_MANUAL_EMAIL,
  privacy: TEMPORARY_MANUAL_EMAIL,
  partnerships: TEMPORARY_MANUAL_EMAIL,
};

export const POLICY_VERSIONS = {
  terms: "2026-07-v1",
  privacy: "2026-07-v1",
  enrollmentAgreement: "2026-07-v1",
  portfolioStandard: "2026-07-v1",
};

export const OFFICIAL_CREDENTIAL_TITLE = "Certificate of Completion";

export const HUMAN_REVIEW_NOTICE =
  "Only an authorized human reviewer may require revisions, confirm that the Cognita Standard has been met, approve a portfolio, or authorize credential issuance.";

export function createOperationalReference(prefix = "COG") {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${randomPart}`;
}

export function createConsentPayload({ context, email, userId = "", userAgent = "" }) {
  return {
    context,
    email,
    user_id: userId,
    terms_version: POLICY_VERSIONS.terms,
    privacy_version: POLICY_VERSIONS.privacy,
    accepted_at: new Date().toISOString(),
    user_agent: userAgent,
  };
}
