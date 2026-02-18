// Selections for building structure step 4 (moved from page.tsx)
export const DEDUCTION_CHOICES = [
  { id: "no_plumbing", name: "No Plumbing", percentage: 3 },
  { id: "no_electrical", name: "No Electrical", percentage: 3 },
  { id: "no_paint", name: "No Paint", percentage: 6 },
  { id: "no_ceiling", name: "No Ceiling", percentage: 7 },
  { id: "no_partition", name: "No Partition", percentage: 5 },
  { id: "no_cement_plaster_inside", name: "No Cement Plaster Inside", percentage: 3 },
  { id: "no_cement_plaster_outside", name: "No Cement Plaster Outside", percentage: 3 },
  { id: "second_hand_material_used", name: "Second Hand Material Used", percentage: 10 },
];

export const ADDITIONAL_PERCENT_CHOICES = [
  { id: "carport", name: "Carport", percentage: 70 },
  { id: "mezzanine", name: "Mezzanine", percentage: 60 },
  { id: "porch", name: "Porch", percentage: 40 },
  { id: "balcony", name: "Balcony", percentage: 45 },
  { id: "garage", name: "Garage", percentage: 45 },
  { id: "terrace_covered", name: "Terrace (Covered)", percentage: 35 },
  { id: "terrace_open", name: "Terrace (Open)", percentage: 20 },
  { id: "roof_deck_open", name: "Roof Deck (Open)", percentage: 20 },
  { id: "roof_deck_covered", name: "Roof Deck (Covered - No Sidings)", percentage: 30 },
  { id: "basement_residential", name: "Basement (Residential)", percentage: 60 },
  { id: "basement_high_rise", name: "Basement (High Rise Building Plus)", percentage: 20 },
];

export const ADDITIONAL_FLAT_RATE_CHOICES = [
  { id: "pavement_tennis_court", name: "Pavement: Tennis Court", pricePerSqm: 450 },
  { id: "pavement_concrete_10cm", name: "Concrete Pavement (10cm thick)", pricePerSqm: 450 },
  { id: "pavement_concrete_15cm", name: "Concrete Pavement (15cm thick)", pricePerSqm: 600 },
  { id: "pavement_concrete_20cm", name: "Concrete Pavement (20cm thick)", pricePerSqm: 700 },
  { id: "floor_marble_tiles", name: "Floor: Marble Tiles", pricePerSqm: 500 },
  { id: "floor_narra", name: "Floor: Narra", pricePerSqm: 400 },
  { id: "floor_fancy_wood", name: "Floor: Fancy Wood Tiles", pricePerSqm: 300 },
  { id: "floor_ordinary_wood", name: "Floor: Ordinary Wood Tiles", pricePerSqm: 200 },
  { id: "floor_washout_pebbles", name: "Floor: Washout Pebbles", pricePerSqm: 200 },
  { id: "floor_granite", name: "Floor: Granite", pricePerSqm: 600 },
  { id: "floor_crazy_cut_marble", name: "Floor: Crazy Cut Marble", pricePerSqm: 400 },
  { id: "floor_vinyl_tiles", name: "Floor: Vinyl Tiles", pricePerSqm: 100 },
];
// config/form-options.ts

export const BUILDING_TYPES = [
  { id: "building_type_1", label: "Residential Houses" },
  { id: "building_type_2", label: "Apartment Row Houses" },
  {
    id: "building_type_3",
    label: "Boarding House, Lodging House, Hotels, Inns, Motels, Restaurant",
  },
  {
    id: "building_type_4",
    label:
      "Accessory Garage, Green House, Laundry House, Gasoline Station, Swimming Pool, Bath House",
  },
  { id: "building_type_5", label: "School Buildings" },
  {
    id: "building_type_6",
    label: "Hospital Office Buildings, Banta, Condominiums, Super Markets, Shopping Malls",
  },
  {
    id: "building_type_7",
    label: "Church Chapels, Assembly House, Theaters, Funeral Parlor",
  },
  {
    id: "building_type_8",
    label: "Factory Wave House, Bodega, Storage, Rice Mill, Shop, Bakery Shop",
  },
  { id: "building_type_9", label: "Open Market" },
  { id: "building_type_10", label: "Open Gym" },
];

export const STRUCTURAL_TYPES = [
  "Type V-A",
  "Type V-B",
  "Type IV-A",
  "Type IV-B",
  "Type IV-C",
  "Type III-A",
  "Type III-B",
  "Type III-C",
  "Type II-A",
  "Type II-B",
  "Type I",
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
