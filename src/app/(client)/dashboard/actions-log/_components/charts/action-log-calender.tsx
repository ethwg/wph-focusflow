"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  MoreHorizontal,
  Plus,
  CalendarIcon as CalendarIconLucide,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarSidebar } from "./action-log-calender-sidebar";

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

interface TimeSlot {
  hour: number;
  activities: Activity[];
}

interface DayColumn {
  date: Date;
  dayName: string;
  dayNumber: number;
  timeSlots: TimeSlot[];
}

interface ManualEntryForm {
  title: string;
  toolId: string;
  date: Date | undefined;
  time: string;
  minutes: string;
}

interface WorkingHours {
  start: string;
  end: string;
  monday?: { start: string; end: string; enabled: boolean };
  tuesday?: { start: string; end: string; enabled: boolean };
  wednesday?: { start: string; end: string; enabled: boolean };
  thursday?: { start: string; end: string; enabled: boolean };
  friday?: { start: string; end: string; enabled: boolean };
  saturday?: { start: string; end: string; enabled: boolean };
  sunday?: { start: string; end: string; enabled: boolean };
}

// Tool icons mapping
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

// Tool colors mapping
const getToolColor = (toolName: string): string => {
  const colors: { [key: string]: string } = {
    GitHub: "bg-teal-100 border-teal-300 text-teal-900",
    Figma: "bg-pink-100 border-pink-300 text-pink-900",
    Trello: "bg-blue-100 border-blue-300 text-blue-900",
    Slack: "bg-purple-100 border-purple-300 text-purple-900",
    WhatsApp: "bg-green-100 border-green-300 text-green-900",
    Zoom: "bg-indigo-100 border-indigo-300 text-indigo-900",
    FB: "bg-blue-100 border-blue-300 text-blue-900",
    IG: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900",
    TikTok: "bg-slate-100 border-slate-300 text-slate-900",
    Jira: "bg-orange-100 border-orange-300 text-orange-900",
    Notion: "bg-gray-100 border-gray-300 text-gray-900",
    Calendar: "bg-violet-100 border-violet-300 text-violet-900",
    Sheets: "bg-emerald-100 border-emerald-300 text-emerald-900",
    default: "bg-blue-100 border-blue-300 text-blue-900",
  };
  return colors[toolName] || colors.default;
};

const getToolDotColor = (toolName: string): string => {
  const colors: { [key: string]: string } = {
    GitHub: "bg-teal-500",
    Figma: "bg-pink-500",
    Trello: "bg-blue-500",
    Slack: "bg-purple-500",
    WhatsApp: "bg-green-500",
    Zoom: "bg-indigo-500",
    FB: "bg-blue-500",
    IG: "bg-fuchsia-500",
    TikTok: "bg-slate-500",
    Jira: "bg-orange-500",
    Notion: "bg-gray-500",
    Calendar: "bg-violet-500",
    Sheets: "bg-emerald-500",
    default: "bg-blue-500",
  };
  return colors[toolName] || colors.default;
};

export function ActionLogsCalendar() {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }), // Start week on Monday
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toolFilter, setToolFilter] = useState("all");
  const [isMonthCalendarOpen, setIsMonthCalendarOpen] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    start: "09:00",
    end: "17:00",
  });

  // Manual entry dialog state
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntryCalendarOpen, setIsEntryCalendarOpen] = useState(false);

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

  // Generate hours array based on working hours
  const getHoursArray = () => {
    const startHour = parseInt(workingHours.start.split(":")[0]);
    const endHour = parseInt(workingHours.end.split(":")[0]);
    const hoursCount = endHour - startHour;
    return Array.from({ length: hoursCount }, (_, i) => i + startHour);
  };

  // Check if a specific day is a working day
  const isWorkingDay = (date: Date): boolean => {
    const dayName = format(date, "EEEE").toLowerCase() as
      | "monday"
      | "tuesday"
      | "wednesday"
      | "thursday"
      | "friday"
      | "saturday"
      | "sunday";

    const daySettings = workingHours[dayName];

    // If day-specific settings exist, use them; otherwise default to enabled
    return daySettings?.enabled !== false;
  };

  // Get working hours for a specific day

  const hours = getHoursArray();

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [currentWeekStart, toolFilter]);

  const fetchWorkingHours = async () => {
    try {
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        console.error("Failed to fetch working hours");
        return;
      }

      const data = await response.json();

      if (data.user?.privacy_settings?.working_hours) {
        setWorkingHours(data.user.privacy_settings.working_hours);
      }
    } catch (err) {
      console.error("Error fetching working hours:", err);
      // Keep default working hours on error
    }
  };

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

      const params = new URLSearchParams({
        page: "1",
        pageSize: "1000",
        sortBy: "event_time",
        sortOrder: "asc",
        tool: toolFilter,
        status: "all",
      });

      const response = await fetch(`/api/dashboard/action-logs?${params}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch action logs");
      }

      const responseData = await response.json();

      // Filter activities to only those within the week
      const filteredActivities = responseData.activities.filter(
        (activity: Activity) => {
          const activityDate = parseISO(activity.dateTime);
          return activityDate >= currentWeekStart && activityDate <= weekEnd;
        },
      );

      setActivities(filteredActivities);
      setTools(responseData.filters.tools);
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
        setActivities((prevActivities) =>
          prevActivities.map((activity) =>
            activity.logId === logId
              ? { ...activity, showInReport: !currentStatus }
              : activity,
          ),
        );

        if (selectedActivity && selectedActivity.logId === logId) {
          setSelectedActivity({
            ...selectedActivity,
            showInReport: !currentStatus,
          });
        }
      }
    } catch (err) {
      console.error("Error updating show in report status:", err);
    }
  };

  const getWeekDays = (): DayColumn[] => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

    return days.map((date) => {
      const dayActivities = activities.filter((activity) =>
        isSameDay(parseISO(activity.dateTime), date),
      );

      const timeSlots: TimeSlot[] = hours.map((hour) => {
        const hourActivities = dayActivities.filter((activity) => {
          const activityDate = parseISO(activity.dateTime);
          const activityHour = getHours(activityDate);
          return activityHour === hour;
        });

        return {
          hour,
          activities: hourActivities,
        };
      });

      return {
        date,
        dayName: format(date, "EEE"),
        dayNumber: parseInt(format(date, "d")),
        timeSlots,
      };
    });
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDialogOpen(true);
  };

  const handleMonthSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
      setIsMonthCalendarOpen(false);
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
      setIsManualEntryOpen(false);

      // Refresh the activities
      fetchActivities();
    } catch (err) {
      console.error("Error creating manual entry:", err);
      alert(err instanceof Error ? err.message : "Failed to create action log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualEntryOpenChange = (open: boolean) => {
    setIsManualEntryOpen(open);
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

  const calculateActivityPosition = (activity: Activity) => {
    const activityDate = parseISO(activity.dateTime);
    const minutes = getMinutes(activityDate);
    const topOffset = (minutes / 60) * 100;
    const height = Math.max((activity.minutes / 60) * 100, 50);

    return {
      top: `${topOffset}%`,
      height: `${height}px`,
      minHeight: "50px",
    };
  };

  const weekDays = getWeekDays();
  const currentMonth = format(currentWeekStart, "MMMM yyyy");

  // Calculate tool statistics for the week
  const getToolStats = () => {
    const stats = new Map<string, number>();

    activities.forEach((activity) => {
      const current = stats.get(activity.tool) || 0;
      stats.set(activity.tool, current + activity.minutes);
    });

    return Array.from(stats.entries())
      .map(([toolName, totalMinutes]) => ({ toolName, totalMinutes }))
      .sort((a, b) => b.totalMinutes - a.totalMinutes);
  };

  const toolStats = getToolStats();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Calendar Section */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Review Your Weekly Hours
              </h2>
              <Popover
                open={isMonthCalendarOpen}
                onOpenChange={setIsMonthCalendarOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-sm text-primary/70 hover:text-primary p-0 h-auto font-normal"
                  >
                    {currentMonth}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarIcon
                    mode="single"
                    selected={currentWeekStart}
                    onSelect={handleMonthSelect}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select value={toolFilter} onValueChange={setToolFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tools</SelectItem>
                  {tools.map((tool) => (
                    <SelectItem
                      key={tool.tool_id}
                      value={tool.tool_id.toString()}
                    >
                      {tool.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={() => setIsManualEntryOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Entry
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="flex">
            {/* Time column */}
            <div className="w-20 flex-shrink-0 border-r">
              <div className="h-12 border-b" />
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-24 border-b flex items-start justify-end pr-2 pt-1 text-xs text-gray-500"
                >
                  {format(new Date().setHours(hour, 0), "HH:mm")}
                </div>
              ))}
            </div>

            {/* Days columns */}
            <div className="flex-1 flex">
              {isLoading ? (
                <div className="flex-1 flex">
                  {[...Array(7)].map((_, index) => (
                    <div
                      key={index}
                      className="flex-1 border-r last:border-r-0"
                    >
                      <div className="h-12 border-b p-2">
                        <Skeleton className="h-4 w-16" />
                      </div>
                      {hours.map((hour) => (
                        <div key={hour} className="h-24 border-b p-1">
                          <Skeleton className="h-16 w-full" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                weekDays.map((day, dayIndex) => {
                  const isDayWorking = isWorkingDay(day.date);

                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "flex-1 border-r last:border-r-0 relative",
                        isSameDay(day.date, new Date()) && "bg-blue-50/30",
                        !isDayWorking && "bg-gray-50",
                      )}
                    >
                      {/* Non-working day overlay */}
                      {!isDayWorking && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                          <span className="text-xs font-medium text-gray-400 bg-white/80 px-2 py-1 rounded">
                            Non-working day
                          </span>
                        </div>
                      )}

                      {/* Day header */}
                      <div
                        className={cn(
                          "h-12 border-b flex flex-col items-center justify-center",
                          isSameDay(day.date, new Date()) && "bg-blue-100",
                          !isDayWorking && "bg-gray-100",
                        )}
                      >
                        <span
                          className={cn(
                            "text-xs",
                            !isDayWorking ? "text-gray-400" : "text-gray-600",
                          )}
                        >
                          {day.dayName}
                        </span>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            isSameDay(day.date, new Date())
                              ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                              : !isDayWorking
                                ? "text-gray-400"
                                : "text-gray-900",
                          )}
                        >
                          {day.dayNumber}
                        </span>
                      </div>

                      {/* Time slots */}
                      {day.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slotIndex}
                          className="h-24 border-b relative p-1"
                        >
                          {slot.activities.map((activity, actIndex) => {
                            const position =
                              calculateActivityPosition(activity);
                            return (
                              <div
                                key={activity.logId}
                                className={cn(
                                  "absolute left-1 right-1 rounded-md border p-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden",
                                  getToolColor(activity.tool),
                                )}
                                style={{
                                  top: position.top,
                                  height: position.height,
                                  minHeight: position.minHeight,
                                  zIndex: actIndex,
                                }}
                                onClick={() => handleActivityClick(activity)}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {toolIcons[activity.tool] ? (
                                      <Image
                                        src={toolIcons[activity.tool]}
                                        alt={activity.tool}
                                        width={12}
                                        height={12}
                                        className="flex-shrink-0"
                                      />
                                    ) : (
                                      <div
                                        className={cn(
                                          "w-2 h-2 rounded-full flex-shrink-0",
                                          getToolDotColor(activity.tool),
                                        )}
                                      />
                                    )}
                                    <span className="text-xs font-medium truncate">
                                      {activity.tool}
                                    </span>
                                  </div>
                                  <button className="flex-shrink-0 hover:bg-white/50 rounded p-0.5">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="text-xs font-medium line-clamp-2 mb-1">
                                  {activity.actionDescription}
                                </div>
                                <div className="text-xs opacity-80">
                                  {activity.time}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Activity Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Activity Details</DialogTitle>
              <DialogDescription>
                {selectedActivity &&
                  format(
                    parseISO(selectedActivity.dateTime),
                    "EEEE, MMMM d, yyyy",
                  )}
              </DialogDescription>
            </DialogHeader>

            {selectedActivity && (
              <div className="space-y-4 mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        {selectedActivity.tool}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {selectedActivity.time}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-gray-900">
                        {selectedActivity.actionDescription}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{selectedActivity.minutes} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-sm text-gray-700">
                        Show in report:
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toggleShowInReport(
                            selectedActivity.logId,
                            selectedActivity.showInReport,
                          )
                        }
                        className={
                          selectedActivity.showInReport
                            ? "text-primary"
                            : "text-gray-400 hover:text-gray-600"
                        }
                      >
                        {selectedActivity.showInReport ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manual Entry Dialog */}
        <Dialog
          open={isManualEntryOpen}
          onOpenChange={handleManualEntryOpenChange}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Manual Action Log</DialogTitle>
              <DialogDescription>
                Manually log an action that wasn&#39;t automatically tracked.
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
                    {tools.map((tool) => (
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
                    open={isEntryCalendarOpen}
                    onOpenChange={setIsEntryCalendarOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !formData.date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIconLucide className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          format(formData.date, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarIcon
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          setFormData({ ...formData, date });
                          setIsEntryCalendarOpen(false);
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
                onClick={() => setIsManualEntryOpen(false)}
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

      {/* Sidebar */}
      <CalendarSidebar
        currentWeekStart={currentWeekStart}
        onDateSelect={(date) => {
          setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
        }}
        tools={tools}
        toolStats={toolStats}
      />
    </div>
  );
}
