import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ExternalLink, FileText, Library, Loader2, Search, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/curriculum/EmptyState";
import { getCurriculumForTrack } from "@/lib/curriculum-utils";

export default function StudentLibrary() {
  const [student, setStudent] = useState(null);
  const [learningSources, setLearningSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Resources");

  useEffect(() => {
    const load = async () => {
      try {
        const user = await base44.auth.me();
        const students = await base44.entities.Student.filter({ email: user.email });
        const currentStudent = students[0] || null;
        setStudent(currentStudent);
        if (currentStudent) {
          try {
            const sources = await base44.entities.LearningSource.list("title", 500);
            setLearningSources(sources.filter((source) => source.status === "Approved" && source.public_to_learners === true));
          } catch {
            setLearningSources([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const curriculum = useMemo(() => student ? getCurriculumForTrack(student.track) : [], [student]);

  const resources = useMemo(() => {
    const programResources = curriculum.map((week) => ({
      id: `week-${week.week}`,
      title: week.title,
      category: week.phase,
      description: week.learningObjective,
      meta: `Week ${week.week} · ${week.requiredOutput}`,
      path: `/student/lesson/${week.week}`,
      external: false,
    }));

    const controlledSources = learningSources
      .filter((source) => !source.tracks?.length || source.tracks.includes(student?.track))
      .map((source) => ({
        id: source.source_id || source.id,
        title: source.title,
        category: source.source_type || "Learning Source",
        description: `${source.author_or_organization}${source.publication_date ? ` · ${source.publication_date}` : ""}`,
        meta: `${source.source_id || "Source"}${source.last_reviewed_at ? ` · Reviewed ${new Date(source.last_reviewed_at).toLocaleDateString()}` : ""}`,
        path: source.url || source.document_location,
        external: true,
      }));

    const institutionalResources = [
      {
        id: "academic-policy",
        title: "Academic and Assessment Standards",
        category: "Institutional Guide",
        description: "Review Cognita's output-based learning, revision, human portfolio audit, and credential requirements.",
        meta: "Program governance",
        path: "/program",
        external: false,
      },
      {
        id: "privacy",
        title: "Learner Privacy Policy",
        category: "Institutional Guide",
        description: "Understand how accounts, learner records, private files, support concerns, portfolio audits, and credentials are handled.",
        meta: "Privacy and records",
        path: "/privacy",
        external: false,
      },
      {
        id: "terms",
        title: "Learner Terms of Use",
        category: "Institutional Guide",
        description: "Read the rules governing enrollment, access, payments, evidence, human review, intellectual property, and credentials.",
        meta: "Learner responsibilities",
        path: "/terms",
        external: false,
      },
    ];

    return [...programResources, ...controlledSources, ...institutionalResources];
  }, [curriculum, learningSources, student]);

  const categories = ["All Resources", ...new Set(resources.map((resource) => resource.category))];
  const filteredResources = resources.filter((resource) => {
    const matchesCategory = category === "All Resources" || resource.category === category;
    const text = `${resource.title} ${resource.description} ${resource.meta}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>;
  if (!student) return <EmptyState icon={Library} title="Library access is not active yet" description="The Learning Resource Center becomes available after enrollment and access requirements are completed." />;

  const ResourceCard = ({ resource }) => {
    const content = (
      <>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-sky-400/15 bg-sky-400/7">
          {resource.category === "Institutional Guide" ? <ShieldCheck size={18} className="text-sky-300" /> : <BookOpen size={18} className="text-sky-300" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground group-hover:text-sky-200">{resource.title}</h3>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-sky-400/65">{resource.category}</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{resource.meta}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-sky-300">Open resource <ExternalLink size={12} /></span>
          </div>
        </div>
      </>
    );

    if (resource.external) {
      return <a href={resource.path} target="_blank" rel="noopener noreferrer" className="corporate-panel group flex items-start gap-4 rounded-xl p-5 transition hover:border-sky-400/30">{content}</a>;
    }
    return <Link to={resource.path} className="corporate-panel group flex items-start gap-4 rounded-xl p-5 transition hover:border-sky-400/30">{content}</Link>;
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-400/70">Academic Support</p>
        <h1 className="mt-2 text-2xl font-bold md:text-3xl">Learning Resource Center</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Access program guides, institutional policies, and approved learning sources. Only sources marked Approved and public to learners appear in this catalogue.</p>
      </div>

      <section className="corporate-panel mb-6 rounded-xl p-5 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <label htmlFor="library-search" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Search the resource center</label>
            <div className="relative mt-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input id="library-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic, source, lesson, or output" className="h-11 w-full rounded-lg border border-border bg-background/70 pl-10 pr-4 text-sm outline-none transition focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/10" /></div>
          </div>
          <div>
            <label htmlFor="library-category" className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Collection</label>
            <select id="library-category" value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 h-11 min-w-56 rounded-lg border border-border bg-background/70 px-3 text-sm outline-none transition focus:border-sky-400/50">
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Resource Catalogue</h2><span className="text-xs text-muted-foreground">{filteredResources.length} item{filteredResources.length === 1 ? "" : "s"}</span></div>
          <div className="space-y-3">
            {filteredResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
            {filteredResources.length === 0 && <div className="corporate-panel rounded-xl p-10 text-center"><FileText size={24} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-medium">No matching resources</p><p className="mt-1 text-xs text-muted-foreground">Try another search term or collection.</p></div>}
          </div>
        </section>

        <aside className="space-y-5">
          <section className="corporate-panel rounded-xl p-5">
            <div className="flex items-center gap-2"><Library size={16} className="text-sky-300" /><h2 className="text-sm font-semibold">Library Access</h2></div>
            <div className="mt-4 space-y-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Enrolled learner</p><p className="mt-1 font-medium">{student.full_name}</p></div>
              <div><p className="text-xs text-muted-foreground">Program track</p><p className="mt-1 font-medium">{student.track}</p></div>
              <div><p className="text-xs text-muted-foreground">Approved source records</p><p className="mt-1 font-medium">{learningSources.length}</p></div>
            </div>
          </section>
          <section className="rounded-xl border border-amber-400/15 bg-amber-400/5 p-5">
            <h2 className="text-sm font-semibold text-amber-200">Resource Use Policy</h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Do not redistribute restricted materials. AI summaries are not substitutes for the recorded source. Verify changing platform, legal, price, safety, and product information against the current authoritative source.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
