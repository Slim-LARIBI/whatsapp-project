'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SidebarLeft from '@/components/layout/sidebar-left';
import SidebarRight from '@/components/layout/sidebar-right';
import { useUiStore } from '@/store/ui-store';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isInbox = pathname?.startsWith('/inbox');

  const inboxFocusMode = useUiStore((s) => s.inboxFocusMode);

  // ✅ Focus mode uniquement sur Inbox
  const hideRight = isInbox && inboxFocusMode;

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-gray-50">
      {/* LEFT */}
      <aside className="w-16 shrink-0 border-r bg-black text-white">
        <SidebarLeft />
      </aside>

      {/* CENTER */}
      <main className="flex-1 min-w-0 overflow-hidden">
        {children}
      </main>

      {/* RIGHT (hidden in Inbox focus mode) */}
      {!hideRight && (
        <aside className="w-[360px] shrink-0 border-l bg-white overflow-y-auto">
          <SidebarRight />
        </aside>
      )}
    </div>
  );
}