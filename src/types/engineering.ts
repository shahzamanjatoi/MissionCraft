export type ComponentCategory =
  | "bus" | "instrument" | "power" | "battery" | "communication" | "propulsion";

export interface SpacecraftComponent {
  id: string;
  name: string;
  category: ComponentCategory;
  massKg: number;
  costCredits: number;
  powerConsumptionW?: number;
  solarAreaM2?: number;
  efficiency?: number;
  batteryCapacityWh?: number;
  dataRateBps?: number;
  dataGeneratedMBPerHour?: number; // instruments only
  ispSeconds?: number;             // propulsion only
  essential?: boolean;             // stays on in essential-only mode
  scienceValue?: number;
  mountingPoint?: string;
  modelKey: string;
  description: string;
}

export interface SpacecraftDesign {
  componentIds: string[];
  propellantKg: number;
  activeInstrumentIds: string[];
  configurationVersion: number;
}

export interface RocketProfile {
  id: string;
  name: string;
  payloadCapacityKg: number;
  costCredits: number;
  missionCapabilityLabel: string;
}

export interface MissionConfig {
  id: string;
  name: string;
  destination: "moon";
  missionType: "orbiter";
  budgetCredits: number;
  requiredDeltaVKmPerS: number;
  eclipseDurationHours: number;
  requiredScienceDataMB: number;
  requiredDataReturnFraction: number;
  contactWindowSeconds: number;
  depthOfDischarge: number;
  dischargeEfficiency: number;
  batteryReserveFraction: number;
  eventSeed: number;
}

export interface EngineeringSnapshot {
  // mass
  dryMassKg: number;
  propellantMassKg: number;
  launchMassKg: number;
  payloadPass: boolean;
  // propulsion
  availableDeltaVKmPerS: number;
  deltaVPass: boolean;
  // power
  generatedPowerW: number;
  fullLoadW: number;
  essentialLoadW: number;
  powerMarginW: number;
  // battery
  batteryCapacityWh: number;
  usableBatteryWh: number;
  eclipseEnergyRequiredWh: number;
  batteryPass: boolean;
  // data
  dataGenerationMBPerHour: number;
  downlinkRateBps: number;
  estimatedDataCapacityMB: number;
  // cost
  estimatedCostCredits: number;
  budgetPass: boolean;
  warnings: string[];
}