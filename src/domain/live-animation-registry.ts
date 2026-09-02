import { getLiveStrikePhase, liveStrikeAnimationDelay } from "./time";

export class LiveAnimationRegistry {
  private delays = new Map<string, number>();

  resolveDelay(eventId: string, timestamp: number): number {
    let delay = this.delays.get(eventId);
    if (delay === undefined) {
      delay = liveStrikeAnimationDelay(timestamp, Date.now());
      this.delays.set(eventId, delay);
    }
    return delay;
  }

  prune(activeEventIds: Iterable<string>): void {
    const active = new Set(activeEventIds);
    for (const id of this.delays.keys()) {
      if (!active.has(id)) {
        this.delays.delete(id);
      }
    }
  }

  pruneByEvents(
    events: Array<{ id: string; timestamp: number }>,
    now = Date.now()
  ): void {
    const activeIds = events
      .filter((event) => getLiveStrikePhase(event.timestamp, now) !== "none")
      .map((event) => event.id);
    this.prune(activeIds);
  }

  reset(): void {
    this.delays.clear();
  }
}
