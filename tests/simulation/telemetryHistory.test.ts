import { describe, it, expect } from "vitest";
import {
  recordTelemetrySnapshot,
  getLatestTelemetry,
  clearTelemetryHistory,
} from "../../src/simulation/telemetryHistory";
import type { MissionTelemetry } from "../../src/simulation/telemetry";

const snapshot: MissionTelemetry = {
  phase: "operations",
  elapsedSeconds: 3600,
  batteryPercentage: 85,
  propellantRemainingKg: 90,
  deltaVRemainingKmPerS: 1.2,
  generatedDataMB: 50,
  storedDataMB: 40,
  transmittedDataMB: 10,
  eclipseActive: false,
  loadMode: "full",
};

describe("Telemetry history", () => {
  it("records a telemetry snapshot", () => {
    const result = recordTelemetrySnapshot([], snapshot);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(snapshot);
  });

  it("records multiple snapshots in order", () => {
    const first = recordTelemetrySnapshot([], snapshot);
    const second = recordTelemetrySnapshot(first, {
      ...snapshot,
      elapsedSeconds: 7200,
      batteryPercentage: 70,
    });

    expect(second).toHaveLength(2);
    expect(second[1].elapsedSeconds).toBe(7200);
  });

  it("does not record duplicate mission timestamps", () => {
    const first = recordTelemetrySnapshot([], snapshot);
    const second = recordTelemetrySnapshot(first, snapshot);

    expect(second).toHaveLength(1);
  });

  it("returns the latest snapshot", () => {
    const history = [
      snapshot,
      { ...snapshot, elapsedSeconds: 7200 },
    ];

    expect(getLatestTelemetry(history)?.elapsedSeconds).toBe(7200);
  });

  it("returns null for empty history", () => {
    expect(getLatestTelemetry([])).toBeNull();
  });

  it("clears telemetry history", () => {
    expect(clearTelemetryHistory()).toEqual([]);
  });
});