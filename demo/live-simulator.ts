import type { Hass, HassEntity } from "../src/types";
import {
  ENTITY_COUNT,
  ENTITY_DISTANCE,
  createMockHass,
  type FixtureDefinition,
} from "./fixtures";

function makeEntity(
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

export function randomStrikeDistance(min = 4, max = 36): number {
  const value = min + Math.random() * (max - min);
  return Math.round(value * 10) / 10;
}

export class LiveStrikeSimulator {
  private readonly baseHass: Hass;
  private currentCount: number;
  private autoTimer?: ReturnType<typeof setInterval>;
  public hass: Hass;

  constructor(fixture: FixtureDefinition) {
    this.baseHass = createMockHass(fixture);
    this.currentCount = Number.parseInt(
      this.baseHass.states[ENTITY_COUNT].state,
      10
    );
    const distance = Number.parseFloat(
      this.baseHass.states[ENTITY_DISTANCE].state
    );
    this.hass = this.buildHass(this.currentCount, distance);
  }

  get count(): number {
    return this.currentCount;
  }

  get lastDistance(): number {
    return Number.parseFloat(this.hass.states[ENTITY_DISTANCE].state);
  }

  strike(distance: number): Hass {
    this.currentCount += 1;
    this.hass = this.buildHass(this.currentCount, distance);
    return this.hass;
  }

  startAuto(
    intervalMs: number,
    pickDistance: () => number,
    onStrike?: (distance: number) => void
  ): void {
    this.stopAuto();
    this.autoTimer = setInterval(() => {
      const distance = pickDistance();
      this.strike(distance);
      onStrike?.(distance);
    }, intervalMs);
  }

  stopAuto(): void {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = undefined;
    }
  }

  private buildHass(count: number, distance: number): Hass {
    return {
      ...this.baseHass,
      states: {
        [ENTITY_DISTANCE]: makeEntity(ENTITY_DISTANCE, String(distance), {
          unit_of_measurement: "km",
          friendly_name: "Lightning Distance",
        }),
        [ENTITY_COUNT]: makeEntity(ENTITY_COUNT, String(count), {
          friendly_name: "Lightning Count",
        }),
      },
    };
  }
}
