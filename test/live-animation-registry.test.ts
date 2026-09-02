import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LiveAnimationRegistry } from "../src/domain/live-animation-registry";

describe("LiveAnimationRegistry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("freezes animation delay the first time an event is seen", () => {
    const registry = new LiveAnimationRegistry();
    const timestamp = Date.now();

    vi.advanceTimersByTime(2_500);

    const delay = registry.resolveDelay("live-1", timestamp);
    expect(delay).toBe(-2_500);
    expect(registry.resolveDelay("live-1", timestamp)).toBe(-2_500);
  });

  it("prunes delays once events leave the live window", () => {
    const registry = new LiveAnimationRegistry();
    const timestamp = Date.now();

    registry.resolveDelay("live-1", timestamp);
    registry.prune([]);

    vi.advanceTimersByTime(2_500);
    expect(registry.resolveDelay("live-1", timestamp)).toBe(-2_500);
  });
});
