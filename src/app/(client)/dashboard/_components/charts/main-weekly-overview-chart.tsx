"use client";

import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Legend,
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
  actions: number;
  minutes: number;
}

interface WeeklyOverviewData {
  chartData: ChartDataPoint[];
  summary: {
    totalActions: number;
    totalMinutes: number;
    totalHours: number;
    averageActionsPerDay: number;
    averageMinutesPerDay: number;
    weekStart: string;
    weekEnd: string;
  };
}

const chartConfig = {
  actions: {
    label: "Actions",
    color: "var(--primary)",
  },
  minutes: {
    label: "Minutes",
    color: "var(--secondary)",
  },
} satisfies ChartConfig;

export function MainWeeklyOverviewChart() {
  const [data, setData] = useState<WeeklyOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.

  useEffect(() => {
    fetchWeeklyOverview();
  }, [weekOffset]);

  const fetchWeeklyOverview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/dashboard/personal/weekly-overview?weekOffset=${weekOffset}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch weekly overview");
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching weekly overview:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startFormatted = start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endFormatted = end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  if (isLoading) {
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

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="w-full flex items-center gap-4 justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousWeek}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center">
          <span className="text-sm font-medium text-gray-900">
            {formatDateRange(data.summary.weekStart, data.summary.weekEnd)}
          </span>
          {weekOffset !== 0 && (
            <Button
              variant="link"
              size="sm"
              onClick={goToCurrentWeek}
              className="h-auto p-0 text-xs text-primary"
            >
              Back to Current Week
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextWeek}
          disabled={weekOffset === 0}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data.chartData}
            margin={{
              left: 12,
              right: 12,
              bottom: 12,
            }}
          >
            <CartesianGrid vertical={false} />
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
            <Line
              dataKey="actions"
              type="monotone"
              stroke="var(--color-actions)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-actions)",
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "var(--color-actions)",
              }}
            />
            <Line
              dataKey="minutes"
              type="monotone"
              stroke="var(--color-minutes)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-minutes)",
                r: 4,
              }}
              activeDot={{
                r: 6,
                fill: "var(--color-minutes)",
              }}
            />
            <Legend iconType="circle" />
          </LineChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
}
