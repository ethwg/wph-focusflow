"use client";

import { useState } from "react";
import Image from "next/image";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarSidebarProps {
  currentWeekStart: Date;
  onDateSelect?: (date: Date) => void;
  tools?: Array<{ tool_id: number; name: string }>;
  toolStats?: Array<{ toolName: string; totalMinutes: number }>;
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

// Get tool colors
const getToolColor = (toolName: string): string => {
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

export function CalendarSidebar({
  currentWeekStart,
  onDateSelect,
  toolStats = [],
}: CalendarSidebarProps) {
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date());

  // Format minutes to hours and minutes
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h${mins}mins`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}mins`;
    }
  };

  const getMiniCalendarDays = () => {
    const monthStart = startOfMonth(miniCalendarMonth);
    const monthEnd = endOfMonth(miniCalendarMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const handlePreviousMonth = () => {
    setMiniCalendarMonth(
      new Date(
        miniCalendarMonth.getFullYear(),
        miniCalendarMonth.getMonth() - 1,
      ),
    );
  };

  const handleNextMonth = () => {
    setMiniCalendarMonth(
      new Date(
        miniCalendarMonth.getFullYear(),
        miniCalendarMonth.getMonth() + 1,
      ),
    );
  };

  const handleDayClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const miniCalendarDays = getMiniCalendarDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-80 flex-shrink-0 space-y-6">
      {/* Mini Month Calendar */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-primary">
            {format(miniCalendarMonth, "MMMM yyyy")}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500"
            >
              {day.slice(0, 3)}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {miniCalendarDays.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, miniCalendarMonth);
            const isToday = isSameDay(date, new Date());
            const isInCurrentWeek =
              date >= currentWeekStart &&
              date <= endOfWeek(currentWeekStart, { weekStartsOn: 1 });

            return (
              <button
                key={index}
                onClick={() => handleDayClick(date)}
                className={cn(
                  "h-8 w-8 text-xs rounded-md hover:bg-gray-100 transition-colors",
                  !isCurrentMonth && "text-gray-300",
                  isCurrentMonth && "text-gray-700",
                  isToday &&
                    "bg-primary text-white hover:bg-primary/90 font-semibold",
                  isInCurrentWeek &&
                    !isToday &&
                    "bg-blue-50 font-medium text-primary",
                )}
              >
                {format(date, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Project Legend */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-semibold text-primary mb-4">
          Project Legend
        </h3>
        <div className="space-y-3">
          {toolStats.length > 0 ? (
            toolStats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      getToolColor(stat.toolName),
                    )}
                  />
                  <div className="flex items-center gap-1.5">
                    {toolIcons[stat.toolName] && (
                      <Image
                        src={toolIcons[stat.toolName]}
                        alt={stat.toolName}
                        width={16}
                        height={16}
                        className="flex-shrink-0"
                      />
                    )}
                    <span className="text-gray-700">{stat.toolName}</span>
                  </div>
                </div>
                <span className="text-gray-500 text-xs">
                  {formatDuration(stat.totalMinutes)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No activity data for this week
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full justify-center">
          Save
        </Button>
        <Button className="w-full justify-center bg-primary hover:bg-primary/90">
          Save & Publish
        </Button>
      </div>
    </div>
  );
}
