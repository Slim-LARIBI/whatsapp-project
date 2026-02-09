'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Inbox,
  LayoutTemplate,
  GitBranch,
  Users,
  BarChart3,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
} from 'lucide-react';

// ✅ Optional: pull live unread count from your inbox store (safe fallback if empty)
import { useInboxStore } from '@/store/inbox-store';

type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number | string;
};

const COLLAPSE_KEY = 'wa.sidebar.collapsed';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { conversations } = useInboxStore();

  const unreadTotal = useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.reduce((sum: number, c: any) => sum + (Number(c?.unreadCount) || 0), 0);
  }, [conversations]);

  const [collapsed, setCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw === '1') setCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  const nav: NavItem[] = [
    { key: 'inbox', label: 'Inbox', href: '/inbox', icon: Inbox, badge: unreadTotal > 0 ? unreadTotal : undefined },
    { key: 'templates', label: 'Templates', href: '/templates', icon: LayoutTemplate },
    { key: 'automations', label: 'Automations', href: '/automations', icon: GitBranch, badge: 'Mock' },
    { key: 'contacts', label: 'Contacts', href: '/contacts', icon: Users },
    { key: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3, badge: 'Soon' },
  ];

  const goQuickNew = (target: 'template' | 'automation') => {
    if (target === 'template') router.push('/templates');
    if (target === 'automation') router.push('/automations');
  };

  return (
    <aside
      className={cn(
        'h-screen border-r border-gray-200 bg-white flex flex-col',
        collapsed ? 'w-[72px]' : 'w-[260px]',
      )}
    >
      {/* Top / Brand */}
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-whatsapp-green text-white flex items-center justify-center font-bold">
            W
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight truncate">WhatsApp Platform</div>
              <div className="text-xs text-gray-500 truncate">Workspace: Demo</div>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          aria-label="Toggle sidebar"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Quick Actions */}
      <div className={cn('px-3 py-3 border-b border-gray-200', collapsed && 'px-2')}>
        <div className={cn('grid gap-2', collapsed ? 'grid-rows-2' : 'grid-cols-2')}>
          <button
            onClick={() => goQuickNew('template')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm py-2',
              collapsed && 'px-0',
            )}
            title="New Template"
          >
            <Plus size={16} />
            {!collapsed && <span>Template</span>}
          </button>

          <button
            onClick={() => goQuickNew('automation')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm py-2',
              collapsed && 'px-0',
            )}
            title="New Automation"
          >
            <Plus size={16} />
            {!collapsed && <span>Automation</span>}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-2 text-[11px] text-gray-500">
            Quick actions (mock) → open the module and click <b>New</b>.
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 overflow-y-auto py-2', collapsed ? 'px-2' : 'px-3')}>
        <div className="space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== '/' && pathname?.startsWith(item.href + '/'));

            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  active ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} className={cn(active ? 'text-green-700' : 'text-gray-500')} />

                {!collapsed && (
                  <>
                    <span className="flex-1 min-w-0 truncate">{item.label}</span>

                    {item.badge !== undefined && item.badge !== 0 && (
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border',
                          active
                            ? 'bg-white border-green-200 text-green-700'
                            : 'bg-gray-100 border-gray-200 text-gray-700',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-gray-200 p-3', collapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
            SL
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">Slim</div>
              <div className="text-xs text-gray-500 truncate">Admin</div>
            </div>
          )}

          {!collapsed && (
            <div className="flex items-center gap-1">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Settings"
                onClick={() => router.push('/settings')}
              >
                <Settings size={18} />
              </button>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Logout"
                onClick={() => alert('Mock logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>

        {collapsed && (
          <div className="mt-2 flex items-center justify-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              title="Settings"
              onClick={() => router.push('/settings')}
            >
              <Settings size={18} />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
              title="Logout"
              onClick={() => alert('Mock logout')}
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}