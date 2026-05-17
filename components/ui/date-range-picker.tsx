"use client"

import * as React from "react"
import { CalendarBlank } from "@phosphor-icons/react"
import type { DateRange } from "react-day-picker"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateRangePickerProps = {
  startName: string
  endName: string
  defaultStart?: string
  defaultEnd?: string
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

function toYmd(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function DateRangePicker({ startName, endName, defaultStart, defaultEnd }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    if (!defaultStart && !defaultEnd) return undefined
    return {
      from: defaultStart ? parseYmd(defaultStart) : undefined,
      to: defaultEnd ? parseYmd(defaultEnd) : undefined,
    }
  })

  const startYmd = range?.from ? toYmd(range.from) : ""
  const endYmd = range?.to ? toYmd(range.to) : ""

  const label =
    range?.from && range?.to
      ? `${formatDisplay(range.from)} – ${formatDisplay(range.to)}`
      : range?.from
        ? `${formatDisplay(range.from)} – pick end`
        : "Pick date range"

  return (
    <div className="grid gap-2">
      <input type="hidden" name={startName} value={startYmd} />
      <input type="hidden" name={endName} value={endYmd} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start gap-2 font-normal", !range?.from && "text-muted-foreground")}
          >
            <CalendarBlank className="size-4 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={1}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
