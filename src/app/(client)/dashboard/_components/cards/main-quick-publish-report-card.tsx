import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import MainEmptyImage from "../images/main-quick-publish-report-empty.svg";
import { FileText } from "lucide-react";

export function MainQuickPublishReportCard() {
  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2" /> Quick Publish Report
        </CardTitle>
        <CardContent>
          <div className="flex items-center justify-center my-8">
            <div className="space-y-4">
              <div>
                <Image
                  src={MainEmptyImage}
                  alt={"Empty Image"}
                  height={300}
                  width={300}
                />
              </div>
              <div className="text-muted-foreground text-sm text-center">
                Reports come alive as you start achieving.
              </div>
            </div>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
