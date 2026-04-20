/**
 * Building Assessment Level Schedule
 * Source: Local Assessment Ordinance / Book schedule
 *
 * Applies to ALL building types regardless of actual use.
 * Based solely on Fair Market Value (FMV).
 */
export function getAssessmentLevel(
  _typeOfBuildingLabel: string,
  _actualUse: string,
  marketValue: number
): string | null {
  if (marketValue <= 0) return null;

  if (marketValue <= 175_000)                              return "0%";
  if (marketValue <= 300_000)                              return "10%";
  if (marketValue <= 500_000)                              return "20%";
  if (marketValue <= 750_000)                              return "25%";
  if (marketValue <= 1_000_000)                            return "30%";
  if (marketValue <= 2_000_000)                            return "35%";
  if (marketValue <= 5_000_000)                            return "40%";
  if (marketValue <= 10_000_000)                           return "50%";
  return "60%";
}
