import type { MissionTelemetry } from "./telemetry";

export type TelemetryHistory = MissionTelemetry[];

export function recordTelemetrySnapshot(
  history: TelemetryHistory,
  snapshot: MissionTelemetry
): TelemetryHistory {
  const lastSnapshot = history[history.length - 1];

  // Avoid duplicate snapshots at the same mission time.
  if (
    lastSnapshot &&
    lastSnapshot.elapsedSeconds === snapshot.elapsedSeconds
  ) {
    return history;
  }

  return [...history, { ...snapshot }];
}

export function getLatestTelemetry(
  history: TelemetryHistory
): MissionTelemetry | null {
  return history.length > 0
    ? history[history.length - 1]
    : null;
}

export function clearTelemetryHistory(): TelemetryHistory {
  return [];
}