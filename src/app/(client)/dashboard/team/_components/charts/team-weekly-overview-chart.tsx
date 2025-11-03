"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartDataPoint {
  day: string;
  [key: string]: number | string;
}

interface WeeklyOverviewData {
  chartData: ChartDataPoint[];
  tools: string[];
  teamName: string;
  weekStart: string;
  weekEnd: string;
}

interface ToolColors {
  current: string;
  last: string;
}

interface ErrorResponse {
  error?: string;
}

const toolColors: Record<string, ToolColors> = {
  GitLab: { current: "#10b981", last: "#86efac" },
  Jira: { current: "#f97316", last: "#fdba74" },
  Slack: { current: "#3b82f6", last: "#93c5fd" },
  GitHub: { current: "#8b5cf6", last: "#c4b5fd" },
  Figma: { current: "#ec4899", last: "#f9a8d4" },
  Trello: { current: "#06b6d4", last: "#67e8f9" },
  WhatsApp: { current: "#22c55e", last: "#86efac" },
  Zoom: { current: "#6366f1", last: "#a5b4fc" },
  FB: { current: "#3b82f6", last: "#93c5fd" },
  IG: { current: "#ec4899", last: "#f9a8d4" },
  TikTok: { current: "#14b8a6", last: "#5eead4" },
  Notion: { current: "#000000", last: "#737373" },
  Calendar: { current: "#f59e0b", last: "#fcd34d" },
  Sheets: { current: "#10b981", last: "#86efac" },
};

export function TeamWeeklyOverviewChart() {
  const [data, setData] = useState<WeeklyOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0=current, -1=last, etc.

  useEffect(() => {
    const fetchWeeklyOverview = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/dashboard/team/weekly-overview?weekOffset=${weekOffset}`,
        );
        if (!res.ok) {
          const e = (await res.json()) as ErrorResponse;
          throw new Error(e.error || "Failed to fetch weekly data");
        }
        const json = (await res.json()) as WeeklyOverviewData;
        setData(json);
      } catch (err) {
        console.error("Error fetching team weekly overview:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchWeeklyOverview();
  }, [weekOffset]);

  const goPrev = () => setWeekOffset((p) => p - 1);
  const goNext = () => setWeekOffset((p) => p + 1);
  const goCurrent = () => setWeekOffset(0);

  const formatDateRange = (startIso?: string, endIso?: string): string => {
    if (!startIso || !endIso) return "";
    const start = new Date(startIso);
    const end = new Date(endIso);
    const s = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const e = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${s} - ${e}`;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px] w-full" />
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

  if (!data || data.chartData.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Build dynamic chart config for legend/colors
  const chartConfig: ChartConfig = {};
  data.tools.forEach((tool) => {
    const colors: ToolColors = toolColors[tool] ?? {
      current: "#64748b",
      last: "#cbd5e1",
    };
    chartConfig[`${tool}_current`] = {
      label: `${tool} (selected)`,
      color: colors.current,
    };
    chartConfig[`${tool}_last`] = {
      label: `${tool} (previous)`,
      color: colors.last,
    };
  });

  return (
    <div className="space-y-4 w-full">
      {/* Week navigation */}
      <div className="w-full flex items-center gap-4 justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-900">
            {data.teamName} • {formatDateRange(data.weekStart, data.weekEnd)}
          </span>
          {weekOffset !== 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={goCurrent}
              className="h-auto p-0 text-xs text-primary"
            >
              Back to Current Week
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={weekOffset === 0}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legend pills (current vs previous) */}
      <div className="mb-2">
        <div className="flex flex-wrap gap-4">
          {data.tools.map((tool) => {
            const colors: ToolColors = toolColors[tool] ?? {
              current: "#64748b",
              last: "#cbd5e1",
            };
            return (
              <div key={tool} className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.current }}
                  />
                  <span className="text-muted-foreground">
                    {tool} (selected)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors.last }}
                  />
                  <span className="text-muted-foreground">
                    {tool} (previous)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data.chartData}
            margin={{ left: 12, right: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            {/* Selected week */}
            {data.tools.map((tool) => {
              const colors: ToolColors = toolColors[tool] ?? {
                current: "#64748b",
                last: "#cbd5e1",
              };
              return (
                <Line
                  key={`${tool}_current`}
                  dataKey={`${tool}_current`}
                  type="monotone"
                  stroke={colors.current}
                  strokeWidth={2}
                  dot={false}
                />
              );
            })}
            {/* Previous week */}
            {data.tools.map((tool) => {
              const colors: ToolColors = toolColors[tool] ?? {
                current: "#64748b",
                last: "#cbd5e1",
              };
              return (
                <Line
                  key={`${tool}_last`}
                  dataKey={`${tool}_last`}
                  type="monotone"
                  stroke={colors.last}
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="5 5"
                />
              );
            })}
          </LineChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
}
