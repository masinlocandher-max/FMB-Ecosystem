import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ACTIVE_TRACKS } from "@/lib/curriculum";
import { CheckCircle, Loader2, ShieldCheck, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/AuthContext";
import { OFFICIAL_EMAILS } from "@/lib/governance";

export default function Apply() {
  const { backendAvailable } = useAuth();
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", location: "",
    preferred_track: "", occupation: "",
    ai_skill_level: 5, tech_skill_level: 5, available_hours: 10,
    why_apply: "", production_goals: "",
    understands_no_auto_cert: false, agrees_to_submit_weekly: false,
    accepts_terms: false, accepts_privacy: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const buildInterestSummary = () => [
    `Location: ${form.location}`,
    `Occupation or student status: ${form.occupation}`,
    `Current AI skill: ${form.ai_skill_level}/10`,
    `Current technology skill: ${form.tech_skill_level}/10`,
    `Available study time: ${form.available_hours} hours per week`,
    `Reason for applying: ${form.why_apply}`,
    `Expected 10-week output: ${form.production_goals}`,
    "Applicant understands that completion and credentialing require human-reviewed work and are not automatic.",
  ].join("\n\n");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.preferred_track) {
      setError("Please select a specialization track.");
      return;
    }

    if (!form.understands_no_auto_cert || !form.agrees_to_submit_weekly || !form.accepts_terms || !form.accepts_privacy) {
      setError("Please confirm all program, Terms of Use, and Privacy Policy statements.");
      return;
    }

    setSubmitting(true);
    const email = form.email.trim().toLowerCase();
    const interestSummary = buildInterestSummary();

    try {
      try {
        await base44.entities.Waitlist.create({
          full_name: form.full_name.trim(),
          email,
          phone: form.phone.trim(),
          preferred_track: form.preferred_track,
          reason_for_interest: interestSummary,
          preferred_batch: "Next available Cognita Professional Program cohort",
          status: "New",
        });
      } catch {
        // Preserve applicant intake on installations where the existing Lead
        // entity is available before Waitlist synchronization is completed.
        await base44.entities.Lead.create({
          full_name: form.full_name.trim(),
          email,
          phone: form.phone.trim(),
          interest_type: "Join Waitlist",
          preferred_track: form.preferred_track,
          message: interestSummary,
          source_page: "Professional Program Application Waitlist",
          status: "New",
        });
      }

      setSubmitted(true);
    } catch (submissionError) {
      setError(
        submissionError?.message ||
        `Applicant intake is temporarily unavailable. Please email ${OFFICIAL_EMAILS.admissions} with the subject “Cognita Waitlist Application.”`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="apple-surface flex min-h-[76vh] items-center justify-center px-5 py-24 sm:px-6">
        <div className="apple-card max-w-lg p-8 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-sky-300/15 bg-sky-300/[0.07]">
            <CheckCircle size={30} className="text-sky-300" />
          </div>
          <p className="apple-eyebrow mt-7">Cognita Professional Programs</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Application received</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Your application has been recorded and placed on the Cognita launch waitlist. Admissions will contact applicants in order of program readiness, track capacity, and available cohort schedules.
          </p>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            Being placed on the waitlist is not yet an enrollment offer, payment request, or guarantee of admission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-surface min-h-screen px-5 pb-24 pt-24 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 max-w-2xl">
          <p className="apple-eyebrow">Cognita Professional Programs</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
            Apply for the launch waitlist
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400 md:text-lg">
            Cognita is accepting applications while final learner operations are being prepared. Every complete application is placed on the waitlist for the next available 10-Week Professional AI Program cohort.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.045] p-5">
          <Clock3 size={19} className="mt-0.5 flex-shrink-0 text-amber-200" />
          <p className="text-sm leading-6 text-slate-300/85">
            Applications are open, but enrollment and payment are not yet automatic. Cognita will contact waitlisted applicants only when the relevant cohort, learner support, and human-review capacity are ready.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-300/12 bg-sky-300/[0.04] p-5">
          <ShieldCheck size={19} className="mt-0.5 flex-shrink-0 text-sky-300" />
          <p className="text-sm leading-6 text-slate-300/80">
            Applying does not guarantee acceptance. Certificates are not automatic. Final portfolio approval and credential authorization are human decisions.
          </p>
        </div>

        {!backendAvailable && (
          <div className="mb-6 rounded-2xl border border-orange-300/15 bg-orange-300/[0.04] p-5 text-sm leading-6 text-slate-300/85">
            The public website is available, but the applicant database connection is still being finalized. You may complete the form; if submission fails, email <a href={`mailto:${OFFICIAL_EMAILS.admissions}?subject=Cognita%20Waitlist%20Application`} className="text-sky-300 hover:underline">{OFFICIAL_EMAILS.admissions}</a>.
          </div>
        )}

        <form onSubmit={handleSubmit} className="apple-card space-y-7 p-6 md:p-9">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <Label className="mb-2 text-xs text-slate-400">Full legal name *</Label>
              <Input required value={form.full_name} onChange={(event) => handleChange("full_name", event.target.value)} className="border-white/10 bg-white/[0.035]" />
            </div>
            <div>
              <Label className="mb-2 text-xs text-slate-400">Email address *</Label>
              <Input required type="email" value={form.email} onChange={(event) => handleChange("email", event.target.value)} className="border-white/10 bg-white/[0.035]" />
            </div>
            <div>
              <Label className="mb-2 text-xs text-slate-400">Phone number *</Label>
              <Input required value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} className="border-white/10 bg-white/[0.035]" />
            </div>
            <div>
              <Label className="mb-2 text-xs text-slate-400">Location *</Label>
              <Input required value={form.location} onChange={(event) => handleChange("location", event.target.value)} className="border-white/10 bg-white/[0.035]" />
            </div>
          </div>

          <div>
            <Label className="mb-2 text-xs text-slate-400">Preferred specialization track *</Label>
            <Select value={form.preferred_track} onValueChange={(value) => handleChange("preferred_track", value)}>
              <SelectTrigger className="border-white/10 bg-white/[0.035]"><SelectValue placeholder="Select a track" /></SelectTrigger>
              <SelectContent>{ACTIVE_TRACKS.map((track) => <SelectItem key={track} value={track}>{track}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 text-xs text-slate-400">Current occupation or student status *</Label>
            <Input required value={form.occupation} onChange={(event) => handleChange("occupation", event.target.value)} placeholder="Example: Graphic designer, virtual assistant, college student" className="border-white/10 bg-white/[0.035]" />
          </div>

          <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
            <div>
              <Label className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>Current AI skill level</span><span className="font-mono text-sky-300">{form.ai_skill_level}/10</span></Label>
              <Slider value={[form.ai_skill_level]} onValueChange={(value) => handleChange("ai_skill_level", value[0])} min={1} max={10} step={1} />
            </div>
            <div>
              <Label className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>Current technology skill level</span><span className="font-mono text-sky-300">{form.tech_skill_level}/10</span></Label>
              <Slider value={[form.tech_skill_level]} onValueChange={(value) => handleChange("tech_skill_level", value[0])} min={1} max={10} step={1} />
            </div>
          </div>

          <div>
            <Label className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>Available study time each week</span><span className="font-mono text-sky-300">{form.available_hours} hours</span></Label>
            <Slider value={[form.available_hours]} onValueChange={(value) => handleChange("available_hours", value[0])} min={1} max={40} step={1} />
          </div>

          <div>
            <Label className="mb-2 text-xs text-slate-400">Why are you applying to this program? *</Label>
            <Textarea required value={form.why_apply} onChange={(event) => handleChange("why_apply", event.target.value)} rows={5} placeholder="Explain your motivation, current needs, and why guided training is appropriate for you." className="border-white/10 bg-white/[0.035]" />
          </div>

          <div>
            <Label className="mb-2 text-xs text-slate-400">What do you want to produce after 10 weeks? *</Label>
            <Textarea required value={form.production_goals} onChange={(event) => handleChange("production_goals", event.target.value)} rows={4} placeholder="Describe the practical output, portfolio, workflow, or project you want to complete." className="border-white/10 bg-white/[0.035]" />
          </div>

          <div className="space-y-3">
            {[
              ["understands_no_auto_cert", "I understand that the Certificate of Completion is not automatic. Eligibility depends on completing the required work and passing a final human portfolio review."],
              ["agrees_to_submit_weekly", "I understand that the guided program requires weekly outputs and revisions when requested."],
            ].map(([field, text]) => (
              <div key={field} className="flex items-start gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4">
                <Checkbox checked={form[field]} onCheckedChange={(value) => handleChange(field, value === true)} className="mt-0.5" />
                <p className="text-sm leading-6 text-slate-400">{text}</p>
              </div>
            ))}
            <div className="flex items-start gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4">
              <Checkbox checked={form.accepts_terms} onCheckedChange={(value) => handleChange("accepts_terms", value === true)} className="mt-0.5" />
              <p className="text-sm leading-6 text-slate-400">I have read and accept the <Link to="/terms" target="_blank" className="text-sky-300 hover:underline">Terms of Use</Link>.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-4">
              <Checkbox checked={form.accepts_privacy} onCheckedChange={(value) => handleChange("accepts_privacy", value === true)} className="mt-0.5" />
              <p className="text-sm leading-6 text-slate-400">I have read the <Link to="/privacy" target="_blank" className="text-sky-300 hover:underline">Privacy Policy</Link> and understand how my application information will be used.</p>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="apple-button-primary h-12 w-full border-0 text-sm font-semibold text-slate-950 hover:text-slate-950">
            {submitting ? <Loader2 size={17} className="animate-spin" /> : "Submit application to waitlist"}
          </Button>
        </form>
      </div>
    </div>
  );
}
