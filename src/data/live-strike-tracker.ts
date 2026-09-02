import type { LightningStrikeEvent } from "../types";
import {
  deduplicateEvents,
  parseLiveCountState,
  parseLiveDistanceState,
} from "./strike-reconstruction";

const DEBOUNCE_MS = 500;

export class LiveStrikeTracker {
  private previousCount: number | null = null;
  private pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private liveEvents: LightningStrikeEvent[] = [];
  private eventCounter = 0;
  private onUpdate: (events: LightningStrikeEvent[]) => void;

  constructor(onUpdate: (events: LightningStrikeEvent[]) => void) {
    this.onUpdate = onUpdate;
  }

  handleStateChange(
    countState: string | undefined,
    distanceState: string | undefined
  ): void {
    const currentCount = parseLiveCountState(countState);
    if (currentCount === null) return;

    if (this.previousCount !== null && currentCount > this.previousCount) {
      const delta = currentCount - this.previousCount;
      if (delta === 1) {
        this.schedulePendingEvent(1, distanceState);
      } else {
        this.schedulePendingEvent(delta, distanceState);
      }
    }

    this.previousCount = currentCount;
  }

  initialize(countState: string | undefined): void {
    if (this.previousCount !== null) {
      return;
    }
    this.previousCount = parseLiveCountState(countState);
  }

  getLiveEvents(): LightningStrikeEvent[] {
    return [...this.liveEvents];
  }

  mergeWithHistory(historyEvents: LightningStrikeEvent[]): LightningStrikeEvent[] {
    return deduplicateEvents(historyEvents, this.liveEvents);
  }

  reset(): void {
    this.previousCount = null;
    this.liveEvents = [];
    this.eventCounter = 0;
    this.clearPending();
  }

  destroy(): void {
    this.clearPending();
  }

  private schedulePendingEvent(
    countDelta: number,
    distanceState: string | undefined
  ): void {
    const timeout = setTimeout(() => {
      this.pendingTimeouts.delete(timeout);
      const distance = parseLiveDistanceState(distanceState);
      const event: LightningStrikeEvent = {
        id: `live-${Date.now()}-${countDelta}-${++this.eventCounter}`,
        timestamp: Date.now(),
        distance,
        countDelta,
        source: "live",
      };
      this.liveEvents = [
        event,
        ...this.liveEvents.filter((e) => !eventsAreEquivalent(e, event)),
      ];
      this.onUpdate(this.liveEvents);
    }, DEBOUNCE_MS);

    this.pendingTimeouts.add(timeout);
  }

  private clearPending(): void {
    for (const timeout of this.pendingTimeouts) {
      clearTimeout(timeout);
    }
    this.pendingTimeouts.clear();
  }
}

function eventsAreEquivalent(
  a: LightningStrikeEvent,
  b: LightningStrikeEvent
): boolean {
  return (
    Math.abs(a.timestamp - b.timestamp) <= 5000 &&
    a.countDelta === b.countDelta &&
    a.distance === b.distance
  );
}
