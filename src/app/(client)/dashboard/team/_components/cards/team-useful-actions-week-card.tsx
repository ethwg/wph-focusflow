"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MousePointerClick } from "lucide-react";
import { useEffect, useState } from "react";

interface UsefulActionsData {
  totalActions: number;
  previousWeekActions: number;
  percentageChange: number;
  weekStart: string;
  teamName: string;
}

export function TeamUsefulActionsWeekCard() {
  const [data, setData] = useState<UsefulActionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsefulActions() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/team/useful-actions-week");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch actions data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching useful actions:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchUsefulActions();
  }, []);

  const formatPercentageChange = (change: number) => {
    const sign = change > 0 ? "+" : "";
    return `${sign}${change}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-primary";
    if (change < 0) return "text-primary";
    return "text-muted-foreground";
  };

  return (
    <Card className="bg-secondary/40 h-full">
      <CardContent>
        <div className="flex-col gap-8 items-center justify-center space-y-18 mt-8">
          <div className="flex justify-center">
            <MousePointerClick className="h-20 w-20 rounded-xl bg-primary/20 p-4 text-primary" />
          </div>
          <div className="text-center text-primary font-medium">
            Total Useful Actions This Week
          </div>
          <div className="text-4xl font-semibold text-center text-primary">
            {loading ? (
              <Skeleton className="h-10 w-32 mx-auto" />
            ) : error ? (
              <span className="text-sm text-destructive">{error}</span>
            ) : data ? (
              <>
                {data.totalActions}{" "}
                <span
                  className={`text-sm ${getChangeColor(data.percentageChange)}`}
                >
                  ( {formatPercentageChange(data.percentageChange)} )
                </span>
              </>
            ) : (
              "0"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
