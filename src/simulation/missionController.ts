
import type {
  MissionPhase,
  MissionStartSnapshot,
  MissionState,
  MissionDecision,
} from "../types/simulation";

const MISSION_PHASES: MissionPhase[] = [
  "launch",
  "deployment",
  "transfer",
  "lunar-insertion",
  "operations",
  "communication",
  "completed",
];

export function createInitialMissionState(
  snapshot: MissionStartSnapshot
): MissionState {
  return {
    phase: "launch",
    elapsedSeconds: 0,
    propellantKg: snapshot.design.propellantKg,
    deltaVReserveKmPerS:
      snapshot.engineering.availableDeltaVKmPerS,
    batteryWh: snapshot.engineering.usableBatteryWh,
    solarGenerationW: snapshot.engineering.generatedPowerW,
    loadW: snapshot.engineering.fullLoadW,
    loadMode: "full",
    inEclipse: false,
    dataGeneratedMB: 0,
    dataStoredMB: 0,
    dataTransmittedMB: 0,
    eventsTriggered: [],
    decisions: [],
    failureReasons: [],
  };
}

export function advanceMissionPhase(
  currentPhase: MissionPhase
): MissionPhase {
  if (currentPhase === "failed" || currentPhase === "completed") {
    return currentPhase;
  }

  const currentIndex = MISSION_PHASES.indexOf(currentPhase);

  if (currentIndex === -1 || currentIndex === MISSION_PHASES.length - 1) {
    return currentPhase;
  }

  return MISSION_PHASES[currentIndex + 1];
}

export function recordMissionDecision(
  state: MissionState,
  decision: MissionDecision
): MissionState {
  return {
    ...state,
    decisions: [...state.decisions, decision],
  };
}

export function failMission(
  state: MissionState,
  reason: string
): MissionState {
  return {
    ...state,
    phase: "failed",
    failureReasons: [...state.failureReasons, reason],
  };
}
