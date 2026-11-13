import type {
  MissionStartSnapshot,
  MissionState,
  MissionDecision,
} from "../types/simulation";
import type { EngineeringSnapshot } from "../types/engineering";
import type { MissionEvent } from "./missionEvents";

import { createInitialMissionState } from "./missionController";
import { applyMissionEvent } from "./missionEvents";
import { applyMissionControlDecision } from "./missionControl";

export interface MissionReplayResult {
  state: MissionState;
  eventSeed: number;
}

export function replayMission(
  snapshot: MissionStartSnapshot,
  events: MissionEvent[],
  decisions: MissionDecision[]
): MissionReplayResult {
  const state = createInitialMissionState(snapshot);
  let currentState = state;

  const decisionsByEvent = new Map<string, MissionDecision>();

  for (const decision of decisions) {
    if (decisionsByEvent.has(decision.eventId)) {
      throw new Error(
        `Duplicate decision for event: ${decision.eventId}`
      );
    }

    decisionsByEvent.set(decision.eventId, decision);
  }

  const eventIds = new Set(events.map((event) => event.id));

  for (const decision of decisions) {
    if (!eventIds.has(decision.eventId)) {
      throw new Error(
        `Decision references missing event: ${decision.eventId}`
      );
    }
  }

  for (const event of events) {
    const decision = decisionsByEvent.get(event.id);

    // Apply the recorded choice before the event's effects.
    if (decision) {
      currentState = {
        ...currentState,
        elapsedSeconds: decision.missionTimeSeconds,
      };

      currentState = applyMissionControlDecision(
        currentState,
        event,
        decision.choiceId,
        snapshot.engineering as Pick<
          EngineeringSnapshot,
          "essentialLoadW" | "fullLoadW"
        >
      );
    }

    currentState = applyMissionEvent(currentState, event);
  }

  return {
    state: currentState,
    eventSeed: snapshot.eventSeed,
  };
}