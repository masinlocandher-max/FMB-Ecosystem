import React from "react";

const COLORS = {
  "Pending Review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Accepted": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Waitlisted": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Rejected": "bg-red-500/10 text-red-400 border-red-500/20",
  "Enrolled": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "On Track": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Needs Attention": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "At Risk": "bg-red-500/10 text-red-400 border-red-500/20",
  "Completed": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Removed": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "Not Started": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "In Progress": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Submitted": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Needs Revision": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "Passed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Failed": "bg-red-500/10 text-red-400 border-red-500/20",
  "Not Eligible": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "Under Review": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Approved": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Issued": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Pending": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "Confirmed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Waived": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Active": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Upcoming": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Archived": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "Applications Open": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Locked": "bg-gray-700/30 text-gray-500 border-gray-600/20",
  "Available": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Ready for Review": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Incomplete": "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function StatusBadge({ status }) {
  const color = COLORS[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  return (
    <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {status}
    </span>
  );
}