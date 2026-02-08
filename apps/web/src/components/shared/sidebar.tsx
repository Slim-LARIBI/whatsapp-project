'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, Users, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const NavItem = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: any;
  label: string;
}) => {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      title={label}
      className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
        active ? 'bg-white/15' : 'hover:bg-white/10'
      )}
    >
      <Icon className={cn('w-5 h-5', active ? 'text-white' : 'text-white/80')} />
    </Link>
  );
};

export function Sidebar() {
  return (
    <aside className="w-16 bg-gradient-to-b from-slate-900 to-slate-950 text-white flex flex-col items-center py-3 gap-3">
      <div className="w-10 h-10 bg-whatsapp-green rounded-xl flex items-center justify-center font-bold">
        W
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        {/* Inbox */}
        <NavItem href="/inbox" icon={MessageSquare} label="Inbox" />

        {/* Ces 3 icônes = Contacts / Templates / Settings */}
        <NavItem href="/contacts" icon={Users} label="Contacts" />
        <NavItem href="/templates" icon={FileText} label="Templates" />
        <NavItem href="/settings" icon={Settings} label="Settings" />
      </div>

      <div className="flex-1" />
      <div className="text-[10px] text-white/50 pb-2">v0.1</div>
    </aside>
  );
}