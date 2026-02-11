'use client';

import React from 'react';
import SidebarLeft from '@/components/layout/sidebar-left';
import SidebarRight from '@/components/layout/sidebar-right';

/**
 * STABLE APP SHELL (SAFE)
 * - Left & Right restent fixes
 * - Le centre scrolle (pas les sidebars)
 * - Compatible toutes pages sous /app/(app)/*
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gray-50">
      {/* LEFT (fixed) */}
      <aside className="w-16 shrink-0 border-r bg-black text-white">
        <SidebarLeft />
      </aside>

      {/* CENTER (scroll area) */}
      <section className="flex-1 min-w-0 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          {children}
        </div>
      </section>

      {/* RIGHT (fixed) */}
      <aside className="w-[360px] shrink-0 border-l bg-white overflow-hidden">
        <div className="h-full overflow-y-auto">
          <SidebarRight />
        </div>
      </aside>
    </div>
  );
}