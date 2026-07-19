import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Loader2, CheckCircle, Send, Copy } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { OFFICIAL_DOMAIN, OFFICIAL_EMAILS, createOperationalReference } from "@/lib/governance";

const CONCERN_TYPES = [
  "Application",
  "Enrollment",
  "Payment",
  "Learning Access",
  "Submission Issue",
  "Portfolio Audit",
  "Certificate Verification",
  "Privacy Request",
  "Technical Support",
  "Other",
];

const INITIAL_FORM = { full_name: "", email: "", concern_type: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [ticketReference, setTicketReference] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleChange = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.concern_type) {
      setError("Please select a concern type.");
      return;
    }

    setSubmitting(true);
    const reference = createOperationalReference("COG-SUP");
    const submittedAt = new Date().toISOString();

    try {
      try {
        await base44.entities.SupportTicket.create({
          ticket_reference: reference,
          ...form,
          status: "New",
          priority: ["Payment", "Learning Access", "Privacy Request"].includes(form.concern_type) ? "High" : "Normal",
          submitted_at: submittedAt,
          source_domain: OFFICIAL_DOMAIN,
        });
      } catch {
        // Backward-compatible fallback while the new SupportTicket schema is being deployed.
        await base44.entities.Lead.create({
          full_name: form.full_name,
          email: form.email,
          interest_type: "Ask a Question",
          preferred_track: "Not Sure Yet",
          message: `[${reference}] ${form.concern_type}: ${form.message}`,
          source_page: "Contact and Support",
          status: "New",
        });
      }

      setTicketReference(reference);
      setForm(INITIAL_FORM);
    } catch (submissionError) {
      setError(submissionError.message || "Your message could not be submitted. Please email support directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyReference = async () => {
    await navigator.clipboard.writeText(ticketReference);
    toast({ title: "Support reference copied" });
  };

  if (ticketReference) {
    return (
      <div className="mx-auto max-w-2xl px-6 pb-20 pt-24">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
            <CheckCircle size={32} className="text-cyan-400" />
          </div>
          <h1 className="mb-3 text-2xl font-bold">Support request recorded</h1>
          <p className="mb-6 text-muted-foreground">
            Keep the reference below. Cognita support will use it to trace your concern.
          </p>
          <div className="mx-auto max-w-md rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Reference</p>
            <p className="mt-2 font-mono text-base text-cyan-300">{ticketReference}</p>
            <Button variant="outline" size="sm" onClick={copyReference} className="mt-4 border-border">
              <Copy size={13} className="mr-2" /> Copy reference
            </Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            For an urgent payment, access, privacy, or credential concern, email{" "}
            <a className="text-cyan-400 hover:underline" href={`mailto:${OFFICIAL_EMAILS.support}?subject=${encodeURIComponent(ticketReference)}`}>
              {OFFICIAL_EMAILS.support}
            </a>
            .
          </p>
          <Button onClick={() => setTicketReference("")} variant="ghost" className="mt-6">
            Submit another concern
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 pb-20 pt-24">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-cyan-400">Support</p>
      <h1 className="mb-2 text-3xl font-bold md:text-4xl">Contact and Support</h1>
      <p className="mb-8 text-muted-foreground">
        Questions about an application, payment, access, portfolio review, or credential? Submit a traceable support request below.
      </p>

      <div className="mb-8 flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/10">
          <Mail size={18} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email support directly</p>
          <a href={`mailto:${OFFICIAL_EMAILS.support}`} className="text-sm font-medium text-cyan-400 hover:underline">
            {OFFICIAL_EMAILS.support}
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="contact-name" className="mb-1.5 text-xs text-muted-foreground">Full name *</Label>
            <Input id="contact-name" required value={form.full_name} onChange={(event) => handleChange("full_name", event.target.value)} className="border-border bg-secondary" />
          </div>
          <div>
            <Label htmlFor="contact-email" className="mb-1.5 text-xs text-muted-foreground">Email *</Label>
            <Input id="contact-email" required type="email" value={form.email} onChange={(event) => handleChange("email", event.target.value)} className="border-border bg-secondary" />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 text-xs text-muted-foreground">Concern type *</Label>
          <Select value={form.concern_type} onValueChange={(value) => handleChange("concern_type", value)}>
            <SelectTrigger className="border-border bg-secondary"><SelectValue placeholder="Select a concern type" /></SelectTrigger>
            <SelectContent>
              {CONCERN_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contact-message" className="mb-1.5 text-xs text-muted-foreground">Message *</Label>
          <Textarea id="contact-message" required value={form.message} onChange={(event) => handleChange("message", event.target.value)} rows={6} className="border-border bg-secondary" placeholder="Describe the concern, relevant dates, and any reference numbers. Do not include passwords or one-time codes." />
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            {error} <Link to="/privacy" className="underline">Privacy information</Link>
          </div>
        )}

        <Button type="submit" disabled={submitting} className="h-12 w-full bg-cyan-500 text-sm font-semibold text-black hover:bg-cyan-400">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="mr-2" />}
          {submitting ? "Recording request..." : "Submit support request"}
        </Button>
      </form>
    </div>
  );
}
