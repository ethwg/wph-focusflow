import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainWeeklyOverviewChart } from "@/app/(client)/dashboard/_components/charts/main-weekly-overview-chart";
import { Calendar } from "lucide-react";

export function MainWeeklyOverviewCard() {
  return (
    <Card className="pb-3 flex h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <Calendar className="h-5 w-5 mr-2" /> Weekly Overview
        </CardTitle>
        <CardContent>
          <MainWeeklyOverviewChart />
        </CardContent>
      </CardHeader>
    </Card>
  );
}
