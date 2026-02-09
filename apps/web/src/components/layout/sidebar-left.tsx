"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Inbox, LayoutTemplate, GitBranch, Users, Settings } from "lucide-react";

const items = [
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/automations", label: "Automations", icon: GitBranch },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SidebarLeft() {
  const pathname = usePathname();

  return (
    <div className="h-dvh w-16 flex flex-col items-center py-3 gap-2">
      <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center font-bold">
        W
      </div>

      <div className="mt-3 flex-1 flex flex-col items-center gap-2">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname?.startsWith(it.href + "/");
          const Icon = it.icon;

          return (
            <Link
              key={it.href}
              href={it.href}
              title={it.label}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition",
                active ? "bg-white/15" : "hover:bg-white/10"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  active ? "text-white" : "text-white/80"
                )}
              />
            </Link>
          );
        })}
      </div>

      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold">
        SL
      </div>
    </div>
  );
}