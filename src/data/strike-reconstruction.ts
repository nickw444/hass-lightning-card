import type { LightningStrikeEvent, NumericSample } from "../types";
import { parseNumericState } from "../config";

const CORRELATION_WINDOW_MS = 5000;
const AFTER_WINDOW_MS = 10000;

export function reconstructStrikes(
  countSamples: NumericSample[],
  distanceSamples: NumericSample[],
  source: "history" | "live" = "history"
): LightningStrikeEvent[] {
  const events: LightningStrikeEvent[] = [];

  for (let i = 1; i < countSamples.length; i++) {
    const prev = countSamples[i - 1];
    const curr = countSamples[i];
    const delta = curr.value - prev.value;

    if (delta <= 0) {
      continue;
    }

    const distance = correlateDistance(curr.timestamp, distanceSamples);
    events.push({
      id: `${source}-${curr.timestamp}-${delta}`,
      timestamp: curr.timestamp,
      distance,
      countDelta: delta,
      source,
    });
  }

  return events;
}

export function correlateDistance(
  timestamp: number,
  distanceSamples: NumericSample[]
): number | null {
  if (distanceSamples.length === 0) {
    return null;
  }

  let bestInWindow: NumericSample | null = null;
  let bestInWindowDiff = Infinity;

  for (const sample of distanceSamples) {
    const diff = Math.abs(sample.timestamp - timestamp);
    if (diff <= CORRELATION_WINDOW_MS) {
      if (
        diff < bestInWindowDiff ||
        (diff === bestInWindowDiff &&
          sample.timestamp > (bestInWindow?.timestamp ?? 0))
      ) {
        bestInWindowDiff = diff;
        bestInWindow = sample;
      }
    }
  }

  if (bestInWindow) {
    return bestInWindow.value;
  }

  const lastKnown = [...distanceSamples]
    .filter((s) => s.timestamp <= timestamp)
    .pop();

  if (lastKnown) {
    return lastKnown.value;
  }

  const firstAfter = distanceSamples.find(
    (s) => s.timestamp > timestamp && s.timestamp - timestamp <= AFTER_WINDOW_MS
  );

  return firstAfter?.value ?? null;
}

export function deduplicateEvents(
  historyEvents: LightningStrikeEvent[],
  liveEvents: LightningStrikeEvent[]
): LightningStrikeEvent[] {
  const merged = [...historyEvents];

  for (const live of liveEvents) {
    const duplicateIndex = merged.findIndex((history) =>
      eventsAreEquivalent(history, live)
    );
    if (duplicateIndex >= 0) {
      merged[duplicateIndex] = live;
    } else {
      merged.push(live);
    }
  }

  return merged.sort((a, b) => b.timestamp - a.timestamp);
}

export function eventsAreEquivalent(
  a: LightningStrikeEvent,
  b: LightningStrikeEvent
): boolean {
  return (
    Math.abs(a.timestamp - b.timestamp) <= 5000 &&
    a.countDelta === b.countDelta &&
    a.distance === b.distance
  );
}

export function parseLiveCountState(state: string | undefined): number | null {
  return parseNumericState(state);
}

export function parseLiveDistanceState(state: string | undefined): number | null {
  return parseNumericState(state);
}
