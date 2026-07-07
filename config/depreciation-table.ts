/**
 * Physical Depreciation Schedule for Buildings
 * Source: Schedule of Depreciation per building type manual
 *
 * Buildings aged 0-1 year are treated as new. Annual percentages start after
 * the first year of use and are applied per 5-year depreciation band:
 *   Band 1: depreciable years  1-5
 *   Band 2: depreciable years  6-10
 *   Band 3: depreciable years 11-15
 *   Band 4: depreciable years 16-20
 *   Band 5: depreciable years 21+  (applied until residual floor is hit)
 *
 * Depreciation is capped at (100% - residual%) for each type.
 */

export interface TypeConfig {
  /** Annual depreciation rates for each band [band1, band2, band3, band4, after20] */
  rates: [number, number, number, number, number];
  /** Minimum residual value % — depreciation cannot reduce value below this */
  residual: number;
}

export const BUILDING_DEPRECIATION_TYPES: Record<string, TypeConfig> = {
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

export const STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS: Array<{
  structuralType: string;
  depreciationType: string | null;
}> = [
  { structuralType: "V-A", depreciationType: "Type V-A" },
  { structuralType: "V-B", depreciationType: "Type V-B" },
  { structuralType: "IV-A", depreciationType: "Type IV-A" },
  { structuralType: "IV-B", depreciationType: "Type IV-B" },
  { structuralType: "IV-C", depreciationType: null },
  { structuralType: "III-A", depreciationType: "Type III-AB" },
  { structuralType: "III-B", depreciationType: "Type III-AB" },
  { structuralType: "III-C", depreciationType: "Type III-CD" },
  { structuralType: "II-A", depreciationType: "Type II-A" },
  { structuralType: "II-B", depreciationType: "Type II-B" },
  { structuralType: "I", depreciationType: "Type I" },
];

const STRUCTURAL_TYPE_DEPRECIATION_MAP = STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS.reduce<
  Record<string, string>
>((acc, { structuralType, depreciationType }) => {
  if (depreciationType) acc[structuralType] = depreciationType;
  return acc;
}, {
  "III-D": "Type III-CD",
  "III-CD": "Type III-CD",
  "III-AB": "Type III-AB",
  "III-E": "Type III-E",
  "V-C": "Type V-C",
});

const normalizeStructuralType = (structuralType: string): string =>
  structuralType
    .replace(/^Type\s+/i, "")
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");

export function getBuildingDepreciationTypeKey(structuralType: string): string | null {
  const normalizedType = normalizeStructuralType(structuralType);
  if (!normalizedType) return null;

  const directType = `Type ${normalizedType}`;
  if (BUILDING_DEPRECIATION_TYPES[directType]) return directType;

  return STRUCTURAL_TYPE_DEPRECIATION_MAP[normalizedType] ?? null;
}

export interface DepreciationResult {
  /** Total accumulated depreciation percentage */
  rate: number;
  /** Maximum allowed depreciation % (100 - residual) */
  maxRate: number;
  /** True if the rate was capped at the residual floor */
  capped: boolean;
  /** Residual value % for this building type */
  residual: number;
  /** Depreciation schedule row used for the calculation */
  scheduleType: string;
}

/**
 * Compute the accumulated physical depreciation rate for a building.
 *
 * @param yearsUsed      - Year of Appraisal minus Year Constructed (integer >= 0)
 * @param structuralType - Building structural type string from the form
 * @returns DepreciationResult, or null if the structural type is unrecognised
 */
export function getBuildingDepreciationRate(
  yearsUsed: number,
  structuralType: string
): DepreciationResult | null {
  const scheduleType = getBuildingDepreciationTypeKey(structuralType);
  if (!scheduleType) return null;

  const config = BUILDING_DEPRECIATION_TYPES[scheduleType];
  if (!config) return null;

  const years = Math.max(0, Math.floor(yearsUsed) - 1);
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
    scheduleType,
  };
}

export const STRUCTURAL_TYPE_KEYS = Object.keys(BUILDING_DEPRECIATION_TYPES);
