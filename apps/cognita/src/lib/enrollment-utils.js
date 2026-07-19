// Cognita Enrollment Utilities
// Shared enrollment logic: auto-create payment + invoice when enrolling a student

import {
  DEFAULT_TUITION_FEE,
  calculateDiscount,
  calculateAmountDue,
  generateInvoiceNumber,
  getNextSequence,
} from "./business-utils";

/**
 * Enroll a student from an accepted application.
 * Creates Student record + Payment record + Invoice record in one flow.
 * Returns the created student record.
 */
export async function enrollStudent(base44, application, enrollForm, batches, facilitators, existingInvoices) {
  const batch = batches.find(b => b.id === enrollForm.batch_id);
  const batchName = batch?.name || "Unknown";
  const batchCode = batch?.batch_code || "B000";
  const track = enrollForm.track || application.preferred_track;
  const year = new Date().getFullYear();

  // 1. Create Student record
  const student = await base44.entities.Student.create({
    application_id: application.id,
    full_name: application.full_name,
    email: application.email,
    batch_id: enrollForm.batch_id,
    track,
    facilitator_id: enrollForm.facilitator_id || undefined,
    enrolled_date: new Date().toISOString().split("T")[0],
    payment_status: "Payment Pending",
    certificate_status: "Not Eligible",
  });

  // 2. Create Payment record
  const tuition = DEFAULT_TUITION_FEE;
  const discountAmount = calculateDiscount(tuition, "None");
  const amountDue = calculateAmountDue(tuition, discountAmount);

  await base44.entities.Payment.create({
    student_id: student.id,
    student_name: application.full_name,
    student_email: application.email,
    batch_id: enrollForm.batch_id,
    batch_name: batchName,
    track,
    tuition_fee: tuition,
    discount_type: "None",
    discount_amount: discountAmount,
    amount_due: amountDue,
    amount_paid: 0,
    balance_due: amountDue,
    payment_status: "Payment Pending",
  });

  // 3. Create Invoice record
  const invSeq = getNextSequence(existingInvoices || [], "COG-INV", year, batchCode);
  const invoiceNumber = generateInvoiceNumber(year, batchCode, invSeq);
  const issueDate = new Date().toISOString().split("T")[0];
  const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  await base44.entities.Invoice.create({
    invoice_number: invoiceNumber,
    student_id: student.id,
    student_name: application.full_name,
    student_email: application.email,
    batch_id: enrollForm.batch_id,
    batch_name: batchName,
    track,
    tuition_fee: tuition,
    discount_type: "None",
    discount_amount: discountAmount,
    total_amount_due: amountDue,
    payment_status: "Unpaid",
    issue_date: issueDate,
    due_date: dueDate,
  });

  // 4. Update application status
  await base44.entities.Application.update(application.id, {
    status: "Enrolled",
    batch_id: enrollForm.batch_id,
  });

  return student;
}