import type { LightningStrikeEvent, NumericSample, TrendResult, TrendState } from "../types";
import { getStartOfDayInTimezone } from "./time";

export function computeTodayCount(
  countSamples: NumericSample[],
  timeZone: string,
  now = Date.now()
): number {
  const midnight = getStartOfDayInTimezone(timeZone, new Date(now));
  const relevant = countSamples.filter((s) => s.timestamp >= midnight);
  if (relevant.length < 2) {
    return 0;
  }

  let total = 0;
  for (let i = 1; i < relevant.length; i++) {
    const delta = relevant[i].value - relevant[i - 1].value;
    if (delta > 0) {
      total += delta;
    }
  }
  return total;
}

export function computeLastHourCount(
  events: LightningStrikeEvent[],
  now = Date.now()
): number {
  const cutoff = now - 60 * 60_000;
  return events
    .filter((e) => e.timestamp >= cutoff)
    .reduce((sum, e) => sum + e.countDelta, 0);
}

export function computeTodayFromEvents(
  events: LightningStrikeEvent[],
  timeZone: string,
  now = Date.now()
): number {
  const midnight = getStartOfDayInTimezone(timeZone, new Date(now));
  return events
    .filter((e) => e.timestamp >= midnight)
    .reduce((sum, e) => sum + e.countDelta, 0);
}

export interface TrendObservation {
  timestamp: number;
  distance: number;
}

export function getTrendObservations(
  events: LightningStrikeEvent[],
  windowMinutes: number,
  sampleSize: number,
  now = Date.now()
): TrendObservation[] {
  const cutoff = now - windowMinutes * 60_000;
  const withDistance = events
    .filter((e) => e.distance !== null && e.timestamp >= cutoff)
  // Batch events count once for trend
    .map((e) => ({
      timestamp: e.timestamp,
      distance: e.distance as number,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  return withDistance.slice(-sampleSize);
}

export function computeTrend(
  events: LightningStrikeEvent[],
  options: {
    enabled: boolean;
    sample_size: number;
    window_minutes: number;
    minimum_net_change: number;
  },
  now = Date.now()
): TrendResult {
  if (!options.enabled) {
    return trendResult("insufficient");
  }

  const observations = getTrendObservations(
    events,
    options.window_minutes,
    options.sample_size,
    now
  );

  if (observations.length < 3) {
    return trendResult("insufficient");
  }

  const distances = observations.map((o) => o.distance);
  const d0 = distances[0];
  const dLast = distances[distances.length - 1];
  const netChange = dLast - d0;

  const movements: number[] = [];
  for (let i = 1; i < distances.length; i++) {
    movements.push(distances[i] - distances[i - 1]);
  }

  const negativeCount = movements.filter((m) => m < 0).length;
  const positiveCount = movements.filter((m) => m > 0).length;

  if (
    netChange <= -options.minimum_net_change &&
    negativeCount >= 2
  ) {
    return trendResult("approaching");
  }

  if (
    netChange >= options.minimum_net_change &&
    positiveCount >= 2
  ) {
    return trendResult("receding");
  }

  return trendResult("variable");
}

function trendResult(state: TrendState): TrendResult {
  switch (state) {
    case "approaching":
      return {
        state,
        label: "Approaching",
        subtext: "Storm is getting closer",
      };
    case "receding":
      return {
        state,
        label: "Receding",
        subtext: "Storm is moving away",
      };
    case "variable":
      return {
        state,
        label: "Variable",
        subtext: "Distance keeps changing",
      };
    default:
      return {
        state: "insufficient",
        label: "—",
        subtext: "Not enough recent strikes",
      };
  }
}
