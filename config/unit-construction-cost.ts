import { BUILDING_TYPES } from "@/config/form-options";

const normalizeStructuralType = (structureType: string): string =>
  structureType.replace(/^Type\s+/i, "").trim();

const getBuildingTypeId = (label: string): string | null => {
  const normalized = label.trim();
  if (normalized === "Residential") return "building_type_1";
  const match = BUILDING_TYPES.find((item) => item.label === normalized);
  return match ? match.id : null;
};

const UNIT_CONSTRUCTION_COSTS: Record<string, Record<string, number | null>> = {
  "V-A": {
    building_type_1: 9950,
    building_type_2: 11550,
    building_type_3: 11780,
    building_type_4: 8670,
    building_type_5: 9380,
    building_type_6: 16560,
    building_type_7: 8530,
    building_type_8: 5680,
    building_type_9: 5470,
    building_type_10: 4970,
  },
  "V-B": {
    building_type_1: 8900,
    building_type_2: 10090,
    building_type_3: 10660,
    building_type_4: 7630,
    building_type_5: 8890,
    building_type_6: 14750,
    building_type_7: 7840,
    building_type_8: 5080,
    building_type_9: 4670,
    building_type_10: null,
  },
  "IV-A": {
    building_type_1: 8170,
    building_type_2: 9690,
    building_type_3: 9940,
    building_type_4: 6330,
    building_type_5: 8250,
    building_type_6: 13300,
    building_type_7: 7570,
    building_type_8: 4830,
    building_type_9: 4140,
    building_type_10: null,
  },
  "IV-B": {
    building_type_1: 7200,
    building_type_2: 8270,
    building_type_3: 8490,
    building_type_4: 5450,
    building_type_5: 6400,
    building_type_6: 12130,
    building_type_7: 6850,
    building_type_8: 4600,
    building_type_9: 3680,
    building_type_10: null,
  },
  "IV-C": {
    building_type_1: 6450,
    building_type_2: 7530,
    building_type_3: 7690,
    building_type_4: 4980,
    building_type_5: 5260,
    building_type_6: 10230,
    building_type_7: 6400,
    building_type_8: 4360,
    building_type_9: null,
    building_type_10: null,
  },
  "III-A": {
    building_type_1: 4960,
    building_type_2: 5680,
    building_type_3: 6150,
    building_type_4: 3840,
    building_type_5: 4120,
    building_type_6: null,
    building_type_7: 4320,
    building_type_8: 3890,
    building_type_9: 2320,
    building_type_10: null,
  },
  "III-B": {
    building_type_1: 4310,
    building_type_2: 5150,
    building_type_3: 5400,
    building_type_4: 3280,
    building_type_5: 3710,
    building_type_6: null,
    building_type_7: 3750,
    building_type_8: 3310,
    building_type_9: null,
    building_type_10: null,
  },
  "III-C": {
    building_type_1: 3870,
    building_type_2: 4470,
    building_type_3: 4970,
    building_type_4: 2800,
    building_type_5: 3450,
    building_type_6: null,
    building_type_7: 3360,
    building_type_8: 3110,
    building_type_9: null,
    building_type_10: null,
  },
  "II-A": {
    building_type_1: 2360,
    building_type_2: null,
    building_type_3: null,
    building_type_4: null,
    building_type_5: null,
    building_type_6: null,
    building_type_7: null,
    building_type_8: null,
    building_type_9: null,
    building_type_10: null,
  },
  "II-B": {
    building_type_1: 1520,
    building_type_2: null,
    building_type_3: null,
    building_type_4: null,
    building_type_5: null,
    building_type_6: null,
    building_type_7: null,
    building_type_8: null,
    building_type_9: null,
    building_type_10: null,
  },
  I: {
    building_type_1: 970,
    building_type_2: null,
    building_type_3: null,
    building_type_4: null,
    building_type_5: null,
    building_type_6: null,
    building_type_7: null,
    building_type_8: null,
    building_type_9: null,
    building_type_10: null,
  },
};

export const getUnitConstructionCost = (
  typeOfBuildingLabel: string,
  structureType: string
): string | null => {
  const buildingTypeId = getBuildingTypeId(typeOfBuildingLabel);
  const normalizedStructureType = normalizeStructuralType(structureType);
  if (!buildingTypeId || !normalizedStructureType) return null;

  const cost = UNIT_CONSTRUCTION_COSTS[normalizedStructureType]?.[buildingTypeId];
  return cost == null ? null : String(cost);
};
