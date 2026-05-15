export type LaneInput = {
  id: string;
  start_at: string;
  end_at: string;
};

export type LaneAssignment<T extends LaneInput> = {
  event: T;
  lane: number;
  laneCount: number;
};

export function assignTimelineLanes<T extends LaneInput>(
  events: readonly T[],
): LaneAssignment<T>[] {
  const sorted = [...events].sort((a, b) => {
    const startDelta = Date.parse(a.start_at) - Date.parse(b.start_at);
    if (startDelta !== 0) return startDelta;
    return Date.parse(a.end_at) - Date.parse(b.end_at);
  });

  const assignments: LaneAssignment<T>[] = [];
  const active: Array<{ lane: number; endMs: number }> = [];
  let cluster: LaneAssignment<T>[] = [];
  let clusterMaxLane = 0;

  const finalizeCluster = () => {
    const laneCount = clusterMaxLane + 1;
    cluster.forEach((assignment) => {
      assignment.laneCount = laneCount;
    });
    cluster = [];
    clusterMaxLane = 0;
  };

  for (const event of sorted) {
    const startMs = Date.parse(event.start_at);
    const endMs = Date.parse(event.end_at);

    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].endMs <= startMs) {
        active.splice(index, 1);
      }
    }

    if (active.length === 0 && cluster.length > 0) {
      finalizeCluster();
    }

    const usedLanes = new Set(active.map((item) => item.lane));
    let lane = 0;
    while (usedLanes.has(lane)) lane += 1;

    const assignment: LaneAssignment<T> = {
      event,
      lane,
      laneCount: 1,
    };

    active.push({ lane, endMs });
    cluster.push(assignment);
    clusterMaxLane = Math.max(clusterMaxLane, lane);
    assignments.push(assignment);
  }

  if (cluster.length > 0) {
    finalizeCluster();
  }

  return assignments.sort((a, b) => events.indexOf(a.event) - events.indexOf(b.event));
}
