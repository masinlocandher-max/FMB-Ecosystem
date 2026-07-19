(() => {
  const DESTINATION_EMAIL = "info.senz.pr@gmail.com";
  const REQUEST_TIMEOUT_MS = 20000;
  const CONSULTATION_PENDING_MESSAGE = "Thank you. Your consultation request has been received. SENZ will review your preferred schedule and confirm by email before anything is added to a calendar.";
  const ERROR_MESSAGE = `We could not submit your request. Please try again or email ${DESTINATION_EMAIL}.`;

  const routeByKind = {
    general: () => window["CONTACT_FORM_" + "END" + "POINT"] || defaultInquiryEndpoint(),
    consultation: () => window["CONSULTATION_FORM_" + "END" + "POINT"] || defaultInquiryEndpoint(),
    "creative-pool": () => window["CAREERS_FORM_" + "END" + "POINT"] || defaultInquiryEndpoint()
  };

  function defaultInquiryEndpoint() {
    const baseUrl = String(window.SENZ_API_BASE_URL || window.location.origin || "").replace(/\/$/, "");
    return baseUrl ? `${baseUrl}/api/inquiries` : "";
  }

  function now() {
    return new Date().toISOString();
  }

  function valuesFrom(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function buildPayload(form) {
    const formKind = form.dataset.formKind || "general";
    const values = valuesFrom(form);
    const submittedAt = now();
    const fullName = values.name || values.fullName || "Website Visitor";

    if (formKind === "consultation") {
      const schedule = [values.date, values.time].filter(Boolean).join(" ");
      return {
        formType: "consultation",
        status: "pending",
        destinationEmail: DESTINATION_EMAIL,
        subject: `New SENZ Consultation Request - ${fullName}`,
        submittedAt,
        name: fullName,
        email: values.email || "",
        contact: values.phone || "",
        brand: values.organization || "",
        projectType: values.service || "Consultation",
        timeline: schedule,
        message: values.notes || `Consultation request for ${values.service || "SENZ services"}.`,
        calendarRule: "Pending request only. Do not confirm or add to calendar until SENZ approves.",
        fields: {
          preferredDate: values.date || "",
          preferredTime: values.time || "",
          fullName,
          email: values.email || "",
          phone: values.phone || "",
          organization: values.organization || "",
          service: values.service || "",
          notes: values.notes || ""
        }
      };
    }

    if (formKind === "creative-pool") {
      return {
        formType: "creative-pool",
        destinationEmail: DESTINATION_EMAIL,
        subject: `New SENZ Creative Network Submission - ${fullName}`,
        submittedAt,
        name: fullName,
        email: values.email || "",
        contact: values.phone || "",
        projectType: values.role || "Creative Network",
        message: values.introduction || values.experience || values.portfolio || "Creative network submission.",
        fields: {
          fullName,
          email: values.email || "",
          phone: values.phone || "",
          creativeRole: values.role || "",
          portfolioLink: values.portfolio || "",
          shortIntroduction: values.introduction || values.experience || ""
        }
      };
    }

    return {
      formType: "general",
      destinationEmail: DESTINATION_EMAIL,
      subject: `New SENZ Website Inquiry - ${fullName}`,
      submittedAt,
      name: fullName,
      email: values.email || "",
      contact: values.phone || "",
      brand: values.organization || "",
      projectType: values.inquiryType || "General inquiry",
      message: values.message || "General website inquiry.",
      fields: {
        fullName,
        email: values.email || "",
        phone: values.phone || "",
        organization: values.organization || "",
        position: values.position || "",
        inquiryType: values.inquiryType || "",
        message: values.message || ""
      }
    };
  }

  function successMessage(formKind) {
    if (formKind === "consultation") return CONSULTATION_PENDING_MESSAGE;
    if (formKind === "creative-pool") return "Thank you. Your profile has been received. SENZ will review it for relevant project-based opportunities.";
    return "Thank you. Your message has been received. SENZ will review your inquiry and respond by email.";
  }

  function setStatus(statusEl, state, message) {
    if (!statusEl) return;
    statusEl.dataset.state = state;
    statusEl.textContent = message;
  }

  async function submit(form, statusEl) {
    const formKind = form.dataset.formKind || "general";
    const route = routeByKind[formKind]?.() || "";
    const payload = buildPayload(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    if (!route) {
      setStatus(statusEl, "error", ERROR_MESSAGE);
      return { ok: false, reason: "Missing form endpoint." };
    }

    if (submitButton) submitButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    setStatus(statusEl, "sending", "Submitting your request securely…");

    try {
      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const responseBody = await response.json().catch(() => ({}));
      if (!response.ok || responseBody.ok === false) {
        const serverMessage = Array.isArray(responseBody.errors) ? responseBody.errors.join(" ") : "";
        throw new Error(serverMessage || `Form route returned ${response.status}.`);
      }

      setStatus(statusEl, "success", successMessage(formKind));
      form.reset();
      return { ok: true, response: responseBody };
    } catch (reason) {
      console.warn("SENZ form submission failed.", reason);
      const message = reason?.name === "AbortError"
        ? `The request timed out. Please try again or email ${DESTINATION_EMAIL}.`
        : ERROR_MESSAGE;
      setStatus(statusEl, "error", message);
      return { ok: false, reason };
    } finally {
      window.clearTimeout(timeout);
      form.removeAttribute("aria-busy");
      if (submitButton) submitButton.disabled = false;
    }
  }

  function bind(form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".status, .consult-status, .form-status");
      submit(form, status);
    });
  }

  window.SENZForms = {
    bind,
    submit,
    buildPayload,
    CONSULTATION_PENDING_MESSAGE
  };
})();