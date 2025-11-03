"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";

type WeekPreset = "this" | "last" | "last4" | "all";

type Allocation = { category: string; minutes: number };
type Row = {
  userId: number;
  userName: string;
  totalMinutes: number;
  allocations: Allocation[];
};

type ApiResponse = {
  teamName: string;
  weekPreset: WeekPreset;
  rows: Row[];
};

function fmtMinutes(m: number) {
  if (!m) return "0m";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h ${mm}m` : `${mm}m`;
}

export function TeamProjectTimeAllocation() {
  const [weekPreset, setWeekPreset] = useState<WeekPreset>("this");
  const [search] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [, setTeamName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ weekPreset });
        const res = await fetch(
          `/api/dashboard/team/project-time-allocation?${params}`,
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ApiResponse;
        setRows(json.rows);
        setTeamName(json.teamName);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "An error occurred");
        setRows([]);
      } finally {
        setIsLoading(false);
      }
    }
    run();
    return () => controller.abort();
  }, [weekPreset]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows
      .map((r) => ({
        ...r,
        allocations: r.allocations.filter(
          (a) =>
            r.userName.toLowerCase().includes(q) ||
            a.category.toLowerCase().includes(q),
        ),
      }))
      .filter(
        (r) => r.userName.toLowerCase().includes(q) || r.allocations.length > 0,
      );
  }, [rows, search]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex-col items-center ">
          <span className="text-muted-foreground">Project Time Allocation</span>
          <div className="flex-col items-center gap-4 space-y-2 mt-4">
            <Select
              value={weekPreset}
              onValueChange={(v: WeekPreset) => setWeekPreset(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Week filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this">This week</SelectItem>
                <SelectItem value="last">Last week</SelectItem>
                <SelectItem value="last4">Last 4 weeks</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="whitespace-pre-wrap">
              {error}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center my-16">
            <div className="space-y-2 text-muted-foreground text-center">
              <div className="flex justify-center">
                <ClipboardList className="h-12 w-12" />
              </div>
              <div className="text-sm">No allocation yet.</div>
              <div className="text-sm">Try changing filters or timeframe.</div>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[420px] pr-2">
            <div className="space-y-6">
              {filtered.map((r) => {
                const top = r.allocations.slice(0, 5);
                const max = top[0]?.minutes || 1;
                return (
                  <div key={r.userId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{r.userName}</div>
                      <Badge variant="secondary">
                        {fmtMinutes(r.totalMinutes)} total
                      </Badge>
                    </div>

                    {top.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No categories recorded.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {top.map((a) => {
                          const pct = Math.round((a.minutes / max) * 100);
                          return (
                            <div key={a.category} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className="truncate">{a.category}</span>
                                <span className="text-muted-foreground">
                                  {fmtMinutes(a.minutes)}
                                </span>
                              </div>
                              <Progress value={pct} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
