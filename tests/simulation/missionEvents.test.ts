
import { describe, it, expect } from "vitest";
import {
  applyMissionEvent,
  changeLoadMode,
} from "../../src/simulation/missionEvents";
import type { MissionState } from "../../src/types/simulation";

const initialState: MissionState = {
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

describe("Mission Events", () => {
  it("starts an eclipse and consumes battery energy", () => {
    const result = applyMissionEvent(initialState, {
      id: "eclipse-1",
      type: "eclipse-start",
      description: "Moon blocks sunlight",
      durationSeconds: 3600,
    });

    expect(result.inEclipse).toBe(true);
    expect(result.batteryWh).toBe(400);
    expect(result.eventsTriggered).toContain("eclipse-1");
  });

  it("ends an eclipse", () => {
    const result = applyMissionEvent(
      { ...initialState, inEclipse: true },
      {
        id: "eclipse-end-1",
        type: "eclipse-end",
        description: "Sunlight restored",
      }
    );

    expect(result.inEclipse).toBe(false);
  });

  it("records communication loss", () => {
    const result = applyMissionEvent(initialState, {
      id: "comms-1",
      type: "communication-loss",
      description: "Signal lost",
    });

    expect(result.phase).toBe("communication");
    expect(result.eventsTriggered).toContain("comms-1");
  });

  it("restores communication", () => {
    const result = applyMissionEvent(
      { ...initialState, phase: "communication" },
      {
        id: "comms-restore",
        type: "communication-restored",
        description: "Signal restored",
      }
    );

    expect(result.phase).toBe("operations");
  });

  it("does not mutate the original state", () => {
    const result = applyMissionEvent(initialState, {
      id: "eclipse-2",
      type: "eclipse-start",
      description: "Eclipse",
      durationSeconds: 3600,
    });

    expect(initialState.batteryWh).toBe(500);
    expect(result.batteryWh).toBe(400);
  });

  it("switches to essential-only mode", () => {
    const result = changeLoadMode(
      initialState,
      "essential-only",
      40,
      100
    );

    expect(result.loadMode).toBe("essential-only");
    expect(result.loadW).toBe(40);
  });

  it("restores full load when switching back", () => {
    const essentialState = changeLoadMode(
      initialState,
      "essential-only",
      40,
      100
    );

    const result = changeLoadMode(
      essentialState,
      "full",
      40,
      100
    );

    expect(result.loadMode).toBe("full");
    expect(result.loadW).toBe(100);
  });
});
