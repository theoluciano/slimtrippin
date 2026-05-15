import { describe, expect, it } from "vitest";
import { assignTimelineLanes } from "@/lib/timeline/lanes";

function event(id: string, start: string, end: string) {
  return {
    id,
    start_at: `2026-05-01T${start}:00.000Z`,
    end_at: `2026-05-01T${end}:00.000Z`,
  };
}

describe("assignTimelineLanes", () => {
  it("keeps non-overlapping events in one lane", () => {
    const result = assignTimelineLanes([
      event("a", "09:00", "10:00"),
      event("b", "11:00", "12:00"),
    ]);

    expect(result.map((item) => item.lane)).toEqual([0, 0]);
    expect(result.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("treats adjacent events as non-overlapping", () => {
    const result = assignTimelineLanes([
      event("a", "09:00", "10:00"),
      event("b", "10:00", "11:00"),
    ]);

    expect(result.map((item) => item.lane)).toEqual([0, 0]);
    expect(result.map((item) => item.laneCount)).toEqual([1, 1]);
  });

  it("assigns separate lanes to overlapping events", () => {
    const result = assignTimelineLanes([
      event("a", "09:00", "11:00"),
      event("b", "10:00", "12:00"),
    ]);

    expect(result.map((item) => item.lane)).toEqual([0, 1]);
    expect(result.map((item) => item.laneCount)).toEqual([2, 2]);
  });

  it("handles nested events with stable lane counts", () => {
    const result = assignTimelineLanes([
      event("a", "09:00", "13:00"),
      event("b", "10:00", "11:00"),
      event("c", "11:00", "12:00"),
    ]);

    expect(result.map((item) => item.lane)).toEqual([0, 1, 1]);
    expect(result.map((item) => item.laneCount)).toEqual([2, 2, 2]);
  });
});
