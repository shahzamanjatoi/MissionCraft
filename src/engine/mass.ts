/** Sum of component masses in kg. */
export function totalMass(masses: number[]): number {
  return masses.reduce((sum, m) => sum + m, 0);
}