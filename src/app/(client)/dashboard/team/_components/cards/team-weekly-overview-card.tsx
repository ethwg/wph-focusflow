import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamWeeklyOverviewChart } from "@/app/(client)/dashboard/team/_components/charts/team-weekly-overview-chart";

export function TeamWeeklyOverviewCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground">Weekly Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <TeamWeeklyOverviewChart />
      </CardContent>
    </Card>
  );
}
