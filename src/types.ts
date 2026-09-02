export type TrendState =
  | "approaching"
  | "receding"
  | "variable"
  | "insufficient";

export interface LightningProximityCardConfig {
  type: string;
  distance_entity: string;
  count_entity: string;
  title?: string;
  max_distance?: number;
  tick_interval?: number;
  display_minutes?: number;
  max_rendered_events?: number;
  max_labels?: number;
  trend?: {
    enabled?: boolean;
    sample_size?: number;
    window_minutes?: number;
    minimum_net_change?: number;
  };
  summary?: {
    today?: boolean;
    last_hour?: boolean;
    trend?: boolean;
  };
  animation?: boolean;
}

export interface ResolvedConfig {
  distance_entity: string;
  count_entity: string;
  title: string;
  max_distance: number;
  tick_interval: number;
  display_minutes: number;
  max_rendered_events: number;
  max_labels: number;
  trend: {
    enabled: boolean;
    sample_size: number;
    window_minutes: number;
    minimum_net_change: number;
  };
  summary: {
    today: boolean;
    last_hour: boolean;
    trend: boolean;
  };
  animation: boolean;
}

export interface LightningStrikeEvent {
  id: string;
  timestamp: number;
  distance: number | null;
  countDelta: number;
  source: "history" | "live";
}

export interface NumericSample {
  timestamp: number;
  value: number;
}

export interface HistoryState {
  state: string;
  last_changed: string;
  last_updated?: string;
}

export interface HistoryEntry {
  entity_id: string;
  states: HistoryState[];
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HassConfig {
  time_zone: string;
  unit_system?: {
    length?: string;
  };
}

export interface Hass {
  states: Record<string, HassEntity>;
  config: HassConfig;
  locale?: {
    language?: string;
  };
  callWS: <T>(msg: Record<string, unknown>) => Promise<T>;
}

export interface StrikeCluster {
  id: string;
  x: number;
  events: LightningStrikeEvent[];
  representativeDistance: number;
  newestTimestamp: number;
  count: number;
}

export interface PlacedLabel {
  clusterId: string;
  lane: number;
  x: number;
  distanceText: string;
  ageText: string;
  compact: boolean;
  opacity: number;
  isLatest: boolean;
  count: number;
}

export interface AxisLayout {
  width: number;
  height: number;
  axisLeft: number;
  axisRight: number;
  axisY: number;
  maxDistance: number;
  unit: string;
}

export interface TrendResult {
  state: TrendState;
  label: string;
  subtext: string;
}

export interface AggregateResult {
  today: number | null;
  lastHour: number | null;
}

export type LayoutMode = "wide" | "medium" | "narrow";

export interface CardRenderState {
  clusters: StrikeCluster[];
  labels: PlacedLabel[];
  trend: TrendResult;
  aggregates: AggregateResult;
  layoutMode: LayoutMode;
  emptyMessage: string | null;
  historyUnavailable: boolean;
  unit: string;
}

export interface LovelaceCard {
  setConfig(config: LightningProximityCardConfig): void;
  getCardSize?(): number;
}

export interface LovelaceCardEditor extends HTMLElement {
  setConfig(config: LightningProximityCardConfig): void;
}

declare global {
  interface HTMLElementTagNameMap {
    "lightning-proximity-card": LightningProximityCardElement;
    "lightning-proximity-card-editor": LightningProximityCardEditorElement;
  }

  interface LightningProximityCardElement extends HTMLElement {
    hass?: Hass;
    setConfig(config: LightningProximityCardConfig): void;
  }

  interface LightningProximityCardEditorElement extends HTMLElement {
    hass?: Hass;
    setConfig(config: LightningProximityCardConfig): void;
  }

  interface Window {
    customCards?: Array<{
      type: string;
      name: string;
      description: string;
      preview?: boolean;
    }>;
  }
}

export const CARD_VERSION = "0.1.0";
