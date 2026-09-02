import type { LightningStrikeEvent, StrikeCluster } from "../types";
import type { AxisLayout } from "../types";
import { distanceToPixel, CLUSTER_THRESHOLD_PX } from "./axis-layout";

export function clusterStrikes(
  events: LightningStrikeEvent[],
  layout: AxisLayout
): StrikeCluster[] {
  const plottable = events
    .filter((e) => e.distance !== null)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (plottable.length === 0) return [];

  const withX = plottable.map((event) => ({
    event,
    x: distanceToPixel(event.distance as number, layout),
  }));

  const clusters: StrikeCluster[] = [];

  for (const { event, x } of withX) {
    const existing = clusters.find(
      (c) => Math.abs(c.x - x) <= CLUSTER_THRESHOLD_PX
    );

    if (existing) {
      existing.events.push(event);
      existing.count += event.countDelta;
      existing.newestTimestamp = Math.max(existing.newestTimestamp, event.timestamp);
      const distances = existing.events
        .map((e) => e.distance as number)
        .filter((d) => d !== null);
      existing.representativeDistance =
        distances.reduce((a, b) => a + b, 0) / distances.length;
    } else {
      clusters.push({
        id: `cluster-${event.id}`,
        x,
        events: [event],
        representativeDistance: event.distance as number,
        newestTimestamp: event.timestamp,
        count: event.countDelta,
      });
    }
  }

  return clusters.sort((a, b) => b.newestTimestamp - a.newestTimestamp);
}

export function mergePixelClusters(
  clusters: StrikeCluster[],
  thresholdPx = CLUSTER_THRESHOLD_PX
): StrikeCluster[] {
  const sorted = [...clusters].sort((a, b) => a.x - b.x);
  const merged: StrikeCluster[] = [];

  for (const cluster of sorted) {
    const existing = merged.find(
      (c) => Math.abs(c.x - cluster.x) <= thresholdPx
    );

    if (existing) {
      existing.events.push(...cluster.events);
      existing.count += cluster.count;
      existing.newestTimestamp = Math.max(
        existing.newestTimestamp,
        cluster.newestTimestamp
      );
      const distances = existing.events.map((e) => e.distance as number);
      existing.representativeDistance =
        distances.reduce((a, b) => a + b, 0) / distances.length;
      existing.x = (existing.x + cluster.x) / 2;
    } else {
      merged.push({ ...cluster, events: [...cluster.events] });
    }
  }

  return merged.sort((a, b) => b.newestTimestamp - a.newestTimestamp);
}
