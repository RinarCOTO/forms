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
  return areas.reduce((sum: number, val) => {
    const num = typeof val === "number" ? val : parseFloat(val);
    return !isNaN(num) ? sum + Number(num) : sum;
  }, 0);
}
