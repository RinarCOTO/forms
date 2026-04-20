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
    // Property Identification
    transactionCode: string;
    arpNo: string;
    octTctCloaNo: string;
    pin: string;
    surveyNo: string;
    lotNo: string;
    blk: string | number;
    previousTdNo: string;
    previousOwner: string;
    previousAv: string;
    previousMv: string;
    previousArea: string;

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
    deductionAmounts: Record<string, number>;
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
    physicalDepreciationPct: number;
    depreciationAmount: number;
    baseCost: number;
    standardDeductionTotal: number;
    netUnitCost: number;
    marketValue: number;
    
    // Assessment calculations
    taxStatus: string;
    actualUse: string;
    assessmentLevel: string;
    assessedValue: number;
    amountInWords: string;
    effectivityOfAssessment: string;
    appraisedById: string;
    municipalReviewerId: string;
    provincialReviewerId: string;
    memoranda: string;
}
