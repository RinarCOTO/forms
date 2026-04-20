/**
 * Physical Depreciation Schedule for Buildings
 * Source: Schedule of Depreciation per building type manual
 *
 * Rates are annual percentages applied per 5-year band:
 *   Band 1: years  1–5
 *   Band 2: years  6–10
 *   Band 3: years 11–15
 *   Band 4: years 16–20
 *   Band 5: years 21+  (applied until residual floor is hit)
 *
 * Depreciation is capped at (100% - residual%) for each type.
 */

interface TypeConfig {
  /** Annual depreciation rates for each band [band1, band2, band3, band4, after20] */
  rates: [number, number, number, number, number];
  /** Minimum residual value % — depreciation cannot reduce value below this */
  residual: number;
}

const TYPES: Record<string, TypeConfig> = {
  "Type I":       { rates: [5.2, 4.6, 4.0, 3.4, 3.2], residual: 10 },
  "Type II-A":    { rates: [5.0, 4.2, 3.6, 3.2, 3.2], residual: 12 },
  "Type II-B":    { rates: [5.0, 4.0, 3.4, 3.0, 3.0], residual: 15 },
  "Type III-AB":  { rates: [4.0, 3.6, 3.2, 3.0, 2.5], residual: 20 },
  "Type III-CD":  { rates: [4.0, 3.5, 3.0, 2.5, 2.0], residual: 28 },
  "Type III-E":   { rates: [3.0, 2.5, 2.5, 2.0, 2.0], residual: 30 },
  "Type IV-A":    { rates: [2.6, 2.3, 2.2, 2.0, 1.6], residual: 33 },
  "Type IV-B":    { rates: [2.4, 2.2, 2.0, 1.7, 1.4], residual: 35 },
  "Type V-A":     { rates: [2.2, 2.0, 1.7, 1.3, 1.1], residual: 37 },
  "Type V-B":     { rates: [2.0, 1.8, 1.5, 1.2, 1.0], residual: 40 },
  "Type V-C":     { rates: [1.8, 1.4, 1.2, 1.0, 1.0], residual: 40 },
};

export interface DepreciationResult {
  /** Total accumulated depreciation percentage */
  rate: number;
  /** Maximum allowed depreciation % (100 - residual) */
  maxRate: number;
  /** True if the rate was capped at the residual floor */
  capped: boolean;
  /** Residual value % for this building type */
  residual: number;
}

/**
 * Compute the accumulated physical depreciation rate for a building.
 *
 * @param yearsUsed      - Year of Appraisal minus Year Constructed (integer ≥ 0)
 * @param structuralType - Building structural type string from the form
 * @returns DepreciationResult, or null if the structural type is unrecognised
 */
export function getBuildingDepreciationRate(
  yearsUsed: number,
  structuralType: string
): DepreciationResult | null {
  const config = TYPES[structuralType];
  if (!config) return null;

  const years = Math.max(0, Math.floor(yearsUsed));
  const { rates, residual } = config;
  const maxRate = 100 - residual;

  const bands = [
    rates[0],
    rates[1],
    rates[2],
    rates[3],
  ];

  let accumulated = 0;
  let remaining = years;

  for (const bandRate of bands) {
    if (remaining <= 0) break;
    const yearsInBand = Math.min(remaining, 5);
    accumulated += yearsInBand * bandRate;
    remaining -= yearsInBand;
  }

  // After 20 years — apply the post-20 annual rate
  if (remaining > 0) {
    accumulated += remaining * rates[4];
  }

  const capped = accumulated > maxRate;
  return {
    rate: parseFloat(Math.min(accumulated, maxRate).toFixed(4)),
    maxRate,
    capped,
    residual,
  };
}

export const STRUCTURAL_TYPE_KEYS = Object.keys(TYPES);
