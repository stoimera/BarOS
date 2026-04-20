"use client";

import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { getEvents } from "@/lib/events";
import { getTasks } from "@/lib/tasks";
import { CalendarEvent } from "@/types/event";
import { Task } from "@/types/task";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function MiniCalendar() {
  const today = new Date();
  const [currentMonth] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  useEffect(() => {
    getEvents({ date: undefined }).then(setEvents); // Optionally filter by month
    getTasks({ due_date: undefined }).then(setTasks); // Optionally filter by month
  }, [currentMonth]);

  function getDaySummary(day: Date) {
    const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
    const dayTasks = tasks.filter(t => isSameDay(new Date(t.due_date), day));
    return { dayEvents, dayTasks };
  }

  return (
    <div className="w-full p-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-4 h-4 text-primary">🗓️</span>
        <span className="font-semibold">{format(currentMonth, "MMMM yyyy")}</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center">
        {["S", "M", "T", "W", "T", "F", "S"].map(d => (
          <div key={d} className="font-medium text-muted-foreground">{d}</div>
        ))}
        {days.map(day => {
          const { dayEvents, dayTasks } = getDaySummary(day);
          const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
          return (
            <Popover key={day.toISOString()}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border",
                    isToday(day) && "border-primary text-primary font-bold",
                    hasItems && "bg-muted border-primary text-foreground hover:bg-muted/80",
                    !hasItems && "border-border text-foreground hover:bg-muted"
                  )}
                  aria-label={format(day, "PPP")}
                >
                  {format(day, "d")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="min-w-[200px]">
                <div className="font-semibold mb-2">{format(day, "PPP")}</div>
                {dayEvents.length === 0 && dayTasks.length === 0 && (
                  <div className="text-muted-foreground text-sm">No events or tasks</div>
                )}
                {dayEvents.length > 0 && (
                  <div className="mb-2">
                    <div className="font-medium text-primary mb-1">Events</div>
                    <ul className="space-y-1">
                      {dayEvents.map(e => (
                        <li key={e.id} className="text-xs">{e.name} <span className="text-gray-400">{e.time}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {dayTasks.length > 0 && (
                  <div>
                    <div className="font-medium text-primary mb-1">Tasks</div>
                    <ul className="space-y-1">
                      {dayTasks.map(t => (
                        <li key={t.id} className="text-xs">{t.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
} 