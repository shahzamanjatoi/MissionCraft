
import { describe, it, expect } from "vitest";
import {
  getAvailableDecisions,
  applyMissionControlDecision,
} from "../../src/simulation/missionControl";
import type { MissionState } from "../../src/types/simulation";

const state: MissionState = {
  phase: "operations",
  elapsedSeconds: 3600,
  propellantKg: 100,
  deltaVReserveKmPerS: 1.5,
  batteryWh: 500,
  solarGenerationW: 200,
  loadW: 100,
  loadMode: "full",
  inEclipse: false,
  dataGeneratedMB: 50,
  dataStoredMB: 40,
  dataTransmittedMB: 10,
  eventsTriggered: [],
  decisions: [],
  failureReasons: [],
};

const engineering = {
  essentialLoadW: 40,
  fullLoadW: 100,
};

const eclipseEvent = {
  id: "eclipse-1",
  type: "eclipse-start" as const,
  description: "Lunar eclipse",
  durationSeconds: 3600,
};

describe("Mission Control", () => {
  it("provides available decisions", () => {
    expect(getAvailableDecisions(eclipseEvent)).toHaveLength(2);
  });

  it("conserves power when requested", () => {
    const result = applyMissionControlDecision(
      state,
      eclipseEvent,
      "conserve-power",
      engineering
    );

    expect(result.loadMode).toBe("essential-only");
    expect(result.loadW).toBe(40);
  });

  it("records the decision and mission timestamp", () => {
    const result = applyMissionControlDecision(
      state,
      eclipseEvent,
      "conserve-power",
      engineering
    );

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0].missionTimeSeconds).toBe(3600);
  });

  it("rejects invalid decisions", () => {
    expect(() =>
      applyMissionControlDecision(
        state,
        eclipseEvent,
        "invalid-choice",
        engineering
      )
    ).toThrow("Invalid decision");
  });

  it("prevents duplicate decisions for an event", () => {
    const first = applyMissionControlDecision(
      state,
      eclipseEvent,
      "conserve-power",
      engineering
    );

    expect(() =>
      applyMissionControlDecision(
        first,
        eclipseEvent,
        "maintain-full-load",
        engineering
      )
    ).toThrow("already been recorded");
  });

  it("does not mutate the original state", () => {
    const result = applyMissionControlDecision(
      state,
      eclipseEvent,
      "conserve-power",
      engineering
    );

    expect(state.loadW).toBe(100);
    expect(state.decisions).toHaveLength(0);
    expect(result.loadW).toBe(40);
  });
});
