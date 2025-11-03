"use client";

import { useEffect, useState } from "react";
import { MousePointerClick } from "lucide-react";

export function SideUsefulActionsLoggedCard() {
  const [totalActions, setTotalActions] = useState(32);

  useEffect(() => {
    fetchUsefulActions();
  }, []);

  const fetchUsefulActions = async () => {
    try {
      const response = await fetch("/api/dashboard/personal/useful-actions");

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setTotalActions(data.totalActions);
    } catch (err) {
      console.error("Error fetching useful actions:", err);
    }
  };

  return (
    <div className="flex w-full gap-6 border p-3 bg-primary/20 rounded-xl">
      <div className="w-14 h-14 rounded-xl bg-primary/40 text-primary flex items-center justify-center">
        <MousePointerClick className="h-8 w-8" />
      </div>
      <div className="text-primary">
        <span className="font-medium">Useful Actions Logged</span>
        <div className="font-semibold text-2xl">{totalActions}</div>
      </div>
    </div>
  );
}
