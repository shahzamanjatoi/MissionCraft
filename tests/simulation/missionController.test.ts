
import { describe, it, expect } from "vitest";
import {
  createInitialMissionState,
  advanceMissionPhase,
  recordMissionDecision,
  failMission,
} from "../../src/simulation/missionController";
import type { MissionStartSnapshot } from "../../src/types/simulation";

const snapshot = {
  design: { propellantKg: 100 },
  engineering: {
    availableDeltaVKmPerS: 3.5,
    usableBatteryWh: 500,
    generatedPowerW: 200,
    fullLoadW: 100,
  },
} as MissionStartSnapshot;

const initialState = createInitialMissionState(snapshot);

describe("Mission Controller", () => {
  it("creates initial mission state", () => {
    expect(initialState.phase).toBe("launch");
    expect(initialState.propellantKg).toBe(100);
    expect(initialState.batteryWh).toBe(500);
    expect(initialState.loadW).toBe(100);
  });

  it("advances mission phases", () => {
    expect(advanceMissionPhase("launch")).toBe("deployment");
    expect(advanceMissionPhase("deployment")).toBe("transfer");
    expect(advanceMissionPhase("operations")).toBe("communication");
  });

  it("does not advance completed missions", () => {
    expect(advanceMissionPhase("completed")).toBe("completed");
  });

  it("does not advance failed missions", () => {
    expect(advanceMissionPhase("failed")).toBe("failed");
  });

  it("records mission decisions without mutating state", () => {
    const decision = {
      eventId: "eclipse-1",
      choiceId: "reduce-power",
      missionTimeSeconds: 3600,
    };

    const result = recordMissionDecision(initialState, decision);

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toEqual(decision);
    expect(initialState.decisions).toHaveLength(0);
  });

  it("fails a mission and records the reason", () => {
    const result = failMission(initialState, "Battery depleted");

    expect(result.phase).toBe("failed");
    expect(result.failureReasons).toContain("Battery depleted");
  });
});
