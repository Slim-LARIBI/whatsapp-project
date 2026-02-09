"use client";

import React from "react";
import SidebarLeft from "@/components/layout/sidebar-left";
import SidebarRight from "@/components/layout/sidebar-right";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full bg-gray-50 overflow-hidden">
      {/* LEFT (ne scrolle pas) */}
      <aside className="w-16 shrink-0 border-r bg-black text-white overflow-hidden">
        <SidebarLeft />
      </aside>

      {/* CENTER (ne scrolle pas -> la page gère son propre scroll) */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {children}
      </main>

      {/* RIGHT (scrolle à l'intérieur du panel) */}
      <aside className="w-[360px] shrink-0 border-l bg-white overflow-hidden">
        <div className="h-dvh overflow-y-auto">
          <SidebarRight />
        </div>
      </aside>
    </div>
  );
}