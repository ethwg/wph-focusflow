"use client";

import { useEffect, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  AlertCircle,
  Plus,
  CalendarIcon,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  logId: number;
  date: string;
  time: string;
  dateTime: string;
  tool: string;
  toolId: number | null;
  toolCategory: string | null;
  actionDescription: string;
  minutes: number;
  status: string | null;
  showInReport: boolean;
}

interface Tool {
  tool_id: number;
  name: string;
}

interface ActionLogsData {
  activities: Activity[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    tools: Tool[];
  };
}

interface ManualEntryForm {
  title: string;
  toolId: string;
  date: Date | undefined;
  time: string;
  minutes: string;
}

export function ActionLogsTable() {
  const [data, setData] = useState<ActionLogsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortBy, setSortBy] = useState("event_time");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [toolFilter, setToolFilter] = useState("all");
  const [statusFilter] = useState("all");

  // Manual entry dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get default time
  const getDefaultTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const [formData, setFormData] = useState<ManualEntryForm>({
    title: "",
    toolId: "none",
    date: new Date(),
    time: getDefaultTime(),
    minutes: "",
  });

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchActionLogs();
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    sortBy,
    sortOrder,
    toolFilter,
    statusFilter,
  ]);

  const fetchActionLogs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        search: debouncedSearch,
        sortBy,
        sortOrder,
        tool: toolFilter,
        status: statusFilter,
      });

      const response = await fetch(`/api/dashboard/action-logs?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch action logs");
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      console.error("Error fetching action logs:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowInReport = async (logId: number, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/dashboard/action-logs", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logId,
          showInReport: !currentStatus,
        }),
      });

      if (response.ok) {
        // Update local state
        setData((prevData) => {
          if (!prevData) return null;
          return {
            ...prevData,
            activities: prevData.activities.map((activity) =>
              activity.logId === logId
                ? { ...activity, showInReport: !currentStatus }
                : activity,
            ),
          };
        });
      }
    } catch (err) {
      console.error("Error updating show in report status:", err);
    }
  };

  const handleManualEntry = async () => {
    if (
      !formData.title ||
      !formData.date ||
      !formData.time ||
      !formData.minutes
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine date and time into ISO string
      const [hours, minutes] = formData.time.split(":");
      const eventDateTime = new Date(formData.date);
      eventDateTime.setHours(parseInt(hours), parseInt(minutes));

      const response = await fetch("/api/dashboard/action-logs/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          toolId: formData.toolId === "none" ? null : parseInt(formData.toolId),
          eventTime: eventDateTime.toISOString(),
          minutes: parseInt(formData.minutes),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create action log");
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        toolId: "none",
        date: new Date(),
        time: getDefaultTime(),
        minutes: "",
      });
      setIsDialogOpen(false);

      // Refresh the table
      fetchActionLogs();
    } catch (err) {
      console.error("Error creating manual entry:", err);
      alert(err instanceof Error ? err.message : "Failed to create action log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (open) {
      // Reset form when opening dialog
      setFormData({
        title: "",
        toolId: "none",
        date: new Date(),
        time: getDefaultTime(),
        minutes: "",
      });
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by action description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={toolFilter} onValueChange={setToolFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by tool" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tools</SelectItem>
              {data?.filters.tools.map((tool) => (
                <SelectItem key={tool.tool_id} value={tool.tool_id.toString()}>
                  {tool.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add Manual Entry Button */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Manual Action Log</DialogTitle>
              <DialogDescription>
                Manually log an action that wasn&apos;t automatically tracked.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Action Description *</Label>
                <Textarea
                  id="title"
                  placeholder="e.g., Reviewed code pull request"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tool">Tool (Optional)</Label>
                <Select
                  value={formData.toolId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, toolId: value })
                  }
                >
                  <SelectTrigger id="tool">
                    <SelectValue placeholder="Select a tool" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {data?.filters.tools.map((tool) => (
                      <SelectItem
                        key={tool.tool_id}
                        value={tool.tool_id.toString()}
                      >
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Date & Time *</Label>
                <div className="flex gap-2">
                  {/* Date Picker */}
                  <Popover
                    open={isCalendarOpen}
                    onOpenChange={setIsCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          format(formData.date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          setFormData({ ...formData, date });
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Time Input */}
                  <div className="relative w-[130px]">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minutes">Duration (minutes) *</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="1"
                  placeholder="e.g., 30"
                  value={formData.minutes}
                  onChange={(e) =>
                    setFormData({ ...formData, minutes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleManualEntry}
                disabled={
                  isSubmitting ||
                  !formData.title ||
                  !formData.date ||
                  !formData.time ||
                  !formData.minutes
                }
              >
                {isSubmitting ? "Adding..." : "Add Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[140px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("event_time")}
                >
                  Date & Time
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("tool_id")}
                >
                  Tool
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent font-semibold"
                  onClick={() => handleSort("title")}
                >
                  Action Description
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[140px] text-center font-semibold">
                Show in Report
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeletons
              [...Array(pageSize)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.activities.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No action logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.activities.map((activity) => (
                <TableRow key={activity.logId} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.date}
                      </span>
                      <span className="text-xs text-gray-500">
                        {activity.time}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-white">
                      {activity.tool}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-900">
                      {activity.actionDescription}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        toggleShowInReport(
                          activity.logId,
                          activity.showInReport,
                        )
                      }
                      className={
                        activity.showInReport
                          ? "text-primary "
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      }
                    >
                      {activity.showInReport ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, data.pagination.total)} of{" "}
              {data.pagination.total} results
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {data.pagination.totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === data.pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(data.pagination.totalPages)}
              disabled={currentPage === data.pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
