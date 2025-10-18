import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { MainWelcomeCard } from "@/app/(client)/dashboard/_components/cards/main-welcome-card";
import { MainTaskListCard } from "@/app/(client)/dashboard/_components/cards/main-task-list-card";
import { MainWeeklyOverviewCard } from "@/app/(client)/dashboard/_components/cards/main-weekly-overview-card";
import { MainProjectTimeAllocationCard } from "@/app/(client)/dashboard/_components/cards/main-project-time-allocation-card";
import { MainQuickPublishReportCard } from "@/app/(client)/dashboard/_components/cards/main-quick-publish-report-card";
import { SideUsefulActionsLoggedCard } from "@/app/(client)/dashboard/_components/cards/side-useful-actions-logged-card";
import { SideDate } from "@/app/(client)/dashboard/_components/cards/side-date";
import { SideAiPoweredSummaryCard } from "@/app/(client)/dashboard/_components/cards/side-ai-powered-summary-card";
import { SideTodayActionLogCard } from "@/app/(client)/dashboard/_components/cards/side-today-action-log-card";

export function MainDashboardLayoutComponent() {
  return (
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel defaultSize={70} minSize={50}>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4">
              <MainWelcomeCard />
            </div>

            <MainTaskListCard />
            <div className="col-span-2">
              <MainWeeklyOverviewCard />
            </div>
            <MainProjectTimeAllocationCard />

            <div className="col-span-4">
              <MainQuickPublishReportCard />
            </div>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={30} minSize={20}>
        <div className="p-4 space-y-4">
          <SideDate />
          <SideUsefulActionsLoggedCard />
          <SideAiPoweredSummaryCard />
          <SideTodayActionLogCard />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
