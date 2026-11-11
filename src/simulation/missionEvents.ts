
import type { MissionState } from "../types/simulation";

export type MissionEventType =
  | "eclipse-start"
  | "eclipse-end"
  | "communication-loss"
  | "communication-restored";

export interface MissionEvent {
  id: string;
  type: MissionEventType;
  description: string;
  durationSeconds?: number;
}

export function applyMissionEvent(
  state: MissionState,
  event: MissionEvent
): MissionState {
  const eventsTriggered = state.eventsTriggered.includes(event.id)
    ? state.eventsTriggered
    : [...state.eventsTriggered, event.id];

  switch (event.type) {
    case "eclipse-start": {
      const energyUsed =
        (state.loadW * (event.durationSeconds ?? 0)) / 3600;

      return {
        ...state,
        inEclipse: true,
        batteryWh: Math.max(0, state.batteryWh - energyUsed),
        eventsTriggered,
      };
    }

    case "eclipse-end":
      return {
        ...state,
        inEclipse: false,
        eventsTriggered,
      };

    case "communication-loss":
      return {
        ...state,
        phase: "communication",
        eventsTriggered,
      };

    case "communication-restored":
      return {
        ...state,
        phase:
          state.phase === "communication"
            ? "operations"
            : state.phase,
        eventsTriggered,
      };
  }
}

export function changeLoadMode(
  state: MissionState,
  mode: "full" | "essential-only",
  essentialLoadW: number,
  fullLoadW: number
): MissionState {
  return {
    ...state,
    loadMode: mode,
    loadW: mode === "essential-only"
      ? essentialLoadW
      : fullLoadW,
  };
}
