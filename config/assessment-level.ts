// config/assessment-level.ts
// Assessment level lookup similar to unit-construction-cost

import { BUILDING_TYPES } from "@/config/form-options";

const getBuildingTypeId = (label: string): string | null => {
  // Exact match first
  const exact = BUILDING_TYPES.find((item) => item.label === label);
  if (exact) return exact.id;
  // Fallback: case-insensitive check for stored shorthand values like "residential"
  const lower = label.toLowerCase();
  const partial = BUILDING_TYPES.find((item) =>
    item.label.toLowerCase().startsWith(lower)
  );
  return partial ? partial.id : null;
};

export const getAssessmentLevel = (
  typeOfBuildingLabel: string,
  actualUse: string,
  marketValue: number
): string | null => {
  const buildingTypeId = getBuildingTypeId(typeOfBuildingLabel);

  // If residential (id: building_type_1) and market value > 175,000 and <= 300,000, assessment level is 5%
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 175000 &&
    marketValue <= 300000
  ) {
    return "5%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 300001 &&
    marketValue <= 500000
  ) {
    return "7%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 500001 &&
    marketValue <= 750000
  ) {
    return "9%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 750001 &&
    marketValue <= 1000000
  ) {
    return "11%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 1000001 &&
    marketValue <= 2000000
  ) {
    return "13%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 2000001 &&
    marketValue <= 5000000
  ) {
    return "15%";
  }
  if (
    buildingTypeId === "building_type_1" &&
    actualUse === "Residential" &&
    marketValue > 5000001 &&
    marketValue <= 10000000
  ) {
    return "17%";
  }

  // Add more rules as needed

  return null;
};
