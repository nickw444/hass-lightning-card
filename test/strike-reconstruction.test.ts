import { describe, it, expect } from "vitest";
import {
  reconstructStrikes,
  correlateDistance,
  deduplicateEvents,
} from "../src/data/strike-reconstruction";
import type { LightningStrikeEvent, NumericSample } from "../src/types";

describe("strike-reconstruction", () => {
  it("reconstructs simple +1 increments", () => {
    const countSamples: NumericSample[] = [
      { timestamp: 1000, value: 10 },
      { timestamp: 2000, value: 11 },
      { timestamp: 3000, value: 12 },
    ];
    const distanceSamples: NumericSample[] = [
      { timestamp: 2000, value: 8 },
      { timestamp: 3000, value: 13 },
    ];

    const events = reconstructStrikes(countSamples, distanceSamples);
    expect(events).toHaveLength(2);
    expect(events[0].countDelta).toBe(1);
    expect(events[0].distance).toBe(8);
    expect(events[1].distance).toBe(13);
  });

  it("handles repeated identical distance", () => {
    const countSamples: NumericSample[] = [
      { timestamp: 1000, value: 5 },
      { timestamp: 2000, value: 6 },
      { timestamp: 3000, value: 7 },
      { timestamp: 4000, value: 8 },
    ];
    const distanceSamples: NumericSample[] = [
      { timestamp: 500, value: 8 },
    ];

    const events = reconstructStrikes(countSamples, distanceSamples);
    expect(events).toHaveLength(3);
    expect(events.every((e) => e.distance === 8)).toBe(true);
  });

  it("prefers nearby after-count distance update", () => {
    const timestamp = 10_000;
    const distanceSamples: NumericSample[] = [
      { timestamp: timestamp - 1000, value: 5 },
      { timestamp: timestamp + 300, value: 11 },
    ];

    const distance = correlateDistance(timestamp, distanceSamples);
    expect(distance).toBe(11);
  });

  it("uses before-count distance when closer", () => {
    const timestamp = 10_000;
    const distanceSamples: NumericSample[] = [
      { timestamp: timestamp - 200, value: 11 },
      { timestamp: timestamp + 4000, value: 5 },
    ];

    const distance = correlateDistance(timestamp, distanceSamples);
    expect(distance).toBe(11);
  });

  it("ignores counter reset (negative delta)", () => {
    const countSamples: NumericSample[] = [
      { timestamp: 1000, value: 500 },
      { timestamp: 2000, value: 501 },
      { timestamp: 3000, value: 502 },
      { timestamp: 4000, value: 0 },
      { timestamp: 5000, value: 1 },
      { timestamp: 6000, value: 2 },
    ];
    const distanceSamples: NumericSample[] = [
      { timestamp: 2000, value: 10 },
      { timestamp: 5000, value: 8 },
      { timestamp: 6000, value: 12 },
    ];

    const events = reconstructStrikes(countSamples, distanceSamples);
    expect(events).toHaveLength(4);
    expect(events.every((e) => e.countDelta > 0)).toBe(true);
    expect(events.reduce((s, e) => s + e.countDelta, 0)).toBe(4);
  });

  it("handles delta > 1 as single event", () => {
    const countSamples: NumericSample[] = [
      { timestamp: 1000, value: 100 },
      { timestamp: 2000, value: 104 },
    ];
    const distanceSamples: NumericSample[] = [
      { timestamp: 2000, value: 12 },
    ];

    const events = reconstructStrikes(countSamples, distanceSamples);
    expect(events).toHaveLength(1);
    expect(events[0].countDelta).toBe(4);
    expect(events[0].distance).toBe(12);
  });

  it("skips invalid numeric values via empty distance", () => {
    const countSamples: NumericSample[] = [
      { timestamp: 1000, value: 1 },
      { timestamp: 2000, value: 2 },
    ];
    const events = reconstructStrikes(countSamples, []);
    expect(events).toHaveLength(1);
    expect(events[0].distance).toBeNull();
  });

  it("deduplicates live and history events", () => {
    const history: LightningStrikeEvent[] = [
      {
        id: "h1",
        timestamp: 1000,
        distance: 8,
        countDelta: 1,
        source: "history",
      },
    ];
    const live: LightningStrikeEvent[] = [
      {
        id: "l1",
        timestamp: 1002,
        distance: 8,
        countDelta: 1,
        source: "live",
      },
    ];

    const merged = deduplicateEvents(history, live);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({
      source: "live",
      timestamp: 1002,
    });
  });
});
