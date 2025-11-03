"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { ActionLogTopCards } from "@/app/(client)/dashboard/actions-log/_components/cards/action-log-top-cards";
import { ActionLogTableCard } from "@/app/(client)/dashboard/actions-log/_components/cards/action-log-table-card";
import { ActionLogCalenderCard } from "@/app/(client)/dashboard/actions-log/_components/cards/action-log-calender-card";

type ViewMode = "table" | "calendar";

export function ActionsLogDashboardLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const toggleView = () => {
    setViewMode(viewMode === "table" ? "calendar" : "table");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-primary text-xl font-medium">Action Log</p>
          <p className="text-primary/80">A list of useful actions logged</p>
        </div>
        <div>
          <Button
            size="lg"
            variant={viewMode === "calendar" ? "default" : "outline"}
            onClick={toggleView}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ActionLogTopCards />

        {viewMode === "table" ? (
          <ActionLogTableCard />
        ) : (
          <ActionLogCalenderCard />
        )}
      </div>
    </div>
  );
}
