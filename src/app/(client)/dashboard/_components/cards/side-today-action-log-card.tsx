"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Clock } from "lucide-react";
import Image from "next/image";
import SideEmptyImage from "@/app/(client)/dashboard/_components/images/side-today-action-log-empty.svg";

interface ActionLog {
  logId: number;
  title: string;
  time: string;
  minutes: number;
  status: string | null;
  toolName: string | null;
  toolCategory: string | null;
  actionType: string | null;
}

interface TodayActionsData {
  hasActions: boolean;
  actions: ActionLog[];
  summary: {
    totalActions: number;
    totalMinutes: number;
    totalHours: number;
    remainingMinutes: number;
  };
}

export function SideTodayActionLogCard() {
  const [data, setData] = useState<TodayActionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodayActions();
  }, []);

  const fetchTodayActions = async () => {
    try {
      const response = await fetch("/api/dashboard/personal/today-actions");

      if (!response.ok) {
        return;
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching today's actions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="pb-3">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <ClipboardCheck className="h-5 w-5 mr-2" /> Today&apos;s Action Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.hasActions) {
    return (
      <Card className="pb-3 min-h-[440px]">
        <CardHeader>
          <CardTitle className="text-muted-foreground flex items-center text-lg">
            <ClipboardCheck className="h-5 w-5 mr-2" /> Today&apos;s Action Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center my-8">
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
      </Card>
    );
  }

  return (
    <Card className="pb-3 min-h-[370px]">
      <CardHeader>
        <CardTitle className="text-muted-foreground flex items-center justify-between text-lg">
          <div className="flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2" /> Today&apos;s Action Log
          </div>
          <Badge variant="secondary" className="text-xs">
            {data.summary.totalActions} action
            {data.summary.totalActions !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[290px] overflow-y-auto">
          {data.actions.map((action) => (
            <div
              key={action.logId}
              className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {action.title}
                  </h4>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {action.time}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {action.toolName && (
                    <Badge variant="outline" className="text-xs bg-white">
                      {action.toolName}
                    </Badge>
                  )}
                  {action.minutes > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{action.minutes}m</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total time logged today</span>
            <span className="font-semibold text-gray-900">
              {data.summary.totalHours > 0 && `${data.summary.totalHours}h `}
              {data.summary.remainingMinutes}m
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
