import type { HistoryEntry, NumericSample } from "../types";
import { parseNumericState } from "../config";

export function normalizeHistory(entries: HistoryEntry[]): {
  countSamples: NumericSample[];
  distanceSamples: NumericSample[];
} {
  const countEntry = entries.find((e) => e.entity_id.includes("count"));
  const distanceEntry = entries.find((e) => e.entity_id.includes("distance"));

  const countSamples = normalizeEntityHistory(
    countEntry ?? entries[0]
  );
  const distanceSamples = normalizeEntityHistory(
    distanceEntry ?? entries[1] ?? entries[0]
  );

  return { countSamples, distanceSamples };
}

export function normalizeEntityHistory(
  entry: HistoryEntry | undefined
): NumericSample[] {
  if (!entry) return [];

  return entry.states
    .map((s) => {
      const value = parseNumericState(s.state);
      if (value === null) return null;
      return {
        timestamp: new Date(s.last_changed).getTime(),
        value,
      };
    })
    .filter((s): s is NumericSample => s !== null)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export function normalizeHistoryByEntityId(
  entries: HistoryEntry[],
  countEntityId: string,
  distanceEntityId: string
): { countSamples: NumericSample[]; distanceSamples: NumericSample[] } {
  const countEntry = entries.find((e) => e.entity_id === countEntityId);
  const distanceEntry = entries.find((e) => e.entity_id === distanceEntityId);

  return {
    countSamples: normalizeEntityHistory(countEntry),
    distanceSamples: normalizeEntityHistory(distanceEntry),
  };
}
