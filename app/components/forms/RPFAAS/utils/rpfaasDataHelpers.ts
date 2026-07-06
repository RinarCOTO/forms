import type { RPFAASFormData, RoofMaterials } from "@/app/types/rpfaas";
import { ADDITIONAL_FLAT_RATE_CHOICES, ADDITIONAL_PERCENT_CHOICES, DEDUCTION_CHOICES } from "@/config/form-options";
import { getBuildingDepreciationRate } from "@/config/depreciation-table";
import { getLocationName } from "./locationHelpers";
import { DUMMY_BARANGAYS, DUMMY_MUNICIPALITIES, DUMMY_PROVINCES } from "../constants/locations";

export type JsonObject = Record<string, unknown>;

// The FAAS API still returns mixed DB column shapes while the form normalizes them.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RPFAASServerData = Record<string, any>;

export const DEFAULT_ROOF_MATERIALS: RoofMaterials = {
  reinforcedConcrete: false,
  longspanRoof: false,
  tiles: false,
  giSheets: false,
  aluminum: false,
  others: false,
};

export const DEFAULT_RPFAAS_FORM_DATA: RPFAASFormData = {
  transactionCode: "",
  tdNo: "",
  arpNo: "",
  octTctCloaNo: "",
  pin: "",
  surveyNo: "",
  lotNo: "",
  blk: "",
  previousTdNo: "",
  previousOwner: "",
  previousAv: "",
  previousMv: "",
  previousArea: "",
  ownerName: "",
  adminCareOfName: "",
  ownerAddressBarangay: "",
  ownerAddressMunicipality: "",
  ownerAddressProvince: "",
  adminBarangayName: "",
  adminMunicipalityName: "",
  adminProvinceName: "",
  locationStreet: "",
  locationMunicipality: "",
  locationBarangay: "",
  locationProvince: "",
  typeOfBuilding: "",
  structuralType: "",
  buildingPermitNo: "",
  cct: "",
  completionIssuedOn: "",
  dateConstructed: "",
  dateOccupied: "",
  buildingAge: "",
  numberOfStoreys: "",
  floorAreas: [],
  totalFloorArea: "",
  landOwner: "",
  landTdNo: "",
  landArpNo: "",
  landTdArpNo: "",
  landArea: "",
  roofMaterials: DEFAULT_ROOF_MATERIALS,
  roofMaterialsOtherText: "",
  flooringGrid: [],
  wallsGrid: [],
  selectedDeductions: [],
  deductionAmounts: {},
  deductionComments: "",
  additionalPercentageChoice: "",
  additionalPercentageValue: 0,
  additionalPercentageAreas: [],
  additionalFlatRateChoice: "",
  additionalFlatRateValue: 0,
  additionalFlatRateAreas: [],
  unitCost: 0,
  physicalDepreciationPct: 0,
  depreciationAmount: 0,
  baseCost: 0,
  standardDeductionTotal: 0,
  netUnitCost: 0,
  marketValue: 0,
  taxStatus: "taxable",
  actualUse: "",
  assessmentLevel: "20%",
  assessedValue: 0,
  amountInWords: "",
  effectivityOfAssessment: "",
  appraisedById: "",
  submittedAt: "",
  municipalSignedAt: "",
  provincialSignedAt: "",
  municipalReviewerId: "",
  provincialReviewerId: "",
  memoranda: "",
};

export function createRPFAASDataFromServer(d: RPFAASServerData): RPFAASFormData {
  const ownerAddress = getAddressParts({
    rawAddress: d.owner_address,
    provinceCode: d.owner_province_code,
    municipalityCode: d.owner_municipality_code,
    barangayCode: d.owner_barangay_code,
  });

  const adminAddress = getAddressParts({
    rawAddress: d.admin_address,
    provinceCode: d.admin_province_code,
    municipalityCode: d.admin_municipality_code,
    barangayCode: d.admin_barangay_code,
  });

  const location = getPropertyLocationParts({
    province: d.location_province,
    municipality: d.location_municipality,
    barangay: d.location_barangay,
    provinceCode: d.property_province_code,
    municipalityCode: d.property_municipality_code,
    barangayCode: d.property_barangay_code,
  });

  const rm = parseJsonObject(d.roofing_material);
  const fm = parseJsonObject(d.flooring_material);
  const wm = parseJsonObject(d.wall_material);
  const roofMaterials = getRoofMaterials(d.roofing_material);

  const unitCost = asNumber(d.cost_of_construction);
  const physicalDepreciationPct = asNumber(d.physical_depreciation_pct);
  const totalFloorAreaNum = asNumber(d.total_floor_area);
  const totalFloorArea = String(d.total_floor_area || "");
  const mainCost = totalFloorAreaNum > 0 ? unitCost * totalFloorAreaNum : unitCost || 0;

  const additionalTotals = calculateAdditionalTotals({
    unitCost,
    percentageChoice: asString(d.additional_percentage_choice),
    percentageAreas: asNumberArray(d.additional_percentage_areas),
    flatRateChoice: asString(d.additional_flat_rate_choice),
    flatRateAreas: asNumberArray(d.additional_flat_rate_areas),
  });

  const baseCost = mainCost + additionalTotals.percentageTotal + additionalTotals.flatRateTotal;
  const depreciationAmount = baseCost * physicalDepreciationPct / 100;
  const selectedDeductions = asStringArray(d.selected_deductions);
  const deductionAmounts = parseNumberRecord(d.deduction_amounts);
  const standardDeductionTotal = calculateStandardDeductionTotal({
    selectedDeductions,
    deductionAmounts,
    baseCost,
  });

  return {
    transactionCode: d.transaction_code || "",
    tdNo: d.td_no || "",
    arpNo: d.arp_no || "",
    octTctCloaNo: d.oct_tct_cloa_no && d.oct_tct_cloa_no !== "None" ? d.oct_tct_cloa_no : "",
    pin: d.pin || "",
    surveyNo: d.survey_no || "",
    lotNo: d.lot_no || "",
    blk: d.blk || "",
    previousTdNo: d.previous_td_no || "",
    previousOwner: d.previous_owner || "",
    previousAv: d.previous_av != null ? String(d.previous_av) : "",
    previousMv: d.previous_mv != null ? String(d.previous_mv) : "",
    previousArea: d.previous_area != null ? String(d.previous_area) : "",
    ownerName: d.owner_name || "",
    adminCareOfName: d.admin_care_of || "",
    ownerAddressBarangay: ownerAddress.barangay,
    ownerAddressMunicipality: ownerAddress.municipality,
    ownerAddressProvince: ownerAddress.province,
    adminBarangayName: adminAddress.barangay,
    adminMunicipalityName: adminAddress.municipality,
    adminProvinceName: adminAddress.province,
    locationStreet: d.property_address || "",
    locationMunicipality: location.municipality,
    locationBarangay: location.barangay,
    locationProvince: location.province,
    typeOfBuilding: d.type_of_building || "",
    structuralType: d.structure_type || "",
    buildingPermitNo: d.building_permit_no || "",
    cct: d.cct || "",
    completionIssuedOn: d.completion_issued_on || "",
    dateConstructed: d.date_constructed || "",
    dateOccupied: d.date_occupied || "",
    buildingAge: d.building_age || "",
    numberOfStoreys: d.number_of_storeys || "",
    floorAreas: d.floor_areas || [],
    totalFloorArea,
    landOwner: d.land_owner || "",
    landTdNo: d.land_td_no || d.td_arp_no || "",
    landArpNo: d.land_arp_no || "",
    landTdArpNo: d.td_arp_no || "",
    landArea: d.land_area || "",
    roofMaterials,
    roofMaterialsOtherText: asString(rm.otherText),
    flooringGrid: asBooleanGrid(fm.grid),
    wallsGrid: asBooleanGrid(wm.grid),
    selectedDeductions,
    deductionAmounts,
    deductionComments: d.overall_comments || "",
    additionalPercentageChoice: d.additional_percentage_choice || "",
    additionalPercentageValue: 0,
    additionalPercentageAreas: d.additional_percentage_areas || [],
    additionalFlatRateChoice: d.additional_flat_rate_choice || "",
    additionalFlatRateValue: 0,
    additionalFlatRateAreas: d.additional_flat_rate_areas || [],
    unitCost,
    physicalDepreciationPct,
    depreciationAmount,
    baseCost,
    standardDeductionTotal,
    netUnitCost: baseCost - standardDeductionTotal - depreciationAmount,
    marketValue: asNumber(d.market_value),
    actualUse: d.actual_use || "",
    taxStatus: d.tax_status || "taxable",
    assessmentLevel: formatAssessmentLevel(d.assessment_level),
    assessedValue: asNumber(d.estimated_value),
    amountInWords: d.amount_in_words || "",
    effectivityOfAssessment: d.effectivity_of_assessment || "",
    appraisedById: d.appraised_by || "",
    submittedAt: d.submitted_at || "",
    municipalSignedAt: d.municipal_signed_at || "",
    provincialSignedAt: d.provincial_signed_at || "",
    municipalReviewerId: d.municipal_reviewer_id || "",
    provincialReviewerId: d.provincial_reviewer_id || "",
    memoranda: d.memoranda || "",
  };
}

export function createRPFAASDataFromStorage(storage: Storage, locationSearch = ""): RPFAASFormData {
  const transactionCode = storage.getItem("rpfaas_transaction_code") || "";
  const tdNo = storage.getItem("rpfaas_td_no") || "";
  const arpNo = storage.getItem("rpfaas_arp_no") || "";
  const titleType = storage.getItem("rpfaas_title_type") || "";
  const titleNo = storage.getItem("rpfaas_title_no") || "";
  const octTctCloaNo = titleType && titleType !== "None" ? `${titleType} ${titleNo}`.trim() : "";
  const pin = storage.getItem("rpfaas_pin") || "";
  const surveyNo = storage.getItem("rpfaas_survey_no") || "";
  const lotNo = storage.getItem("rpfaas_lot_no") || "";
  const blk = storage.getItem("rpfaas_blk") || "";
  const previousTdNo = storage.getItem("rpfaas_previous_td_no") || "";
  const previousOwner = storage.getItem("rpfaas_previous_owner") || "";
  const previousAv = storage.getItem("rpfaas_previous_av") || "";
  const previousMv = storage.getItem("rpfaas_previous_mv") || "";
  const previousArea = storage.getItem("rpfaas_previous_area") || "";
  const ownerName = storage.getItem("rpfaas_owner_name") || "";
  const adminCareOfName = storage.getItem("rpfaas_admin_careof") || "";
  const locationStreet = storage.getItem("rpfaas_location_street") || "";

  const ownerAddress = getAddressParts({
    rawAddress: storage.getItem("rpfaas_owner_address"),
    provinceCode: storage.getItem("rpfaas_owner_address_province_code"),
    municipalityCode: storage.getItem("rpfaas_owner_address_municipality_code"),
    barangayCode: storage.getItem("rpfaas_owner_address_barangay_code"),
  });

  const adminAddress = getAddressParts({
    rawAddress: storage.getItem("rpfaas_admin_address"),
    provinceCode: storage.getItem("rpfaas_admin_province_code"),
    municipalityCode: storage.getItem("rpfaas_admin_municipality_code"),
    barangayCode: storage.getItem("rpfaas_admin_barangay_code"),
  });

  const location = getPropertyLocationParts({
    province: storage.getItem("rpfaas_location_province"),
    municipality: storage.getItem("rpfaas_location_municipality"),
    barangay: storage.getItem("rpfaas_location_barangay"),
    provinceCode: storage.getItem("rpfaas_location_province_code"),
    municipalityCode: storage.getItem("rpfaas_location_municipality_code"),
    barangayCode: storage.getItem("rpfaas_location_barangay_code"),
  });

  const step2Data = parseJsonObject(storage.getItem("p2"));
  const typeOfBuilding = asString(step2Data.type_of_building);
  const structuralType = asString(step2Data.structure_type);
  const buildingPermitNo = asString(step2Data.building_permit_no);
  const cct = asString(step2Data.cct);
  const completionIssuedOn = asString(step2Data.completion_issued_on);
  const dateConstructed = asString(step2Data.date_constructed);
  const dateOccupied = asString(step2Data.date_occupied);
  const buildingAge = asString(step2Data.building_age);
  const numberOfStoreys = asString(step2Data.number_of_storeys);
  const floorAreas = Array.isArray(step2Data.floor_areas) ? step2Data.floor_areas as string[] : [];
  const totalFloorArea = asString(step2Data.total_floor_area);
  const landOwner = asString(step2Data.land_owner);
  const landTdNo = asString(step2Data.land_td_no || step2Data.td_arp_no);
  const landArpNo = asString(step2Data.land_arp_no);
  const landTdArpNo = asString(step2Data.td_arp_no);
  const landArea = asString(step2Data.land_area);

  const step3Data = parseJsonObject(storage.getItem("p3"));
  let roofMaterials: RoofMaterials = DEFAULT_ROOF_MATERIALS;
  if (hasAnyRoofMaterial(step3Data.roof_materials)) {
    roofMaterials = { ...roofMaterials, ...getRoofMaterialData(step3Data.roof_materials) };
  } else {
    const roofRaw = storage.getItem("roofing_material_json");
    if (roofRaw) roofMaterials = { ...roofMaterials, ...getRoofMaterialData(roofRaw) };
  }

  const roofMaterialsOtherText = asString(step3Data.roof_materials_other_text) ||
    storage.getItem("roofing_material_other_text") ||
    "";

  let flooringGrid: boolean[][] = [];
  if (Array.isArray(step3Data.flooring_grid) && step3Data.flooring_grid.length > 0) {
    flooringGrid = step3Data.flooring_grid as boolean[][];
  } else {
    flooringGrid = parseStoredBooleanGrid(storage.getItem("flooring_material_json"));
  }

  let wallsGrid: boolean[][] = [];
  if (Array.isArray(step3Data.walls_grid) && step3Data.walls_grid.length > 0) {
    wallsGrid = step3Data.walls_grid as boolean[][];
  } else {
    wallsGrid = parseStoredBooleanGrid(storage.getItem("wall_material_json"));
  }

  const step4Data = parseJsonObject(storage.getItem("p4"));
  if (Object.keys(step4Data).length === 0 && locationSearch.includes("id=")) {
    console.warn("Missing p4 localStorage data. Please go back to Step 4 and save again, or this data needs to be restored from the database.");
  }

  const selectedDeductions = asStringArray(step4Data.selected_deductions);
  const deductionAmounts = parseNumberRecord(step4Data.deduction_amounts);
  const deductionComments = asString(step4Data.overall_comments);
  const additionalPercentageChoice = asString(step4Data.additional_percentage_choice);
  const additionalPercentageValue = asNumber(step4Data.additional_percentage_value);
  const additionalPercentageAreas = asNumberArray(step4Data.additional_percentage_areas);
  const additionalFlatRateChoice = asString(step4Data.additional_flat_rate_choice);
  const additionalFlatRateValue = asNumber(step4Data.additional_flat_rate_value);
  const additionalFlatRateAreas = asNumberArray(step4Data.additional_flat_rate_areas);
  const marketValue = storage.getItem("market_value_p4");
  const unitCostNum = asNumber(storage.getItem("unit_cost_p2"));
  const floorAreaNum = asNumber(step2Data.total_floor_area);
  const mainCost = floorAreaNum > 0 ? unitCostNum * floorAreaNum : unitCostNum;
  const additionalTotals = calculateAdditionalTotals({
    unitCost: unitCostNum,
    percentageChoice: additionalPercentageChoice,
    percentageAreas: additionalPercentageAreas,
    flatRateChoice: additionalFlatRateChoice,
    flatRateAreas: additionalFlatRateAreas,
  });
  const baseCost = mainCost + additionalTotals.percentageTotal + additionalTotals.flatRateTotal;
  const standardDeductionTotal = calculateStandardDeductionTotal({
    selectedDeductions,
    deductionAmounts,
    baseCost,
  });

  const buildingAgeNum = asNumber(buildingAge);
  const depreciationResultFromStorage = (buildingAgeNum && structuralType)
    ? getBuildingDepreciationRate(buildingAgeNum, structuralType)
    : null;
  const depreciationPctFromStorage = depreciationResultFromStorage?.rate ?? 0;
  const depreciationAmountFromStorage = baseCost * depreciationPctFromStorage / 100;
  const netUnitCost = baseCost - standardDeductionTotal - depreciationAmountFromStorage;
  const assessmentLevelFromStorage = storage.getItem("assessment_level_p5");

  return {
    transactionCode,
    tdNo,
    arpNo,
    octTctCloaNo,
    pin,
    surveyNo,
    lotNo,
    blk,
    previousTdNo,
    previousOwner,
    previousAv,
    previousMv,
    previousArea,
    ownerName,
    adminCareOfName,
    ownerAddressBarangay: ownerAddress.barangay,
    ownerAddressMunicipality: ownerAddress.municipality,
    ownerAddressProvince: ownerAddress.province,
    adminBarangayName: adminAddress.barangay,
    adminMunicipalityName: adminAddress.municipality,
    adminProvinceName: adminAddress.province,
    locationStreet,
    locationMunicipality: location.municipality,
    locationBarangay: location.barangay,
    locationProvince: location.province,
    typeOfBuilding,
    structuralType,
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
    landTdArpNo,
    landArea,
    roofMaterials,
    roofMaterialsOtherText,
    flooringGrid,
    wallsGrid,
    selectedDeductions,
    deductionAmounts,
    deductionComments,
    additionalPercentageChoice,
    additionalPercentageValue,
    additionalPercentageAreas,
    additionalFlatRateChoice,
    additionalFlatRateValue,
    additionalFlatRateAreas,
    unitCost: unitCostNum,
    physicalDepreciationPct: depreciationPctFromStorage,
    depreciationAmount: depreciationAmountFromStorage,
    baseCost,
    standardDeductionTotal,
    netUnitCost,
    marketValue: asNumber(marketValue),
    actualUse: storage.getItem("actual_use_p5") || "",
    taxStatus: storage.getItem("tax_status_p5") || "taxable",
    assessmentLevel: assessmentLevelFromStorage ? formatAssessmentLevel(assessmentLevelFromStorage) : "20%",
    assessedValue: asNumber(storage.getItem("estimated_value_p5")),
    amountInWords: storage.getItem("amount_in_words_p5") || "",
    effectivityOfAssessment: storage.getItem("effectivity_of_assessment_p5") || "",
    appraisedById: storage.getItem("appraised_by_p5") || "",
    submittedAt: "",
    municipalSignedAt: "",
    provincialSignedAt: "",
    municipalReviewerId: storage.getItem("municipal_reviewer_id_p5") || "",
    provincialReviewerId: storage.getItem("provincial_reviewer_id_p5") || "",
    memoranda: storage.getItem("memoranda_p5") || "",
  };
}

export function parseJsonObject(value: unknown): JsonObject {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return isJsonObject(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  return isJsonObject(value) ? value : {};
}

export function normalizePsgcCode(code: string | null | undefined) {
  return code?.length === 10 ? code.slice(0, 2) + code.slice(3) : (code ?? null);
}

export function asString(value: unknown, fallback = "") {
  return value != null ? String(value) : fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  const parsed = parseFloat(String(value ?? fallback));
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function asNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.map(item => asNumber(item, 0)) : [];
}

export function parseNumberRecord(value: unknown): Record<string, number> {
  if (!isJsonObject(value)) return {};

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, asNumber(item, 0)]),
  );
}

export function asBooleanGrid(value: unknown): boolean[][] {
  return Array.isArray(value) ? value as boolean[][] : [];
}

export function getAddressParts({
  rawAddress,
  provinceCode,
  municipalityCode,
  barangayCode,
}: {
  rawAddress: unknown;
  provinceCode: string | null | undefined;
  municipalityCode: string | null | undefined;
  barangayCode: string | null | undefined;
}) {
  const address = asString(rawAddress);

  return {
    province: address ? "" : getLocationName(normalizePsgcCode(provinceCode), DUMMY_PROVINCES),
    municipality: address ? "" : getLocationName(normalizePsgcCode(municipalityCode), DUMMY_MUNICIPALITIES),
    barangay: address || getLocationName(normalizePsgcCode(barangayCode), DUMMY_BARANGAYS),
  };
}

export function getPropertyLocationParts({
  province,
  municipality,
  barangay,
  provinceCode,
  municipalityCode,
  barangayCode,
}: {
  province: unknown;
  municipality: unknown;
  barangay: unknown;
  provinceCode: string | null | undefined;
  municipalityCode: string | null | undefined;
  barangayCode: string | null | undefined;
}) {
  return {
    province: asString(province) || getLocationName(normalizePsgcCode(provinceCode), DUMMY_PROVINCES) || "Mountain Province",
    municipality: asString(municipality) || getLocationName(normalizePsgcCode(municipalityCode), DUMMY_MUNICIPALITIES),
    barangay: asString(barangay) || getLocationName(normalizePsgcCode(barangayCode), DUMMY_BARANGAYS),
  };
}

export function getRoofMaterialData(value: unknown): JsonObject {
  const parsed = parseJsonObject(value);
  return isJsonObject(parsed.data) ? parsed.data : parsed;
}

export function getRoofMaterials(value: unknown): RoofMaterials {
  return {
    ...DEFAULT_ROOF_MATERIALS,
    ...getRoofMaterialData(value),
  };
}

export function hasAnyRoofMaterial(value: unknown) {
  return isJsonObject(value) && Object.values(value).some(Boolean);
}

export function calculateAdditionalTotals({
  unitCost,
  percentageChoice,
  percentageAreas,
  flatRateChoice,
  flatRateAreas,
}: {
  unitCost: number;
  percentageChoice: string;
  percentageAreas: number[];
  flatRateChoice: string;
  flatRateAreas: number[];
}) {
  const percentageIds = percentageChoice.split(",").filter(Boolean);
  const percentageTotal = percentageIds.reduce((total, id, index) => {
    const option = ADDITIONAL_PERCENT_CHOICES.find(choice => String(choice.id) === id);
    const area = percentageAreas[index] || 0;
    return option ? total + ((unitCost * option.percentage) / 100) * area : total;
  }, 0);

  const flatRateIds = flatRateChoice.split(",").filter(Boolean);
  const flatRateTotal = flatRateIds.reduce((total, id, index) => {
    const option = ADDITIONAL_FLAT_RATE_CHOICES.find(choice => String(choice.id) === id);
    const area = flatRateAreas[index] || 0;
    return option ? total + option.pricePerSqm * area : total;
  }, 0);

  return { percentageTotal, flatRateTotal };
}

export function calculateStandardDeductionTotal({
  selectedDeductions,
  deductionAmounts,
  baseCost,
}: {
  selectedDeductions: string[];
  deductionAmounts: Record<string, number>;
  baseCost: number;
}) {
  return selectedDeductions.reduce((total, id) => {
    const stored = deductionAmounts[id];
    if (stored !== undefined) return total + stored;

    const option = DEDUCTION_CHOICES.find(choice => choice.id === id);
    if (!option) return total;
    if ("percentage" in option) return total + (baseCost * option.percentage) / 100;
    return total;
  }, 0);
}

export function formatAssessmentLevel(value: unknown, fallback = "20") {
  const raw = value != null ? String(value) : fallback;
  return raw.includes("%") ? raw : `${raw}%`;
}

function parseStoredBooleanGrid(value: string | null): boolean[][] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
