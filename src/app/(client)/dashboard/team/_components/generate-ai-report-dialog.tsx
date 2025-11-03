"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, StopCircle, Copy } from "lucide-react";
import { WeekPicker, type WeekRange } from "./week-picker";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type WeekPreset = "this" | "last" | "last4" | "all" | "custom";
type Tone = "concise" | "balanced" | "detailed";
type TabValue = "preview" | "markdown";

interface IncludeSections {
  highlights: boolean;
  insights: boolean;
  recommendations: boolean;
  workload: boolean;
  sources: boolean;
}

interface StreamedItem {
  type: string;
  content?: string;
}

// Small Markdown cleanup (so preview looks neat while streaming)
function normalizeMarkdown(md: string) {
  if (!md) return md;
  let s = md.replace(/\r\n/g, "\n");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  // Ensure space after heading hashes
  s = s.replace(/^(#{1,6})([^\s#])/gm, "$1 $2");
  // Normalize bullets
  s = s.replace(/^\s*[•–—]\s*/gm, "- ");
  return s.trimEnd();
}

export function GenerateAiReportDialog() {
  const [open, setOpen] = React.useState(false);

  // Controls
  const [weekPreset, setWeekPreset] = React.useState<WeekPreset>("this");
  const [customWeek, setCustomWeek] = React.useState<WeekRange | null>(null);
  const [tone, setTone] = React.useState<Tone>("balanced");
  const [include, setInclude] = React.useState<IncludeSections>({
    highlights: true,
    insights: true,
    recommendations: true,
    workload: true,
    sources: false,
  });

  // Options
  const [autoTitle, setAutoTitle] = React.useState(true);

  // Streaming state
  const [isRunning, setIsRunning] = React.useState(false);
  const [rawReport, setRawReport] = React.useState(""); // plain markdown text as we stream
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const decoderRef = React.useRef(new TextDecoder());
  const bufferRef = React.useRef("");

  // UI state
  const [tab, setTab] = React.useState<TabValue>("preview");
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  const isCustom = weekPreset === "custom";
  const canStart =
    !isRunning &&
    (isCustom ? Boolean(customWeek?.start && customWeek?.end) : true);

  // Compose live markdown (with optional title injection)
  const composedMarkdown = React.useMemo(() => {
    const title = autoTitle ? `# Team Report — ${weekLabelShort()}\n\n` : "";
    const content = normalizeMarkdown(rawReport);
    // Only insert title if content doesn't already start with a heading
    if (autoTitle && !/^\s*#\s/.test(content)) return title + content;
    return content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawReport, autoTitle, weekPreset, customWeek]);

  // Autoscroll (both tabs share the same ScrollArea ref)
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawReport, tab]);

  function resetOutput() {
    setRawReport("");
    setError(null);
  }

  function closeDialog() {
    if (isRunning) handleStop();
    setOpen(false);
  }

  function handleStop() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }

  function handleCopy() {
    navigator.clipboard
      .writeText(composedMarkdown || rawReport)
      .catch(() => {});
  }

  function weekLabelShort() {
    if (isCustom && customWeek?.start && customWeek?.end) {
      return `${format(customWeek.start, "EEE dd MMM")} → ${format(
        customWeek.end,
        "EEE dd MMM",
      )}`;
    }
    return (
      {
        this: "This week",
        last: "Last week",
        last4: "Last 4 weeks",
        all: "All available",
        custom: "Custom week",
      } as const
    )[weekPreset];
  }

  async function handleStart() {
    try {
      setIsRunning(true);
      resetOutput();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      // Query params
      const qs = new URLSearchParams({
        weekPreset,
        tone,
        include_highlights: String(include.highlights),
        include_insights: String(include.insights),
        include_recommendations: String(include.recommendations),
        include_workload: String(include.workload),
        include_sources: String(include.sources),
      });

      if (isCustom && customWeek?.start && customWeek?.end) {
        qs.set("start", customWeek.start.toISOString().slice(0, 10));
        qs.set("end", customWeek.end.toISOString().slice(0, 10));
      }

      // Stream from your API → n8n (supports SSE/NDJSON/plain)
      const url = `/api/dashboard/team/generate-report?${qs.toString()}`;
      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream, application/x-ndjson, text/plain",
          "Cache-Control": "no-store",
        },
        body: JSON.stringify({ notes: null }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Upstream ${res.status} ${res.statusText}`);
      }

      const reader = res.body.getReader();
      const decoder = decoderRef.current;
      bufferRef.current = "";

      const append = (s: string) => setRawReport((prev) => prev + s);

      const ctype = res.headers.get("content-type") || "";
      const likelyNDJSON =
        ctype.includes("application/x-ndjson") ||
        ctype.includes("application/json");

      let endedByProtocol = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        bufferRef.current += chunk;

        const lines = bufferRef.current.split(/\r?\n/);
        bufferRef.current = lines.pop() ?? "";

        for (let raw of lines) {
          if (!raw) continue;
          if (raw.startsWith("data:")) raw = raw.replace(/^data:\s?/, "");

          // try JSON item
          let parsed: StreamedItem | null = null;
          if (likelyNDJSON || raw.startsWith("{")) {
            try {
              parsed = JSON.parse(raw) as StreamedItem;
            } catch {
              parsed = null;
            }
          }

          if (parsed && typeof parsed === "object") {
            const t = parsed.type;
            if (t === "item" && typeof parsed.content === "string") {
              append(parsed.content);
            } else if (t === "end") {
              endedByProtocol = true;
              try {
                await reader.cancel();
              } catch {
                // Ignore cancel errors
              }
              break;
            }
          } else {
            append(raw + "\n");
          }
        }

        if (endedByProtocol) break;
      }

      // Flush tail
      const tail = bufferRef.current.trim();
      if (tail) {
        let t = tail;
        if (t.startsWith("data:")) t = t.replace(/^data:\s?/, "");
        try {
          const pj = JSON.parse(t) as StreamedItem;
          if (pj?.type === "item" && typeof pj.content === "string") {
            append(pj.content);
          }
        } catch {
          append(t);
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== "AbortError") {
        setError(e.message || "Failed to generate report");
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }

  const weekLabel = weekLabelShort();

  const mdComponents: Components = {
    h1: ({ ...props }) => (
      <h1 className="mt-0 mb-3 text-2xl font-bold" {...props} />
    ),
    h2: ({ ...props }) => (
      <h2 className="mt-6 mb-2 text-xl font-semibold" {...props} />
    ),
    h3: ({ ...props }) => (
      <h3 className="mt-4 mb-2 text-lg font-semibold" {...props} />
    ),
    ul: ({ ...props }) => (
      <ul className="list-disc pl-5 space-y-1" {...props} />
    ),
    ol: ({ ...props }) => (
      <ol className="list-decimal pl-5 space-y-1" {...props} />
    ),
    p: ({ ...props }) => <p className="leading-6" {...props} />,
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => (v ? setOpen(true) : closeDialog())}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant="default">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate AI Report
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-5xl">
        <DialogHeader>
          <DialogTitle>Generate Team Report</DialogTitle>
          <DialogDescription>
            Choose a time window and options, then stream a tailored AI report
            for your team.
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Preset */}
          <div className="md:col-span-4 space-y-2">
            <Label>Week preset</Label>
            <Select
              value={weekPreset}
              onValueChange={(v) => setWeekPreset(v as WeekPreset)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this">This week</SelectItem>
                <SelectItem value="last">Last week</SelectItem>
                <SelectItem value="last4">Last 4 weeks</SelectItem>
                <SelectItem value="all">All available</SelectItem>
                <SelectItem value="custom">Custom week</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {weekLabel}
            </p>
          </div>

          {/* Custom week picker */}
          <div className="md:col-span-8 space-y-2">
            <Label>Select week (Mon–Sun)</Label>
            <WeekPicker
              value={customWeek}
              onChange={setCustomWeek}
              disabled={!isCustom || isRunning}
            />
          </div>

          {/* Tone */}
          <div className="md:col-span-4 space-y-2">
            <Label>Tone</Label>
            <Select
              value={tone}
              onValueChange={(v) => setTone(v as Tone)}
              disabled={isRunning}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sections */}
          <div className="md:col-span-8 space-y-2">
            <Label>Include sections</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {(
                [
                  ["highlights", "Highlights"],
                  ["insights", "Insights"],
                  ["recommendations", "Recommendations"],
                  ["workload", "Workload distribution"],
                  ["sources", "Sources"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={include[key]}
                    onCheckedChange={(v) =>
                      setInclude((s) => ({ ...s, [key]: Boolean(v) }))
                    }
                    disabled={isRunning}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Formatting options */}
          <div className="md:col-span-12 grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={autoTitle}
                onCheckedChange={(v) => setAutoTitle(Boolean(v))}
                disabled={isRunning}
              />
              Auto-insert title
            </label>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-2">
          <Label>Live report</Label>

          <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
            <TabsList className="mb-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>

            {/* Preview (ReactMarkdown) */}
            <TabsContent value="preview">
              <div className="border rounded-lg">
                <ScrollArea className="h-64">
                  <div
                    ref={scrollRef}
                    className="p-5 prose prose-sm dark:prose-invert max-w-none"
                  >
                    {error ? (
                      <div className="text-sm text-red-600">{error}</div>
                    ) : composedMarkdown ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        // Map headings to ensure consistent sizing with Tailwind Typography
                        components={mdComponents}
                      >
                        {composedMarkdown}
                      </ReactMarkdown>
                    ) : (
                      <div className="text-sm text-muted-foreground p-1">
                        {isRunning ? "Generating…" : "No content yet."}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Raw Markdown */}
            <TabsContent value="markdown">
              <div className="border rounded-lg">
                <ScrollArea className="h-64">
                  <div ref={scrollRef} className="p-3">
                    {error ? (
                      <div className="text-sm text-red-600">{error}</div>
                    ) : composedMarkdown ? (
                      <pre className="text-sm whitespace-pre-wrap leading-6">
                        {composedMarkdown}
                      </pre>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {isRunning ? "Generating…" : "No content yet."}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleCopy}
            disabled={!rawReport}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>

          {!isRunning ? (
            <Button type="button" onClick={handleStart} disabled={!canStart}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleStop}>
              <StopCircle className="mr-2 h-4 w-4" />
              Stop
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
