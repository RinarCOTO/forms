// Utility functions for form logic

/**
 * Generate an array of years from startYear to current year (descending).
 */
export function generateYears(startYear = 1900): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }
  return years;
}

/**
 * Generate ascending effectivity years from a fixed start year through a future offset.
 */
export function generateEffectivityYears(startYear = 2001, futureYears = 10): number[] {
  const endYear = new Date().getFullYear() + futureYears;
  const years: number[] = [];
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  return years;
}

/**
 * Calculate age based on input year.
 */
export function calculateAge(year: number): number | string {
  const currentYear = new Date().getFullYear();
  if (!year || year > currentYear) return 0;
  if (year === currentYear) return "NEW";
  return currentYear - year;
}

/**
 * Sum an array of numbers (ignores non-numeric values).
 */
export function calculateTotalFloorArea(areas: (number | string)[]): number {
  const sum = areas.reduce((acc: number, val) => {
    const num = typeof val === "number" ? val : parseFloat(val);
    return !isNaN(num) ? acc + num : acc;
  }, 0);
  return Math.round(sum * 100) / 100;
}
