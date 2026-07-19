import React from "react";
import { Linkedin, Globe } from "lucide-react";

export default function EmployeeCard({
  photo,
  name,
  role,
  department,
  bio,
  tags = [],
  link,
  linkLabel,
  comingSoon = false,
}) {
  return (
    <div className={`card-glow rounded-xl overflow-hidden ${comingSoon ? "opacity-50" : ""}`}>
      <div className="relative aspect-[4/5] overflow-hidden border-b border-cyan-500/10">
        {photo ? (
          <img src={photo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-background flex items-center justify-center">
            <span className="text-4xl font-heading font-bold text-muted-foreground/30">
              {name?.charAt(0) || "?"}
            </span>
          </div>
        )}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Coming Soon
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-base font-heading font-semibold text-foreground">{name}</h3>
        <p className="text-xs text-cyan-400 font-medium mt-0.5">{role}</p>
        {department && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{department}</p>
        )}
        {bio && (
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{bio}</p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {tags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/5 border border-cyan-500/15 text-cyan-400/80"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-cyan-400 transition-colors mt-4"
          >
            {linkLabel?.toLowerCase().includes("linkedin") ? (
              <Linkedin size={12} />
            ) : (
              <Globe size={12} />
            )}
            {linkLabel}
          </a>
        )}
      </div>
    </div>
  );
}