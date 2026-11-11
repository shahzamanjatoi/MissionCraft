
import type {
  MissionState,
  MissionStartSnapshot,
  MissionResult,
} from "../types/simulation";

export function createMissionResult(
  state: MissionState,
  snapshot: MissionStartSnapshot,
  missionId: string
): MissionResult {
  const scienceScore = Math.min(
    100,
    (state.dataGeneratedMB /
      Math.max(1, snapshot.missionConfig.requiredScienceDataMB)) * 100
  );

  const returnFraction =
    state.dataGeneratedMB > 0
      ? state.dataTransmittedMB / state.dataGeneratedMB
      : 0;

  const reliabilityScore =
    state.phase === "failed" ? 0 : 100;

  const safetyScore =
    state.failureReasons.length === 0 ? 100 : 0;

  const outcome =
    state.phase === "failed"
      ? "failure"
      : scienceScore >= 100 &&
          returnFraction >= snapshot.missionConfig.requiredDataReturnFraction
        ? "success"
        : "partial";

  const engineeringScore =
    snapshot.engineering.deltaVPass &&
    snapshot.engineering.batteryPass
      ? 100
      : 50;

  const costScore =
    snapshot.engineering.budgetPass ? 100 : 0;

  const total = Math.round(
    (scienceScore +
      engineeringScore +
      costScore +
      reliabilityScore +
      safetyScore) / 5
  );

  return {
    missionId,
    outcome,
    phaseReached: state.phase,
    decisions: [...state.decisions],
    eventSeed: snapshot.eventSeed,
    scienceDataGeneratedMB: state.dataGeneratedMB,
    scienceDataReturnedMB: state.dataTransmittedMB,
    failureReasons: [...state.failureReasons],
    score: {
      science: Math.round(scienceScore),
      engineering: engineeringScore,
      cost: costScore,
      reliability: reliabilityScore,
      safety: safetyScore,
      total,
    },
  };
}
