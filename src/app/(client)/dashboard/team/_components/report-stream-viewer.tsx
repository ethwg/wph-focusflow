"use client";

import * as React from "react";
import { useEffect, useRef } from "react";

export function ReportStreamViewer({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  // auto-scroll as text grows
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [text]);

  return (
    <div ref={ref} className="max-h-[340px] overflow-y-auto">
      <pre className="whitespace-pre-wrap text-sm leading-6">
        {text || "Waiting for output…"}
      </pre>
    </div>
  );
}
