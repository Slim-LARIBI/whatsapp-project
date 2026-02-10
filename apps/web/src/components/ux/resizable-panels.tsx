"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  storageKey?: string;
  minRight?: number;
  maxRight?: number;
  defaultRight?: number;
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
};

export default function ResizablePanels({
  storageKey = "wa.ui.rightWidth",
  minRight = 300,
  maxRight = 520,
  defaultRight = 360,
  left,
  center,
  right,
  leftWidth = "w-96",
}: Props) {
  const [rightW, setRightW] = useState<number>(defaultRight);
  const dragRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const n = raw ? Number(raw) : NaN;
      if (!Number.isNaN(n)) setRightW(clamp(n, minRight, maxRight));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    try {
      localStorage.setItem(storageKey, String(rightW));
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const vw = window.innerWidth;
    const next = clamp(vw - e.clientX, minRight, maxRight);
    setRightW(next);
  };

  const rightStyle = useMemo(() => ({ width: `${rightW}px` }), [rightW]);

  return (
    <div className="h-full w-full flex overflow-hidden">
      {/* LEFT */}
      <aside className={cn(leftWidth, "shrink-0 border-r border-gray-200 bg-white overflow-hidden flex flex-col")}>
        {left}
      </aside>

      {/* CENTER */}
      <section className="flex-1 min-w-0 overflow-hidden bg-white">
        {center}
      </section>

      {/* RESIZER */}
      <div
        className="w-2 shrink-0 cursor-col-resize bg-transparent hover:bg-gray-200/60 active:bg-gray-300/60"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerMove={onPointerMove}
        title="Resize panel"
        role="separator"
        aria-orientation="vertical"
      >
        <div className="h-full w-full flex items-center justify-center">
          <div className="h-10 w-1 rounded-full bg-gray-300" />
        </div>
      </div>

      {/* RIGHT */}
      <aside className="shrink-0 border-l border-gray-200 bg-white overflow-hidden" style={rightStyle}>
        <div className="h-full overflow-y-auto">{right}</div>
      </aside>
    </div>
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}