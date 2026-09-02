import { html, nothing, svg, TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { PlacedLabel, StrikeCluster } from "../types";
import type { AxisLayout } from "../types";
import {
  AXIS_ARROW_HEIGHT,
  AXIS_ARROW_WIDTH,
  AXIS_BAR_THICKNESS,
  getScaleRight,
  getTickPositions,
} from "../layout/axis-layout";
import { getLabelY } from "../layout/label-layout";
import { formatDistance } from "../domain/units";
import {
  formatAge,
  formatAgeLong,
  formatTime,
  ageOpacity,
  getLiveStrikePhase,
} from "../domain/time";
import { HOME_PATH } from "../styles";
import {
  collectLiveDots,
  collectLiveRings,
  renderLiveBolt,
  renderLiveDotLayer,
  renderLiveRingLayer,
} from "./live-markers";

export interface AxisRenderOptions {
  layout: AxisLayout;
  tickInterval: number;
  clusters: StrikeCluster[];
  labels: PlacedLabel[];
  emptyMessage: string | null;
  timeZone: string;
  unit: string;
  now: number;
  displayMinutes: number;
  animationEnabled: boolean;
  getLiveAnimationDelay?: (eventId: string, timestamp: number) => number;
  tooltip?: {
    cluster: StrikeCluster;
    x: number;
    y: number;
    now: number;
  } | null;
}

export function renderAxis(options: AxisRenderOptions): TemplateResult {
  const {
    layout,
    tickInterval,
    clusters,
    labels,
    emptyMessage,
    unit,
    timeZone,
    tooltip,
    now,
    displayMinutes,
    animationEnabled,
    getLiveAnimationDelay,
  } = options;

  const ticks = getTickPositions(layout, tickInterval);
  const labelMap = new Map(labels.map((l) => [l.clusterId, l]));
  const scaleRight = getScaleRight(layout);
  const zeroX = layout.axisLeft;
  const homeIconSize = 20;
  const homeIconY = layout.axisY - homeIconSize - 4;
  const barHalf = AXIS_BAR_THICKNESS / 2;
  const arrowHalf = AXIS_ARROW_HEIGHT / 2;
  const latestClusterId = clusters[0]?.id;
  const liveDots = collectLiveDots(
    clusters,
    layout,
    now,
    animationEnabled,
    latestClusterId
  );
  const liveRings = collectLiveRings(
    clusters,
    layout,
    now,
    animationEnabled,
    latestClusterId
  );
  const axisBarPath = [
    `M ${layout.axisLeft} ${layout.axisY - barHalf}`,
    `L ${scaleRight} ${layout.axisY - barHalf}`,
    `L ${scaleRight} ${layout.axisY + barHalf}`,
    `L ${layout.axisLeft} ${layout.axisY + barHalf}`,
    "Z",
    `M ${scaleRight} ${layout.axisY - arrowHalf}`,
    `L ${scaleRight + AXIS_ARROW_WIDTH} ${layout.axisY}`,
    `L ${scaleRight} ${layout.axisY + arrowHalf}`,
    "Z",
  ].join(" ");

  return html`
    <div class="axis-container">
      ${svg`
        <svg
          class="axis-svg"
          viewBox="0 0 ${layout.width} ${layout.height}"
          width="100%"
          height="${layout.height}"
          role="img"
          aria-label="Lightning strike distance axis"
        >
          <g
            transform="translate(${zeroX - homeIconSize / 2}, ${homeIconY})"
            role="img"
            aria-label="Home"
          >
            <svg class="home-icon" width="${homeIconSize}" height="${homeIconSize}" viewBox="0 0 24 24">
              <path d="${HOME_PATH}"></path>
            </svg>
          </g>
          <line
            class="tick-line"
            x1="${layout.axisLeft}"
            y1="${layout.axisY - 6}"
            x2="${layout.axisLeft}"
            y2="${layout.axisY + 6}"
          ></line>
          <path class="axis-bar" d="${axisBarPath}"></path>
          ${ticks.map((distance) => {
            const x =
              layout.axisLeft +
              (distance / layout.maxDistance) * (scaleRight - layout.axisLeft);
            const tickLabel =
              distance === layout.maxDistance
                ? `${distance} ${unit}`
                : String(distance);
            const showTick =
              distance !== 0 && distance !== layout.maxDistance;
            return svg`
              <g>
                ${showTick
                  ? svg`
                      <line
                        class="tick-line"
                        x1="${x}"
                        y1="${layout.axisY - 4}"
                        x2="${x}"
                        y2="${layout.axisY + 4}"
                      ></line>
                    `
                  : ""}
                <text class="tick-label" x="${x}" y="${layout.axisY + 18}">
                  ${tickLabel}
                </text>
              </g>
            `;
          })}
          ${emptyMessage
            ? svg`
                <text
                  class="empty-message"
                  x="${layout.width / 2}"
                  y="${layout.axisY + 40}"
                >
                  ${emptyMessage}
                </text>
              `
            : ""}
          ${repeat(
            clusters,
            (cluster) => cluster.id,
            (cluster) =>
              renderStrikeMarker(
                cluster,
                cluster.id === latestClusterId,
                labelMap.get(cluster.id),
                layout,
                unit,
                now,
                displayMinutes,
                animationEnabled,
                getLiveAnimationDelay
              )
          )}
          ${labels.map((label) => renderStrikeLabel(label, layout.axisY, unit))}
          ${renderLiveRingLayer(liveRings)}
          ${renderLiveDotLayer(liveDots, getLiveAnimationDelay)}
        </svg>
      `}
      ${tooltip
        ? renderTooltip(
            tooltip.cluster,
            tooltip.x,
            tooltip.y,
            unit,
            timeZone,
            tooltip.now
          )
        : nothing}
    </div>
  `;
}

function renderStrikeMarker(
  cluster: StrikeCluster,
  isLatest: boolean,
  label: PlacedLabel | undefined,
  layout: AxisLayout,
  unit: string,
  now: number,
  displayMinutes: number,
  animationEnabled: boolean,
  getLiveAnimationDelay?: (eventId: string, timestamp: number) => number
): TemplateResult {
  const opacity = ageOpacity(cluster.newestTimestamp, displayMinutes, now);
  const radius = isLatest ? 6 : 4;
  const outlined = !isLatest && opacity < 0.6;
  const showBolt = isLatest || label !== undefined;
  const showCount = cluster.count > 1;
  const hasActiveOverlay =
    animationEnabled &&
    cluster.events.some(
      (event) => getLiveStrikePhase(event.timestamp, now) === "active"
    );
  const boltLiveEvent =
    isLatest && showBolt
      ? cluster.events
          .filter((event) => getLiveStrikePhase(event.timestamp, now) === "active")
          .sort((a, b) => b.timestamp - a.timestamp)[0]
      : undefined;
  const boltY = layout.axisY - 28 - (showCount ? 10 : 0);
  const countY = layout.axisY - 38;
  const stemEnd = label
    ? getLabelY(layout.axisY, label.lane) - 8
    : layout.axisY + radius;

  return svg`
    <g
      class="strike-marker"
      data-cluster-id="${cluster.id}"
      data-marker-x="${cluster.x}"
      opacity="${opacity}"
      role="img"
      aria-label="${getMarkerAriaLabel(cluster, unit)}"
    >
      <g
        class="marker-bolt-group"
        transform="translate(${cluster.x - 8}, ${boltY})"
        style="${showBolt ? "" : "display: none"}"
      >
        ${renderLiveBolt(boltLiveEvent, getLiveAnimationDelay)}
      </g>
      <text
        class="cluster-count"
        x="${cluster.x}"
        y="${countY}"
        style="${showCount ? "" : "display: none"}"
      >
        ×${cluster.count}
      </text>
      ${hasActiveOverlay
        ? svg`
            <circle
              class="marker-hit"
              cx="${cluster.x}"
              cy="${layout.axisY}"
              r="${radius}"
            ></circle>
          `
        : svg`
            <circle
              class="marker-dot ${outlined ? "outlined" : ""} ${isLatest ? "latest" : ""}"
              cx="${cluster.x}"
              cy="${layout.axisY}"
              r="${radius}"
            ></circle>
          `}
      <line
        class="marker-stem"
        x1="${cluster.x}"
        y1="${layout.axisY + radius}"
        x2="${cluster.x}"
        y2="${stemEnd}"
        style="${label ? "" : "display: none"}"
      ></line>
    </g>
  `;
}

function renderStrikeLabel(
  label: PlacedLabel,
  axisY: number,
  unit: string
): TemplateResult {
  const y = getLabelY(axisY, label.lane);

  if (label.compact) {
    return svg`
      <text
        class="label-compact"
        x="${label.x}"
        y="${y}"
        opacity="${label.opacity}"
      >
        ${label.distanceText} ${unit} · ${label.ageText}
      </text>
    `;
  }

  return svg`
    <g class="label-group" opacity="${label.opacity}">
      <text
        class="label-distance ${label.isLatest ? "latest" : ""}"
        x="${label.x}"
        y="${y}"
      >
        ${label.distanceText} ${unit}
      </text>
      <text class="label-age" x="${label.x}" y="${y + 14}">${label.ageText}</text>
    </g>
  `;
}

export function renderTooltip(
  cluster: StrikeCluster | null,
  x: number,
  y: number,
  unit: string,
  timeZone: string,
  now: number
): TemplateResult {
  if (!cluster) return html``;

  const title =
    cluster.count > 1 ? `${cluster.count} strikes` : null;

  const lines =
    cluster.events.length > 1
      ? cluster.events
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 6)
          .map(
            (e) =>
              `${formatDistance(e.distance ?? cluster.representativeDistance, unit).replace(` ${unit}`, "")} ${unit} · ${formatAge(e.timestamp, now)}`
          )
      : [
          `${formatDistance(cluster.representativeDistance, unit)} away`,
          formatAgeLong(cluster.newestTimestamp, now),
          formatTime(cluster.newestTimestamp, timeZone),
        ];

  return html`
    <div
      class="tooltip"
      style="left: ${x}px; top: ${y}px;"
    >
      ${title ? html`<div class="tooltip-title">${title}</div>` : nothing}
      ${lines.map((line) => html`<div class="tooltip-line">${line}</div>`)}
    </div>
  `;
}

function getMarkerAriaLabel(cluster: StrikeCluster, unit: string): string {
  const distance = formatDistance(cluster.representativeDistance, unit);
  const age = formatAgeLong(cluster.newestTimestamp);
  if (cluster.count > 1) {
    return `${cluster.count} lightning strikes around ${distance}, latest ${age}`;
  }
  return `Lightning strike, ${distance}, ${age}`;
}
