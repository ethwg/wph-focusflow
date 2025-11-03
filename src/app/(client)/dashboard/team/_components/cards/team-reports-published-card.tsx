"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";

interface ReportsPublishedData {
  publishedCount: number;
  totalMembers: number;
  date: string;
  teamName: string;
}

export function TeamReportsPublishedCard() {
  const [data, setData] = useState<ReportsPublishedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportsPublished() {
      try {
        setLoading(true);
        const response = await fetch("/api/dashboard/team/reports-published");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch reports data");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching reports published:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchReportsPublished();
  }, []);

  return (
    <Card className="bg-secondary/40 h-full">
      <CardContent>
        <div className="flex-col gap-8 items-center justify-center space-y-18 mt-8">
          <div className="flex justify-center">
            <ClipboardList className="h-20 w-20 rounded-xl bg-primary/20 p-4 text-primary" />
          </div>
          <div className="text-center text-primary font-medium">
            Reports Published Today
          </div>
          <div className="text-4xl font-semibold text-center text-primary">
            {loading ? (
              <Skeleton className="h-8 w-16 mx-auto" />
            ) : error ? (
              <span className="text-sm text-destructive">{error}</span>
            ) : data ? (
              `${data.publishedCount}/${data.totalMembers}`
            ) : (
              "0/0"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
