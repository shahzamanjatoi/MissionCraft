import { describe, it, expect } from "vitest";
import { deltaV } from "../../src/engine/deltaV";

describe("deltaV", () => {
  it("matches a hand-calculated value", () => {
    expect(deltaV(300, 2000, 1000)).toBeCloseTo(2039.2, 0);
  });

  it("is zero when no propellant", () => {
    expect(deltaV(300, 1000, 1000)).toBe(0);
  });

  it("throws on invalid masses", () => {
    expect(() => deltaV(300, 500, 1000)).toThrow();
  });
});