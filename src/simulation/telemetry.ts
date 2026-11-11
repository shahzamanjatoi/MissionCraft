
import type { MissionState } from "../types/simulation";

export interface MissionTelemetry {
  phase: MissionState["phase"];
  elapsedSeconds: number;
  batteryPercentage: number;
  propellantRemainingKg: number;
  deltaVRemainingKmPerS: number;
  generatedDataMB: number;
  storedDataMB: number;
  transmittedDataMB: number;
  eclipseActive: boolean;
  loadMode: MissionState["loadMode"];
}

export function getMissionTelemetry(
  state: MissionState,
  batteryCapacityWh: number
): MissionTelemetry {
  const batteryPercentage =
    batteryCapacityWh > 0
      ? (state.batteryWh / batteryCapacityWh) * 100
      : 0;

  return {
    phase: state.phase,
    elapsedSeconds: state.elapsedSeconds,
    batteryPercentage: Math.min(100, Math.max(0, batteryPercentage)),
    propellantRemainingKg: state.propellantKg,
    deltaVRemainingKmPerS: state.deltaVReserveKmPerS,
    generatedDataMB: state.dataGeneratedMB,
    storedDataMB: state.dataStoredMB,
    transmittedDataMB: state.dataTransmittedMB,
    eclipseActive: state.inEclipse,
    loadMode: state.loadMode,
  };
}
