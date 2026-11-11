import { describe, it, expect } from "vitest";
import { totalMass } from "../../src/engine/mass";

describe("totalMass", () => {
  it("sums component masses", () => {
    expect(totalMass([100, 250, 50.5])).toBeCloseTo(400.5);
  });

  it("returns 0 for an empty list", () => {
    expect(totalMass([])).toBe(0);
  });

  it("handles a single component", () => {
    expect(totalMass([42])).toBe(42);
  });
});