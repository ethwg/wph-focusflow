"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

function mondayOf(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function sundayOf(d: Date) {
  const x = mondayOf(d);
  x.setDate(x.getDate() + 6);
  x.setHours(23, 59, 59, 999);
  return x;
}

export type WeekRange = { start: Date; end: Date };

export function WeekPicker({
  value,
  onChange,
  className,
  disabled = false,
}: {
  value: WeekRange | null;
  onChange: (v: WeekRange | null) => void;
  className?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const label =
    value?.start && value?.end
      ? `${format(value.start, "EEE dd MMM yyyy")} → ${format(value.end, "EEE dd MMM yyyy")}`
      : "Select week";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal w-full",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <Calendar
          mode="single"
          // when a day is picked, snap to its week (Mon–Sun)
          onSelect={(d) => {
            if (!d) {
              onChange(null);
              return;
            }
            const start = mondayOf(d);
            const end = sundayOf(d);
            onChange({ start, end });
            setOpen(false);
          }}
          // show the currently selected week's Monday
          selected={value?.start ?? undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
