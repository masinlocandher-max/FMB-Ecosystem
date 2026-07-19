import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ACTIVE_TRACKS } from "@/lib/curriculum";
import { CheckCircle, Loader2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import CinematicBackground from "@/components/CinematicBackground";

export default function Teach() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", location: "",
    current_occupation: "", years_of_experience: 3,
    ai_skill_level: 7, teaching_experience: "",
    preferred_tracks: [], why_teach: "", teaching_philosophy: "",
    portfolio_url: "", linkedin_url: "",
    agrees_to_review_weekly: false, agrees_to_rubric_standards: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const toggleTrack = (track) => {
    setForm(f => ({
      ...f,
      preferred_tracks: f.preferred_tracks.includes(track)
        ? f.preferred_tracks.filter(t => t !== track)
        : [...f.preferred_tracks, track],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.agrees_to_review_weekly || !form.agrees_to_rubric_standards) {
      setError("You must confirm both statements to proceed.");
      return;
    }
    if (form.preferred_tracks.length === 0) {
      setError("Please select at least one preferred track.");
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.TeacherApplication.create({
        ...form,
        status: "Pending Review",
      });
      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <CinematicBackground className="min-h-[70vh] flex items-center justify-center px-5 sm:px-6 pt-16 pb-12">
        <div className="text-center max-w-md card-glow rounded-xl p-8">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-2xl font-heading font-bold mb-3">Application Received</h1>
          <p className="text-muted-foreground leading-relaxed">
            Thank you for your interest in teaching at Cognita. Our team reviews every educator application carefully. We'll contact you via email regarding next steps.
          </p>
        </div>
      </CinematicBackground>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 sm:px-6 pt-20 pb-20">
      <div className="flex items-center gap-3 mb-4">
        <GraduationCap size={24} className="text-cyan-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">Educator Application</p>
      </div>
      <h1 className="text-2xl md:text-4xl font-heading font-bold mb-3">Teach at Cognita</h1>
      <p className="text-sm md:text-base text-muted-foreground mb-10">
        Cognita facilitators review student outputs, provide feedback, and uphold our standards. We accept educators who believe in output-based learning.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 card-glow rounded-xl p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Full Name *</Label>
            <Input required value={form.full_name} onChange={e => handleChange("full_name", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Email *</Label>
            <Input required type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Phone Number *</Label>
            <Input required value={form.phone} onChange={e => handleChange("phone", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Location *</Label>
            <Input required value={form.location} onChange={e => handleChange("location", e.target.value)} className="bg-secondary border-border" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Current Occupation *</Label>
            <Input required value={form.current_occupation} onChange={e => handleChange("current_occupation", e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Years of Experience</Label>
            <Input type="number" min={0} max={50} value={form.years_of_experience} onChange={e => handleChange("years_of_experience", Number(e.target.value))} className="bg-secondary border-border" />
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
            <span>AI Skill Level</span>
            <span className="text-cyan-400 font-mono">{form.ai_skill_level}/10</span>
          </Label>
          <Slider value={[form.ai_skill_level]} onValueChange={v => handleChange("ai_skill_level", v[0])} min={1} max={10} step={1} />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Teaching / Training Experience *</Label>
          <Textarea required value={form.teaching_experience} onChange={e => handleChange("teaching_experience", e.target.value)} rows={3} placeholder="Describe your prior teaching, training, or mentoring experience..." className="bg-secondary border-border" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-3">Preferred Tracks (select all that apply) *</Label>
          <div className="space-y-2">
            {ACTIVE_TRACKS.map(track => (
              <div key={track} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                <Checkbox checked={form.preferred_tracks.includes(track)} onCheckedChange={() => toggleTrack(track)} className="mt-0.5" />
                <p className="text-sm text-muted-foreground">{track}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Why do you want to teach at Cognita? *</Label>
          <Textarea required value={form.why_teach} onChange={e => handleChange("why_teach", e.target.value)} rows={4} placeholder="Tell us why you want to join as a facilitator..." className="bg-secondary border-border" />
        </div>

        <div>
          <Label className="text-xs text-muted-foreground mb-1.5">Teaching Philosophy</Label>
          <Textarea value={form.teaching_philosophy} onChange={e => handleChange("teaching_philosophy", e.target.value)} rows={3} placeholder="How do you approach teaching and student development?" className="bg-secondary border-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">Portfolio URL</Label>
            <Input value={form.portfolio_url} onChange={e => handleChange("portfolio_url", e.target.value)} placeholder="https://..." className="bg-secondary border-border" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5">LinkedIn URL</Label>
            <Input value={form.linkedin_url} onChange={e => handleChange("linkedin_url", e.target.value)} placeholder="https://linkedin.com/in/..." className="bg-secondary border-border" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50">
            <Checkbox checked={form.agrees_to_review_weekly} onCheckedChange={v => handleChange("agrees_to_review_weekly", v)} className="mt-0.5" />
            <p className="text-sm text-muted-foreground">
              I agree to review student submissions weekly and provide timely feedback using the Cognita rubric.
            </p>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border/50">
            <Checkbox checked={form.agrees_to_rubric_standards} onCheckedChange={v => handleChange("agrees_to_rubric_standards", v)} className="mt-0.5" />
            <p className="text-sm text-muted-foreground">
              I agree to uphold Cognita's output-based standards. I will not pass students who do not meet the rubric criteria.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="btn-glow w-full h-12 text-sm font-semibold border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20">
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "SUBMIT APPLICATION"}
        </Button>
      </form>
    </div>
  );
}