import React from "react";
import { Smartphone, Copy, Search } from "lucide-react";

export default function AdminPlayStore() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Smartphone size={20} className="text-cyan-400" />
        <h1 className="text-2xl font-heading font-bold">Play Store Listing</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Copy and assets for the Google Play Store listing.</p>

      <div className="space-y-6">
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Copy size={14} className="text-cyan-400" />
            <h2 className="text-sm font-semibold">Short Description</h2>
          </div>
          <p className="text-sm text-foreground/80">Selective AI academy for practical learning, outputs, and verified skill.</p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Copy size={14} className="text-cyan-400" />
            <h2 className="text-sm font-semibold">Full Description</h2>
          </div>
          <div className="text-sm text-foreground/80 space-y-4 leading-relaxed">
            <p>Cognita AI is a selective learning app from Cognita Institute of Artificial Intelligence. It is designed for students, creatives, professionals, and future-ready learners who want practical AI training with real outputs, guided review, portfolio development, and verified certification.</p>
            <p>Unlike generic online courses, Cognita is application-based. Students are accepted into structured batches, complete weekly outputs, receive facilitator feedback, and build a portfolio of practical AI-assisted work.</p>
            <p>The 10-week Cognita learning journey includes AI foundations, prompt engineering, critical thinking, research and verification, specialization tracks, workflow design, portfolio building, and capstone review.</p>
            <p>Certificates are not automatic. Cognita certificates are issued only after required outputs are completed, reviewed, and approved.</p>
            <div>
              <p className="font-semibold text-foreground mb-2">Key Features:</p>
              <ul className="space-y-1">
                {[
                  "Application-based enrollment",
                  "10-week AI learning structure",
                  "AI foundation lessons",
                  "Specialization tracks",
                  "Weekly output submissions",
                  "Facilitator feedback",
                  "Portfolio tracking",
                  "Certificate eligibility review",
                  "Public certificate verification",
                ].map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-1 flex-shrink-0">·</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="font-medium text-foreground">Cognita believes AI skill must be demonstrated, not claimed.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Search size={14} className="text-cyan-400" />
            <h2 className="text-sm font-semibold">Keywords</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "AI education", "AI training", "prompt engineering", "AI academy",
              "AI learning", "AI for creatives", "AI for professionals",
              "AI certification", "AI portfolio", "digital skills",
              "future skills", "practical AI", "online academy",
            ].map((kw, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full border border-border/50 bg-secondary/50 text-foreground/70">{kw}</span>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={14} className="text-cyan-400" />
            <h2 className="text-sm font-semibold">Screenshot Sections</h2>
          </div>
          <div className="space-y-3">
            {[
              { title: "Homepage Hero", text: "Cognita AI — AI Training That Proves Skill, Not Attendance" },
              { title: "Application Screen", text: "Apply for the Next Batch" },
              { title: "Student Dashboard", text: "Current Week · Progress · Pending Tasks · Certificate Status" },
              { title: "Curriculum Screen", text: "10-Week Learning Path" },
              { title: "Submission & Feedback", text: "Submit Output · Facilitator Feedback" },
              { title: "Certificate Verification", text: "Verify a Cognita Certificate" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                <span className="text-xs font-mono font-bold text-cyan-400 flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold mb-3">Primary CTA</h2>
          <p className="text-sm text-foreground/80">Apply for the Next Batch</p>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-3">App Identity</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">App Name</span>
              <span className="font-medium">Cognita AI</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Full Institution Name</span>
              <span className="font-medium text-right">Cognita Institute of Artificial Intelligence</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">Education</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">Selective AI Academy App</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
          <h2 className="text-sm font-semibold text-cyan-400 mb-3">Demo Access (Internal Testing Only)</h2>
          <p className="text-xs text-muted-foreground mb-4">Demo accounts for testing flows. Passwords must be set after accepting the invite email.</p>
          <div className="space-y-2">
            {[
              { role: "Admin", email: "admin@cognita.ai" },
              { role: "Facilitator", email: "facilitator@cognita.ai" },
              { role: "Student", email: "student@cognita.ai" },
              { role: "Applicant", email: "applicant@cognita.ai" },
            ].map((acc, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 border border-border/30">
                <div>
                  <p className="text-sm font-medium">{acc.role}</p>
                  <p className="text-xs text-cyan-400">{acc.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}