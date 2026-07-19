import React from "react";
import { Outlet } from "react-router-dom";
import PublicNav from "@/components/public/PublicNav";
import PublicFooter from "@/components/public/PublicFooter";
import RouteTransition from "@/components/RouteTransition";

export default function PublicLayout() {
  return (
    <div className="corporate-shell flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1 pt-[100px]">
        <RouteTransition>
          <Outlet />
        </RouteTransition>
      </main>
      <PublicFooter />
    </div>
  );
}
