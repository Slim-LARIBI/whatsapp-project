"use client";

import React, { useMemo, useState } from "react";
import { useInboxStore } from "@/store/inbox-store";
import { cn } from "@/lib/utils";
import { Search, Pin, CheckCircle2, CircleDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type FilterKey = "all" | "unread" | "open" | "closed";

export default function ConversationListPro() {
  const { conversations, selectedConversationId, selectConversation } = useInboxStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [pinned, setPinned] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = Array.isArray(conversations) ? [...conversations] : [];

    if (filter === "unread") list = list.filter((c: any) => (Number(c?.unreadCount) || 0) > 0);
    if (filter === "open") list = list.filter((c: any) => String(c?.status) === "open");
    if (filter === "closed") list = list.filter((c: any) => String(c?.status) === "closed");

    if (q) {
      list = list.filter((c: any) =>
        String(c?.contact?.name || "").toLowerCase().includes(q) ||
        String(c?.contact?.phone || "").includes(search)
      );
    }

    list.sort((a: any, b: any) => {
      const ap = pinned[a.id] ? 1 : 0;
      const bp = pinned[b.id] ? 1 : 0;
      if (ap !== bp) return bp - ap;
      return String(b?.lastMessageAt || "").localeCompare(String(a?.lastMessageAt || ""));
    });

    return list;
  }, [conversations, search, filter, pinned]);

  const totalUnread = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    return list.reduce((s: number, c: any) => s + (Number(c?.unreadCount) || 0), 0);
  }, [conversations]);

  const Chip = ({ k, label }: { k: FilterKey; label: string }) => (
    <button
      onClick={() => setFilter(k)}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border transition",
        filter === k
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
      )}
    >
      {label}
      {k === "unread" && totalUnread > 0 && (
        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-green-600 text-white">
          {totalUnread}
        </span>
      )}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Inbox</div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 border text-gray-700">
            UX v2
          </span>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / phone…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Chip k="all" label="All" />
          <Chip k="unread" label="Unread" />
          <Chip k="open" label="Open" />
          <Chip k="closed" label="Closed" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((c: any) => {
          const active = selectedConversationId === c.id;
          const name = c?.contact?.name || c?.contact?.phone || "Unknown";
          const initial = String(name)[0]?.toUpperCase() || "?";
          const status = String(c?.status || "open");
          const unread = Number(c?.unreadCount) || 0;

          return (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={cn(
                "w-full px-4 py-3 flex items-start gap-3 border-b border-gray-100 text-left transition",
                active ? "bg-green-50" : "hover:bg-gray-50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-medium shrink-0">
                {initial}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-medium text-sm truncate">{name}</div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {c?.lastMessageAt
                      ? formatDistanceToNow(new Date(c.lastMessageAt), { addSuffix: true })
                      : ""}
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusPill status={status} />
                    {c?.aiIntent && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 truncate">
                        {String(c.aiIntent)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {unread > 0 && (
                      <span className="bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full min-w-[24px] text-center">
                        {unread}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPinned((m) => ({ ...m, [c.id]: !m[c.id] }));
                      }}
                      className={cn(
                        "p-1 rounded-md hover:bg-white/70",
                        pinned[c.id] ? "text-yellow-600" : "text-gray-400"
                      )}
                      title="Pin (mock)"
                    >
                      <Pin size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No conversations found.</div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status === "closed" ? "closed" : "open";
  const Icon = s === "open" ? CircleDot : CheckCircle2;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border",
        s === "open"
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-gray-100 border-gray-200 text-gray-700"
      )}
    >
      <Icon size={12} />
      {s}
    </span>
  );
}