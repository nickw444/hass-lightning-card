import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  Hass,
  LightningProximityCardConfig,
  LightningStrikeEvent,
  ResolvedConfig,
  StrikeCluster,
} from "./types";
import { CARD_VERSION } from "./types";
import { validateConfig, resolveConfig, detectDistanceUnit } from "./config";
import { cardStyles } from "./styles";
import { HistoryClient } from "./data/history-client";
import { normalizeHistoryByEntityId } from "./data/history-normalizer";
import { reconstructStrikes } from "./data/strike-reconstruction";
import { LiveStrikeTracker } from "./data/live-strike-tracker";
import {
  computeTodayCount,
  computeLastHourCount,
  computeTrend,
} from "./domain/trend";
import { LiveAnimationRegistry } from "./domain/live-animation-registry";
import {
  getCalendarDayKey,
  getStartOfDayInTimezone,
  getLiveStrikePhase,
  getLiveStrikeTransitionTimes,
} from "./domain/time";
import type { NumericSample } from "./types";
import { getLayoutMode, getMaxLabelsForWidth } from "./domain/units";
import { createAxisLayout, getContentWidth, getTickPixelPositions } from "./layout/axis-layout";
import { clusterStrikes } from "./layout/marker-clustering";
import { layoutLabels } from "./layout/label-layout";
import { renderHeader } from "./render/header";
import { renderAxis } from "./render/axis";
import { renderFooter } from "./render/footer";

@customElement("lightning-proximity-card")
export class LightningProximityCard extends LitElement {
  @property({ attribute: false }) public hass?: Hass;

  @state() private _config?: ResolvedConfig;
  @state() private _events: LightningStrikeEvent[] = [];
  @state() private _width = 400;
  @state() private _now = Date.now();
  @state() private _historyUnavailable = false;
  @state() private _hoveredCluster: StrikeCluster | null = null;
  @state() private _tooltipPos = { x: 0, y: 0 };

  private _historyClient?: HistoryClient;
  private _liveTracker?: LiveStrikeTracker;
  private _resizeObserver?: ResizeObserver;
  private _tickTimer?: ReturnType<typeof setTimeout>;
  private _liveExpiryTimer?: ReturnType<typeof setTimeout>;
  private _liveAnimationRegistry = new LiveAnimationRegistry();
  private _dayKey = "";
  private _historyGeneration = 0;
  private _countSamples: NumericSample[] = [];

  static styles = cardStyles;

  public setConfig(config: LightningProximityCardConfig): void {
    validateConfig(config);
    const resolved = resolveConfig(config, this.hass);
    const configChanged =
      !this._config ||
      this._config.distance_entity !== resolved.distance_entity ||
      this._config.count_entity !== resolved.count_entity ||
      this._config.display_minutes !== resolved.display_minutes;

    this._config = resolved;

    if (configChanged) {
      this._liveTracker?.reset();
      this._liveAnimationRegistry.reset();
      void this._ensureHistoryLoaded();
      this.requestUpdate();
    }
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._setupResizeObserver();
    this._startTickTimer();
    this._liveTracker = new LiveStrikeTracker(() => {
      this._mergeEvents();
    });
    if (this.hass) {
      this._historyClient = new HistoryClient(this.hass.callWS.bind(this.hass));
    }
    if (this._config && this.hass) {
      void this._ensureHistoryLoaded();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    if (this._tickTimer) {
      clearTimeout(this._tickTimer);
      this._tickTimer = undefined;
    }
    if (this._liveExpiryTimer) {
      clearTimeout(this._liveExpiryTimer);
      this._liveExpiryTimer = undefined;
    }
    this._liveTracker?.destroy();
    this._liveAnimationRegistry.reset();
    this._historyClient?.invalidate();
    this._historyGeneration++;
  }

  protected firstUpdated(): void {
    void this._ensureHistoryLoaded();
    this._bindMarkerEvents();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (this.hass && this._config) {
      if (changed.has("hass")) {
        void this._ensureHistoryLoaded();
      }

      const countState = this.hass.states[this._config.count_entity]?.state;
      const distanceState =
        this.hass.states[this._config.distance_entity]?.state;

      if (!this._liveTracker) {
        this._liveTracker = new LiveStrikeTracker(() => this._mergeEvents());
      }

      this._liveTracker.initialize(countState);
      this._liveTracker.handleStateChange(countState, distanceState);
    }

    this._bindMarkerEvents();
  }

  protected render() {
    if (!this._config) {
      return html`<ha-card><div>Configuration error</div></ha-card>`;
    }

    const unit = detectDistanceUnit(this.hass, this._config.distance_entity);
    const layoutMode = getLayoutMode(this._width);
    const contentWidth = getContentWidth(this._width);
    const layout = createAxisLayout(
      contentWidth,
      this._config.max_distance,
      unit
    );

    const displayCutoff = this._now - this._config.display_minutes * 60_000;
    const displayEvents = this._events
      .filter((e) => e.timestamp >= displayCutoff && e.distance !== null)
      .slice(0, this._config.max_rendered_events);

    const clusters = clusterStrikes(displayEvents, layout);
    const maxLabels = getMaxLabelsForWidth(this._width, this._config.max_labels);
    const tickXs = getTickPixelPositions(layout, this._config.tick_interval);
    const labels = layoutLabels(clusters, {
      maxLabels,
      unit,
      now: this._now,
      displayMinutes: this._config.display_minutes,
      compactThreshold: 5,
      tickXs,
    });

    const emptyMessage =
      displayEvents.length === 0
        ? `No strikes in the last ${this._config.display_minutes >= 60 ? "hour" : `${this._config.display_minutes} minutes`}`
        : null;

    const timeZone = this.hass?.config?.time_zone ?? "UTC";

    const aggregates = {
      today: this._config.summary.today
        ? computeTodayCount(this._countSamples, timeZone, this._now)
        : null,
      lastHour: this._config.summary.last_hour
        ? computeLastHourCount(this._events, this._now)
        : null,
    };

    const trend = computeTrend(this._events, this._config.trend, this._now);

    const animationEnabled =
      this._config.animation &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this._liveAnimationRegistry.pruneByEvents(this._events, this._now);

    const ariaSummary = this._buildAriaSummary(
      aggregates,
      clusters,
      trend,
      unit
    );

    return html`
      <ha-card aria-label="${ariaSummary}">
        <div class="card-inner">
          ${renderHeader(this._config.title)}
          ${renderAxis({
            layout,
            tickInterval: this._config.tick_interval,
            clusters,
            labels,
            emptyMessage,
            timeZone,
            unit,
            now: this._now,
            displayMinutes: this._config.display_minutes,
            animationEnabled,
            getLiveAnimationDelay: (eventId, timestamp) =>
              this._liveAnimationRegistry.resolveDelay(eventId, timestamp),
            tooltip: this._hoveredCluster
              ? {
                  cluster: this._hoveredCluster,
                  x: this._tooltipPos.x,
                  y: this._tooltipPos.y,
                  now: this._now,
                }
              : null,
          })}
          ${this._historyUnavailable
            ? html`<div class="history-warning">History unavailable</div>`
            : nothing}
          ${renderFooter(aggregates, trend, layoutMode, {
            today: this._config.summary.today,
            lastHour: this._config.summary.last_hour,
            trend: this._config.summary.trend,
          })}
        </div>
      </ha-card>
    `;
  }

  public getCardSize(): number {
    return 3;
  }

  private _setupResizeObserver(): void {
    this._resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0 && width !== this._width) {
          this._width = width;
        }
      }
    });
    this._resizeObserver.observe(this);
  }

  private _startTickTimer(): void {
    const timeZone = this.hass?.config?.time_zone ?? "UTC";
    this._dayKey = getCalendarDayKey(timeZone);
    this._scheduleTick();
  }

  private _scheduleTick(): void {
    if (this._tickTimer) {
      clearTimeout(this._tickTimer);
    }

    this._tickTimer = setTimeout(() => {
      this._now = Date.now();
      const timeZone = this.hass?.config?.time_zone ?? "UTC";
      const newDayKey = getCalendarDayKey(timeZone, new Date(this._now));
      if (newDayKey !== this._dayKey) {
        this._dayKey = newDayKey;
        void this._loadHistory();
      }
      this._scheduleTick();
    }, 30_000);
  }

  private _scheduleLiveExpiryRefresh(): void {
    if (this._liveExpiryTimer) {
      clearTimeout(this._liveExpiryTimer);
      this._liveExpiryTimer = undefined;
    }

    if (!this._config) return;

    const displayCutoff = this._now - this._config.display_minutes * 60_000;
    const transitionTimes = this._events
      .filter(
        (event) =>
          event.timestamp >= displayCutoff &&
          event.distance !== null &&
          getLiveStrikePhase(event.timestamp, this._now) !== "none"
      )
      .flatMap((event) =>
        getLiveStrikeTransitionTimes(event.timestamp, this._now)
      );

    if (transitionTimes.length === 0) return;

    const nextTransition = Math.min(...transitionTimes);
    const delay = Math.max(50, nextTransition - Date.now());

    this._liveExpiryTimer = setTimeout(() => {
      this._now = Date.now();
      this._scheduleLiveExpiryRefresh();
    }, delay);
  }

  private _ensureHistoryLoaded(): void {
    if (!this.hass || !this._config) return;
    if (!this._historyClient) {
      this._historyClient = new HistoryClient(this.hass.callWS.bind(this.hass));
    }
    void this._loadHistory();
  }

  private async _loadHistory(): Promise<void> {
    if (!this.hass || !this._config || !this._historyClient) return;

    const generation = ++this._historyGeneration;
    const now = new Date();
    const displayStart = new Date(
      now.getTime() - this._config.display_minutes * 60_000
    );
    const trendStart = new Date(
      now.getTime() - this._config.trend.window_minutes * 60_000
    );
    const midnight = getStartOfDayInTimezone(
      this.hass.config.time_zone,
      now
    );

    const historyStart = new Date(
      Math.min(displayStart.getTime(), trendStart.getTime(), midnight)
    );

    const { entries } =
      await this._historyClient.fetchHistory(
        [this._config.count_entity, this._config.distance_entity],
        historyStart,
        now
      );

    if (generation !== this._historyGeneration) return;

    if (entries.length === 0 || entries.every((e) => e.states.length === 0)) {
      this._historyUnavailable = true;
      this._events = this._liveTracker?.getLiveEvents() ?? [];
      return;
    }

    this._historyUnavailable = false;

    const { countSamples, distanceSamples } = normalizeHistoryByEntityId(
      entries,
      this._config.count_entity,
      this._config.distance_entity
    );

    this._countSamples = countSamples;

    const historyEvents = reconstructStrikes(
      countSamples,
      distanceSamples,
      "history"
    );

    this._events = this._liveTracker?.mergeWithHistory(historyEvents) ?? historyEvents;
    this._events.sort((a, b) => b.timestamp - a.timestamp);
    this._now = Date.now();
    this._scheduleLiveExpiryRefresh();
  }

  private _mergeEvents(): void {
    if (!this._config) return;

    const historyEvents = this._events.filter((e) => e.source === "history");
    const merged = this._liveTracker?.mergeWithHistory(historyEvents) ?? historyEvents;

    this._now = Date.now();
    this._events = merged;
    this._events.sort((a, b) => b.timestamp - a.timestamp);
    this._scheduleLiveExpiryRefresh();
    this._scheduleTick();
  }

  private _showTooltipForMarker(target: Element): void {
    const clusterId = target.getAttribute("data-cluster-id");
    if (!clusterId) return;

    const dot =
      target.querySelector(".marker-dot") ??
      target.querySelector(".marker-hit");
    const container = this.shadowRoot?.querySelector(".axis-container");
    if (!dot || !container) return;

    const dotRect = dot.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const layout = createAxisLayout(
      getContentWidth(this._width),
      this._config?.max_distance ?? 40,
      detectDistanceUnit(this.hass, this._config?.distance_entity ?? "")
    );
    const displayCutoff =
      this._now - (this._config?.display_minutes ?? 60) * 60_000;
    const displayEvents = this._events
      .filter((e) => e.timestamp >= displayCutoff && e.distance !== null)
      .slice(0, this._config?.max_rendered_events ?? 40);
    const clusters = clusterStrikes(displayEvents, layout);
    const cluster = clusters.find((c) => c.id === clusterId) ?? null;

    this._hoveredCluster = cluster;
    this._tooltipPos = {
      x: dotRect.left - containerRect.left + dotRect.width / 2,
      y: dotRect.top - containerRect.top,
    };
  }

  private _hideTooltip(): void {
    this._hoveredCluster = null;
  }

  private _markersBound = false;

  private _bindMarkerEvents(): void {
    const root = this.shadowRoot;
    if (!root || this._markersBound) return;

    this._markersBound = true;
    root.addEventListener("pointerover", this._onMarkerPointer, true);
    root.addEventListener("pointerout", this._onMarkerPointer, true);
  }

  private _onMarkerPointer = (event: Event): void => {
    const pointerEvent = event as PointerEvent;
    const fromMarker = (pointerEvent.target as Element | null)?.closest?.(
      ".strike-marker"
    );
    const toMarker = (pointerEvent.relatedTarget as Element | null)?.closest?.(
      ".strike-marker"
    );

    if (event.type === "pointerover" && fromMarker) {
      this._showTooltipForMarker(fromMarker);
      return;
    }

    if (event.type === "pointerout" && fromMarker && !toMarker) {
      this._hideTooltip();
    }
  };

  private _buildAriaSummary(
    aggregates: { today: number | null; lastHour: number | null },
    clusters: StrikeCluster[],
    trend: { label: string; state: string; subtext: string },
    unit: string
  ): string {
    const parts: string[] = [];
    if (aggregates.today !== null) {
      parts.push(`${aggregates.today} lightning strikes today`);
    }
    if (aggregates.lastHour !== null) {
      parts.push(`${aggregates.lastHour} in the last hour`);
    }
    if (clusters[0]) {
      parts.push(
        `Latest strike ${clusters[0].representativeDistance} ${unit} away`
      );
    }
    if (trend.state !== "insufficient") {
      parts.push(trend.subtext);
    }
    return parts.join(". ") || "Lightning activity";
  }
}

// Card picker registration
window.customCards = window.customCards ?? [];
window.customCards.push({
  type: "lightning-proximity-card",
  name: "Lightning Proximity Card",
  description: "Visualises lightning strike distance and recent activity.",
  preview: true,
});

console.info(
  `%c LIGHTNING-PROXIMITY-CARD %c ${CARD_VERSION}`,
  "color: white; background: #03a9f4; font-weight: bold;",
  "color: #03a9f4; font-weight: bold;"
);
