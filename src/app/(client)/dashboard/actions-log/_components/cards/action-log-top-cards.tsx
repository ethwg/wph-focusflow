"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

interface ActionLogStats {
  totalActionsThisWeek: number;
  averageActionsPerDay: number;
  topUsedTool: string;
  longestStreakDays: number;
}

const toolIcons: Record<string, string> = {
  GitHub: "/assets/icons/github.svg",
  Figma: "/assets/icons/figma.svg",
  Trello: "/assets/icons/trello.svg",
  Slack: "/assets/icons/slack.svg",
  WhatsApp: "/assets/icons/whatsapp.svg",
  Zoom: "/assets/icons/zoom.svg",
  FB: "/assets/icons/facebook.svg",
  IG: "/assets/icons/instagram.svg",
  TikTok: "/assets/icons/tiktok.svg",
  Jira: "/assets/icons/jira.svg",
  Notion: "/assets/icons/notion.svg",
  Calendar: "/assets/icons/calendar.svg",
  Sheets: "/assets/icons/sheets.svg",
};

export function ActionLogTopCards() {
  const [stats, setStats] = useState<ActionLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/action-logs/stats");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching action log stats:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="rounded-sm py-10">
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-7 w-16 ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="rounded-sm py-10 border-l-8 border-l-primary">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">Total Actions this Week</div>
            <div className="font-semibold text-muted-foreground text-lg">
              {stats.totalActionsThisWeek}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-sm py-10 border-l-8 border-l-teal-500">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">
              Average Useful Actions per Day
            </div>
            <div className="font-semibold text-muted-foreground text-lg">
              {stats.averageActionsPerDay}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-sm py-10 border-l-8 border-l-orange-500">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">Top Used Tool</div>
            <div className="flex items-center gap-2">
              {toolIcons[stats.topUsedTool] ? (
                <Image
                  src={toolIcons[stats.topUsedTool]}
                  alt={stats.topUsedTool}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {stats.topUsedTool.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-muted-foreground text-lg">
                {stats.topUsedTool}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-sm py-10 border-l-8 border-l-amber-500">
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-muted-foreground">
              Longest Streak of Days with Logged Actions
            </div>
            <div className="font-semibold text-muted-foreground text-lg">
              {stats.longestStreakDays}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
