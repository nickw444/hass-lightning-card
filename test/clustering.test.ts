import { describe, it, expect } from "vitest";
import { clusterStrikes, mergePixelClusters } from "../src/layout/marker-clustering";
import { createAxisLayout } from "../src/layout/axis-layout";
import type { LightningStrikeEvent, StrikeCluster } from "../src/types";

function makeEvent(distance: number, timestamp: number): LightningStrikeEvent {
  return {
    id: `e-${distance}-${timestamp}`,
    timestamp,
    distance,
    countDelta: 1,
    source: "history",
  };
}

describe("clustering", () => {
  const layout = createAxisLayout(600, 40, "km");

  it("clusters identical pixel positions", () => {
    const now = Date.now();
    const events = [
      makeEvent(8, now - 60_000),
      makeEvent(8, now - 180_000),
      makeEvent(8, now - 300_000),
      makeEvent(8, now - 540_000),
    ];

    const clusters = clusterStrikes(events, layout);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].count).toBe(4);
  });

  it("does not cluster markers far apart", () => {
    const now = Date.now();
    const events = [
      makeEvent(8, now - 60_000),
      makeEvent(21, now - 300_000),
      makeEvent(34, now - 600_000),
    ];

    const clusters = clusterStrikes(events, layout);
    expect(clusters).toHaveLength(3);
  });

  it("mergePixelClusters combines nearby clusters", () => {
    const clusters: StrikeCluster[] = [
      {
        id: "c1",
        x: 100,
        events: [makeEvent(8, 1000)],
        representativeDistance: 8,
        newestTimestamp: 1000,
        count: 1,
      },
      {
        id: "c2",
        x: 103,
        events: [makeEvent(8.1, 2000)],
        representativeDistance: 8.1,
        newestTimestamp: 2000,
        count: 1,
      },
    ];

    const merged = mergePixelClusters(clusters, 7);
    expect(merged).toHaveLength(1);
    expect(merged[0].count).toBe(2);
  });

  it("resize changes clustering outcome", () => {
    const now = Date.now();
    const events = [
      makeEvent(8, now - 60_000),
      makeEvent(8.5, now - 120_000),
    ];

    const wideLayout = createAxisLayout(1200, 40, "km");
    const narrowLayout = createAxisLayout(320, 40, "km");

    const wideClusters = clusterStrikes(events, wideLayout);
    const narrowClusters = clusterStrikes(events, narrowLayout);

    expect(wideClusters.length).toBeGreaterThanOrEqual(narrowClusters.length);
  });
});
