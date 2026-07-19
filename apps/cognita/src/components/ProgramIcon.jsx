import React from "react";

const ICONS = {
  "open-learning": (
    <>
      <path d="M7 6.5h9.5A2.5 2.5 0 0 1 19 9v9.5H9.5A2.5 2.5 0 0 1 7 16V6.5Z" />
      <path d="M7 18.5V9A2.5 2.5 0 0 0 4.5 6.5H3v9A3 3 0 0 0 6 18.5h1Z" />
      <path d="m13 10 3 2-3 2v-4Z" fill="currentColor" stroke="none" />
    </>
  ),
  "professional-programs": (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="3" />
      <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
      <path d="m8 14 2 2 5-5" />
    </>
  ),
  "assessment-credentialing": (
    <>
      <path d="M12 3.5 19 6v5.5c0 4.3-2.8 7.5-7 9-4.2-1.5-7-4.7-7-9V6l7-2.5Z" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </>
  ),
  "institutional-training": (
    <>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M8 20v-7h8v7M3 20h18M8 9h.01M12 9h.01M16 9h.01" />
    </>
  ),
};

export default function ProgramIcon({ name, size = 28, className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name] || ICONS["open-learning"]}
    </svg>
  );
}
