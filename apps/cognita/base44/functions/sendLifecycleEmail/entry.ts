import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SITE_URL = 'https://thecognitainstitute.com';
const SUPPORT_EMAIL = 'support@thecognitainstitute.com';
const CREDENTIAL_TITLE = 'Certificate of Completion';
const ALLOWED_EMAIL_TYPES = new Set([
  'application_submitted',
  'application_accepted',
  'application_waitlisted',
  'application_rejected',
  'application_status_changed',
  'submission_reviewed',
  'certificate_issued',
  'payment_confirmed',
  'announcement_published',
  'teacher_app_submitted',
]);

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function safeText(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, 10000);
}

function learnerPortalLink(path = '/login'): string {
  return `${SITE_URL}${path}`;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const emailType = safeText(body?.email_type, '').slice(0, 80);
    const entityData = body?.entity_data && typeof body.entity_data === 'object' ? body.entity_data : {};

    if (!ALLOWED_EMAIL_TYPES.has(emailType)) {
      return Response.json({ error: 'Unsupported lifecycle email type' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    let to = '';
    let subject = '';
    let emailBody = '';

    if (emailType === 'application_submitted') {
      const app = entityData;
      to = safeText(app.email);
      subject = 'Application Received | Cognita Institute';
      emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nThank you for applying to Cognita Institute. We have recorded your application for the ${safeText(app.preferred_track, 'selected')} track.\n\nThe Admissions Office will review your application. Applying does not guarantee acceptance, and admissions decisions are made by authorized personnel.\n\nFor your privacy, status details are not displayed through the public application form. Cognita will contact you using the information you submitted.\n\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'application_accepted') {
      const app = entityData;
      to = safeText(app.email);
      subject = 'Application Accepted | Cognita Institute';
      emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nYour application to Cognita Institute has been accepted for the ${safeText(app.preferred_track, 'selected')} track.\n\nAcceptance is not yet full learning access. Your next steps may include account verification, enrollment agreement acceptance, invoice review, payment confirmation or an approved waiver, and batch assignment.\n\nSign in: ${learnerPortalLink('/login')}\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'application_waitlisted') {
      const app = entityData;
      to = safeText(app.email);
      subject = 'Application Waitlist Update | Cognita Institute';
      emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nYour application for the ${safeText(app.preferred_track, 'selected')} track has been placed on the Cognita waitlist. We will contact you if an appropriate place becomes available.\n\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'application_rejected') {
      const app = entityData;
      to = safeText(app.email);
      subject = 'Application Update | Cognita Institute';
      emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nAfter review, Cognita is unable to offer enrollment for this application at this time. Please refer to any specific information provided by the Admissions Office.\n\nQuestions may be submitted through ${learnerPortalLink('/contact')} or ${SUPPORT_EMAIL}.\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'application_status_changed') {
      const app = entityData;
      const status = safeText(app.status);
      to = safeText(app.email);

      if (status === 'Accepted') {
        subject = 'Application Accepted | Cognita Institute';
        emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nYour Cognita application has been accepted. Complete the remaining enrollment requirements before learning access is activated.\n\nSign in: ${learnerPortalLink('/login')}\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
      } else if (status === 'Waitlisted') {
        subject = 'Application Waitlist Update | Cognita Institute';
        emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nYour application is currently waitlisted. Cognita will contact you if an appropriate place becomes available.\n\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
      } else if (status === 'Rejected') {
        subject = 'Application Update | Cognita Institute';
        emailBody = `Dear ${safeText(app.full_name, 'Applicant')},\n\nCognita is unable to offer enrollment for this application at this time.\n\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
      } else if (status === 'Enrolled') {
        subject = 'Enrollment Record Created | Cognita Institute';
        emailBody = `Dear ${safeText(app.full_name, 'Learner')},\n\nA Cognita enrollment record has been created. Learning access remains subject to the enrollment agreement, payment confirmation or approved waiver, and active access status.\n\nEnrollment status: ${learnerPortalLink('/student/payments')}\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
      } else {
        return Response.json({ skipped: true, reason: `status ${status} does not trigger email` });
      }
    }

    else if (emailType === 'submission_reviewed') {
      const submission = entityData;
      const student = await svc.entities.Student.get(submission.student_id).catch(() => null);
      if (!student) return Response.json({ skipped: true, reason: 'student not found' });
      to = safeText(student.email);
      const status = safeText(submission.status);
      const statusLabel = status === 'Passed' ? 'PASSED' : status === 'Needs Revision' ? 'REVISION REQUIRED' : 'NOT PASSED';
      subject = `Week ${submission.week_number} Human Review | ${statusLabel}`;
      const feedback = safeText(submission.feedback);
      const revisionInstructions = safeText(submission.revision_instructions);
      emailBody = `Dear ${safeText(student.full_name, 'Learner')},\n\nAn authorized human reviewer recorded a decision for Week ${submission.week_number}: ${statusLabel}.\n\n${feedback ? `Reviewer feedback:\n${feedback}\n\n` : ''}${status === 'Needs Revision' && revisionInstructions ? `Required revision:\n${revisionInstructions}\n\n` : ''}View the reviewed submission: ${learnerPortalLink(`/student/lesson/${submission.week_number}`)}\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'certificate_issued') {
      const certificate = entityData;
      const student = await svc.entities.Student.get(certificate.student_id).catch(() => null);
      to = student ? safeText(student.email) : '';
      if (!to) return Response.json({ skipped: true, reason: 'student email not found' });
      subject = `${CREDENTIAL_TITLE} Issued | Cognita Institute`;
      emailBody = `Dear ${safeText(certificate.student_name, 'Learner')},\n\nYour Cognita ${CREDENTIAL_TITLE} has been issued after the required human portfolio review and credential approval process.\n\nSerial number: ${safeText(certificate.serial_number)}\nTrack: ${safeText(certificate.track)}\nBatch: ${safeText(certificate.batch_name)}\n\nVerify: ${learnerPortalLink(`/verify?serial=${encodeURIComponent(safeText(certificate.serial_number))}`)}\n\nThis is a non-degree professional training record. It is not a diploma, academic credit, professional license, or attendance-only certificate.\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'payment_confirmed') {
      const payment = entityData;
      to = safeText(payment.student_email);
      subject = 'Payment Confirmed | Cognita Institute';
      emailBody = `Dear ${safeText(payment.student_name, 'Learner')},\n\nYour Cognita payment record has been confirmed. Learning access also requires a signed enrollment agreement and active enrollment status.\n\nBatch: ${safeText(payment.batch_name)}\nTrack: ${safeText(payment.track)}\nAmount paid: ${String(payment.amount_paid ?? '')}\n\nCheck enrollment status: ${learnerPortalLink('/student/payments')}\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
    }

    else if (emailType === 'announcement_published') {
      const announcement = entityData;
      let recipients = [];
      if (announcement.audience === 'All Students') {
        recipients = await svc.entities.Student.filter({ progress_status: { $ne: 'Removed' } }, '-created_date', 500);
      } else if (announcement.audience === 'Specific Track' && announcement.track) {
        recipients = await svc.entities.Student.filter({ track: announcement.track, progress_status: { $ne: 'Removed' } }, '-created_date', 500);
      } else if (announcement.audience === 'Specific Batch' && announcement.batch_id) {
        recipients = await svc.entities.Student.filter({ batch_id: announcement.batch_id, progress_status: { $ne: 'Removed' } }, '-created_date', 500);
      } else if (announcement.audience === 'Facilitators') {
        recipients = await svc.entities.Facilitator.filter({ status: 'Active' }, '-created_date', 100);
      }

      const priorityLabel = announcement.priority === 'Urgent' ? '[URGENT] ' : announcement.priority === 'Important' ? '[Important] ' : '';
      const title = safeText(announcement.title, 'Cognita Announcement').slice(0, 200);
      const announcementBody = safeText(announcement.body);
      const results = [];

      for (const recipient of recipients) {
        if (!isValidEmail(recipient.email)) continue;
        try {
          await svc.integrations.Core.SendEmail({
            to: recipient.email.trim(),
            subject: `${priorityLabel}${title}`,
            body: `${announcementBody}\n\nView Cognita: ${SITE_URL}\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`,
          });
          results.push(recipient.email);
        } catch {
          // Continue sending to remaining authorized recipients.
        }
      }
      return Response.json({ sent_to: results.length });
    }

    else if (emailType === 'teacher_app_submitted') {
      const application = entityData;
      to = safeText(application.email);
      subject = 'Educator Application Received | Cognita Institute';
      emailBody = `Dear ${safeText(application.full_name, 'Applicant')},\n\nCognita has recorded your educator or facilitator application. The application will be reviewed by authorized personnel. Submission does not guarantee appointment, employment, assignment, or compensation.\n\nSupport: ${SUPPORT_EMAIL}\n\nCognita Institute of Artificial Intelligence`;
    }

    if (!isValidEmail(to)) {
      return Response.json({ skipped: true, reason: 'invalid or missing recipient email' });
    }

    try {
      await svc.integrations.Core.SendEmail({ to: to.trim(), subject, body: emailBody });
      return Response.json({ sent: true, email_type: emailType });
    } catch (sendError) {
      return Response.json({ sent: false, email_type: emailType, reason: sendError.message }, { status: 502 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
