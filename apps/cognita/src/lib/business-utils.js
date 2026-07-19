// Cognita Business Utilities
// Payment, invoice, receipt, certificate serial generation, discount calculation

export const DEFAULT_TUITION_FEE = 15000;

export const TRACK_CODES = {
  "AI for Creatives": "CRE",
  "AI for Professionals and Virtual Assistants": "PVA",
  "AI for Entrepreneurs": "ENT",
  "AI for Students": "STU",
};

export const DISCOUNT_TYPES = [
  "None",
  "Future Educator 50% Discount",
  "Early Applicant Discount",
  "Partner Institution Discount",
  "Scholarship",
  "Manual Discount",
  "Waived",
];

export const PAYMENT_STATUSES = [
  "Not Required Yet",
  "Payment Pending",
  "Payment Submitted",
  "Payment Confirmed",
  "Payment Failed",
  "Payment Waived",
  "Refund Requested",
  "Refunded",
  "Balance Due",
];

export const PAYMENT_METHODS = [
  "Bank Transfer",
  "GCash",
  "Maya",
  "Cash",
  "Check",
  "Other",
];

export const REFUND_STATUSES = [
  "Not Requested",
  "Requested",
  "Approved",
  "Rejected",
  "Processed",
];

export const PARTNER_TYPES = [
  "School",
  "College/University",
  "LGU",
  "Youth Organization",
  "NGO",
  "Company",
  "Training Center",
  "Creative Organization",
  "Other",
];

export const PARTNER_PROGRAMS = [
  "Open Learning Group Access",
  "10-Week Professional AI Program",
  "Educator AI Development Program",
  "Student AI Development Program",
  "Workforce AI Productivity Training",
  "Creative AI Professional Training",
  "Virtual Assistant AI Professional Training",
  "Assessment and Credentialing Service",
  "Custom Institutional Training Program",
];

export const PARTNER_INQUIRY_STATUSES = [
  "New",
  "Contacted",
  "Meeting Scheduled",
  "Proposal Sent",
  "Approved",
  "Rejected",
  "Archived",
];

export const LEAD_TYPES = [
  "Join Waitlist",
  "Request Brochure",
  "Book Orientation",
  "Partner Inquiry",
  "Ask a Question",
];

export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Converted",
  "Not Qualified",
  "Archived",
];

export const WAITLIST_STATUSES = [
  "New",
  "Invited to Apply",
  "Applied",
  "Accepted",
  "Not Interested",
  "Archived",
];

export const ALL_TRACKS = [
  "AI for Creatives",
  "AI for Professionals and Virtual Assistants",
  "AI for Entrepreneurs",
  "AI for Students",
  "Not Sure Yet",
];

export function getTrackCode(track) {
  return TRACK_CODES[track] || "GEN";
}

export function calculateDiscount(tuitionFee, discountType) {
  if (!tuitionFee || !discountType || discountType === "None") return 0;
  if (discountType === "Waived") return tuitionFee;
  if (discountType === "Future Educator 50% Discount") return tuitionFee * 0.5;
  if (discountType === "Early Applicant Discount") return tuitionFee * 0.15;
  if (discountType === "Partner Institution Discount") return tuitionFee * 0.2;
  if (discountType === "Scholarship") return tuitionFee;
  return 0;
}

export function calculateAmountDue(tuitionFee, discountAmount) {
  return Math.max(0, (tuitionFee || 0) - (discountAmount || 0));
}

export function generateCertificateSerial(year, batchCode, trackCode, sequence) {
  const seq = String(sequence).padStart(4, "0");
  const bc = batchCode || "B000";
  return `COG-CERT-${year}-${bc}-${trackCode}-${seq}`;
}

export function generateInvoiceNumber(year, batchCode, sequence) {
  const seq = String(sequence).padStart(4, "0");
  const bc = batchCode || "B000";
  return `COG-INV-${year}-${bc}-${seq}`;
}

export function generateReceiptNumber(year, batchCode, sequence) {
  const seq = String(sequence).padStart(4, "0");
  const bc = batchCode || "B000";
  return `COG-RCPT-${year}-${bc}-${seq}`;
}

export function getNextSequence(items, prefix, year, batchCode) {
  let max = 0;
  for (const item of items) {
    const num = item[prefix === "COG-CERT" ? "serial_number" : prefix === "COG-INV" ? "invoice_number" : "receipt_number"];
    if (!num) continue;
    const parts = num.split("-");
    if (parts.length < 5) continue;
    if (parts[2] !== String(year)) continue;
    if (parts[3] !== batchCode) continue;
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seq) && seq > max) max = seq;
  }
  return max + 1;
}

export function getVerificationUrl(serialNumber) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify?serial=${encodeURIComponent(serialNumber)}`;
}

export function getQrCodeUrl(data, size = 200) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "₱0";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(amount);
}
