/**
 * Physical Depreciation Schedule for Buildings
 * Source: Building depreciation schedule by number of years and structural type.
 *
 * Values are cumulative depreciation percentages. When the building age exceeds
 * the last listed year for a type, the last listed percentage is used as the cap.
 */

export const BUILDING_DEPRECIATION_SCHEDULE = {
  "Type V": [
    2.75, 5.5, 8.25, 11, 13.75, 16.5, 19.25, 22, 24.75, 27.5,
    30, 32.5, 35, 37.5, 40, 42, 44, 46, 48, 50,
    51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
    61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
    71, 72, 73, 74, 75, 76, 77, 78, 79, 80,
  ],
  "Type V-B": [
    2.75, 5.5, 8.25, 11, 13.75, 16.5, 19.25, 22, 24.75, 27.5,
    30, 32.5, 35, 37.5, 40, 42, 44, 46, 48, 50,
    51.5, 53, 54.5, 56, 57.5, 59, 60.5, 62, 63.5, 65,
    66.5, 68, 69.5, 71, 72.5, 74, 75.5, 77, 78.5, 80,
  ],
  "Type IV-A": [
    3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
    33, 36, 39, 42, 45, 47.5, 50, 52.5, 55, 57.5,
    59, 60.5, 62, 63.5, 65, 66.5, 68, 69.5, 71, 72.5,
    74, 75.5, 77, 78.5, 80,
  ],
  "Type IV-B": [
    3.5, 7, 10.5, 14, 17.5, 21, 24.5, 28, 31.5, 35,
    38.5, 42, 45.5, 49, 52.5, 55.5, 58.5, 61.5, 64.5, 67.5,
    69, 70.5, 72, 73.5, 75, 76.5, 78, 79.5,
  ],
  "Type IV-C": [
    4, 8, 12, 16, 20, 23.5, 27, 30.5, 34, 37.5,
    41, 44.5, 48, 51.5, 55, 58, 61, 64, 67, 70,
    71.5, 73, 74.5, 76, 77.5, 79, 80.5,
  ],
  "Type III-A to III-C": [
    4.5, 9, 13.5, 18, 22.5, 26.5, 30.5, 34.5, 38.5, 42.5,
    46, 49.5, 53, 56.5, 60, 63, 66, 69, 72, 75,
    77, 79, 81, 83, 85,
  ],
  "Type II-A & B": [
    5, 10, 15, 20, 25, 29.5, 34, 38.5, 43, 47.5,
    51.5, 55.5, 59.5, 63.5, 67.5, 71, 74.5, 78, 81.5, 85,
  ],
  "Type I": [
    6, 12, 18, 24, 30, 35, 40, 45, 50, 55,
    59, 63, 67, 71, 75, 78.5, 82, 85.5,
  ],
} as const;

export type BuildingDepreciationType = keyof typeof BUILDING_DEPRECIATION_SCHEDULE;

export const STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS: Array<{
  structuralType: string;
  depreciationType: BuildingDepreciationType | null;
}> = [
  { structuralType: "V-A", depreciationType: "Type V" },
  { structuralType: "V-B", depreciationType: "Type V-B" },
  { structuralType: "V-C", depreciationType: null },
  { structuralType: "IV-A", depreciationType: "Type IV-A" },
  { structuralType: "IV-B", depreciationType: "Type IV-B" },
  { structuralType: "IV-C", depreciationType: "Type IV-C" },
  { structuralType: "III-A", depreciationType: "Type III-A to III-C" },
  { structuralType: "III-B", depreciationType: "Type III-A to III-C" },
  { structuralType: "III-C", depreciationType: "Type III-A to III-C" },
  { structuralType: "II-A", depreciationType: "Type II-A & B" },
  { structuralType: "II-B", depreciationType: "Type II-A & B" },
  { structuralType: "I", depreciationType: "Type I" },
];

const STRUCTURAL_TYPE_DEPRECIATION_MAP = STRUCTURAL_TYPE_DEPRECIATION_EQUIVALENTS.reduce<
  Record<string, BuildingDepreciationType>
>((acc, { structuralType, depreciationType }) => {
  if (depreciationType) acc[structuralType] = depreciationType;
  return acc;
}, {});

const normalizeStructuralType = (structuralType: string): string =>
  structuralType
    .replace(/^Type\s+/i, "")
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, "");

export function getBuildingDepreciationTypeKey(structuralType: string): BuildingDepreciationType | null {
  const normalizedType = normalizeStructuralType(structuralType);
  if (!normalizedType) return null;

  const directType = `Type ${normalizedType}` as BuildingDepreciationType;
  if (directType in BUILDING_DEPRECIATION_SCHEDULE) return directType;

  return STRUCTURAL_TYPE_DEPRECIATION_MAP[normalizedType] ?? null;
}

export interface DepreciationResult {
  /** Total accumulated depreciation percentage */
  rate: number;
  /** Maximum allowed depreciation % for this schedule */
  maxRate: number;
  /** True if the building age exceeded the last listed year */
  capped: boolean;
  /** Residual value % after maximum depreciation */
  residual: number;
  /** Depreciation schedule row used for the calculation */
  scheduleType: string;
  /** Schedule year used for lookup */
  scheduleYear: number;
}

/**
 * Get the cumulative physical depreciation rate for a building.
 *
 * @param yearsUsed      - Year of appraisal minus year constructed
 * @param structuralType - Building structural type string from the form
 * @returns DepreciationResult, or null if the structural type is unrecognised
 */
export function getBuildingDepreciationRate(
  yearsUsed: number,
  structuralType: string
): DepreciationResult | null {
  const scheduleType = getBuildingDepreciationTypeKey(structuralType);
  if (!scheduleType) return null;

  const schedule = BUILDING_DEPRECIATION_SCHEDULE[scheduleType];
  if (!schedule) return null;

  const age = Math.max(0, Math.floor(yearsUsed));
  const maxRate = schedule[schedule.length - 1];

  if (age <= 0) {
    return {
      rate: 0,
      maxRate,
      capped: false,
      residual: parseFloat((100 - maxRate).toFixed(2)),
      scheduleType,
      scheduleYear: 0,
    };
  }

  const scheduleIndex = Math.min(age, schedule.length) - 1;
  const capped = age > schedule.length;
  const rate = schedule[scheduleIndex];

  return {
    rate,
    maxRate,
    capped,
    residual: parseFloat((100 - maxRate).toFixed(2)),
    scheduleType,
    scheduleYear: scheduleIndex + 1,
  };
}

export const STRUCTURAL_TYPE_KEYS = Object.keys(BUILDING_DEPRECIATION_SCHEDULE) as BuildingDepreciationType[];
