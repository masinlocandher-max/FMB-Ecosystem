import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-8 md:p-12 text-center">
      {Icon && <Icon size={32} className="text-muted-foreground mx-auto mb-4" />}
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}