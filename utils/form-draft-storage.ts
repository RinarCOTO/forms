type DraftStorage = Pick<Storage, "length" | "key" | "getItem">;
type WritableDraftStorage = Pick<Storage, "setItem" | "removeItem">;
type ClearableDraftStorage = Pick<Storage, "length" | "key" | "removeItem">;

const STEP_FIELD_SUFFIX = /_p[1-6]$/;
export type FaasDraftFormType = "building" | "land" | "machinery";

const FAAS_DRAFT_ID_KEYS: Record<FaasDraftFormType, string> = {
  building: "building_draft_id",
  land: "land_draft_id",
  machinery: "machinery_draft_id",
};

const LEGACY_DRAFT_ID_KEY = "draft_id";

const DEFAULT_SKIP_KEYS = new Set([
  "id",
  "created_at",
  "updated_at",
  "unit_cost",
  // localStorage alias for estimated_value; step 6 saves estimated_value directly.
  "assessed_value",
]);

interface CollectDraftFieldsOptions {
  skipKeys?: Set<string>;
  parseJsonFieldNames?: string[];
}

export function collectStepDraftFields(
  storage: DraftStorage,
  {
    skipKeys = DEFAULT_SKIP_KEYS,
    parseJsonFieldNames = ["flooring_material", "wall_material"],
  }: CollectDraftFieldsOptions = {}
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (!key || !STEP_FIELD_SUFFIX.test(key)) continue;

    const value = storage.getItem(key);
    if (!value) continue;

    // Whole-step persistence blobs are stored separately and are not DB columns.
    if (value.trimStart().startsWith("{")) continue;

    const fieldName = key.replace(STEP_FIELD_SUFFIX, "");
    if (skipKeys.has(fieldName)) continue;

    if (parseJsonFieldNames.some((name) => fieldName.includes(name))) {
      try {
        data[fieldName] = JSON.parse(value);
      } catch {
        data[fieldName] = value;
      }
    } else {
      data[fieldName] = value;
    }
  }

  return data;
}

export function getFaasDraftIdStorageKey(formType: FaasDraftFormType) {
  return FAAS_DRAFT_ID_KEYS[formType];
}

export function getStoredFaasDraftId(
  storage: Pick<Storage, "getItem">,
  formType: FaasDraftFormType
) {
  return storage.getItem(FAAS_DRAFT_ID_KEYS[formType]) || storage.getItem(LEGACY_DRAFT_ID_KEY);
}

export function setStoredFaasDraftId(
  storage: WritableDraftStorage,
  formType: FaasDraftFormType,
  draftId: string
) {
  storage.setItem(FAAS_DRAFT_ID_KEYS[formType], draftId);

  // Keep the legacy key during the namespacing transition because older step
  // pages still fall back to draft_id while this cleanup is being phased in.
  if (formType !== "land") {
    storage.setItem(LEGACY_DRAFT_ID_KEY, draftId);
  }
}

export function removeStoredFaasDraftId(
  storage: Pick<Storage, "removeItem">,
  formType: FaasDraftFormType
) {
  storage.removeItem(FAAS_DRAFT_ID_KEYS[formType]);
  if (formType !== "land") storage.removeItem(LEGACY_DRAFT_ID_KEY);
}

export function mergeStorageFallbackFields<T extends Record<string, unknown>>(
  baseData: T,
  storage: DraftStorage,
  fields: string[],
  suffix: string
): T {
  const merged = { ...baseData };

  fields.forEach((field) => {
    if (merged[field] !== undefined) return;
    const value = storage.getItem(`${field}${suffix}`);
    if (value) merged[field as keyof T] = value as T[keyof T];
  });

  return merged;
}

const LAND_PREVIEW_STEP_1_FALLBACK_FIELDS = [
  "pin",
  "arp_no",
  "transaction_code",
  "oct_tct_cloa_no",
  "survey_no",
  "lot_no",
  "blk",
  "owner_name",
  "owner_address",
  "admin_care_of",
  "admin_address",
  "property_address",
  "location_province",
  "location_municipality",
  "location_barangay",
];

const BUILDING_STRUCTURE_DRAFT_KEYS = new Set([
  "building_draft_id",
  "draft_id",
  "p2",
  "p3",
  "p4",
  "roofing_material_json",
  "roofing_material_other_text",
  "flooring_material_json",
  "wall_material_json",
]);

const LAND_IMPROVEMENT_DRAFT_KEYS = new Set([
  "land_draft_id",
  "land_p4",
  "draft_id",
]);

const MACHINERY_DRAFT_KEYS = new Set([
  "machinery_draft_id",
  "draft_id",
]);

export function mergeLandPreviewStorageFallbacks<T extends Record<string, unknown>>(
  baseData: T,
  storage: DraftStorage
): T {
  return mergeStorageFallbackFields(
    baseData,
    storage,
    LAND_PREVIEW_STEP_1_FALLBACK_FIELDS,
    "_p1"
  );
}

function removeMatchingStorageKeys(
  storage: ClearableDraftStorage,
  shouldRemove: (key: string) => boolean
) {
  const keys: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && shouldRemove(key)) keys.push(key);
  }

  keys.forEach((key) => storage.removeItem(key));
}

export function clearBuildingStructureDraftStorage(storage: ClearableDraftStorage) {
  removeMatchingStorageKeys(storage, (key) => (
    BUILDING_STRUCTURE_DRAFT_KEYS.has(key) ||
    key.startsWith("rpfaas_") ||
    STEP_FIELD_SUFFIX.test(key)
  ));
}

export function clearLandImprovementDraftStorage(storage: ClearableDraftStorage) {
  removeMatchingStorageKeys(storage, (key) => (
    LAND_IMPROVEMENT_DRAFT_KEYS.has(key) ||
    key.startsWith("land_") ||
    LAND_PREVIEW_STEP_1_FALLBACK_FIELDS.some((field) => key === `${field}_p1`)
  ));
}

export function clearMachineryDraftStorage(storage: ClearableDraftStorage) {
  removeMatchingStorageKeys(storage, (key) => (
    MACHINERY_DRAFT_KEYS.has(key) ||
    key.startsWith("rpfaas_") ||
    STEP_FIELD_SUFFIX.test(key)
  ));
}

type DraftRecord = Record<string, unknown>;

function toStorageString(value: unknown): string | null | undefined {
  if (value == null || value === "") return value as null | undefined | "";
  return String(value);
}

function setStorageValue(
  storage: WritableDraftStorage,
  key: string,
  value: string | null | undefined
) {
  if (value == null || value === "") {
    storage.removeItem(key);
  } else {
    storage.setItem(key, value);
  }
}

function parseStoredJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === "object") return value as Record<string, unknown>;
  return {};
}

export function seedBuildingStructureDraftStorage(
  storage: WritableDraftStorage,
  record: DraftRecord,
  draftId: string
) {
  const set = (key: string, value: unknown) =>
    setStorageValue(storage, key, toStorageString(value));

  storage.removeItem("roofing_material_json");
  storage.removeItem("roofing_material_other_text");
  storage.removeItem("flooring_material_json");
  storage.removeItem("wall_material_json");

  set("rpfaas_transaction_code", record.transaction_code);
  set("rpfaas_arp_no", record.arp_no);
  set("rpfaas_pin", record.pin);
  set("rpfaas_survey_no", record.survey_no);
  set("rpfaas_lot_no", record.lot_no);
  set("rpfaas_blk", record.blk);

  if (record.oct_tct_cloa_no) {
    storage.setItem("rpfaas_title_type", String(record.oct_tct_cloa_no));
  } else {
    storage.removeItem("rpfaas_title_type");
  }
  storage.setItem("rpfaas_title_no", "");

  set("rpfaas_owner_name", record.owner_name);
  set("rpfaas_admin_careof", record.admin_care_of);
  set("rpfaas_location_street", record.property_address);
  set("rpfaas_owner_address_province_code", record.owner_province_code);
  set("rpfaas_owner_address_municipality_code", record.owner_municipality_code);
  set("rpfaas_owner_address_barangay_code", record.owner_barangay_code);
  set("rpfaas_owner_address", record.owner_address);
  set("rpfaas_admin_province_code", record.admin_province_code);
  set("rpfaas_admin_municipality_code", record.admin_municipality_code);
  set("rpfaas_admin_barangay_code", record.admin_barangay_code);
  set("rpfaas_admin_address", record.admin_address);
  set("rpfaas_location_province_code", record.property_province_code);
  set("rpfaas_location_municipality_code", record.property_municipality_code);
  set("rpfaas_location_municipality", record.location_municipality);
  set("rpfaas_location_barangay_code", record.property_barangay_code);
  set("rpfaas_location_barangay", record.location_barangay);
  set("rpfaas_location_province", record.location_province);

  storage.setItem("p2", JSON.stringify({
    type_of_building: record.type_of_building || "",
    structure_type: record.structure_type || "",
    building_permit_no: record.building_permit_no || "",
    cct: record.cct || "",
    completion_issued_on: record.completion_issued_on || "",
    date_constructed: record.date_constructed || "",
    date_occupied: record.date_occupied || "",
    building_age: record.building_age || "",
    number_of_storeys: record.number_of_storeys || "",
    floor_areas: record.floor_areas || [],
    total_floor_area: record.total_floor_area || "",
    land_owner: record.land_owner || "",
    land_td_no: record.land_td_no || record.td_arp_no || "",
    land_arp_no: record.land_arp_no || "",
    td_arp_no: record.td_arp_no || "",
    land_area: record.land_area || "",
  }));
  if (record.cost_of_construction != null) set("unit_cost_p2", String(record.cost_of_construction));

  const roofingMaterial = parseStoredJsonObject(record.roofing_material);
  const flooringMaterial = parseStoredJsonObject(record.flooring_material);
  const wallMaterial = parseStoredJsonObject(record.wall_material);
  storage.setItem("p3", JSON.stringify({
    roof_materials: roofingMaterial.data || {},
    roof_materials_other_text: roofingMaterial.otherText || "",
    flooring_grid: flooringMaterial.grid || [],
    walls_grid: wallMaterial.grid || [],
  }));

  storage.setItem("p4", JSON.stringify({
    selected_deductions: record.selected_deductions || [],
    deduction_amounts: record.deduction_amounts || {},
    overall_comments: record.overall_comments || "",
    additional_percentage_choice: record.additional_percentage_choice || "",
    additional_percentage_areas: record.additional_percentage_areas || [],
    additional_flat_rate_choice: record.additional_flat_rate_choice || "",
    additional_flat_rate_areas: record.additional_flat_rate_areas || [],
    market_value: record.market_value,
  }));
  if (record.market_value != null) set("market_value_p4", String(record.market_value));

  set("amount_in_words_p5", record.amount_in_words);
  set("assessment_level_p5", record.assessment_level);
  if (record.estimated_value != null) set("estimated_value_p5", String(record.estimated_value));
  set("actual_use_p5", record.actual_use);
  if (record.effectivity_of_assessment != null) {
    set("effectivity_of_assessment_p5", String(record.effectivity_of_assessment));
  }
  set("appraised_by_p5", record.appraised_by);
  set("municipal_reviewer_id_p5", record.municipal_reviewer_id);
  set("provincial_reviewer_id_p5", record.provincial_reviewer_id);
  set("tax_status_p5", record.tax_status);
  set("memoranda_p5", record.memoranda);

  storage.setItem("draft_id", draftId);
}
