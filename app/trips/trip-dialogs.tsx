"use client";

import { SignOut, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { createTripAction, deleteTripAction, updateTripAction } from "@/app/trips/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trip } from "@/lib/types";

const TIMEZONE_GROUPS: { label: string; timezones: string[] }[] = [
  {
    label: "Americas",
    timezones: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "America/Toronto",
      "America/Vancouver",
      "America/Mexico_City",
      "America/Bogota",
      "America/Lima",
      "America/Santiago",
      "America/Sao_Paulo",
      "America/Argentina/Buenos_Aires",
    ],
  },
  {
    label: "Europe",
    timezones: [
      "Europe/London",
      "Europe/Lisbon",
      "Europe/Dublin",
      "Europe/Paris",
      "Europe/Berlin",
      "Europe/Rome",
      "Europe/Madrid",
      "Europe/Amsterdam",
      "Europe/Brussels",
      "Europe/Vienna",
      "Europe/Zurich",
      "Europe/Stockholm",
      "Europe/Oslo",
      "Europe/Copenhagen",
      "Europe/Helsinki",
      "Europe/Warsaw",
      "Europe/Prague",
      "Europe/Budapest",
      "Europe/Bucharest",
      "Europe/Athens",
      "Europe/Istanbul",
      "Europe/Moscow",
    ],
  },
  {
    label: "Africa",
    timezones: [
      "Africa/Cairo",
      "Africa/Johannesburg",
      "Africa/Lagos",
      "Africa/Nairobi",
      "Africa/Casablanca",
    ],
  },
  {
    label: "Middle East",
    timezones: [
      "Asia/Dubai",
      "Asia/Riyadh",
      "Asia/Kuwait",
      "Asia/Qatar",
      "Asia/Bahrain",
      "Asia/Tehran",
      "Asia/Jerusalem",
      "Asia/Beirut",
      "Asia/Amman",
      "Asia/Baghdad",
    ],
  },
  {
    label: "Asia",
    timezones: [
      "Asia/Kolkata",
      "Asia/Karachi",
      "Asia/Dhaka",
      "Asia/Colombo",
      "Asia/Kathmandu",
      "Asia/Tashkent",
      "Asia/Almaty",
      "Asia/Bangkok",
      "Asia/Ho_Chi_Minh",
      "Asia/Jakarta",
      "Asia/Singapore",
      "Asia/Kuala_Lumpur",
      "Asia/Manila",
      "Asia/Shanghai",
      "Asia/Hong_Kong",
      "Asia/Taipei",
      "Asia/Seoul",
      "Asia/Tokyo",
    ],
  },
  {
    label: "Oceania",
    timezones: [
      "Australia/Perth",
      "Australia/Darwin",
      "Australia/Adelaide",
      "Australia/Brisbane",
      "Australia/Sydney",
      "Australia/Melbourne",
      "Pacific/Auckland",
      "Pacific/Fiji",
      "Pacific/Guam",
    ],
  },
];

function TimezoneSelect({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: string;
}) {
  const [value, setValue] = useState(defaultValue);

  const isKnown = TIMEZONE_GROUPS.some((g) => g.timezones.includes(defaultValue));
  const displayValue = isKnown ? defaultValue : defaultValue;

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>{displayValue.replace(/_/g, " ")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {!isKnown && (
            <SelectGroup>
              <SelectLabel>Current</SelectLabel>
              <SelectItem value={defaultValue}>{defaultValue.replace(/_/g, " ")}</SelectItem>
            </SelectGroup>
          )}
          {TIMEZONE_GROUPS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel>{group.label}</SelectLabel>
              {group.timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export function CreateTripDialog({ today }: { today: string }) {
  const [open, setOpen] = useState(false);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">
          <Plus aria-hidden="true" />
          New trip
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New trip</DialogTitle>
          <DialogDescription>
            Set the trip dates and timezone before adding events.
          </DialogDescription>
        </DialogHeader>
        <form id="create-trip-form" action={createTripAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" placeholder="Lisbon spring trip" required />
          </div>
          <div className="grid gap-2">
            <Label>Dates</Label>
            <DateRangePicker
              startName="startDate"
              endName="endDate"
              defaultStart={today}
              defaultEnd={today}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <TimezoneSelect id="timezone" name="timezone" defaultValue={timezone} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="create-trip-form">
            <Plus aria-hidden="true" />
            Create trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          Sign out
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign out?</DialogTitle>
          <DialogDescription>
            You will need to sign in again before editing your trips.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This only signs you out on this device. Your trip data stays saved.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action="/auth/signout" method="post">
            <Button type="submit">
              <SignOut aria-hidden="true" />
              Sign out
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditTripDialog({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${trip.title}`}
          className="action-btn bg-card hover:bg-card border-border !size-12 [&_svg]:!size-6"
        >
          <PencilSimple weight="regular" className="group-hover/button:hidden" aria-hidden="true" />
          <PencilSimple weight="fill" className="hidden group-hover/button:block" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit trip</DialogTitle>
          <DialogDescription>
            Update the trip title, dates, or timezone.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-trip-form"
          action={async (formData) => {
            await updateTripAction(formData);
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="tripId" value={trip.id} />
          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={trip.title}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Dates</Label>
            <DateRangePicker
              startName="startDate"
              endName="endDate"
              defaultStart={trip.start_date}
              defaultEnd={trip.end_date}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-timezone">Timezone</Label>
            <TimezoneSelect id="edit-timezone" name="timezone" defaultValue={trip.timezone} />
          </div>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="edit-trip-form">
            <PencilSimple aria-hidden="true" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteTripDialog({ trip }: { trip: Trip }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Delete ${trip.title}`}
          className="action-btn bg-destructive-soft hover:bg-destructive-soft border-destructive-soft-border !size-12 [&_svg]:!size-6"
        >
          <Trash weight="regular" className="group-hover/button:hidden" aria-hidden="true" />
          <Trash weight="fill" className="hidden group-hover/button:block" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete trip?</DialogTitle>
          <DialogDescription>
            {`This will permanently delete "${trip.title}" and its events.`}
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <form action={deleteTripAction}>
            <input type="hidden" name="tripId" value={trip.id} />
            <Button type="submit" variant="destructive">
              <Trash aria-hidden="true" />
              Delete trip
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
