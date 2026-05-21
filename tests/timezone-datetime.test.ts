import { describe, expect, it } from "vitest";
import {
  datetimeLocalToUtcIso,
  utcIsoToDatetimeLocal,
} from "@/lib/timezone/datetime";

describe("timezone datetime conversion", () => {
  it("creates UTC timestamps from trip-local times", () => {
    expect(datetimeLocalToUtcIso("2026-07-04T09:30", "Europe/Lisbon")).toBe(
      "2026-07-04T08:30:00.000Z",
    );
  });

  it("formats UTC timestamps for editing in the trip timezone", () => {
    expect(utcIsoToDatetimeLocal("2026-07-04T08:30:00.000Z", "Europe/Lisbon")).toBe(
      "2026-07-04T09:30",
    );
  });

  it("handles a non-whole-day offset timezone", () => {
    expect(datetimeLocalToUtcIso("2026-01-10T08:15", "Asia/Kolkata")).toBe(
      "2026-01-10T02:45:00.000Z",
    );
  });
});
