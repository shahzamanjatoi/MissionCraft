import { describe, it, expect } from "vitest";
import { replayMission } from "../../src/simulation/missionReplay";
import type { MissionStartSnapshot, MissionDecision } from "../../src/types/simulation";

const snapshot = {
  engineering: {
    availableDeltaVKmPerS: 1.5,
    usableBatteryWh: 500,
    generatedPowerW: 200,
    fullLoadW: 100,
    essentialLoadW: 40,
  },
  design: { propellantKg: 100 },
  eventSeed: 12345,
} as MissionStartSnapshot;

const events = [
  {
    id: "eclipse-1",
    type: "eclipse-start" as const,
    description: "Lunar eclipse",
    durationSeconds: 3600,
  },
  {
    id: "eclipse-2",
    type: "eclipse-end" as const,
    description: "Eclipse ends",
  },
];

const decisions: MissionDecision[] = [
  {
    eventId: "eclipse-1",
    choiceId: "conserve-power",
    missionTimeSeconds: 3600,
  },
];

describe("Mission replay", () => {
  it("replays recorded events and decisions", () => {
    const result = replayMission(snapshot, events, decisions);

    expect(result.state.batteryWh).toBe(460);
    expect(result.state.loadMode).toBe("essential-only");
    expect(result.state.inEclipse).toBe(false);
    expect(result.state.decisions).toEqual(decisions);
    expect(result.eventSeed).toBe(12345);
  });

  it("produces the same result when replayed again", () => {
    const first = replayMission(snapshot, events, decisions);
    const second = replayMission(snapshot, events, decisions);

    expect(second).toEqual(first);
  });

  it("rejects decisions for events missing from the replay", () => {
    const invalidDecision: MissionDecision = {
      eventId: "missing-event",
      choiceId: "conserve-power",
      missionTimeSeconds: 100,
    };

    expect(() =>
      replayMission(snapshot, events, [invalidDecision])
    ).toThrow("Decision references missing event");
  });

  it("rejects duplicate decisions for one event", () => {
    expect(() =>
      replayMission(snapshot, events, [
        decisions[0],
        { ...decisions[0], choiceId: "maintain-full-load" },
      ])
    ).toThrow("Duplicate decision");
  });
});