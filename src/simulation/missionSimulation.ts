import type {
  MissionStartSnapshot,
  MissionState,
} from "../types/simulation";
import { failMission } from "./missionController";

export interface MissionStepOptions {
  durationSeconds: number;
  inContactWindow?: boolean;
}

/**
 * Advances spacecraft resources and science-data flow by one time step.
 * All energy values are calculated in Wh and data values in MB.
 */
export function advanceMissionTime(
  state: MissionState,
  snapshot: MissionStartSnapshot,
  options: MissionStepOptions
): MissionState {
  const { durationSeconds, inContactWindow = false } = options;

  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error("Duration must be a positive finite number.");
  }

  if (state.phase === "failed" || state.phase === "completed") {
    return state;
  }

  const durationHours = durationSeconds / 3600;

  // Solar generation is unavailable during an eclipse.
  const availablePowerW = state.inEclipse
    ? 0
    : state.solarGenerationW;

  const netEnergyWh =
    (availablePowerW - state.loadW) * durationHours;

  const batteryCapacityWh = snapshot.engineering.usableBatteryWh;

  const calculatedBatteryWh = Math.min(
    batteryCapacityWh,
    state.batteryWh + netEnergyWh
  );

  const generatedMB =
    snapshot.engineering.dataGenerationMBPerHour * durationHours;

  const totalGeneratedMB = state.dataGeneratedMB + generatedMB;
  const availableDataMB = state.dataStoredMB + generatedMB;

  // Convert downlink bits/second to MB over this time step.
  const transmissionCapacityMB = inContactWindow
    ? (snapshot.engineering.downlinkRateBps * durationSeconds) / 8 / 1_000_000
    : 0;

  const transmittedMB = Math.min(
    availableDataMB,
    transmissionCapacityMB
  );

  const updatedState: MissionState = {
    ...state,
    elapsedSeconds: state.elapsedSeconds + durationSeconds,
    batteryWh: Math.max(0, calculatedBatteryWh),
    dataGeneratedMB: totalGeneratedMB,
    dataStoredMB: availableDataMB - transmittedMB,
    dataTransmittedMB: state.dataTransmittedMB + transmittedMB,
  };

  if (calculatedBatteryWh < 0) {
    return failMission(updatedState, "Battery depleted during mission.");
  }

  return updatedState;
}
