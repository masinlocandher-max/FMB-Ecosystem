import React, { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

function displayName(fileReference, fallback = "Open file") {
  if (!fileReference) return fallback;
  const clean = fileReference.split("?")[0];
  const finalPart = clean.split("/").pop();
  return finalPart || fallback;
}

export default function SecureFileLink({ fileReference, label, className = "" }) {
  const [opening, setOpening] = useState(false);
  const { toast } = useToast();

  const openFile = async () => {
    if (!fileReference || opening) return;
    setOpening(true);
    try {
      let target = fileReference;
      try {
        const result = await base44.integrations.Core.CreateFileSignedUrl({
          file_uri: fileReference,
          expires_in: 300,
        });
        if (result?.signed_url) target = result.signed_url;
      } catch {
        // Public legacy links can still be opened directly.
      }
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast({ title: "Could not open file", description: error.message, variant: "destructive" });
    } finally {
      setOpening(false);
    }
  };

  return (
    <button
      type="button"
      onClick={openFile}
      disabled={opening}
      className={`inline-flex items-center gap-1.5 text-left text-cyan-400 hover:underline disabled:opacity-60 ${className}`}
    >
      {opening ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
      <span className="truncate">{label || displayName(fileReference)}</span>
    </button>
  );
}
