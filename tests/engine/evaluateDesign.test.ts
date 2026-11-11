import { describe, it, expect } from "vitest";
import { evaluateDesign } from "../../src/engine";
import type {
  SpacecraftComponent,
  SpacecraftDesign,
  RocketProfile,
  MissionConfig,
} from "../../src/types/engineering";

const base = { modelKey: "x", description: "" };

const catalog: SpacecraftComponent[] = [
  { ...base, id: "bus", name: "Bus", category: "bus", massKg: 100, costCredits: 100, powerConsumptionW: 20, essential: true },
  { ...base, id: "solar", name: "Solar", category: "power", massKg: 20, costCredits: 50, solarAreaM2: 2, efficiency: 0.3 },
  { ...base, id: "bat", name: "Battery", category: "battery", massKg: 30, costCredits: 40, batteryCapacityWh: 500 },
  { ...base, id: "comm", name: "Comm", category: "communication", massKg: 10, costCredits: 60, powerConsumptionW: 15, essential: true, dataRateBps: 1_000_000 },
  { ...base, id: "eng", name: "Engine", category: "propulsion", massKg: 40, costCredits: 80, ispSeconds: 300 },
  { ...base, id: "cam", name: "Camera", category: "instrument", massKg: 20, costCredits: 70, powerConsumptionW: 30, dataGeneratedMBPerHour: 60 },
];

const design: SpacecraftDesign = {
  componentIds: ["bus", "solar", "bat", "comm", "eng", "cam"],
  propellantKg: 180,
  activeInstrumentIds: ["cam"],
  configurationVersion: 1,
};

const rocket: RocketProfile = {
  id: "r1", name: "Test", payloadCapacityKg: 500, costCredits: 200, missionCapabilityLabel: "",
};

const mission: MissionConfig = {
  id: "m1", name: "Test", destination: "moon", missionType: "orbiter",
  budgetCredits: 1000, requiredDeltaVKmPerS: 1.5, eclipseDurationHours: 0.5,
  requiredScienceDataMB: 50, requiredDataReturnFraction: 0.5, contactWindowSeconds: 600,
  depthOfDischarge: 0.8, dischargeEfficiency: 0.9, batteryReserveFraction: 0.2, eventSeed: 1,
};

describe("evaluateDesign", () => {
  const r = evaluateDesign(design, catalog, rocket, mission);

  it("computes mass", () => {
    expect(r.dryMassKg).toBe(220);
    expect(r.launchMassKg).toBe(400);
    expect(r.payloadPass).toBe(true);
  });

  it("converts delta-v to km/s", () => {
    // 300 * 9.80665 * ln(400/220) / 1000
    expect(r.availableDeltaVKmPerS).toBeCloseTo(1.7588, 3);
    expect(r.deltaVPass).toBe(true);
  });

  it("computes power", () => {
    expect(r.generatedPowerW).toBeCloseTo(816.6, 1);
    expect(r.fullLoadW).toBe(65);
    expect(r.essentialLoadW).toBe(35);
    expect(r.powerMarginW).toBeCloseTo(751.6, 1);
  });

  it("computes battery", () => {
    expect(r.usableBatteryWh).toBeCloseTo(360, 5); // 500 * 0.8 * 0.9
    expect(r.eclipseEnergyRequiredWh).toBeCloseTo(32.5, 5);
    expect(r.batteryPass).toBe(true);
  });

  it("computes data and cost", () => {
    expect(r.dataGenerationMBPerHour).toBe(60);
    expect(r.estimatedDataCapacityMB).toBeCloseTo(75, 5);
    expect(r.estimatedCostCredits).toBe(600);
    expect(r.budgetPass).toBe(true);
    expect(r.warnings).toEqual([]);
  });

  it("flags problems", () => {
    const bad = evaluateDesign(
      { ...design, propellantKg: 900, activeInstrumentIds: [] },
      catalog,
      rocket,
      { ...mission, budgetCredits: 100 }
    );
    expect(bad.payloadPass).toBe(false);
    expect(bad.budgetPass).toBe(false);
    expect(bad.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores inactive instruments", () => {
    const off = evaluateDesign({ ...design, activeInstrumentIds: [] }, catalog, rocket, mission);
    expect(off.fullLoadW).toBe(35);
    expect(off.dataGenerationMBPerHour).toBe(0);
  });
});