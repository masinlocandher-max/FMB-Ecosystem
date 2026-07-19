import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Building2, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { PARTNER_PROGRAMS, PARTNER_TYPES } from "@/lib/business-utils";

const INITIAL_FORM = {
  organization_name: "",
  organization_type: "",
  contact_person: "",
  email: "",
  phone: "",
  location: "",
  interested_program: "",
  estimated_participants: "",
  preferred_schedule: "",
  message: "",
};

export default function Partner() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [proposalFile, setProposalFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.organization_name || !form.organization_type || !form.contact_person || !form.email || !form.interested_program) {
      toast({ title: "Please complete all required fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let proposalUrl;
      if (proposalFile) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: proposalFile });
        proposalUrl = file_url;
      }

      await base44.entities.PartnerInquiry.create({
        ...form,
        estimated_participants: form.estimated_participants ? parseInt(form.estimated_participants, 10) : undefined,
        proposal_url: proposalUrl,
        status: "New",
      });
      setSubmitted(true);
    } catch (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
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
          <p className="apple-eyebrow mt-7">Cognita Institutional Training</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Inquiry received</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            Thank you for considering Cognita. The Institutional Training team will review your organization, audience, objectives, schedule, and preferred delivery model before recommending the next step.
          </p>
          <Button
            onClick={() => {
              setSubmitted(false);
              setForm(INITIAL_FORM);
              setProposalFile(null);
            }}
            variant="outline"
            className="apple-button-secondary mt-7 border-white/10"
          >
            Submit another inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-surface min-h-screen px-5 pb-24 pt-24 sm:px-6 md:pt-32">
      <section className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <p className="apple-eyebrow">Cognita Institutional Training</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
            Professional AI training for organizations.
          </h1>
          <p className="mt-7 max-w-3xl text-base leading-8 text-slate-300/75 md:text-xl">
            Cognita works with schools, companies, NGOs, LGUs, associations, and training partners to design group learning experiences with clear objectives, practical outputs, and responsible reporting.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
          {PARTNER_TYPES.map((type) => (
            <div key={type} className="apple-card flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-sky-300/12 bg-sky-300/[0.05]">
                <Building2 size={16} className="text-sky-300" />
              </div>
              <span className="text-xs font-medium text-slate-300">{type}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="apple-eyebrow">Available engagement formats</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white md:text-5xl">
            Built around institutional needs, not generic seat counts.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400">
            The final scope depends on the participants, learning objectives, delivery schedule, facilitator requirements, assessment level, and reporting expectations.
          </p>

          <div className="mt-8 space-y-3">
            {PARTNER_PROGRAMS.map((program) => (
              <div key={program} className="flex items-center justify-between rounded-2xl border border-white/[0.075] bg-white/[0.025] px-4 py-3.5">
                <span className="text-sm text-slate-300">{program}</span>
                <ArrowRight size={14} className="text-sky-300/60" />
              </div>
            ))}
          </div>
        </div>

        <div className="apple-card p-6 md:p-9">
          <div className="mb-7">
            <p className="apple-eyebrow">Institutional inquiry</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-white">Tell us about the training requirement</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label className="mb-2 text-xs text-slate-400">Organization name *</Label>
                <Input value={form.organization_name} onChange={(event) => updateForm("organization_name", event.target.value)} className="border-white/10 bg-white/[0.035]" required />
              </div>
              <div>
                <Label className="mb-2 text-xs text-slate-400">Organization type *</Label>
                <Select value={form.organization_type} onValueChange={(value) => updateForm("organization_type", value)}>
                  <SelectTrigger className="border-white/10 bg-white/[0.035]"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label className="mb-2 text-xs text-slate-400">Contact person *</Label>
                <Input value={form.contact_person} onChange={(event) => updateForm("contact_person", event.target.value)} className="border-white/10 bg-white/[0.035]" required />
              </div>
              <div>
                <Label className="mb-2 text-xs text-slate-400">Email address *</Label>
                <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="border-white/10 bg-white/[0.035]" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label className="mb-2 text-xs text-slate-400">Phone number</Label>
                <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className="border-white/10 bg-white/[0.035]" />
              </div>
              <div>
                <Label className="mb-2 text-xs text-slate-400">Location</Label>
                <Input value={form.location} onChange={(event) => updateForm("location", event.target.value)} className="border-white/10 bg-white/[0.035]" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Label className="mb-2 text-xs text-slate-400">Interested program *</Label>
                <Select value={form.interested_program} onValueChange={(value) => updateForm("interested_program", value)}>
                  <SelectTrigger className="border-white/10 bg-white/[0.035]"><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_PROGRAMS.map((program) => <SelectItem key={program} value={program}>{program}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 text-xs text-slate-400">Estimated participants</Label>
                <Input type="number" value={form.estimated_participants} onChange={(event) => updateForm("estimated_participants", event.target.value)} className="border-white/10 bg-white/[0.035]" placeholder="Example: 30" />
              </div>
            </div>

            <div>
              <Label className="mb-2 text-xs text-slate-400">Preferred schedule</Label>
              <Input value={form.preferred_schedule} onChange={(event) => updateForm("preferred_schedule", event.target.value)} className="border-white/10 bg-white/[0.035]" placeholder="Example: Q3 2026, weekends, two-day workshop" />
            </div>

            <div>
              <Label className="mb-2 text-xs text-slate-400">Training objectives and context</Label>
              <Textarea value={form.message} onChange={(event) => updateForm("message", event.target.value)} rows={5} className="border-white/10 bg-white/[0.035]" placeholder="Describe the participants, current needs, desired outcomes, and any reporting requirements." />
            </div>

            <div>
              <Label className="mb-2 text-xs text-slate-400">Proposal or formal letter, optional</Label>
              <input
                type="file"
                accept="image/*,application/pdf,.doc,.docx"
                onChange={(event) => setProposalFile(event.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-sky-300/10 file:px-4 file:py-2 file:text-xs file:font-medium file:text-sky-300 hover:file:bg-sky-300/15"
              />
            </div>

            <Button type="submit" disabled={submitting} className="apple-button-primary h-12 w-full border-0 text-sm font-semibold text-slate-950 hover:text-slate-950">
              {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ArrowRight size={16} className="mr-2" />}
              Submit institutional inquiry
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
