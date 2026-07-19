import React, { useState } from "react";
import { Loader2, Upload, Send, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SubmissionForm({ existing, onSubmit, submitting }) {
  const [content, setContent] = useState(existing?.content || "");
  const [processNote, setProcessNote] = useState(existing?.process_note || "");
  const [reflection, setReflection] = useState(existing?.reflection || "");
  const [files, setFiles] = useState([]);

  const canSubmit = content.trim().length > 0 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      content: content.trim(),
      process_note: processNote.trim(),
      reflection: reflection.trim(),
      files,
    });
  };

  return (
    <div className="space-y-4">
      {/* Main content */}
      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Submission Content <span className="text-red-400">*</span>
        </Label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={10}
          className="bg-secondary border-border text-sm"
          placeholder="Write your output here..."
        />
        <p className="text-[11px] text-muted-foreground mt-1">{content.length} characters</p>
      </div>

      {/* Process note */}
      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Process Note
        </Label>
        <Textarea
          value={processNote}
          onChange={e => setProcessNote(e.target.value)}
          rows={3}
          className="bg-secondary border-border text-sm"
          placeholder="Describe your process — what AI tools you used, what prompts worked, what you edited..."
        />
      </div>

      {/* Reflection */}
      <div>
        <Label className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5 block">
          Reflection
        </Label>
        <Textarea
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          rows={3}
          className="bg-secondary border-border text-sm"
          placeholder="What did you learn from this output? What would you improve? How did human judgment play a role?"
        />
      </div>

      {/* File upload */}
      <div>
        <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border cursor-pointer hover:border-cyan-500/30 transition-colors">
          <Upload size={14} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Attach files (optional)</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={e => setFiles(Array.from(e.target.files))}
          />
        </label>
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {files.length} file(s) selected: {files.map(f => f.name).join(", ")}
          </p>
        )}
        {existing?.file_urls?.length > 0 && files.length === 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-muted-foreground">Current files:</p>
            {existing.file_urls.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-400 hover:underline block truncate"
              >
                <FileText size={10} className="inline mr-1" />
                {url.split("/").pop()}
              </a>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full bg-cyan-500 text-black hover:bg-cyan-400 disabled:opacity-40"
      >
        {submitting ? (
          <><Loader2 size={14} className="animate-spin mr-2" /> Submitting...</>
        ) : (
          <><Send size={14} className="mr-2" /> {existing?.status === "Needs Revision" ? "Resubmit Output" : "Submit Output"}</>
        )}
      </Button>
    </div>
  );
}