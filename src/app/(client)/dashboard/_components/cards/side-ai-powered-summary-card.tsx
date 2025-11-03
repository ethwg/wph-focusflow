"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import SideEmptyImage from "@/app/(client)/dashboard/_components/images/side-ai-powered-summary-empty.svg";

interface AISummaryData {
  hasSummary: boolean;
  summary?: {
    summaryId: number;
    summaryDate: string;
    aiSummary: string;
    totalActions: number;
    totalMinutes: number;
    timeAgo: string;
  };
}

export function SideAiPoweredSummaryCard() {
  const [data, setData] = useState<AISummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAISummary();
  }, []);

  const fetchAISummary = async () => {
    try {
      const response = await fetch("/api/dashboard/personal/ai-summary");

      if (!response.ok) {
        return;
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching AI summary:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <Sparkles className="h-5 w-5 mr-2" /> AI-Powered Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasSummary) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <Sparkles className="h-5 w-5 mr-2" /> AI-Powered Summary
          </CardTitle>
        </CardHeader>
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
      </Card>
    );
  }

  return (
    <Card className="pb-3">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center text-lg">
          <Sparkles className="h-5 w-5 mr-2" /> AI-Powered Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Summary Header */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{data.summary!.summaryDate}</span>
            <span className="italic">{data.summary!.timeAgo}</span>
          </div>

          {/* AI Summary Content */}
          <div className="text-sm text-gray-700 leading-relaxed">
            {data.summary!.aiSummary}
          </div>

          {/* Stats Footer */}
          <div className="flex items-center gap-4 pt-2 border-t text-xs text-muted-foreground">
            <div>
              <span className="font-medium">{data.summary!.totalActions}</span>{" "}
              actions
            </div>
            <div>
              <span className="font-medium">
                {Math.round(data.summary!.totalMinutes / 60)}h{" "}
                {data.summary!.totalMinutes % 60}m
              </span>{" "}
              logged
            </div>
          </div>

          {/* Last Updated Note */}
          <div className="text-xs text-center text-muted-foreground/70 italic pt-2">
            Last summary from your previous work session
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
