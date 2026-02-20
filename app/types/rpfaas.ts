export interface Location {
    code: string;
    name: string;
}

export interface Municipality extends Location {
    provinceCode: string;
}

export interface Barangay extends Location {
    municipalityCode: string;
}

export interface RoofMaterials {
    reinforcedConcrete: boolean;
    longspanRoof: boolean;
    tiles: boolean;
    giSheets: boolean;
    aluminum: boolean;
    others: boolean;
}

export interface RPFAASFormData {
    // Owner Info
    ownerName: string;
    adminCareOfName: string;
    
    // Owner Address
    ownerAddressBarangay: string;
    ownerAddressMunicipality: string;
    ownerAddressProvince: string;
    
    // Admin Address
    adminBarangayName: string;
    adminMunicipalityName: string;
    adminProvinceName: string;
    
    // Property Location
    locationStreet: string;
    locationMunicipality: string;
    locationBarangay: string;
    locationProvince: string;
    
    // Building Info
    typeOfBuilding: string;
    structuralType: string;
    buildingPermitNo: string;
    cct: string;
    completionIssuedOn: string;
    dateConstructed: string;
    dateOccupied: string;
    buildingAge: string;
    numberOfStoreys: string;
    floorAreas: string[];
    totalFloorArea: string;
    
    // Land Info
    landOwner: string;
    landTdArpNo: string;
    landArea: string;
    
    // Structural Materials
    roofMaterials: RoofMaterials;
    roofMaterialsOtherText: string;
    flooringGrid: boolean[][];
    wallsGrid: boolean[][];
    
    // Deductions from Step 4
    selectedDeductions: string[];
    deductionComments: string;
    
    // Additional items from Step 4
    additionalPercentageChoice: string;
    additionalPercentageValue: number;
    additionalPercentageAreas: number[];
    additionalFlatRateChoice: string;
    additionalFlatRateValue: number;
    additionalFlatRateAreas: number[];
    
    // Financial calculations from Step 4
    unitCost: number;
    baseCost: number;
    standardDeductionTotal: number;
    netUnitCost: number;
    marketValue: number;
    
    // Assessment calculations
    assessmentLevel: string;
    assessedValue: number;
}
