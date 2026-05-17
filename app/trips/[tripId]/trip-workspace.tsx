"use client";

import {
  ArrowLeft,
  CalendarPlus,
  MapPin,
  FloppyDisk,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "@/app/trips/[tripId]/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addHoursToDatetimeLocal,
  dateKeyForIso,
  datetimeLocalToUtcIso,
  eachDate,
  formatDateLabel,
  formatTimeLabel,
  utcIsoToDatetimeLocal,
} from "@/lib/timezone/datetime";
import { EVENT_TYPES, type Trip, type TripEvent } from "@/lib/types";

type Props = {
  trip: Trip;
  events: TripEvent[];
};

export function TripWorkspace({ trip, events }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextEventId = useMemo(() => findNextEvent(events)?.id ?? null, [events]);
  const editingEvent = events.find((event) => event.id === editingId) ?? null;
  const deletingEvent = events.find((event) => event.id === deletingId) ?? null;
  const dates = useMemo(
    () => eachDate(trip.start_date, trip.end_date),
    [trip.start_date, trip.end_date],
  );
  const eventsByDate = useMemo(
    () => groupEventsByDate(events, trip.timezone),
    [events, trip.timezone],
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const target = nextEventId
      ? container.querySelector<HTMLElement>(`[data-event-id="${nextEventId}"]`)
      : container.querySelector<HTMLElement>("[data-event-id]");

    if (target) {
      container.scrollTo({
        top: Math.max(target.offsetTop - 140, 0),
        behavior: "smooth",
      });
    }
  }, [nextEventId]);

  function openEvent(eventId: string) {
    setSelectedId(eventId);
    setEditingId(eventId);
  }

  return (
    <main className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-muted">
      <header className="flex min-h-[72px] items-center justify-between gap-4 bg-muted px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back to trips">
            <Link href="/trips">
              <ArrowLeft aria-hidden="true" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{trip.title}</h1>
            <p className="truncate text-sm text-muted-foreground">
              {trip.start_date} to {trip.end_date} · {trip.timezone}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <CalendarPlus aria-hidden="true" />
            Add event
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-4 pt-2">
      <section ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-card">
        <Agenda
          dates={dates}
          eventsByDate={eventsByDate}
          nextEventId={nextEventId}
          selectedId={selectedId}
          timezone={trip.timezone}
          onSelect={openEvent}
        />
      </section>
      </div>

      <CreateEventDialog trip={trip} open={createOpen} onOpenChange={setCreateOpen} />
      {editingEvent ? (
        <EditEventDialog
          trip={trip}
          event={editingEvent}
          open={Boolean(editingId)}
          onOpenChange={(open) => {
            if (!open) setEditingId(null);
          }}
          onDelete={() => {
            setDeletingId(editingEvent.id);
            setEditingId(null);
          }}
        />
      ) : null}
      {deletingEvent ? (
        <DeleteEventDialog
          trip={trip}
          event={deletingEvent}
          open={Boolean(deletingId)}
          onOpenChange={(open) => {
            if (!open) setDeletingId(null);
          }}
        />
      ) : null}
    </main>
  );
}

function Agenda({
  dates,
  eventsByDate,
  timezone,
  selectedId,
  nextEventId,
  onSelect,
}: {
  dates: string[];
  eventsByDate: Map<string, TripEvent[]>;
  timezone: string;
  selectedId: string | null;
  nextEventId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6">
      {dates.map((date) => {
        const dayEvents = eventsByDate.get(date) ?? [];

        return (
          <section key={date} className="grid gap-4 border-b pb-5 md:grid-cols-[120px_1fr]">
            <div className="md:sticky md:top-4 md:h-fit">
              <p className="font-semibold">{formatDateLabel(date, timezone)}</p>
              <p className="text-sm text-muted-foreground">{date}</p>
            </div>
            {dayEvents.length > 0 ? (
              <div className="grid gap-3">
                {dayEvents.map((event) => {
                  const isPast = Date.parse(event.end_at) < Date.now();
                  const isNext = event.id === nextEventId;

                  return (
                    <button
                      key={event.id}
                      data-event-id={event.id}
                      type="button"
                      onClick={() => onSelect(event.id)}
                      className={[
                        "grid h-28 grid-rows-[auto_auto_1fr] gap-1 rounded-md border p-3 text-left text-sm shadow-sm transition",
                        selectedId === event.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card hover:border-primary/70",
                        isPast && selectedId !== event.id ? "opacity-45" : "",
                        isNext && selectedId !== event.id ? "ring-2 ring-accent" : "",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate font-medium">{event.title}</span>
                        <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {titleCase(event.type)}
                        </span>
                      </span>
                      <span className="truncate text-xs opacity-80">
                        {formatTimeLabel(event.start_at, timezone)} to{" "}
                        {formatTimeLabel(event.end_at, timezone)}
                      </span>
                      {event.location_name ? (
                        <span className="mt-2 flex min-w-0 items-end gap-1 truncate text-xs opacity-80">
                          <MapPin className="size-3 shrink-0" aria-hidden="true" />
                          <span className="truncate">{event.location_name}</span>
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md border border-dashed bg-card p-4 text-sm text-muted-foreground">
                No events scheduled for this day.
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function CreateEventDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const startDefault = `${trip.start_date}T09:00`;
  const endDefault = addHoursToDatetimeLocal(startDefault, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add event</DialogTitle>
          <DialogDescription>{`Times are entered in ${trip.timezone}.`}</DialogDescription>
        </DialogHeader>
        <form
          id="create-event-form"
          action={(formData) => {
            normalizeEventFormTimes(formData, trip.timezone);
            return createEventAction(formData);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <EventFields
            idPrefix="create"
            defaultType="activity"
            defaultStart={startDefault}
            defaultEnd={endDefault}
          />
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-event-form">
            <CalendarPlus aria-hidden="true" />
            Add event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditEventDialog({
  trip,
  event,
  open,
  onOpenChange,
  onDelete,
}: {
  trip: Trip;
  event: TripEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit event</DialogTitle>
          <DialogDescription>{`Times are edited in ${trip.timezone}.`}</DialogDescription>
        </DialogHeader>
        <form
          key={event.id}
          id="edit-event-form"
          action={(formData) => {
            normalizeEventFormTimes(formData, trip.timezone);
            return updateEventAction(formData);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <input type="hidden" name="eventId" value={event.id} />
          <EventFields
            idPrefix="edit"
            defaultTitle={event.title}
            defaultType={event.type}
            defaultStart={utcIsoToDatetimeLocal(event.start_at, trip.timezone)}
            defaultEnd={utcIsoToDatetimeLocal(event.end_at, trip.timezone)}
            defaultLocation={event.location_name ?? ""}
            defaultAddress={event.address ?? ""}
            defaultNotes={event.notes ?? ""}
          />
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash aria-hidden="true" />
            Delete
          </Button>
          <Button type="submit" form="edit-event-form">
            <FloppyDisk aria-hidden="true" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteEventDialog({
  trip,
  event,
  open,
  onOpenChange,
}: {
  trip: Trip;
  event: TripEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete event?</DialogTitle>
          <DialogDescription>{`This will permanently delete "${event.title}".`}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <form action={deleteEventAction}>
            <input type="hidden" name="tripId" value={trip.id} />
            <input type="hidden" name="eventId" value={event.id} />
            <Button type="submit" variant="destructive">
              <Trash aria-hidden="true" />
              Delete event
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EventFields({
  idPrefix,
  defaultTitle = "",
  defaultType,
  defaultStart,
  defaultEnd,
  defaultLocation = "",
  defaultAddress = "",
  defaultNotes = "",
}: {
  idPrefix: string;
  defaultTitle?: string;
  defaultType: string;
  defaultStart: string;
  defaultEnd: string;
  defaultLocation?: string;
  defaultAddress?: string;
  defaultNotes?: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          defaultValue={defaultTitle}
          placeholder="Flight to Madrid"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-type`}>Type</Label>
        <Select name="type" defaultValue={defaultType}>
          <SelectTrigger id={`${idPrefix}-type`} className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {EVENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {titleCase(type)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-start`}>Start</Label>
          <DateTimePicker
            id={`${idPrefix}-start`}
            name="startAt"
            defaultValue={defaultStart}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-end`}>End</Label>
          <DateTimePicker
            id={`${idPrefix}-end`}
            name="endAt"
            defaultValue={defaultEnd}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-location`}>Location</Label>
        <Input
          id={`${idPrefix}-location`}
          name="locationName"
          defaultValue={defaultLocation}
          placeholder="Terminal 2"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-address`}>Address</Label>
        <Input id={`${idPrefix}-address`} name="address" defaultValue={defaultAddress} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
        <Textarea id={`${idPrefix}-notes`} name="notes" defaultValue={defaultNotes} />
      </div>
    </>
  );
}

function normalizeEventFormTimes(formData: FormData, timezone: string) {
  const startAt = formData.get("startAt");
  const endAt = formData.get("endAt");

  if (typeof startAt === "string") {
    formData.set("startAt", datetimeLocalToUtcIso(startAt, timezone));
  }

  if (typeof endAt === "string") {
    formData.set("endAt", datetimeLocalToUtcIso(endAt, timezone));
  }
}

function groupEventsByDate(events: TripEvent[], timezone: string) {
  return events.reduce((grouped, event) => {
    const dateKey = dateKeyForIso(event.start_at, timezone);
    const dayEvents = grouped.get(dateKey) ?? [];
    grouped.set(dateKey, [...dayEvents, event].sort(compareEvents));
    return grouped;
  }, new Map<string, TripEvent[]>());
}

function compareEvents(a: TripEvent, b: TripEvent) {
  const startDifference = Date.parse(a.start_at) - Date.parse(b.start_at);
  if (startDifference !== 0) return startDifference;
  return a.title.localeCompare(b.title);
}

function findNextEvent(events: TripEvent[]) {
  const now = Date.now();
  return events
    .filter((event) => Date.parse(event.end_at) >= now)
    .sort(compareEvents)[0];
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}
