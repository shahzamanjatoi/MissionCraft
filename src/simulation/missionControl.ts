
import type {
  MissionDecision,
  MissionState,
} from "../types/simulation";
import type { EngineeringSnapshot } from "../types/engineering";
import type { MissionEvent } from "./missionEvents";
import { changeLoadMode } from "./missionEvents";

export interface MissionControlOption {
  id: string;
  label: string;
  description: string;
}

export function getAvailableDecisions(
  event: MissionEvent
): MissionControlOption[] {
  switch (event.type) {
    case "eclipse-start":
    case "communication-loss":
      return [
        {
          id: "conserve-power",
          label: "Conserve Power",
          description: "Switch non-essential systems off.",
        },
        {
          id: "maintain-full-load",
          label: "Maintain Full Load",
          description: "Keep all systems operating.",
        },
      ];

    case "eclipse-end":
    case "communication-restored":
      return [
        {
          id: "restore-full-load",
          label: "Restore Full Load",
          description: "Resume normal spacecraft operations.",
        },
        {
          id: "remain-essential",
          label: "Remain in Essential Mode",
          description: "Continue conserving spacecraft power.",
        },
      ];
  }
}

export function applyMissionControlDecision(
  state: MissionState,
  event: MissionEvent,
  choiceId: string,
  engineering: Pick<
    EngineeringSnapshot,
    "essentialLoadW" | "fullLoadW"
  >
): MissionState {
  if (state.phase === "failed" || state.phase === "completed") {
    throw new Error("Cannot make decisions after mission termination.");
  }

  if (state.decisions.some((d) => d.eventId === event.id)) {
    throw new Error("A decision has already been recorded for this event.");
  }

  const option = getAvailableDecisions(event).find(
    (choice) => choice.id === choiceId
  );

  if (!option) {
    throw new Error("Invalid decision for this mission event.");
  }

  let updatedState = state;

  if (choiceId === "conserve-power" ||
      choiceId === "remain-essential") {
    updatedState = changeLoadMode(
      state,
      "essential-only",
      engineering.essentialLoadW,
      engineering.fullLoadW
    );
  }

  if (choiceId === "maintain-full-load" ||
      choiceId === "restore-full-load") {
    updatedState = changeLoadMode(
      state,
      "full",
      engineering.essentialLoadW,
      engineering.fullLoadW
    );
  }

  const decision: MissionDecision = {
    eventId: event.id,
    choiceId,
    missionTimeSeconds: state.elapsedSeconds,
  };

  return {
    ...updatedState,
    decisions: [...state.decisions, decision],
  };
}
