import type { PlacedLabel, StrikeCluster } from "../types";
import { formatDistanceValue } from "../domain/units";
import { formatAge, ageOpacity } from "../domain/time";

const MIN_LABEL_SPACING = 16;
const LABEL_COLLISION_WIDTH = 48;
const COMPACT_COLLISION_WIDTH = 40;
const MAX_LANES = 2;

export function layoutLabels(
  clusters: StrikeCluster[],
  options: {
    maxLabels: number;
    unit: string;
    now: number;
    displayMinutes: number;
    compactThreshold: number;
    tickXs?: number[];
  }
): PlacedLabel[] {
  const sorted = [...clusters].sort(
    (a, b) => b.newestTimestamp - a.newestTimestamp
  );

  const labelCandidates = sorted.slice(0, options.maxLabels);
  const compact = labelCandidates.length > options.compactThreshold;
  const placed: PlacedLabel[] = [];
  const laneOccupancy: Array<{ x: number; width: number }[]> = Array.from(
    { length: MAX_LANES },
    () => []
  );

  for (let i = 0; i < labelCandidates.length; i++) {
    const cluster = labelCandidates[i];
    const isLatest = i === 0;
    const ageText = formatAge(cluster.newestTimestamp, options.now);
    const distanceText = formatDistanceValue(
      cluster.representativeDistance,
      options.unit
    );

    const labelWidth = compact ? COMPACT_COLLISION_WIDTH : LABEL_COLLISION_WIDTH;
    let placedLane = -1;

    for (let lane = 0; lane < MAX_LANES; lane++) {
      if (!hasCollision(cluster.x, labelWidth, laneOccupancy[lane])) {
        placedLane = lane;
        laneOccupancy[lane].push({ x: cluster.x, width: labelWidth });
        break;
      }
    }

    if (placedLane === -1 && !isLatest) {
      continue;
    }

    if (placedLane === -1) {
      placedLane = 0;
      laneOccupancy[0].push({ x: cluster.x, width: labelWidth });
    }

    const opacity = ageOpacity(
      cluster.newestTimestamp,
      options.displayMinutes,
      options.now
    );

    placed.push({
      clusterId: cluster.id,
      lane: placedLane,
      x: cluster.x,
      distanceText,
      ageText,
      compact,
      opacity,
      isLatest,
      count: cluster.count,
    });
  }

  return placed;
}

function hasCollision(
  x: number,
  width: number,
  occupied: { x: number; width: number }[]
): boolean {
  const halfWidth = width / 2;
  const left = x - halfWidth;
  const right = x + halfWidth;

  return occupied.some((o) => {
    const oLeft = o.x - o.width / 2;
    const oRight = o.x + o.width / 2;
    return !(right + MIN_LABEL_SPACING / 2 < oLeft || left - MIN_LABEL_SPACING / 2 > oRight);
  });
}

export function getLabelY(axisY: number, lane: number): number {
  // Lane 0 sits below axis tick labels (ticks at axisY + 18)
  return axisY + 36 + lane * 34;
}
