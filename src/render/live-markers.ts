import { svg } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { liveDelay } from "../directives/live-delay";
import { getLiveStrikePhase } from "../domain/time";
import type { AxisLayout, LightningStrikeEvent, StrikeCluster } from "../types";
import { LIGHTNING_BOLT_PATH } from "../styles";

export interface LiveDotItem {
  key: string;
  event: LightningStrikeEvent;
  x: number;
  y: number;
  radius: number;
  isLatest: boolean;
}

export interface LiveRingItem {
  key: string;
  event: LightningStrikeEvent;
  x: number;
  y: number;
  radius: number;
  phase: "active" | "fading";
}

export function collectLiveDots(
  clusters: StrikeCluster[],
  layout: AxisLayout,
  now: number,
  animationEnabled: boolean,
  latestClusterId: string | undefined
): LiveDotItem[] {
  if (!animationEnabled) {
    return [];
  }

  const items: LiveDotItem[] = [];

  for (const cluster of clusters) {
    const isLatestCluster = cluster.id === latestClusterId;
    const radius = isLatestCluster ? 6 : 4;

    for (const event of cluster.events) {
      if (getLiveStrikePhase(event.timestamp, now) !== "active") {
        continue;
      }

      items.push({
        key: event.id,
        event,
        x: cluster.x,
        y: layout.axisY,
        radius,
        isLatest: isLatestCluster,
      });
    }
  }

  return items.sort((a, b) => a.event.timestamp - b.event.timestamp);
}

export function collectLiveRings(
  clusters: StrikeCluster[],
  layout: AxisLayout,
  now: number,
  animationEnabled: boolean,
  latestClusterId: string | undefined
): LiveRingItem[] {
  if (!animationEnabled) {
    return [];
  }

  const items: LiveRingItem[] = [];

  for (const cluster of clusters) {
    const isLatestCluster = cluster.id === latestClusterId;
    const radius = isLatestCluster ? 6 : 4;
    const ringEvent = cluster.events
      .filter((event) => getLiveStrikePhase(event.timestamp, now) !== "none")
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!ringEvent) {
      continue;
    }

    const phase = getLiveStrikePhase(ringEvent.timestamp, now);
    if (phase === "none") {
      continue;
    }

    items.push({
      key: `${cluster.id}-${ringEvent.id}`,
      event: ringEvent,
      x: cluster.x,
      y: layout.axisY,
      radius,
      phase,
    });
  }

  return items;
}

export function renderLiveDotLayer(
  items: LiveDotItem[],
  getLiveAnimationDelay?: (eventId: string, timestamp: number) => number
) {
  return repeat(
    items,
    (item) => item.key,
    (item) => {
      const delay = getLiveAnimationDelay?.(item.event.id, item.event.timestamp) ?? 0;

      return svg`
        <circle
          class="marker-dot live ${item.isLatest ? "latest" : ""}"
          ${liveDelay(delay)}
          cx="${item.x}"
          cy="${item.y}"
          r="${item.radius}"
        ></circle>
      `;
    }
  );
}

export function renderLiveRingLayer(items: LiveRingItem[]) {
  return repeat(
    items,
    (item) => item.key,
    (item) => {
      if (item.phase === "active") {
        return svg`
          <g class="marker-rings live" transform="translate(${item.x}, ${item.y})">
            <g class="marker-ring-group">
              <circle class="marker-ring" cx="0" cy="0" r="${item.radius}"></circle>
            </g>
            <g class="marker-ring-group delayed">
              <circle class="marker-ring" cx="0" cy="0" r="${item.radius}"></circle>
            </g>
          </g>
        `;
      }

      return svg`
        <g class="marker-rings fading" transform="translate(${item.x}, ${item.y})">
          <g class="marker-ring-group">
            <circle class="marker-ring" cx="0" cy="0" r="${item.radius}"></circle>
          </g>
          <g class="marker-ring-group delayed">
            <circle class="marker-ring" cx="0" cy="0" r="${item.radius}"></circle>
          </g>
        </g>
      `;
    }
  );
}

export function renderLiveBolt(
  event: LightningStrikeEvent | undefined,
  getLiveAnimationDelay?: (eventId: string, timestamp: number) => number
) {
  if (!event) {
    return svg`
      <svg class="marker-bolt" width="16" height="16" viewBox="0 0 24 24">
        <path d="${LIGHTNING_BOLT_PATH}"></path>
      </svg>
    `;
  }

  const delay = getLiveAnimationDelay?.(event.id, event.timestamp) ?? 0;

  return svg`
    <svg
      class="marker-bolt live"
      ${liveDelay(delay)}
      width="16"
      height="16"
      viewBox="0 0 24 24"
    >
      <path d="${LIGHTNING_BOLT_PATH}"></path>
    </svg>
  `;
}
