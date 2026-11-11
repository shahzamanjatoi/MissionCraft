import type {
  SpacecraftComponent,
  SpacecraftDesign,
  RocketProfile,
  MissionConfig,
  EngineeringSnapshot,
} from "../types/engineering";
import { totalMass } from "./mass";
import { deltaV } from "./deltaV";

/** Solar flux near Earth/Moon in W/m^2. Assumes panels face the sun. */
export const SOLAR_FLUX_W_PER_M2 = 1361;

/** A component draws power if it is not an instrument, or is an active one. */
function isActive(c: SpacecraftComponent, design: SpacecraftDesign): boolean {
  return c.category !== "instrument" || design.activeInstrumentIds.includes(c.id);
}

export function evaluateDesign(
  design: SpacecraftDesign,
  catalog: SpacecraftComponent[],
  rocket: RocketProfile,
  mission: MissionConfig
): EngineeringSnapshot {
  const warnings: string[] = [];
  const parts = design.componentIds
    .map((id) => catalog.find((c) => c.id === id))
    .filter((c): c is SpacecraftComponent => c !== undefined);

  if (parts.length !== design.componentIds.length) {
    warnings.push("Some selected components were not found in the catalog.");
  }

  // ---- mass ----
  const dryMassKg = totalMass(parts.map((c) => c.massKg));
  const propellantMassKg = design.propellantKg;
  const launchMassKg = dryMassKg + propellantMassKg;
  const payloadPass = launchMassKg <= rocket.payloadCapacityKg;
  if (!payloadPass) warnings.push("Launch mass exceeds the rocket's payload capacity.");

  // ---- propulsion ----
  const isp = Math.max(0, ...parts.map((c) => c.ispSeconds ?? 0));
  const availableDeltaVKmPerS =
    isp > 0 && dryMassKg > 0 ? deltaV(isp, launchMassKg, dryMassKg) / 1000 : 0;
  const deltaVPass = availableDeltaVKmPerS >= mission.requiredDeltaVKmPerS;
  if (isp === 0) warnings.push("No propulsion component selected.");
  else if (!deltaVPass) warnings.push("Delta-v is below the mission requirement.");

  // ---- power ----
  const generatedPowerW = parts.reduce(
    (sum, c) =>
      sum + (c.solarAreaM2 ?? 0) * (c.efficiency ?? 0) * SOLAR_FLUX_W_PER_M2,
    0
  );
  const active = parts.filter((c) => isActive(c, design));
  const fullLoadW = totalMass(active.map((c) => c.powerConsumptionW ?? 0));
  const essentialLoadW = totalMass(
    active.filter((c) => c.essential).map((c) => c.powerConsumptionW ?? 0)
  );
  const powerMarginW = generatedPowerW - fullLoadW;
  if (powerMarginW < 0) warnings.push("Full load exceeds solar power generation.");

  // ---- battery ----
  const batteryCapacityWh = totalMass(parts.map((c) => c.batteryCapacityWh ?? 0));
  const usableBatteryWh =
    batteryCapacityWh * mission.depthOfDischarge * mission.dischargeEfficiency;
  const eclipseEnergyRequiredWh = fullLoadW * mission.eclipseDurationHours;
  const batteryPass =
    usableBatteryWh * (1 - mission.batteryReserveFraction) >= eclipseEnergyRequiredWh;
  if (!batteryPass) warnings.push("Battery cannot cover the eclipse with the required reserve.");

  // ---- data ----
  const dataGenerationMBPerHour = totalMass(
    active.map((c) => c.dataGeneratedMBPerHour ?? 0)
  );
  const downlinkRateBps = Math.max(0, ...parts.map((c) => c.dataRateBps ?? 0));
  // bits/s * seconds / 8 bits per byte / 1e6 bytes per MB
  const estimatedDataCapacityMB =
    (downlinkRateBps * mission.contactWindowSeconds) / 8 / 1e6;

  // ---- cost ----
  const estimatedCostCredits =
    totalMass(parts.map((c) => c.costCredits)) + rocket.costCredits;
  const budgetPass = estimatedCostCredits <= mission.budgetCredits;
  if (!budgetPass) warnings.push("Total cost exceeds the mission budget.");

  return {
    dryMassKg,
    propellantMassKg,
    launchMassKg,
    payloadPass,
    availableDeltaVKmPerS,
    deltaVPass,
    generatedPowerW,
    fullLoadW,
    essentialLoadW,
    powerMarginW,
    batteryCapacityWh,
    usableBatteryWh,
    eclipseEnergyRequiredWh,
    batteryPass,
    dataGenerationMBPerHour,
    downlinkRateBps,
    estimatedDataCapacityMB,
    estimatedCostCredits,
    budgetPass,
    warnings,
  };
}