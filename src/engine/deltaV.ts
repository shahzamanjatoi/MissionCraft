const G0 = 9.80665; // m/s^2

/**
 * Tsiolkovsky rocket equation.
 * @param isp specific impulse in seconds
 * @param wetMass total mass with propellant, kg
 * @param dryMass mass without propellant, kg
 * @returns delta-v in m/s
 */
export function deltaV(isp: number, wetMass: number, dryMass: number): number {
  if (dryMass <= 0 || wetMass < dryMass) {
    throw new Error("Invalid masses: wetMass must be >= dryMass > 0");
  }
  return isp * G0 * Math.log(wetMass / dryMass);
}