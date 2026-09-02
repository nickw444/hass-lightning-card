import { describe, it, expect } from "vitest";
import {
  formatAge,
  formatAgeLong,
  ageOpacity,
  getCalendarDayKey,
  getStartOfDayInTimezone,
  isLiveStrike,
  isLiveStrikeFading,
  getLiveStrikePhase,
  getClusterLiveStrikePhase,
  liveStrikeAnimationDelay,
  LIVE_STRIKE_FADE_MS,
  LIVE_STRIKE_WINDOW_MS,
} from "../src/domain/time";

describe("time", () => {
  const now = new Date("2026-09-02T14:30:00Z").getTime();

  it("formats compact ages", () => {
    expect(formatAge(now - 15_000, now)).toBe("now");
    expect(formatAge(now - 45_000, now)).toBe("45s");
    expect(formatAge(now - 120_000, now)).toBe("2m");
    expect(formatAge(now - 3600_000, now)).toBe("1h");
  });

  it("formats long ages", () => {
    expect(formatAgeLong(now - 120_000, now)).toBe("2 minutes ago");
    expect(formatAgeLong(now - 3600_000, now)).toBe("1 hour ago");
  });

  it("computes age opacity with floor", () => {
    expect(ageOpacity(now, 60, now)).toBe(1);
    expect(ageOpacity(now - 30 * 60_000, 60, now)).toBe(0.625);
    expect(ageOpacity(now - 120 * 60_000, 60, now)).toBe(0.25);
  });

  it("gets calendar day key in timezone", () => {
    const key = getCalendarDayKey(
      "Australia/Sydney",
      new Date("2026-09-02T14:00:00Z")
    );
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("gets start of day in timezone", () => {
    const start = getStartOfDayInTimezone(
      "UTC",
      new Date("2026-09-02T15:30:00Z")
    );
    expect(new Date(start).toISOString()).toBe("2026-09-02T00:00:00.000Z");
  });

  it("detects live strikes within 10 seconds", () => {
    expect(isLiveStrike(now - 5_000, now)).toBe(true);
    expect(isLiveStrike(now + 500, now)).toBe(true);
    expect(isLiveStrike(now - LIVE_STRIKE_WINDOW_MS, now)).toBe(false);
    expect(isLiveStrike(now - 15_000, now)).toBe(false);
  });

  it("fades live strikes out after the active window", () => {
    expect(getLiveStrikePhase(now - 5_000, now)).toBe("active");
    expect(getLiveStrikePhase(now - LIVE_STRIKE_WINDOW_MS, now)).toBe("fading");
    expect(
      getLiveStrikePhase(now - LIVE_STRIKE_WINDOW_MS - LIVE_STRIKE_FADE_MS, now)
    ).toBe("none");
    expect(isLiveStrikeFading(now - LIVE_STRIKE_WINDOW_MS - 500, now)).toBe(
      true
    );
  });

  it("treats a cluster as live when any member is live", () => {
    expect(
      getClusterLiveStrikePhase(
        [{ timestamp: now - 15_000 }, { timestamp: now - 3_000 }],
        now
      )
    ).toBe("active");
    expect(
      getClusterLiveStrikePhase(
        [{ timestamp: now - 15_000 }, { timestamp: now - 12_000 }],
        now
      )
    ).toBe("none");
  });

  it("syncs live strike animation delay to age", () => {
    expect(liveStrikeAnimationDelay(now - 2_500, now)).toBe(-2500);
    expect(liveStrikeAnimationDelay(now - 20_000, now)).toBe(
      -LIVE_STRIKE_WINDOW_MS
    );
  });
});
