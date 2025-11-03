import { Card, CardContent } from "@/components/ui/card";
import { ActionLogsCalendar } from "@/app/(client)/dashboard/actions-log/_components/charts/action-log-calender";

export function ActionLogCalenderCard() {
  return (
    <div>
      <Card>
        <CardContent>
          <ActionLogsCalendar />
        </CardContent>
      </Card>
    </div>
  );
}
