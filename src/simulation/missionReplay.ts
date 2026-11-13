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
import { advanceMissionTime } from "./missionSimulation";

export interface MissionReplayResult {
  state: MissionState;
  eventSeed: number;
}

export function replayMission(
  snapshot: MissionStartSnapshot,
  events: MissionEvent[],
  decisions: MissionDecision[]
): MissionReplayResult {
  let currentState = createInitialMissionState(snapshot);

  const decisionsByEvent = new Map<string, MissionDecision>();

  for (const decision of decisions) {
    if (decisionsByEvent.has(decision.eventId)) {
      throw new Error(`Duplicate decision for event: ${decision.eventId}`);
    }

    if (
      !Number.isFinite(decision.missionTimeSeconds) ||
      decision.missionTimeSeconds < 0
    ) {
      throw new Error("Invalid decision mission time.");
    }

    decisionsByEvent.set(decision.eventId, decision);
  }

  const eventIds = new Set(events.map((event) => event.id));

  if (eventIds.size !== events.length) {
    throw new Error("Duplicate event IDs in replay.");
  }

  for (const decision of decisions) {
    if (!eventIds.has(decision.eventId)) {
      throw new Error(
        `Decision references missing event: ${decision.eventId}`
      );
    }
  }

  for (const event of events) {
    const decision = decisionsByEvent.get(event.id);

    if (decision) {
      if (decision.missionTimeSeconds < currentState.elapsedSeconds) {
        throw new Error("Mission decisions must be chronological.");
      }

      const duration = decision.missionTimeSeconds -
        currentState.elapsedSeconds;

      if (duration > 0) {
        currentState = advanceMissionTime(
          currentState,
          snapshot,
          { durationSeconds: duration }
        );
      }

      if (currentState.phase === "failed") break;

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

    if (currentState.phase === "failed") break;
  }

  return {
    state: currentState,
    eventSeed: snapshot.eventSeed,
  };
}

