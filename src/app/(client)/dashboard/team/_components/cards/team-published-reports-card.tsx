import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamPublishedReportTable } from "@/app/(client)/dashboard/team/_components/charts/team-published-reports-table";

export function TeamPublishedReportsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-muted-foreground">
          Published Reports Feed
        </CardTitle>
      </CardHeader>

      <CardContent>
        <TeamPublishedReportTable />
      </CardContent>
    </Card>
  );
}
