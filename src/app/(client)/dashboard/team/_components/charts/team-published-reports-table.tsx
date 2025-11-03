"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";

// ---- Types ----
type WeekPreset = "this" | "last" | "last4" | "all";

interface FeedRow {
  reportId: number;
  userId: number;
  userName: string;
  weekStart: string; // ISO
  weekEnd: string; // ISO
  publishedAt: string; // ISO
  usefulActions: number;
  summarySnippet: string | null;
}

interface FeedResponse {
  rows: FeedRow[];
  total: number;
  page: number;
  pageSize: number;
}

interface FullLogItem {
  log_id: number;
  event_time: string;
  minutes: number | null;
  title: string | null;
  tool_name: string | null;
}

// ---- Utilities ----
function formatPublished(iso: string) {
  const d = new Date(iso);
  // "published at 1-1-2025 at 9.40pm"
  const datePart = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  const hours = d.getHours();
  const mins = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `Published at ${datePart} at ${h12}.${mins}${ampm}`;
}

function humanRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return `${format(s, "MMM d")} - ${format(e, "MMM d, yyyy")}`;
}

// ---- Component ----
export function TeamPublishedReportTable() {
  // Data
  const [data, setData] = useState<FeedRow[]>([]);
  const [total, setTotal] = useState(0);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query state (search, filters, sort, pagination)
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [weekPreset, setWeekPreset] = useState<WeekPreset>("this");

  const [sortBy, setSortBy] = useState<
    "publishedAt" | "usefulActions" | "userName"
  >("publishedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogItems, setDialogItems] = useState<FullLogItem[]>([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch feed
  useEffect(() => {
    const controller = new AbortController();
    async function run() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          pageSize: String(pageSize),
          q: debouncedSearch,
          weekPreset,
          sortBy,
          sortDir: sortOrder,
        });
        const res = await fetch(
          `/api/dashboard/team/published-reports?${params}`,
          {
            signal: controller.signal,
          },
        );
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch published reports");
        }
        const json = (await res.json()) as FeedResponse;
        setData(json.rows);
        setTotal(json.total);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "An error occurred");
        setData([]);
        setTotal(0);
      } finally {
        setIsLoading(false);
      }
    }
    run();
    return () => controller.abort();
  }, [currentPage, pageSize, debouncedSearch, weekPreset, sortBy, sortOrder]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize],
  );

  // Handlers
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder((s) => (s === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
  };

  const handlePageSizeChange = (v: string) => {
    setPageSize(parseInt(v));
    setCurrentPage(1);
  };

  const openDialogForRow = (row: FeedRow) => {
    setDialogTitle(
      `${row.userName} — ${humanRange(row.weekStart, row.weekEnd)}`,
    );
    setDialogOpen(true);
    setDialogLoading(true);

    const params = new URLSearchParams({
      userId: String(row.userId),
      weekStart: row.weekStart,
      weekEnd: row.weekEnd,
    });

    fetch(`/api/dashboard/team/user-week-log?${params}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        const items = (await r.json()) as FullLogItem[];
        setDialogItems(items);
      })
      .catch((e) => {
        console.error(e);
        setDialogItems([]);
      })
      .finally(() => setDialogLoading(false));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="whitespace-pre-wrap">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or summary…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Week Preset */}
          <Select
            value={weekPreset}
            onValueChange={(v: WeekPreset) => {
              setWeekPreset(v);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
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
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead className="w-[220px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("userName")}
                >
                  User
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead className="w-[180px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("usefulActions")}
                >
                  Useful actions logged
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead>
                <span className="font-semibold">Summary snippet</span>
              </TableHead>

              <TableHead className="w-[260px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("publishedAt")}
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>

              <TableHead className="w-[140px] text-right font-semibold">
                View
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              // Loading skeletons
              [...Array(pageSize)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-56" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No published reports found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={`${row.reportId}-${row.userId}`}
                  className="hover:bg-muted/30"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">
                        {row.userName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {humanRange(row.weekStart, row.weekEnd)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm">{row.usefulActions}</span>
                  </TableCell>

                  <TableCell>
                    <span className="text-sm text-foreground line-clamp-1">
                      {row.summarySnippet ?? "—"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="whitespace-normal">
                      {formatPublished(row.publishedAt)}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDialogForRow(row)}
                    >
                      View full log
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, total)} of {total} results
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Full Log */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Full activity log</DialogTitle>
            <DialogDescription>{dialogTitle}</DialogDescription>
          </DialogHeader>

          {dialogLoading ? (
            <div className="py-8 space-y-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : dialogItems.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No activities for this period.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Tool</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="text-right">Minutes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dialogItems.map((it) => (
                    <TableRow key={it.log_id}>
                      <TableCell>
                        {new Date(it.event_time).toLocaleString("en-AU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>{it.tool_name ?? "—"}</TableCell>
                      <TableCell className="max-w-[420px] truncate">
                        {it.title ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {it.minutes ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
