"use client";

import {
  ArrowLeft,
  CalendarPlus,
  MagnifyingGlass,
  MapPin,
  FloppyDisk,
  PencilSimple,
  Trash,
  AirplaneTilt,
  Bed,
  ForkKnife,
  Mountains,
  CheckSquare,
  DotsThreeOutline,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createEventAction,
  deleteEventAction,
  updateEventAction,
} from "@/app/trips/[tripId]/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
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
  formatTripDate,
  utcIsoToDatetimeLocal,
} from "@/lib/timezone/datetime";
import { EventAttachments } from "@/app/trips/[tripId]/event-attachments";
import { cn } from "@/lib/utils";
import {
  EVENT_TYPES,
  type EventAttachment,
  type Trip,
  type TripEvent,
} from "@/lib/types";

type Props = {
  trip: Trip;
  events: TripEvent[];
  attachments: EventAttachment[];
};

export function TripWorkspace({ trip, events, attachments }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextEventId = useMemo(() => findNextEvent(events)?.id ?? null, [events]);
  const selectedEvent = events.find((event) => event.id === selectedId) ?? null;
  // Keep last event in a ref so SheetContent stays populated during the close animation
  const lastSelectedEventRef = useRef(selectedEvent);
  if (selectedEvent) lastSelectedEventRef.current = selectedEvent;
  const sheetEvent = selectedEvent ?? lastSelectedEventRef.current;
  const deletingEvent = events.find((event) => event.id === deletingId) ?? null;
  const dates = useMemo(
    () => eachDate(trip.start_date, trip.end_date),
    [trip.start_date, trip.end_date],
  );
  const eventsByDate = useMemo(
    () => groupEventsByDate(events, trip.timezone),
    [events, trip.timezone],
  );
  const attachmentsByEvent = useMemo(
    () => groupAttachmentsByEvent(attachments),
    [attachments],
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
    setEditingId(null);
  }

  return (
    <main className="flex h-screen min-h-[720px] flex-col overflow-hidden bg-muted">
      <header className="shrink-0 bg-muted">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 pb-2 pt-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="icon" aria-label="Back to trips">
              <Link href="/trips">
                <ArrowLeft aria-hidden="true" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">{trip.title}</h1>
              <p className="truncate text-sm text-muted-foreground">
                {formatTripDate(trip.start_date)} – {formatTripDate(trip.end_date)} · {trip.timezone}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" onClick={() => setCreateOpen(true)}>
              <CalendarPlus aria-hidden="true" />
              Add event
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col px-6 pb-6 pt-4">
      <section ref={scrollRef} className="trip-section min-h-0 flex-1 overflow-y-auto border border-border bg-white p-5">
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
      <Sheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setEditingId(null);
          }
        }}
      >
        <SheetContent>
          {sheetEvent && (editingId ? (
            <EditEventContent
              trip={trip}
              event={sheetEvent}
              onSaved={() => setEditingId(null)}
              onCancel={() => setEditingId(null)}
              onDelete={() => {
                setDeletingId(sheetEvent.id);
                setSelectedId(null);
                setEditingId(null);
              }}
            />
          ) : (
            <ViewEventContent
              trip={trip}
              event={sheetEvent}
              attachments={attachmentsByEvent.get(sheetEvent.id) ?? []}
              onEdit={() => setEditingId(sheetEvent.id)}
            />
          ))}
        </SheetContent>
      </Sheet>
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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-col gap-5">
      {dates.map((date) => {
        const dayEvents = eventsByDate.get(date) ?? [];

        return (
          <section key={date} className={["grid gap-4 border-b pb-5 last:border-b-0 md:grid-cols-[120px_1fr] md:pl-8", dayEvents.length === 0 ? "items-center" : ""].join(" ")}>
            <div className={dayEvents.length > 0 ? "md:sticky md:top-4 md:h-fit" : ""}>
              <p className="font-semibold">{formatDateLabel(date, timezone)}</p>
            </div>
            {dayEvents.length > 0 ? (
              <div className="grid gap-3">
                {dayEvents.map((event) => {
                  const isPast = Date.parse(event.end_at) < Date.now();
                  const isNext = event.id === nextEventId;
                  const nextUpLabel = isNext ? formatNextUpLabel(event.start_at, now) : null;
                  const TypeIcon = EVENT_TYPE_ICONS[event.type];
                  const typeColors = EVENT_TYPE_COLORS[event.type] ?? "bg-secondary text-secondary-foreground";

                  return (
                    <button
                      key={event.id}
                      data-event-id={event.id}
                      type="button"
                      onClick={() => onSelect(event.id)}
                      className={[
                        "event-card relative overflow-hidden grid h-28 grid-rows-[auto_auto_1fr] gap-1 border p-3 text-left text-sm",
                        isNext ? "border-primary" : "border-border",
                        isPast ? "is-past opacity-45" : "",
                      ].join(" ")}
                    >
                      <span className={`absolute -right-px -top-px flex items-center gap-1.5 rounded-bl-[16px] rounded-tr-[20px] px-5 py-2 text-xs font-semibold shadow-[inset_-1px_2px_6px_rgba(0,0,0,0.10)] ${typeColors}`}>
                        {TypeIcon && <TypeIcon weight="duotone" className="size-3.5 shrink-0" aria-hidden="true" />}
                        {titleCase(event.type)}
                      </span>
                      <span className="truncate pr-24 text-base font-medium">{event.title}</span>
                      <span className="truncate text-xs opacity-80">
                        {formatTimeLabel(event.start_at, timezone)} to{" "}
                        {formatTimeLabel(event.end_at, timezone)}
                      </span>
                      <span className="mt-auto flex min-w-0 items-end justify-between gap-2">
                        {event.address ? (
                          <span className="flex min-w-0 items-end gap-1 truncate text-xs opacity-80">
                            <MapPin className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{event.address}</span>
                          </span>
                        ) : <span />}
                        {nextUpLabel ? (
                          <Badge className="shrink-0">{nextUpLabel}</Badge>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed bg-card p-4 text-sm text-muted-foreground">
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
          action={async (formData) => {
            normalizeEventFormTimes(formData, trip.timezone);
            await createEventAction(formData);
            onOpenChange(false);
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

function ViewEventContent({
  trip,
  event,
  attachments,
  onEdit,
}: {
  trip: Trip;
  event: TripEvent;
  attachments: EventAttachment[];
  onEdit: () => void;
}) {
  const hasLocation = !!event.address;

  return (
    <>
      <SheetHeader className="sr-only">
        <SheetTitle>{event.title}</SheetTitle>
        <SheetDescription>Event details</SheetDescription>
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pb-2 pt-7">
        {/* Group 1: badge, title, time cards, notes */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="rounded-lg bg-muted px-3 py-1 text-[13px] font-medium leading-4">
              {titleCase(event.type)}
            </span>
          </div>
          <h2 className="text-2xl font-semibold leading-8 tracking-[-0.02em]">
            {event.title}
          </h2>
          <div className="flex gap-2.5">
            <div className="flex flex-1 flex-col gap-1 rounded-xl border border-muted px-4 py-3">
              <span className="text-[20px] font-semibold leading-none tracking-[-0.02em]">
                {formatTimeOnly(event.start_at, trip.timezone)}
              </span>
              <span className="text-[13px] leading-[18px] text-muted-foreground">
                {formatDateFull(event.start_at, trip.timezone)}
              </span>
            </div>
            <div className="flex flex-1 flex-col gap-1 rounded-xl border border-muted px-4 py-3">
              <span className="text-[20px] font-semibold leading-none tracking-[-0.02em]">
                {formatTimeOnly(event.end_at, trip.timezone)}
              </span>
              <span className="text-[13px] leading-[18px] text-muted-foreground">
                {formatDateFull(event.end_at, trip.timezone)}
              </span>
            </div>
          </div>
          {event.notes && (
            <p className="whitespace-pre-wrap text-sm leading-[22px]">{event.notes}</p>
          )}
        </div>
        {/* Group 2: location + map */}
        {hasLocation && (
          <div className="flex flex-col gap-3">
            <span className="text-sm leading-5 text-muted-foreground">{event.address}</span>
            <MapPreview address={event.address} />
          </div>
        )}
        {/* Group 3: attachments */}
        <EventAttachments
          tripId={trip.id}
          eventId={event.id}
          attachments={attachments}
        />
      </div>
      <SheetFooter>
        <Button type="button" onClick={onEdit}>
          <PencilSimple aria-hidden="true" />
          Edit
        </Button>
      </SheetFooter>
    </>
  );
}

function EditEventContent({
  trip,
  event,
  onSaved,
  onCancel,
  onDelete,
}: {
  trip: Trip;
  event: TripEvent;
  onSaved: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <SheetHeader>
        <SheetTitle>Edit event</SheetTitle>
        <SheetDescription>{`Times are edited in ${trip.timezone}.`}</SheetDescription>
      </SheetHeader>
      <form
        key={event.id}
        id="edit-event-form"
        action={async (formData) => {
          normalizeEventFormTimes(formData, trip.timezone);
          await updateEventAction(formData);
          onSaved();
        }}
        className="grid gap-4 overflow-y-auto px-6 py-4"
      >
        <input type="hidden" name="tripId" value={trip.id} />
        <input type="hidden" name="eventId" value={event.id} />
        <EventFields
          idPrefix="edit"
          defaultTitle={event.title}
          defaultType={event.type}
          defaultStart={utcIsoToDatetimeLocal(event.start_at, trip.timezone)}
          defaultEnd={utcIsoToDatetimeLocal(event.end_at, trip.timezone)}
          defaultAddress={event.address ?? ""}
          defaultNotes={event.notes ?? ""}
        />
      </form>
      <SheetFooter className="sm:justify-between">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="destructive" onClick={onDelete}>
            <Trash aria-hidden="true" />
            Delete
          </Button>
          <Button type="submit" form="edit-event-form">
            <FloppyDisk aria-hidden="true" />
            Save
          </Button>
        </div>
      </SheetFooter>
    </>
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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type GeocodingContext = {
  id: string;
  text: string;
  short_code?: string;
};

type GeocodingFeature = {
  id: string;
  place_name: string;
  text: string;
  address?: string;
  context?: GeocodingContext[];
};

function formatSuggestionContext(f: GeocodingFeature): string {
  const ctx = f.context ?? [];
  const city = ctx.find((c) => c.id.startsWith("place."))?.text ?? "";
  const regionRaw = ctx.find((c) => c.id.startsWith("region."))?.short_code ?? "";
  const state = regionRaw.replace(/^[A-Z]{2}-/, "");
  const country = ctx.find((c) => c.id.startsWith("country."))?.text ?? "";
  return [city, state, country].filter(Boolean).join(", ");
}

function formatAddress(f: GeocodingFeature): string {
  const street = f.address ? `${f.address} ${f.text}` : f.text;
  const ctx = f.context ?? [];
  const city = ctx.find((c) => c.id.startsWith("place."))?.text ?? "";
  const regionRaw = ctx.find((c) => c.id.startsWith("region."))?.short_code ?? "";
  const state = regionRaw.replace(/^[A-Z]{2}-/, "");
  const zip = ctx.find((c) => c.id.startsWith("postcode."))?.text ?? "";
  const parts = [street, [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(", ");
}

function AddressSearchBox({
  defaultValue = "",
}: {
  defaultValue?: string;
}) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<GeocodingFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (value: string) => {
    abortRef.current?.abort();
    if (!value.trim() || !MAPBOX_TOKEN) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5&language=en`,
        { signal: controller.signal }
      );
      const data = await res.json();
      const features: GeocodingFeature[] = data.features ?? [];
      setSuggestions(features);
      setOpen(features.length > 0);
    } catch (e) {
      if ((e as { name?: string }).name !== "AbortError") {
        setSuggestions([]);
        setOpen(false);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const select = (placeName: string) => {
    setQuery(placeName);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      select(formatAddress(suggestions[activeIndex]));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={inputWrapperRef} className="relative">
          <MagnifyingGlass
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden
          />
          <Input
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="123 Main St, City"
            className="pl-8"
            autoComplete="off"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={8}
        className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          // Clicking back into the input shouldn't dismiss the suggestions.
          if (inputWrapperRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div className="max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.id}-${i}`}
              type="button"
              className={cn(
                "w-full cursor-pointer px-3 py-2 text-left text-sm",
                i === activeIndex ? "bg-muted" : "hover:bg-muted"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(formatAddress(s))}
            >
              <div className="truncate font-medium">{s.address ? `${s.address} ${s.text}` : s.text}</div>
              <div className="truncate text-xs text-muted-foreground">{formatSuggestionContext(s)}</div>
            </button>
          ))}
        </div>
        <div className="border-t border-border px-3 py-1.5">
          <span className="text-xs text-muted-foreground">Powered by Mapbox</span>
        </div>
      </PopoverContent>
      <input type="hidden" name="address" value={query} />
    </Popover>
  );
}

function EventFields({
  idPrefix,
  defaultTitle = "",
  defaultType,
  defaultStart,
  defaultEnd,
  defaultAddress = "",
  defaultNotes = "",
}: {
  idPrefix: string;
  defaultTitle?: string;
  defaultType: string;
  defaultStart: string;
  defaultEnd: string;
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
        <Label>Address</Label>
        <AddressSearchBox defaultValue={defaultAddress} />
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

function groupAttachmentsByEvent(attachments: EventAttachment[]) {
  const map = new Map<string, EventAttachment[]>();

  for (const attachment of attachments) {
    const existing = map.get(attachment.event_id);
    if (existing) {
      existing.push(attachment);
    } else {
      map.set(attachment.event_id, [attachment]);
    }
  }

  return map;
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

function formatNextUpLabel(startAt: string, now: number): string | null {
  const ms = Date.parse(startAt) - now;
  if (ms <= 0 || ms >= 5 * 60 * 60 * 1000) return null;
  const totalMinutes = Math.ceil(ms / 60_000);
  if (totalMinutes < 60) return `Next up in ${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `Next up in ${hours}h ${minutes}m` : `Next up in ${hours}h`;
}

function titleCase(value: string) {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

const EVENT_TYPE_ICONS: Record<string, Icon> = {
  transit: AirplaneTilt,
  lodging: Bed,
  food: ForkKnife,
  activity: Mountains,
  task: CheckSquare,
  other: DotsThreeOutline,
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  transit:  "bg-[#D6E0D8] text-[#2D4032]", // sage
  lodging:  "bg-[#E8DCCC] text-[#3D2E1A]", // sand
  food:     "bg-[#D8E0D0] text-[#2A3622]", // moss
  activity: "bg-[#DDD5C8] text-[#3A2E1E]", // clay
  task:     "bg-[#D4D8D0] text-[#2A2E28]", // stone
  other:    "bg-[#DDD0CC] text-[#3A2622]", // terracotta
};

function formatTimeOnly(iso: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(new Date(iso));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "";
  const period = parts.find((p) => p.type === "dayPeriod")?.value?.toLowerCase() ?? "";
  return `${hour}:${minute}${period}`;
}

function formatDateFull(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

function MapPreview({ address }: { address: string | null }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !MAPBOX_TOKEN) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((data: { features?: Array<{ geometry: { coordinates: [number, number] } }> }) => {
        const feature = data.features?.[0];
        if (feature) {
          const [lon, lat] = feature.geometry.coordinates;
          setImageUrl(
            `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-l+5b5784(${lon},${lat})/${lon},${lat},14/400x240@2x?access_token=${MAPBOX_TOKEN}`
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [address]);

  if (loading || !imageUrl) return <MapIllustration />;

  return (
    <a
      href={`https://maps.google.com/?q=${encodeURIComponent(address ?? "")}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <img src={imageUrl} alt="Map preview" className="w-full rounded-xl" />
    </a>
  );
}

function MapIllustration() {
  return (
    <svg width="100%" viewBox="0 0 332 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="332" height="200" fill="#E8E0D0" />
      <path d="M0 110 Q60 90 100 120 Q150 155 200 130 Q250 105 332 140 L332 200 L0 200Z" fill="#A8C8D8" />
      <path d="M180 0 Q200 30 190 60 Q185 80 200 130" stroke="#A8C8D8" strokeWidth="18" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="55" rx="55" ry="45" fill="#B8C8A8" opacity="0.8" />
      <ellipse cx="280" cy="30" rx="45" ry="35" fill="#B8C8A8" opacity="0.7" />
      <ellipse cx="300" cy="170" rx="30" ry="25" fill="#B8C8A8" opacity="0.6" />
      <g fill="#8AAA88" opacity="0.9">
        <polygon points="30,70 38,50 46,70" />
        <polygon points="50,75 58,55 66,75" />
        <polygon points="18,72 26,52 34,72" />
        <polygon points="65,65 73,45 81,65" />
        <polygon points="260,45 268,25 276,45" />
        <polygon points="278,50 286,30 294,50" />
        <polygon points="295,40 303,20 311,40" />
      </g>
      <path d="M0 85 Q80 75 160 95 Q240 110 332 100" stroke="#F0EAE0" strokeWidth="3" fill="none" strokeDasharray="10,6" />
      <path d="M160 0 L155 200" stroke="#F0EAE0" strokeWidth="2.5" fill="none" strokeDasharray="8,5" />
      <g fill="#C0B8A8" opacity="0.7">
        <polygon points="70,145 88,118 106,145" />
        <polygon points="90,145 110,112 130,145" />
        <polygon points="110,145 125,125 140,145" />
      </g>
      <circle cx="200" cy="92" r="8" fill="#5B5784" opacity="0.9" />
      <circle cx="200" cy="92" r="4" fill="#ffffff" />
    </svg>
  );
}
