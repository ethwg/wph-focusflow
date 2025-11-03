"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  Brain,
  CheckCircle2,
  ListTree,
  BookText,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Feed {
  highlights: string[];
  insights: string[];
  recommendations: string[];
  workload_distribution: string[];
  sources: string[];
}

interface ApiResponse {
  highlights?: unknown;
  insights?: unknown;
  recommendations?: unknown;
  workload_distribution?: unknown;
  sources?: unknown;
}

function SectionIcon({ title }: { title: string }) {
  const t = title.toLowerCase();
  if (t.includes("highlight")) return <Lightbulb className="h-4 w-4" />;
  if (t.includes("insight")) return <Brain className="h-4 w-4" />;
  if (t.includes("recommend")) return <CheckCircle2 className="h-4 w-4" />;
  if (t.includes("workload")) return <ListTree className="h-4 w-4" />;
  if (t.includes("source")) return <BookText className="h-4 w-4" />;
  return <Lightbulb className="h-4 w-4" />;
}

function LoadingSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-muted-foreground">
          Team Knowledge Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Section 1 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Separator />

        {/* Section 2 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Separator />

        {/* Section 3 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <Separator />

        {/* Section 4 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Separator />

        {/* Section 5 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <SectionIcon title={title} />
        {title}
      </div>
      {items?.length ? (
        <ul className="text-sm space-y-1 list-disc pl-5">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-muted-foreground/80">No items.</div>
      )}
    </div>
  );
}

export function TeamKnowledgeFeedCard() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        setErrMsg(null);

        const url = "/api/dashboard/team/knowledge-feed?weekPreset=this";
        const res = await fetch(url, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const rawText = await res.clone().text();
        console.groupCollapsed("[KnowledgeFeed] fetch");
        console.log("URL:", url);
        console.log("Status:", res.status, res.statusText);
        console.log("Content-Type:", res.headers.get("content-type"));
        console.log("Raw body:", rawText);

        if (!res.ok) {
          console.groupEnd();
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        }

        let data: unknown;
        try {
          data = JSON.parse(rawText);
        } catch {
          data = rawText;
        }
        console.log("Parsed:", data);

        const apiData = data as ApiResponse;
        const feedObj: Feed =
          data && typeof data === "object"
            ? {
                highlights: Array.isArray(apiData.highlights)
                  ? apiData.highlights
                  : [],
                insights: Array.isArray(apiData.insights)
                  ? apiData.insights
                  : [],
                recommendations: Array.isArray(apiData.recommendations)
                  ? apiData.recommendations
                  : [],
                workload_distribution: Array.isArray(
                  apiData.workload_distribution,
                )
                  ? apiData.workload_distribution
                  : [],
                sources: Array.isArray(apiData.sources) ? apiData.sources : [],
              }
            : {
                highlights: [],
                insights: [],
                recommendations: [],
                workload_distribution: [],
                sources: [],
              };

        console.log("Normalized Feed:", feedObj);
        console.groupEnd();

        if (!cancelled) setFeed(feedObj);
      } catch (e) {
        console.error("[KnowledgeFeed] error:", e);
        const errorMessage =
          e instanceof Error ? e.message : "Failed to load feed";
        if (!cancelled) setErrMsg(errorMessage);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (errMsg) {
    return (
      <Card className="h-full flex items-center justify-center text-sm text-muted-foreground">
        {errMsg}
      </Card>
    );
  }

  if (!feed) {
    return (
      <Card className="h-full flex items-center justify-center text-sm text-muted-foreground">
        No insights available for this period.
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-muted-foreground">
          Team Knowledge Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-[470px] pr-2 space-y-2 hover:border rounded-lg p-2 hover:shadow-sm">
          <div className="space-y-4">
            <Section title="Highlights" items={feed.highlights} />
            <Separator />
            <Section title="Insights" items={feed.insights} />
            <Separator />
            <Section title="Recommendations" items={feed.recommendations} />
            <Separator />
            <Section
              title="Workload Distribution"
              items={feed.workload_distribution}
            />
            <Separator />
            <Section title="Sources" items={feed.sources} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
