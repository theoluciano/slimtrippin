"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateTimePickerProps = {
  name: string
  id?: string
  defaultValue?: string
}

function parseDatetimeLocal(value: string): { date: Date; time: string } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/)
  if (!match) return null
  const [, y, m, d, time] = match
  return {
    date: new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0),
    time,
  }
}

function toDatetimeLocal(date: Date, time: string): string {
  const ymd = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
  return `${ymd}T${time}`
}

function formatTrigger(date: Date, time: string): string {
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const [h, m] = time.split(":").map(Number)
  const suffix = h < 12 ? "AM" : "PM"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  const timePart = `${hour12}:${String(m).padStart(2, "0")} ${suffix}`
  return `${datePart} at ${timePart}`
}

export function DateTimePicker({ name, id, defaultValue }: DateTimePickerProps) {
  const parsed = defaultValue ? parseDatetimeLocal(defaultValue) : null

  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(parsed?.date)
  const [time, setTime] = React.useState<string>(parsed?.time ?? "09:00")

  const datetimeLocalValue = selectedDate ? toDatetimeLocal(selectedDate, time) : ""

  const triggerLabel = selectedDate ? formatTrigger(selectedDate, time) : "Pick date and time"

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} id={id} value={datetimeLocalValue} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start gap-2 font-normal", !selectedDate && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
            <span>{triggerLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            autoFocus
          />
          <div className="border-t pt-3">
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full"
              aria-label="Time"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
