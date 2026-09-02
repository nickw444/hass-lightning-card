import type { Hass, HassEntity, HistoryEntry, LightningStrikeEvent } from "../src/types";

export const ENTITY_DISTANCE = "sensor.ecowitt_lightning_distance";
export const ENTITY_COUNT = "sensor.ecowitt_lightning_count";

const NOW = Date.now();

function entity(
  entityId: string,
  state: string,
  attrs: Record<string, unknown> = {}
): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString(),
  };
}

function minutesAgo(minutes: number): number {
  return NOW - minutes * 60_000;
}

function secondsAgo(seconds: number): number {
  return NOW - seconds * 1000;
}

function hoursAgo(hours: number): number {
  return NOW - hours * 60 * 60_000;
}

function historyState(value: number, timestamp: number) {
  return {
    state: String(value),
    last_changed: new Date(timestamp).toISOString(),
  };
}

export interface FixtureDefinition {
  id: string;
  name: string;
  description: string;
  expectedTrend?: string;
  strikes: FixtureStrike[];
  todayCount: number;
  lastHourCount: number;
  historyUnavailable?: boolean;
}

export interface FixtureStrike {
  distance: number;
  ageMinutes: number;
  countDelta?: number;
}

function resolveEvents(strikes: FixtureStrike[]): LightningStrikeEvent[] {
  const now = Date.now();
  return strikes.map((strike, index) => ({
    id: `event-${strike.distance}-${strike.ageMinutes}-${index}`,
    timestamp: now - strike.ageMinutes * 60_000,
    distance: strike.distance,
    countDelta: strike.countDelta ?? 1,
    source: "history" as const,
  }));
}

function buildHistoryFromEvents(
  events: LightningStrikeEvent[],
  baseCount = 100,
  todayCount?: number
): { countHistory: HistoryEntry; distanceHistory: HistoryEntry } {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);

  let count = baseCount;
  const countStates = [historyState(count, midnight.getTime())];

  const eventDelta = sorted.reduce((s, e) => s + e.countDelta, 0);
  const extraToday = Math.max(0, (todayCount ?? eventDelta) - eventDelta);

  if (extraToday > 0) {
    count += extraToday;
    countStates.push(historyState(count, midnight.getTime() + 60_000));
  }

  for (const event of sorted) {
    count += event.countDelta;
    countStates.push(historyState(count, event.timestamp));
  }

  const distanceStates: ReturnType<typeof historyState>[] = [];
  for (const event of sorted) {
    if (event.distance !== null) {
      distanceStates.push(historyState(event.distance, event.timestamp));
    }
  }

  return {
    countHistory: {
      entity_id: ENTITY_COUNT,
      states: countStates,
    },
    distanceHistory: {
      entity_id: ENTITY_DISTANCE,
      states: distanceStates.length > 0 ? distanceStates : [historyState(0, NOW - 3600_000)],
    },
  };
}

function makeEvent(
  distance: number,
  ageMinutes: number,
  countDelta = 1,
  id?: string
): LightningStrikeEvent {
  const timestamp = minutesAgo(ageMinutes);
  return {
    id: id ?? `event-${distance}-${ageMinutes}`,
    timestamp,
    distance,
    countDelta,
    source: "history",
  };
}

export const FIXTURE_A_SPARSE: FixtureDefinition = {
  id: "sparse",
  name: "Sparse (preferred mockup)",
  description: "Four strikes spread across the axis — Approaching trend",
  expectedTrend: "Approaching",
  todayCount: 12,
  lastHourCount: 4,
  strikes: [
    { distance: 8.4, ageMinutes: 1 },
    { distance: 13, ageMinutes: 8 },
    { distance: 21, ageMinutes: 17 },
    { distance: 34, ageMinutes: 31 },
  ],
};

export const FIXTURE_B_DENSE: FixtureDefinition = {
  id: "dense",
  name: "Dense activity",
  description: "Many strikes in a short period — label de-cluttering",
  todayCount: 14,
  lastHourCount: 14,
  strikes: [
    { distance: 2.1, ageMinutes: 0.5 },
    { distance: 3.7, ageMinutes: 1 },
    { distance: 5.2, ageMinutes: 2 },
    { distance: 6.8, ageMinutes: 3 },
    { distance: 8.4, ageMinutes: 4 },
    { distance: 9.9, ageMinutes: 6 },
    { distance: 11.3, ageMinutes: 7 },
    { distance: 12.6, ageMinutes: 9 },
    { distance: 14.2, ageMinutes: 11 },
    { distance: 16.5, ageMinutes: 14 },
    { distance: 22.1, ageMinutes: 22 },
    { distance: 29.4, ageMinutes: 28 },
    { distance: 33.8, ageMinutes: 34 },
    { distance: 37.2, ageMinutes: 41 },
  ],
};

export const FIXTURE_C_REPEATED: FixtureDefinition = {
  id: "repeated",
  name: "Repeated distance",
  description: "Multiple strikes at 8 km — clustered visual",
  todayCount: 8,
  lastHourCount: 4,
  strikes: [
    { distance: 8, ageMinutes: 1 },
    { distance: 8, ageMinutes: 3 },
    { distance: 8, ageMinutes: 5 },
    { distance: 8, ageMinutes: 9 },
  ],
};

export const FIXTURE_D_NO_RECENT: FixtureDefinition = {
  id: "no-recent",
  name: "No recent strikes",
  description: "Today count > 0, last event >2h ago",
  expectedTrend: "insufficient",
  todayCount: 12,
  lastHourCount: 0,
  strikes: [
    { distance: 15, ageMinutes: 150 },
    { distance: 22, ageMinutes: 180 },
  ],
};

export const FIXTURE_E_RECEDING: FixtureDefinition = {
  id: "receding",
  name: "Receding",
  description: "Strikes moving farther away",
  expectedTrend: "Receding",
  todayCount: 8,
  lastHourCount: 4,
  strikes: [
    { distance: 6, ageMinutes: 45 },
    { distance: 12, ageMinutes: 30 },
    { distance: 21, ageMinutes: 15 },
    { distance: 31, ageMinutes: 5 },
  ],
};

export const FIXTURE_F_VARIABLE: FixtureDefinition = {
  id: "variable",
  name: "Variable / noisy",
  description: "Mixed distance changes",
  expectedTrend: "Variable",
  todayCount: 6,
  lastHourCount: 4,
  strikes: [
    { distance: 15, ageMinutes: 40 },
    { distance: 8, ageMinutes: 30 },
    { distance: 17, ageMinutes: 20 },
    { distance: 12, ageMinutes: 10 },
  ],
};

export const FIXTURE_G_RESET: FixtureDefinition = {
  id: "reset",
  name: "Counter reset",
  description: "Count resets without negative deltas",
  todayCount: 3,
  lastHourCount: 3,
  strikes: [
    { distance: 10, ageMinutes: 30 },
    { distance: 12, ageMinutes: 25 },
    { distance: 8, ageMinutes: 20 },
  ],
};

export const FIXTURE_H_BATCHED: FixtureDefinition = {
  id: "batched",
  name: "Batched count",
  description: "Single distance for count jump of 4",
  todayCount: 4,
  lastHourCount: 4,
  strikes: [{ distance: 12, ageMinutes: 5, countDelta: 4 }],
};

export const FIXTURE_I_DELAYED_DISTANCE: FixtureDefinition = {
  id: "delayed-distance",
  name: "Delayed distance update",
  description: "Distance arrives 300ms after count",
  todayCount: 1,
  lastHourCount: 1,
  strikes: [{ distance: 11, ageMinutes: 2 }],
};

export const FIXTURE_J_UNAVAILABLE: FixtureDefinition = {
  id: "unavailable",
  name: "Recorder unavailable",
  description: "History fails — live-only fallback",
  todayCount: 0,
  lastHourCount: 0,
  historyUnavailable: true,
  strikes: [],
};

export const FIXTURE_K_LIVE: FixtureDefinition = {
  id: "live",
  name: "Live simulation",
  description:
    "Baseline history — use live controls to fire strikes and watch real-time updates",
  todayCount: 8,
  lastHourCount: 2,
  strikes: [
    { distance: 18, ageMinutes: 25 },
    { distance: 24, ageMinutes: 40 },
  ],
};

export const ALL_FIXTURES: FixtureDefinition[] = [
  FIXTURE_A_SPARSE,
  FIXTURE_K_LIVE,
  FIXTURE_B_DENSE,
  FIXTURE_C_REPEATED,
  FIXTURE_D_NO_RECENT,
  FIXTURE_E_RECEDING,
  FIXTURE_F_VARIABLE,
  FIXTURE_G_RESET,
  FIXTURE_H_BATCHED,
  FIXTURE_I_DELAYED_DISTANCE,
  FIXTURE_J_UNAVAILABLE,
];

export function createMockHass(fixture: FixtureDefinition): Hass {
  const events = resolveEvents(fixture.strikes);
  const { countHistory, distanceHistory } = buildHistoryFromEvents(
    events,
    88,
    fixture.todayCount
  );

  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const latestDistance = sortedEvents[0]?.distance ?? 0;
  const latestCount =
    countHistory.states[countHistory.states.length - 1]?.state ?? "0";

  const historyMap: Record<string, HistoryEntry> = {
    [ENTITY_COUNT]: countHistory,
    [ENTITY_DISTANCE]: distanceHistory,
  };

  return {
    states: {
      [ENTITY_DISTANCE]: entity(ENTITY_DISTANCE, String(latestDistance), {
        unit_of_measurement: "km",
        friendly_name: "Lightning Distance",
      }),
      [ENTITY_COUNT]: entity(ENTITY_COUNT, latestCount, {
        friendly_name: "Lightning Count",
      }),
    },
    config: {
      time_zone: "Australia/Sydney",
      unit_system: { length: "km" },
    },
    locale: { language: "en" },
    callWS: async <T>(msg: Record<string, unknown>): Promise<T> => {
      if (fixture.historyUnavailable) {
        throw new Error("Recorder unavailable");
      }

      if (msg.type === "history/history_during_period") {
        const entityIds = msg.entity_ids as string[];
        const response: Record<string, unknown> = {};
        for (const id of entityIds) {
          const entry = historyMap[id];
          response[id] = entry?.states ?? [];
        }
        return response as T;
      }

      return {} as T;
    },
  };
}

export function createDelayedDistanceHass(): Hass {
  const baseTime = secondsAgo(120);
  const countTime = baseTime;
  const distanceTime = baseTime + 300;

  const hass = createMockHass({
    id: "delayed",
    name: "Delayed",
    description: "",
    todayCount: 1,
    lastHourCount: 1,
    strikes: [{ distance: 11, ageMinutes: 2 }],
  });

  const originalCallWS = hass.callWS;
  hass.callWS = async <T>(msg: Record<string, unknown>): Promise<T> => {
    if (msg.type === "history/history_during_period") {
      const response = await originalCallWS<Record<string, Array<{ state: string; last_changed: string }>>>(msg);
      const countStates = response[ENTITY_COUNT] ?? [];
      const distanceStates = response[ENTITY_DISTANCE] ?? [];

      if (countStates.length > 0) {
        countStates[countStates.length - 1].last_changed = new Date(countTime).toISOString();
      }
      if (distanceStates.length > 0) {
        distanceStates[distanceStates.length - 1] = {
          state: "11",
          last_changed: new Date(distanceTime).toISOString(),
        };
      }

      return response as T;
    }
    return originalCallWS(msg);
  };

  return hass;
}

export { NOW, minutesAgo, secondsAgo, hoursAgo, buildHistoryFromEvents, makeEvent };
