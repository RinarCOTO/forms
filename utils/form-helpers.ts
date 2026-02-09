// Utility functions for form logic

/**
 * Generate an array of years from startYear to current year (descending).
 */
export function generateYears(startYear = 1900): number[] {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i).reverse();
}

/**
 * Calculate age based on input year.
 */
export function calculateAge(year: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - year;
}

/**
 * Sum an array of numbers (floor areas).
 */
export function calculateTotalFloorArea(floorAreas: (number | "")[]): number {
  return floorAreas.reduce((acc, area) => acc + (typeof area === "number" ? area : 0), 0);
}
