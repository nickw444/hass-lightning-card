import type { Hass, LightningProximityCardConfig, ResolvedConfig } from "./types";

const DEFAULT_MAX_DISTANCE_KM = 40;
const DEFAULT_MAX_DISTANCE_MI = 25;
const DEFAULT_TICK_INTERVAL_KM = 10;
const DEFAULT_TICK_INTERVAL_MI = 5;

export function validateConfig(
  config: LightningProximityCardConfig
): LightningProximityCardConfig {
  if (!config.distance_entity) {
    throw new Error("lightning-proximity-card: distance_entity is required");
  }
  if (!config.count_entity) {
    throw new Error("lightning-proximity-card: count_entity is required");
  }
  return config;
}

export function resolveConfig(
  config: LightningProximityCardConfig,
  hass?: Hass
): ResolvedConfig {
  const unit = detectDistanceUnit(hass, config.distance_entity);
  const isMiles = unit === "mi";

  const defaultMax = isMiles ? DEFAULT_MAX_DISTANCE_MI : DEFAULT_MAX_DISTANCE_KM;
  const defaultTick = isMiles ? DEFAULT_TICK_INTERVAL_MI : DEFAULT_TICK_INTERVAL_KM;
  const defaultMinChange = isMiles ? 3 : 5;

  return {
    distance_entity: config.distance_entity,
    count_entity: config.count_entity,
    title: config.title ?? "Lightning",
    max_distance: config.max_distance ?? defaultMax,
    tick_interval: config.tick_interval ?? defaultTick,
    display_minutes: config.display_minutes ?? 60,
    max_rendered_events: config.max_rendered_events ?? 40,
    max_labels: config.max_labels ?? 8,
    trend: {
      enabled: config.trend?.enabled ?? true,
      sample_size: config.trend?.sample_size ?? 4,
      window_minutes: config.trend?.window_minutes ?? 60,
      minimum_net_change:
        config.trend?.minimum_net_change ?? defaultMinChange,
    },
    summary: {
      today: config.summary?.today ?? true,
      last_hour: config.summary?.last_hour ?? true,
      trend: config.summary?.trend ?? true,
    },
    animation: config.animation ?? true,
  };
}

export function detectDistanceUnit(hass: Hass | undefined, entityId: string): string {
  const entity = hass?.states[entityId];
  const unit = entity?.attributes?.unit_of_measurement;
  if (typeof unit === "string" && unit.length > 0) {
    return unit;
  }
  const lengthUnit = hass?.config?.unit_system?.length;
  if (lengthUnit === "mi") {
    return "mi";
  }
  return "km";
}

export function parseNumericState(state: string | undefined): number | null {
  if (!state || state === "unavailable" || state === "unknown") {
    return null;
  }
  const value = Number(state);
  return Number.isFinite(value) ? value : null;
}
