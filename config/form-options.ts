// config/form-options.ts

export const BUILDING_TYPES = [
  "Residential Houses",
  "Apartment Row Houses",
  "boarding house, lodging house, hotels, inns, motels, restaurant",
  "Institutional",
  "School Buildings",
  "Open Market",
  "Open Gym",
];

export const STRUCTURAL_TYPES = [
  "Type V-A",
  "Type V-B",
  "Type IV-A",
  "Type IV-B",
  "Type IV-C",
  "III-A",
  "III-B",
  "III-C",
  "II-A",
  "II-B",
];

export const DEDUCTION_OPTIONS = [
  {
    heading: "Depreciation Category",
    options: [
      { value: "no_plumbing", label: "No Plumbing", percent: 3 },
      { value: "no_electrical", label: "No Electrical", percent: 3 },
      { value: "no_paint", label: "No Paint", percent: 6 },
      { value: "no_ceiling", label: "No Ceiling", percent: 7 },
      { value: "no_partition", label: "No Partition", percent: 0 },
      { value: "no_cement_plaster_inside", label: "No Cement Plaster Inside", percent: 0 },
      { value: "no_cement_plaster_outside", label: "No Cement Plaster Outside", percent: 0 },
      { value: "second_hand_material_used", label: "Second Hand material used", percent: 0 },
    ],
  },
];
// export const AdditionalTableOptions =

export const BUILDING_MATERIALS = {
  reinforcedConcrete: "Reinforced Concrete",
  longspanRoof: "Longspan Roof",
  tiles: "Tiles",
  giSheets: "GI Sheets",
  aluminum: "Aluminum",
  others: "Others",
};

export const FLOORING_MATERIALS = [
  "Concrete",
  "Plain Cement",
  "Marble",
  "Wood",
  "Tiles",
  "Other",
];

export const WALLS_MATERIALS = [
  "Concrete",
  "Brick",
  "Wood",
  "Metal",
  "Other",
];

export const FORM_CONSTANTS = {
  GRID_DIMENSIONS: {
    FLOORING: { ROWS: 6, COLS: 4 },
    WALLS: { ROWS: 5, COLS: 4 },
    SELECTION: { ROWS: 5, COLS: 4 },
  },
  FORM_NAMES: {
    BUILDING_STRUCTURE_STEP_4: "building-structure-form-fill-page-4",
  },
  API_ENDPOINTS: {
    BUILDING_STRUCTURE: "/api/building-structure",
  },
};

export const MULTI_SELECT_OPTIONS = [
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Option E",
  "Option F",
  "Option G",
  "Option H",
];
