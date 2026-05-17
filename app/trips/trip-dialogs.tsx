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
import type { Trip } from "@/lib/types";

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
            <Input
              id="timezone"
              name="timezone"
              defaultValue={timezone}
              placeholder="Europe/Lisbon"
              required
            />
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
          className="action-btn bg-white hover:bg-white border-[#F2F2F2] !size-12 [&_svg]:!size-6"
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
            <Input
              id="edit-timezone"
              name="timezone"
              defaultValue={trip.timezone}
              required
            />
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
          className="action-btn bg-[#FEE5E2] hover:bg-[#FEE5E2] border-[#FEDCD8] !size-12 [&_svg]:!size-6"
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
