const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

export const LIVE_STRIKE_WINDOW_MS = 10_000;
export const LIVE_STRIKE_FADE_MS = 1_500;

export type LiveStrikePhase = "none" | "active" | "fading";

export function getTimezoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  const asUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    Number(lookup.hour),
    Number(lookup.minute),
    Number(lookup.second)
  );

  return asUtc - date.getTime();
}

export function getStartOfDayInTimezone(timeZone: string, now = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      lookup[part.type] = part.value;
    }
  }

  const midnightUtc = Date.UTC(
    Number(lookup.year),
    Number(lookup.month) - 1,
    Number(lookup.day),
    0,
    0,
    0,
    0
  );

  const offset = getTimezoneOffsetMs(timeZone, new Date(midnightUtc));
  return midnightUtc - offset;
}

export function getCalendarDayKey(timeZone: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatAge(timestamp: number, now = Date.now()): string {
  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) {
    return seconds < 30 ? "now" : `${seconds}s`;
  }

  const minutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(diffMs / MS_PER_HOUR);
  return `${hours}h`;
}

export function formatAgeLong(timestamp: number, now = Date.now()): string {
  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / 1000);

  if (seconds < 60) {
    return seconds <= 1 ? "just now" : `${seconds} seconds ago`;
  }

  const minutes = Math.floor(diffMs / MS_PER_MINUTE);
  if (minutes < 60) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(diffMs / MS_PER_HOUR);
  if (hours < 24) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  const days = Math.floor(diffMs / MS_PER_DAY);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export function formatTime(
  timestamp: number,
  timeZone: string,
  locale = "en-US"
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function ageOpacity(
  timestamp: number,
  displayMinutes: number,
  now = Date.now()
): number {
  const ageMinutes = (now - timestamp) / MS_PER_MINUTE;
  const ageRatio = ageMinutes / displayMinutes;
  return Math.max(0.25, Math.min(1, 1 - ageRatio * 0.75));
}

export function getLiveStrikePhase(
  timestamp: number,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS,
  fadeMs = LIVE_STRIKE_FADE_MS
): LiveStrikePhase {
  const ageMs = Math.max(0, now - timestamp);
  if (ageMs < windowMs) return "active";
  if (ageMs < windowMs + fadeMs) return "fading";
  return "none";
}

export function isLiveStrike(
  timestamp: number,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS
): boolean {
  return getLiveStrikePhase(timestamp, now, windowMs) === "active";
}

export function isLiveStrikeFading(
  timestamp: number,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS,
  fadeMs = LIVE_STRIKE_FADE_MS
): boolean {
  return getLiveStrikePhase(timestamp, now, windowMs, fadeMs) === "fading";
}

export function getClusterLiveStrikePhase(
  events: Array<{ timestamp: number }>,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS,
  fadeMs = LIVE_STRIKE_FADE_MS
): LiveStrikePhase {
  let phase: LiveStrikePhase = "none";
  for (const event of events) {
    const eventPhase = getLiveStrikePhase(
      event.timestamp,
      now,
      windowMs,
      fadeMs
    );
    if (eventPhase === "active") return "active";
    if (eventPhase === "fading") phase = "fading";
  }
  return phase;
}

export function getLiveStrikeTransitionTimes(
  timestamp: number,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS,
  fadeMs = LIVE_STRIKE_FADE_MS
): number[] {
  const activeEnd = timestamp + windowMs;
  const fadeEnd = timestamp + windowMs + fadeMs;
  const transitions: number[] = [];
  if (activeEnd > now) transitions.push(activeEnd);
  if (fadeEnd > now) transitions.push(fadeEnd);
  return transitions;
}

/** Negative delay syncs an in-progress CSS animation to strike age. */
export function liveStrikeAnimationDelay(
  timestamp: number,
  now = Date.now(),
  windowMs = LIVE_STRIKE_WINDOW_MS
): number {
  return -Math.min(Math.max(0, now - timestamp), windowMs);
}
