import { describe, it, expect } from "vitest";
import { advanceMissionTime } from "../../src/simulation/missionSimulation";
import type {
  MissionStartSnapshot,
  MissionState,
} from "../../src/types/simulation";

const snapshot = {
  engineering: {
    usableBatteryWh: 500,
    dataGenerationMBPerHour: 10,
    downlinkRateBps: 1_000_000,
  },
} as MissionStartSnapshot;

const initialState: MissionState = {
  phase: "operations",
  elapsedSeconds: 0,
  propellantKg: 100,
  deltaVReserveKmPerS: 3.5,
  batteryWh: 200,
  solarGenerationW: 100,
  loadW: 50,
  loadMode: "full",
  inEclipse: false,
  dataGeneratedMB: 0,
  dataStoredMB: 0,
  dataTransmittedMB: 0,
  eventsTriggered: [],
  decisions: [],
  failureReasons: [],
};

describe("Mission Simulation", () => {
  it("charges battery using surplus solar power", () => {
    const result = advanceMissionTime(initialState, snapshot, {
      durationSeconds: 3600,
    });

    expect(result.batteryWh).toBe(250);
  });

  it("drains battery during eclipse", () => {
    const result = advanceMissionTime(
      { ...initialState, inEclipse: true },
      snapshot,
      { durationSeconds: 3600 }
    );

    expect(result.batteryWh).toBe(150);
  });

  it("generates science data over time", () => {
    const result = advanceMissionTime(initialState, snapshot, {
      durationSeconds: 3600,
    });

    expect(result.dataGeneratedMB).toBe(10);
    expect(result.dataStoredMB).toBe(10);
  });

  it("transmits stored science data during contact windows", () => {
    const result = advanceMissionTime(initialState, snapshot, {
      durationSeconds: 3600,
      inContactWindow: true,
    });

    expect(result.dataTransmittedMB).toBe(10);
    expect(result.dataStoredMB).toBe(0);
  });

  it("fails when battery is depleted", () => {
    const result = advanceMissionTime(
      { ...initialState, batteryWh: 10, inEclipse: true },
      snapshot,
      { durationSeconds: 3600 }
    );

    expect(result.phase).toBe("failed");
    expect(result.failureReasons).toContain(
      "Battery depleted during mission."
    );
  });

  it("rejects invalid durations", () => {
    expect(() =>
      advanceMissionTime(initialState, snapshot, {
        durationSeconds: 0,
      })
    ).toThrow();
  });

  it("does not advance a completed mission", () => {
    const completed = { ...initialState, phase: "completed" as const };

    expect(
      advanceMissionTime(completed, snapshot, {
        durationSeconds: 3600,
      })
    ).toBe(completed);
  });
});
