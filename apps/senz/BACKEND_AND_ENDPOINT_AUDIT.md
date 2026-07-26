# BACKEND AND ENDPOINT AUDIT

PAGE: Contact Us
ISSUE: Send Us A Message must reach the official inbox without creating a paid database dependency.
CURRENT STATUS: Blank custom form endpoints route through `SENZ_API_BASE_URL + /api/inquiries`. The SENZ API validates the request and delivers it to `info.senz.pr@gmail.com` through FormSubmit. It does not write casual inquiries to Supabase or the Render filesystem.
NEEDED FIX: Confirm the one-time FormSubmit activation email for `info.senz.pr@gmail.com`, then keep the deployed SENZ API health check passing.
PRIORITY: High

PAGE: Home, About, Services
ISSUE: Book a Consultation must collect a preferred schedule without falsely confirming an appointment.
CURRENT STATUS: Consultation requests use the same email-only inquiry endpoint. The visitor receives a pending-request message, and SENZ reviews and confirms the schedule manually by email.
NEEDED FIX: No database or calendar write is needed before paid demand justifies it.
PRIORITY: High

PAGE: Home, About, Services
ISSUE: Calendar approval workflow is not connected.
CURRENT STATUS: There is no real calendar integration. The site correctly does not auto-confirm or auto-add appointments to a calendar.
NEEDED FIX: Add a pending appointment workflow later: submit request, SENZ reviews by email/admin, then approved appointments are added to calendar.
PRIORITY: High

PAGE: Careers
ISSUE: Creative Pool / Submit Portfolio must reach the official inbox.
CURRENT STATUS: Creative-network submissions use the same validated email-only endpoint and do not require Supabase.
NEEDED FIX: Review and retain relevant profiles in the official email workflow until a paid operational database is justified.
PRIORITY: High

PAGE: All Approved Pages
ISSUE: Endpoint placeholders are not filled.
CURRENT STATUS: `CONTACT_FORM_ENDPOINT`, `CONSULTATION_FORM_ENDPOINT`, and `CAREERS_FORM_ENDPOINT` are intentionally optional. Blank values route to the deployed SENZ API configured by `SENZ_API_BASE_URL`.
NEEDED FIX: Only paste deployed endpoint URLs into `components/site-config.js` if a form should bypass the SENZ API.
PRIORITY: High

PAGE: All Approved Pages
ISSUE: Existing `/api/inquiries` backend is present but not wired to send email.
CURRENT STATUS: `server.js` now validates, anti-spam checks, and emails accepted submissions. It has no Supabase or local-file persistence path for casual inquiries.
NEEDED FIX: Keep the free FormSubmit delivery endpoint active and test it after deployment.
PRIORITY: Medium

PAGE: FAQ
ISSUE: FAQ Contact Us CTA endpoint.
CURRENT STATUS: The CTA routes to `contact.html`, which is approved.
NEEDED FIX: No link fix needed. Backend dependency is covered by the Contact Us form issue above.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Broken internal links after deleting unapproved pages.
CURRENT STATUS: Checked approved pages. No internal links point to deleted `get-started.html` or `shop/index.html`; no broken approved-page links found.
NEEDED FIX: Re-run link checks after any future page or navigation edits.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Placeholder `href="#"`, empty `href`, and `javascript:void(0)` links.
CURRENT STATUS: Checked approved pages. No placeholder href values found.
NEEDED FIX: Keep modal triggers as buttons instead of placeholder anchors.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Asset references.
CURRENT STATUS: Checked linked CSS, JavaScript, logo, and image paths used by approved pages. No missing linked assets found.
NEEDED FIX: Re-run asset checks after replacing image placeholders or adding final media.
PRIORITY: Low

PAGE: Home
ISSUE: Optional ambient music file dependency.
CURRENT STATUS: Home references `assets/senz-reception-music.mp3`. The file exists locally, and the control is user-activated rather than autoplaying.
NEEDED FIX: No endpoint fix needed. Confirm the same file is present after deployment.
PRIORITY: Low

PAGE: Contact Us
ISSUE: Map is still a placeholder.
CURRENT STATUS: Contact Us includes a map placeholder, which matches the current prototype requirement but is not a live map.
NEEDED FIX: Add an approved embedded map or final static location image before public launch if desired.
PRIORITY: Medium

PAGE: All Approved Pages
ISSUE: Form validation review.
CURRENT STATUS: Required fields are present on the main forms. Contact Us allows optional phone, company, and position as requested. Consultation modal collects required schedule/contact fields and project notes. Careers collects role, name, email, phone, portfolio, and short introduction.
NEEDED FIX: Confirm final required/optional business rules before backend integration.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Unapproved standalone pages.
CURRENT STATUS: Only the six approved HTML pages remain: `index.html`, `about.html`, `services.html`, `careers.html`, `contact.html`, and `faq.html`. `get-started.html` and `shop/index.html` were removed.
NEEDED FIX: Do not re-add unapproved pages unless formally approved.
PRIORITY: Low

PAGE: All Approved Pages
ISSUE: Top navigation compliance.
CURRENT STATUS: Top navigation shows only Home, About, Services, Careers, Contact Us, and FAQ. Book a Consultation is not in the top navigation.
NEEDED FIX: Re-check navigation after future edits.
PRIORITY: Low
