import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ALL_TRACKS } from "@/lib/business-utils";

const INITIAL_FORM = {
  full_name: "",
  email: "",
  phone: "",
  preferred_track: "",
  reason_for_interest: "",
  preferred_batch: "",
};

export default function Waitlist() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.full_name || !form.email) {
      toast({ title: "Please enter your name and email", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      await base44.entities.Waitlist.create({
        ...form,
        status: "New",
      });

      await base44.entities.Lead.create({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        interest_type: "Join Waitlist",
        preferred_track: form.preferred_track || "Not Sure Yet",
        message: `Open Learning interest: ${form.reason_for_interest}`,
        source_page: "Open Learning Waitlist",
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
          <p className="apple-eyebrow mt-7">Cognita Open Learning</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">You are on the early-access list</h1>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            We will contact you when Open Learning access, course collections, or relevant self-paced pathways become available. Joining this list is not an enrollment or payment commitment.
          </p>
          <Button onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); }} variant="outline" className="apple-button-secondary mt-7 border-white/10">
            Submit another response
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-surface min-h-screen px-5 pb-24 pt-24 sm:px-6 md:pt-32">
      <section className="mx-auto max-w-3xl text-center">
        <p className="apple-eyebrow">Cognita Open Learning</p>
        <h1 className="mt-5 text-4xl font-semibold leading-[1.03] tracking-[-0.055em] text-white sm:text-5xl md:text-7xl">
          Flexible AI learning, without a fixed cohort.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-300/75 md:text-xl">
          Open Learning is Cognita's planned self-paced pathway for learners who want structured lessons and practical resources but do not need weekly facilitator-led training.
        </p>
      </section>

      <section className="mx-auto mt-12 max-w-2xl">
        <div className="mb-6 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-5">
          <p className="text-sm leading-7 text-slate-400">
            Open Learning access will be introduced in phases. Assessment and credentialing may be offered separately depending on the course or learning path.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="apple-card space-y-5 p-6 md:p-9">
          <div>
            <Label className="mb-2 text-xs text-slate-400">Full name *</Label>
            <Input value={form.full_name} onChange={(event) => updateForm("full_name", event.target.value)} className="border-white/10 bg-white/[0.035]" required />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-400">Email address *</Label>
            <Input type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} className="border-white/10 bg-white/[0.035]" required />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-400">Phone number</Label>
            <Input value={form.phone} onChange={(event) => updateForm("phone", event.target.value)} className="border-white/10 bg-white/[0.035]" />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-400">Area of interest</Label>
            <Select value={form.preferred_track} onValueChange={(value) => updateForm("preferred_track", value)}>
              <SelectTrigger className="border-white/10 bg-white/[0.035]"><SelectValue placeholder="Select an area" /></SelectTrigger>
              <SelectContent>
                {ALL_TRACKS.map((track) => <SelectItem key={track} value={track}>{track}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-400">Preferred access period</Label>
            <Input value={form.preferred_batch} onChange={(event) => updateForm("preferred_batch", event.target.value)} className="border-white/10 bg-white/[0.035]" placeholder="Example: Q4 2026 or early 2027" />
          </div>
          <div>
            <Label className="mb-2 text-xs text-slate-400">What would make Open Learning useful to you?</Label>
            <Textarea value={form.reason_for_interest} onChange={(event) => updateForm("reason_for_interest", event.target.value)} rows={5} className="border-white/10 bg-white/[0.035]" placeholder="Tell us about your learning goals, preferred topics, and the type of resources you need." />
          </div>
          <Button type="submit" disabled={submitting} className="apple-button-primary h-12 w-full border-0 text-sm font-semibold text-slate-950 hover:text-slate-950">
            {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <ArrowRight size={16} className="mr-2" />}
            Join the Open Learning list
          </Button>
        </form>
      </section>
    </div>
  );
}
