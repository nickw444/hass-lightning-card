export function formatDistance(value: number, unit: string): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  if (value < 10) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded} ${unit}` : `${rounded} ${unit}`;
  }

  const rounded = Math.round(value * 10) / 10;
  if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
    return `${Math.round(rounded)} ${unit}`;
  }

  return `${rounded} ${unit}`;
}

export function formatDistanceValue(value: number, unit: string): string {
  return formatDistance(value, unit).replace(` ${unit}`, "");
}

export function distanceToX(
  distance: number,
  maxDistance: number,
  axisLeft: number,
  axisRight: number
): number {
  const ratio = Math.max(0, Math.min(1, distance / maxDistance));
  return axisLeft + ratio * (axisRight - axisLeft);
}

export function getLayoutMode(width: number): "wide" | "medium" | "narrow" {
  if (width >= 700) return "wide";
  if (width >= 450) return "medium";
  return "narrow";
}

export function getMaxLabelsForWidth(
  width: number,
  configuredMax: number
): number {
  const mode = getLayoutMode(width);
  if (mode === "wide") return Math.min(configuredMax, 8);
  if (mode === "medium") return Math.min(configuredMax, 8);
  return Math.min(configuredMax, 6);
}
