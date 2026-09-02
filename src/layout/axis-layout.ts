import type { AxisLayout } from "../types";
import { distanceToX } from "../domain/units";

export const AXIS_HEIGHT = 120;
export const CARD_PADDING = 16;
export const AXIS_Y = 30;
export const AXIS_ARROW_WIDTH = 6;
export const AXIS_ARROW_HEIGHT = 5;
export const AXIS_BAR_THICKNESS = 1.5;

export function getContentWidth(hostWidth: number): number {
  return Math.max(1, hostWidth - 2 * CARD_PADDING);
}

export function createAxisLayout(
  contentWidth: number,
  maxDistance: number,
  unit: string
): AxisLayout {
  return {
    width: contentWidth,
    height: AXIS_HEIGHT,
    axisLeft: 0,
    axisRight: contentWidth,
    axisY: AXIS_Y,
    maxDistance,
    unit,
  };
}

/** Right edge of the distance scale before the arrowhead. */
export function getScaleRight(layout: AxisLayout): number {
  return layout.axisRight - AXIS_ARROW_WIDTH;
}

export function getTickPositions(layout: AxisLayout, tickInterval: number): number[] {
  const ticks: number[] = [0];
  for (let d = tickInterval; d < layout.maxDistance; d += tickInterval) {
    ticks.push(d);
  }
  ticks.push(layout.maxDistance);
  return ticks;
}

export function getTickPixelPositions(
  layout: AxisLayout,
  tickInterval: number
): number[] {
  const scaleRight = getScaleRight(layout);
  return getTickPositions(layout, tickInterval).map(
    (distance) =>
      layout.axisLeft +
      (distance / layout.maxDistance) * (scaleRight - layout.axisLeft)
  );
}

export function distanceToPixel(
  distance: number,
  layout: AxisLayout
): number {
  return distanceToX(
    distance,
    layout.maxDistance,
    layout.axisLeft,
    getScaleRight(layout)
  );
}

export function getLabelWidth(compact: boolean): number {
  return compact ? 72 : 80;
}

export const CLUSTER_THRESHOLD_PX = 7;
