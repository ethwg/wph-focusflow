"use client";

import { useEffect, useState } from "react";
import { TeamReportsPublishedCard } from "@/app/(client)/dashboard/team/_components/cards/team-reports-published-card";
import { TeamUsefulActionsWeekCard } from "@/app/(client)/dashboard/team/_components/cards/team-useful-actions-week-card";
import { TeamWeeklyOverviewCard } from "@/app/(client)/dashboard/team/_components/cards/team-weekly-overview-card";
import { TeamProjectTimeAllocation } from "@/app/(client)/dashboard/team/_components/cards/team-project-time-allocation";
import { TeamKnowledgeFeedCard } from "@/app/(client)/dashboard/team/_components/cards/team-knowledge-feed-card";
import { TeamPublishedReportsCard } from "@/app/(client)/dashboard/team/_components/cards/team-published-reports-card";
import { GenerateAiReportDialog } from "@/app/(client)/dashboard/team/_components/generate-ai-report-dialog";
import { TeamMembersDialog } from "@/app/(client)/dashboard/team/_components/team-members-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamDashboardLayout() {
  const [teamName, setTeamName] = useState<string>("Team");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeamName() {
      try {
        const res = await fetch("/api/dashboard/team/name");
        if (!res.ok) throw new Error("Failed to fetch team name");
        const data = await res.json();
        setTeamName(data.teamName || "Team");
      } catch (e) {
        console.error("Failed to load team name:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchTeamName();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-primary/80">Welcome to</div>
          <div className="text-primary font-medium text-xl">
            {loading ? (
              <Skeleton className="h-7 w-64 mt-1" />
            ) : (
              <p className="text-primary font-medium text-xl">
                {teamName} Dashboard
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TeamMembersDialog />
          <GenerateAiReportDialog />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2">
          <TeamReportsPublishedCard />
        </div>
        <div className="col-span-2">
          <TeamUsefulActionsWeekCard />
        </div>
        <div className="col-span-4">
          <TeamWeeklyOverviewCard />
        </div>
        <div className="col-span-2">
          <TeamProjectTimeAllocation />
        </div>
        <div className="col-span-2">
          <TeamKnowledgeFeedCard />
        </div>
        <div className="col-span-12">
          <TeamPublishedReportsCard />
        </div>
      </div>
    </div>
  );
}
