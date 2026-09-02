import { describe, it, expect } from "vitest";
import {
  computeTodayCount,
  computeLastHourCount,
  computeTrend,
} from "../src/domain/trend";
import type { LightningStrikeEvent, NumericSample } from "../src/types";

const TIMEZONE = "Australia/Sydney";

describe("aggregates", () => {
  it("computes today count from positive deltas since midnight", () => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const countSamples: NumericSample[] = [
      { timestamp: midnight.getTime() + 1000, value: 10 },
      { timestamp: midnight.getTime() + 2000, value: 12 },
      { timestamp: midnight.getTime() + 3000, value: 12 },
      { timestamp: midnight.getTime() + 4000, value: 15 },
    ];

    const today = computeTodayCount(countSamples, TIMEZONE);
    expect(today).toBe(5);
  });

  it("handles counter reset in today count", () => {
    const now = Date.now();
    const countSamples: NumericSample[] = [
      { timestamp: now - 3600_000, value: 500 },
      { timestamp: now - 3000_000, value: 503 },
      { timestamp: now - 2000_000, value: 0 },
      { timestamp: now - 1000_000, value: 1 },
      { timestamp: now - 500_000, value: 2 },
    ];

    const today = computeTodayCount(countSamples, TIMEZONE, now);
    expect(today).toBe(5);
  });

  it("computes last hour from events", () => {
    const now = Date.now();
    const events: LightningStrikeEvent[] = [
      {
        id: "1",
        timestamp: now - 30 * 60_000,
        distance: 8,
        countDelta: 1,
        source: "history",
      },
      {
        id: "2",
        timestamp: now - 10 * 60_000,
        distance: 12,
        countDelta: 3,
        source: "history",
      },
      {
        id: "3",
        timestamp: now - 90 * 60_000,
        distance: 20,
        countDelta: 1,
        source: "history",
      },
    ];

    expect(computeLastHourCount(events, now)).toBe(4);
  });
});

describe("trend", () => {
  const now = Date.now();

  const makeEvents = (distances: number[], agesMinutes: number[]): LightningStrikeEvent[] =>
    distances.map((distance, i) => ({
      id: `t${i}`,
      timestamp: now - agesMinutes[i] * 60_000,
      distance,
      countDelta: 1,
      source: "history" as const,
    }));

  it("detects approaching trend", () => {
    const events = makeEvents([34, 21, 13, 8.4], [31, 17, 8, 1]);
    const result = computeTrend(events, {
      enabled: true,
      sample_size: 4,
      window_minutes: 60,
      minimum_net_change: 5,
    }, now);
    expect(result.state).toBe("approaching");
    expect(result.label).toBe("Approaching");
  });

  it("detects receding trend", () => {
    const events = makeEvents([6, 12, 21, 31], [45, 30, 15, 5]);
    const result = computeTrend(events, {
      enabled: true,
      sample_size: 4,
      window_minutes: 60,
      minimum_net_change: 5,
    }, now);
    expect(result.state).toBe("receding");
  });

  it("detects variable trend for noisy data", () => {
    const events = makeEvents([15, 8, 17, 12], [40, 30, 20, 10]);
    const result = computeTrend(events, {
      enabled: true,
      sample_size: 4,
      window_minutes: 60,
      minimum_net_change: 5,
    }, now);
    expect(result.state).toBe("variable");
  });

  it("returns insufficient with too few samples", () => {
    const events = makeEvents([8, 13], [5, 1]);
    const result = computeTrend(events, {
      enabled: true,
      sample_size: 4,
      window_minutes: 60,
      minimum_net_change: 5,
    }, now);
    expect(result.state).toBe("insufficient");
  });

  it("treats batch event as single observation", () => {
    const events: LightningStrikeEvent[] = [
      {
        id: "batch",
        timestamp: now - 5 * 60_000,
        distance: 11,
        countDelta: 4,
        source: "history",
      },
      {
        id: "prev",
        timestamp: now - 30 * 60_000,
        distance: 20,
        countDelta: 1,
        source: "history",
      },
      {
        id: "prev2",
        timestamp: now - 40 * 60_000,
        distance: 25,
        countDelta: 1,
        source: "history",
      },
    ];

    const result = computeTrend(events, {
      enabled: true,
      sample_size: 4,
      window_minutes: 60,
      minimum_net_change: 5,
    }, now);
    expect(result.state).toBe("approaching");
  });
});
