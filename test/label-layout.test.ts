import { describe, it, expect } from "vitest";
import { layoutLabels } from "../src/layout/label-layout";
import { clusterStrikes } from "../src/layout/marker-clustering";
import { createAxisLayout, getContentWidth, getTickPixelPositions } from "../src/layout/axis-layout";
import { getMaxLabelsForWidth } from "../src/domain/units";
import type { LightningStrikeEvent } from "../src/types";

function makeEvent(
  distance: number,
  ageMinutes: number,
  now: number
): LightningStrikeEvent {
  return {
    id: `e-${distance}`,
    timestamp: now - ageMinutes * 60_000,
    distance,
    countDelta: 1,
    source: "history",
  };
}

describe("label-layout", () => {
  const now = Date.now();
  const layout = createAxisLayout(600, 40, "km");

  it("always labels newest strike", () => {
    const events = [
      makeEvent(8.4, 1, now),
      makeEvent(13, 8, now),
      makeEvent(21, 17, now),
    ];
    const clusters = clusterStrikes(events, layout);
    const labels = layoutLabels(clusters, {
      maxLabels: 3,
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
    });

    expect(labels.length).toBeGreaterThanOrEqual(1);
    expect(labels[0].isLatest).toBe(true);
  });

  it("enforces maximum labels", () => {
    const events = Array.from({ length: 10 }, (_, i) =>
      makeEvent(2 + i * 3, i + 1, now)
    );
    const clusters = clusterStrikes(events, layout);
    const labels = layoutLabels(clusters, {
      maxLabels: 5,
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
    });

    expect(labels.length).toBeLessThanOrEqual(5);
  });

  it("uses compact labels when many labelled events", () => {
    const events = Array.from({ length: 8 }, (_, i) =>
      makeEvent(2 + i * 2, i + 1, now)
    );
    const clusters = clusterStrikes(events, layout);
    const labels = layoutLabels(clusters, {
      maxLabels: 8,
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
    });

    expect(labels.some((l) => l.compact)).toBe(true);
  });

  it("labels sparse mockup strikes at 400px card width", () => {
    const now = Date.now();
    const hostWidth = 400;
    const layout = createAxisLayout(getContentWidth(hostWidth), 40, "km");
    const events = [
      makeEvent(8.4, 1, now),
      makeEvent(13, 8, now),
      makeEvent(21, 17, now),
      makeEvent(34, 31, now),
    ];
    const clusters = clusterStrikes(events, layout);
    const tickXs = getTickPixelPositions(layout, 10);
    const labels = layoutLabels(clusters, {
      maxLabels: getMaxLabelsForWidth(hostWidth, 8),
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
      tickXs,
    });

    expect(labels).toHaveLength(4);
    expect(labels.map((l) => l.distanceText)).toEqual(
      expect.arrayContaining(["8.4", "13", "21", "34"])
    );
  });

  it("hides dense labels that do not fit in two lanes", () => {
    const now = Date.now();
    const layout = createAxisLayout(getContentWidth(600), 40, "km");
    const events = [
      makeEvent(2.1, 0.5, now),
      makeEvent(3.7, 1, now),
      makeEvent(5.2, 2, now),
      makeEvent(6.8, 3, now),
      makeEvent(8.4, 4, now),
      makeEvent(9.9, 6, now),
      makeEvent(11.3, 7, now),
      makeEvent(12.6, 9, now),
    ];
    const clusters = clusterStrikes(events, layout);
    const labels = layoutLabels(clusters, {
      maxLabels: getMaxLabelsForWidth(600, 8),
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
      tickXs: getTickPixelPositions(layout, 10),
    });

    expect(labels.every((l) => l.lane === 0 || l.lane === 1)).toBe(true);
    expect(labels.map((l) => l.distanceText)).toContain("2.1");
    expect(labels.map((l) => l.distanceText)).not.toContain("5.2");
    expect(labels.length).toBeLessThan(clusters.length);
  });

  it("assigns collision lanes", () => {
    const events = [
      makeEvent(8, 1, now),
      makeEvent(8.2, 2, now),
      makeEvent(8.4, 3, now),
    ];
    const narrowLayout = createAxisLayout(400, 40, "km");
    const clusters = clusterStrikes(events, narrowLayout);
    const labels = layoutLabels(clusters, {
      maxLabels: 3,
      unit: "km",
      now,
      displayMinutes: 60,
      compactThreshold: 5,
    });

    const lanes = new Set(labels.map((l) => l.lane));
    expect(lanes.size).toBeGreaterThanOrEqual(1);
  });
});
