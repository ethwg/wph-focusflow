import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import SideEmptyImage from "@/app/(client)/dashboard/_components/images/side-ai-powered-summary-empty.svg";

export function SideAiPoweredSummaryCard() {
  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <Sparkles className="h-5 w-5 mr-2" /> AI-Powered Summary
        </CardTitle>
        <CardContent>
          <div className="flex items-center justify-center my-8">
            <div className="space-y-4">
              <div className="flex justify-center items-center">
                <Image
                  src={SideEmptyImage}
                  alt={"Empty Image"}
                  height={48}
                  width={48}
                />
              </div>
              <div className="text-muted-foreground text-sm text-center">
                The summary writes itself as you work.
              </div>
            </div>
          </div>
        </CardContent>
      </CardHeader>
    </Card>
  );
}
