import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck } from "lucide-react";
import Image from "next/image";
import SideEmptyImage from "@/app/(client)/dashboard/_components/images/side-today-action-log-empty.svg";

export function SideTodayActionLogCard() {
  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <ClipboardCheck className="h-5 w-5 mr-2" /> Today&apos;s Action Log
        </CardTitle>
        <CardContent>
          <div className="flex items-center justify-center my-47">
            <div className="space-y-4">
              <div className="flex justify-center items-center">
                <Image
                  src={SideEmptyImage}
                  alt={"Empty Image"}
                  height={52}
                  width={52}
                />
              </div>
              <div className="text-muted-foreground text-sm text-center">
                Your progress story begins once you take action.
              </div>
            </div>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
