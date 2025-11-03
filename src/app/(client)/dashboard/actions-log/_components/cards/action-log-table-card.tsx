import { Card, CardContent } from "@/components/ui/card";
import { ActionLogsTable } from "@/app/(client)/dashboard/actions-log/_components/charts/action-log-table";

export function ActionLogTableCard() {
  return (
    <div>
      <Card>
        <CardContent>
          <ActionLogsTable />
        </CardContent>
      </Card>
    </div>
  );
}
