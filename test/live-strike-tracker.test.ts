import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveStrikeTracker } from "../src/data/live-strike-tracker";

describe("LiveStrikeTracker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not reset baseline on repeated initialize calls", () => {
    const onUpdate = vi.fn();
    const tracker = new LiveStrikeTracker(onUpdate);

    tracker.initialize("10");
    tracker.initialize("11");
    tracker.handleStateChange("12", "8.4");

    vi.advanceTimersByTime(500);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0][0]).toMatchObject({
      distance: 8.4,
      countDelta: 2,
      source: "live",
    });
  });

  it("creates separate live events for rapid successive increments", () => {
    const onUpdate = vi.fn();
    const tracker = new LiveStrikeTracker(onUpdate);

    tracker.initialize("10");
    tracker.handleStateChange("11", "8");
    tracker.handleStateChange("12", "10");

    vi.advanceTimersByTime(500);

    expect(onUpdate).toHaveBeenCalled();
    expect(tracker.getLiveEvents()).toHaveLength(2);
    expect(tracker.getLiveEvents().map((event) => event.distance)).toEqual([
      10,
      8,
    ]);
  });

  it("re-baselines after reset", () => {
    const onUpdate = vi.fn();
    const tracker = new LiveStrikeTracker(onUpdate);

    tracker.initialize("5");
    tracker.handleStateChange("5", "10");
    tracker.reset();
    tracker.initialize("5");
    tracker.handleStateChange("6", "12");

    vi.advanceTimersByTime(500);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(onUpdate.mock.calls[0][0][0].distance).toBe(12);
  });
});
