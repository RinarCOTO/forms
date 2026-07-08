export type FloorAreaValue = number | '';
export type BuildingCategory = '' | 'Residential' | 'Commercial';

interface BuildingStep2PayloadInput {
  typeOfBuilding: string;
  structureType: string;
  buildingPermitNo: string;
  cct: string;
  completionIssuedOn: string;
  dateConstructed: string | number;
  dateOccupied: string;
  buildingAge: string | number;
  numberOfStoreys: string | number;
  floorAreas: FloorAreaValue[];
  totalFloorArea: string | number;
  landOwner: string;
  landTdNo: string;
  landArpNo: string;
  landArea: string;
  rawCostValue: string;
}

export function formatPeso(value: string | number | null | undefined) {
  if (value === '' || value === undefined || value === null) return '';

  const num = typeof value === 'string' ? Number(value.replace(/[^0-9.]/g, '')) : value;
  if (isNaN(num) || num === 0) return '₱0.00';

  return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPesoInput(value: string) {
  const cleanValue = value.replace(/[^0-9.]/g, '');
  const parts = cleanValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1].slice(0, 2)}` : '';
  const formattedInteger = integerPart ? parseInt(integerPart, 10).toLocaleString() : '';

  return {
    displayValue: formattedInteger + decimalPart,
    rawValue: cleanValue === '' ? '' : cleanValue,
  };
}

export function getRawCostValue(costOfConstructionDisplay: string) {
  return costOfConstructionDisplay ? costOfConstructionDisplay.replace(/[^0-9.]/g, '') : '0';
}

export function normalizeStructuralType(value: string) {
  return value.replace(/^Type\s+/i, '').trim();
}

export function getBuildingType(category: string, subType: string) {
  if (!category) return '';
  return subType ? `${category} (${subType})` : category;
}

export function getBuildingTypeForCost(category: string, subType: string) {
  return category === 'Residential' ? 'Residential Houses' : subType;
}

export function getBuildingTypeSelection(savedType: string): {
  buildingCategory: BuildingCategory;
  buildingSubType: string;
} {
  if (savedType === 'Residential Houses') {
    return { buildingCategory: 'Residential', buildingSubType: '' };
  }

  const parenMatch = savedType.match(/^(Residential|Commercial) \((.+)\)$/);
  if (parenMatch) {
    return { buildingCategory: parenMatch[1] as BuildingCategory, buildingSubType: parenMatch[2] };
  }

  if (savedType === 'Residential') {
    return { buildingCategory: 'Residential', buildingSubType: '' };
  }

  // Legacy format saved before the parentheses change
  if (savedType.startsWith('Commercial - ')) {
    return { buildingCategory: 'Commercial', buildingSubType: savedType.replace('Commercial - ', '') };
  }

  if (savedType) {
    return { buildingCategory: 'Commercial', buildingSubType: savedType };
  }

  return { buildingCategory: '', buildingSubType: '' };
}

export function getStoredYear(value: unknown): number | '' {
  if (!value) return '';
  if (typeof value === 'number') return value;

  const strVal = value.toString();
  return strVal.length >= 4 ? Number(strVal.substring(0, 4)) : '';
}

export function formatYearToDate(value: string | number) {
  if (!value) return null;

  const str = value.toString();
  return str.length === 4 ? `${str}-01-01` : str;
}

export function parseStoredFloorAreas(value: unknown): FloorAreaValue[] | null {
  if (!value) return null;
  return typeof value === 'string' ? JSON.parse(value) : value as FloorAreaValue[];
}

export function getFloorAreasForStoreys(numberOfStoreys: string | number, floorAreas: FloorAreaValue[]) {
  return typeof numberOfStoreys === 'number' ? floorAreas.slice(0, numberOfStoreys) : floorAreas;
}

export function combineLandTdArpNo(landTdNo: string, landArpNo: string) {
  return [landTdNo, landArpNo].filter(Boolean).join(' / ');
}

function emptyStringToNull(value: string) {
  return value.trim() === '' ? null : value;
}

export function createBuildingStep2Payload({
  typeOfBuilding,
  structureType,
  buildingPermitNo,
  cct,
  completionIssuedOn,
  dateConstructed,
  dateOccupied,
  buildingAge,
  numberOfStoreys,
  floorAreas,
  totalFloorArea,
  landOwner,
  landTdNo,
  landArpNo,
  landArea,
  rawCostValue,
}: BuildingStep2PayloadInput): Record<string, unknown> {
  return {
    type_of_building: typeOfBuilding,
    structure_type: structureType,
    building_permit_no: buildingPermitNo,
    cct,
    completion_issued_on: formatYearToDate(completionIssuedOn),
    date_constructed: formatYearToDate(dateConstructed),
    date_occupied: formatYearToDate(dateOccupied),
    building_age: buildingAge,
    number_of_storeys: numberOfStoreys,
    floor_areas: getFloorAreasForStoreys(numberOfStoreys, floorAreas),
    total_floor_area: totalFloorArea,
    land_owner: landOwner,
    land_td_no: landTdNo,
    land_arp_no: landArpNo,
    td_arp_no: combineLandTdArpNo(landTdNo, landArpNo),
    land_area: emptyStringToNull(landArea),
    cost_of_construction: rawCostValue === '0' ? null : rawCostValue,
  };
}
