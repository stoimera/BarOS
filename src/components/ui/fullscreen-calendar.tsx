"use client"

import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Input } from "@/components/ui/input"

interface Event {
  id: number
  name: string
  time: string
  datetime: string
}

interface CalendarData {
  day: Date
  events: Event[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

export function FullScreenCalendar({ data }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy"),
  )
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
    setSelectedDay(today)
  }

  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Filter data by search term
  const filteredData = searchTerm.trim().length === 0
    ? data
    : data.map(dayObj => ({
        ...dayObj,
        events: dayObj.events.filter(e =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(dayObj => dayObj.events.length > 0);

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 p-3 sm:p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden w-16 sm:w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-muted-foreground">
                {format(today, "MMM")}
              </h1>
              <button
                className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-base sm:text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={goToToday}
                aria-label="Go to today"
              >
                <span>{format(today, "d")}</span>
              </button>
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: right-aligned */}
        <div className="flex flex-col items-center gap-3 sm:gap-4 md:flex-row md:gap-6 md:justify-end w-full md:w-auto">
          {/* Search icon and input */}
          {showSearch ? (
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onBlur={() => { if (searchTerm.trim() === "") setShowSearch(false); }}
              className={
                cn(
                  "transition-all duration-300 ease-in-out",
                  showSearch ? "opacity-100 w-32 sm:w-40 md:w-56 scale-100" : "opacity-0 w-0 scale-95 pointer-events-none"
                )
              }
              aria-label="Search events"
            />
          ) : (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowSearch(true)}
              aria-label="Open search"
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <span className="text-sm">🔍</span>
            </Button>
          )}

          <Separator orientation="vertical" className="hidden h-6 lg:block" />

          <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
            <Button
              onClick={previousMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-9 w-9 sm:h-10 sm:w-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to previous month"
            >
              <span className="text-sm">‹</span>
            </Button>
            <Button
              onClick={goToToday}
              className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10"
              variant="outline"
            >
              Months
            </Button>
            <Button
              onClick={nextMonth}
              className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 h-9 w-9 sm:h-10 sm:w-10"
              variant="outline"
              size="icon"
              aria-label="Navigate to next month"
            >
              <span className="text-sm">›</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 border text-center text-xs font-semibold leading-6 lg:flex-none">
          <div className="border-r py-2.5">Sun</div>
          <div className="border-r py-2.5">Mon</div>
          <div className="border-r py-2.5">Tue</div>
          <div className="border-r py-2.5">Wed</div>
          <div className="border-r py-2.5">Thu</div>
          <div className="border-r py-2.5">Fri</div>
          <div className="py-2.5">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => setSelectedDay(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && "text-primary-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      isSameMonth(day, firstDayCurrentMonth) &&
                      "text-foreground",
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-blue-200 text-muted-foreground dark:bg-blue-900",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                      "font-semibold",
                    "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
                  )}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) &&
                        "bg-blue-600 text-white dark:bg-blue-400 dark:text-white border-none",
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  {filteredData.filter((date) => isSameDay(date.day, day)).length >
                    0 && (
                    <div>
                      {filteredData
                        .filter((date) => isSameDay(date.day, day))
                        .map((date) => (
                          <div
                            key={date.day.toString()}
                            className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                          >
                            {date.events.map((event) => (
                              <span
                                key={event.id}
                                className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                              />
                            ))}
                          </div>
                        ))}
                    </div>
                  )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      !isSameMonth(day, firstDayCurrentMonth) &&
                      "bg-blue-200 text-muted-foreground dark:bg-blue-900",
                    "relative flex flex-col border-b border-r hover:bg-muted focus:z-10",
                    !isEqual(day, selectedDay) && "hover:bg-accent/75",
                  )}
                >
                  <header className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      className={cn(
                        isEqual(day, selectedDay) && "text-primary-foreground",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          isSameMonth(day, firstDayCurrentMonth) &&
                          "text-foreground",
                        !isEqual(day, selectedDay) &&
                          !isToday(day) &&
                          !isSameMonth(day, firstDayCurrentMonth) &&
                          "text-muted-foreground",
                        isEqual(day, selectedDay) &&
                          "bg-blue-600 text-white dark:bg-blue-400 dark:text-white border-none",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                          "font-semibold",
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border",
                      )}
                    >
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 p-2.5">
                    {filteredData
                      .filter((event) => isSameDay(event.day, day))
                      .map((day) => (
                        <div key={day.day.toString()} className="space-y-1.5">
                          {day.events.slice(0, 1).map((event) => (
                            <div
                              key={event.id}
                              className="flex flex-col items-start gap-1 rounded-lg border bg-muted/50 p-2 text-xs leading-tight"
                            >
                              <p className="font-medium leading-none">
                                {event.name}
                              </p>
                              <p className="leading-none text-muted-foreground">
                                {event.time}
                              </p>
                            </div>
                          ))}
                          {day.events.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              + {day.events.length - 1} more
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => setSelectedDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "text-primary-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-foreground",
                  !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                  "flex h-14 flex-col border-b border-r px-3 py-2 hover:bg-muted focus:z-10",
                )}
              >
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                      "bg-blue-600 text-white dark:bg-blue-400 dark:text-white",
                  )}
                >
                  {format(day, "d")}
                </time>
                {filteredData.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {filteredData
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse"
                        >
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground"
                            />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
