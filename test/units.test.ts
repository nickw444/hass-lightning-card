import { describe, it, expect } from "vitest";
import {
  formatDistance,
  formatDistanceValue,
  distanceToX,
  getLayoutMode,
  getMaxLabelsForWidth,
} from "../src/domain/units";

describe("units", () => {
  it("formats distance under 10 with decimal", () => {
    expect(formatDistance(8.4, "km")).toBe("8.4 km");
  });

  it("formats distance >= 10 without unnecessary decimals", () => {
    expect(formatDistance(13, "km")).toBe("13 km");
    expect(formatDistance(21.0, "km")).toBe("21 km");
  });

  it("formats distance value without unit", () => {
    expect(formatDistanceValue(8.4, "km")).toBe("8.4");
    expect(formatDistanceValue(13, "km")).toBe("13");
  });

  it("maps distance to x position", () => {
    expect(distanceToX(20, 40, 40, 360)).toBe(200);
    expect(distanceToX(0, 40, 40, 360)).toBe(40);
    expect(distanceToX(40, 40, 40, 360)).toBe(360);
  });

  it("determines layout mode from width", () => {
    expect(getLayoutMode(800)).toBe("wide");
    expect(getLayoutMode(500)).toBe("medium");
    expect(getLayoutMode(350)).toBe("narrow");
  });

  it("limits labels by width", () => {
    expect(getMaxLabelsForWidth(800, 10)).toBe(8);
    expect(getMaxLabelsForWidth(500, 10)).toBe(8);
    expect(getMaxLabelsForWidth(350, 10)).toBe(6);
  });
});
