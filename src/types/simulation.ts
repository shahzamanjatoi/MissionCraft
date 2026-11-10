import type { EngineeringSnapshot, SpacecraftDesign, MissionConfig } from "./engineering";

export type MissionPhase =
  | "launch" | "deployment" | "transfer" | "lunar-insertion"
  | "operations" | "communication" | "completed" | "failed";

export type LoadMode = "full" | "essential-only";

export interface MissionDecision {
  eventId: string;
  choiceId: string;
  missionTimeSeconds: number;
}

/** Frozen at launch. The mission controller starts only from this. */
export interface MissionStartSnapshot {
  engineering: EngineeringSnapshot;
  design: SpacecraftDesign;
  rocketId: string;
  missionConfig: MissionConfig;
  eventSeed: number;
}

export interface MissionState {
  phase: MissionPhase;
  elapsedSeconds: number;
  propellantKg: number;
  deltaVReserveKmPerS: number;
  batteryWh: number;
  solarGenerationW: number;
  loadW: number;
  loadMode: LoadMode;
  inEclipse: boolean;
  dataGeneratedMB: number;
  dataStoredMB: number;
  dataTransmittedMB: number;
  eventsTriggered: string[];
  decisions: MissionDecision[];
  failureReasons: string[];
}

export interface MissionResult {
  missionId: string;
  outcome: "success" | "partial" | "failure";
  phaseReached: MissionPhase;
  decisions: MissionDecision[];
  eventSeed: number;
  scienceDataGeneratedMB: number;
  scienceDataReturnedMB: number;
  failureReasons: string[];
  score: {
    science: number;
    engineering: number;
    cost: number;
    reliability: number;
    safety: number;
    total: number;
  };
}