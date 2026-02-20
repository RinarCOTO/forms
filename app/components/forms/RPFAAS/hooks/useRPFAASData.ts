import { useState, useEffect, useCallback } from 'react';
import type { RPFAASFormData, RoofMaterials } from "@/app/types/rpfaas";
import { getLocationName } from "../utils/locationHelpers";
import { DUMMY_PROVINCES, DUMMY_MUNICIPALITIES, DUMMY_BARANGAYS } from "../constants/locations";
import { DEDUCTION_CHOICES } from "@/config/form-options";

export const useRPFAASData = () => {
    const [formData, setFormData] = useState<RPFAASFormData>({
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
        landTdArpNo: "",
        landArea: "",
        roofMaterials: {
            reinforcedConcrete: false,
            longspanRoof: false,
            tiles: false,
            giSheets: false,
            aluminum: false,
            others: false,
        },
        roofMaterialsOtherText: "",
        flooringGrid: [],
        wallsGrid: [],
        selectedDeductions: [],
        deductionComments: "",
        // Additional items
        additionalPercentageChoice: "",
        additionalPercentageValue: 0,
        additionalPercentageAreas: [],
        additionalFlatRateChoice: "",
        additionalFlatRateValue: 0,
        additionalFlatRateAreas: [],
        // Financial calculations
        unitCost: 0,
        baseCost: 0,
        standardDeductionTotal: 0,
        netUnitCost: 0,
        marketValue: 0,
        
        // Assessment calculations
        assessmentLevel: "20%",
        assessedValue: 0,
    });

    const loadDataFromStorage = useCallback(() => {
        try {
            // Debug: Log all localStorage keys for RPFAAS
            console.log('localStorage data check:');
            console.log('rpfaas_owner_name:', localStorage.getItem("rpfaas_owner_name"));
            console.log('p2 data:', localStorage.getItem("p2"));
            console.log('p3 data:', localStorage.getItem("p3"));
            
            // Direct Strings from Step 1
            const ownerName = localStorage.getItem("rpfaas_owner_name") || "";
            const adminCareOfName = localStorage.getItem("rpfaas_admin_careof") || "";
            const locationStreet = localStorage.getItem("rpfaas_location_street") || "";

            // Owner Address (Convert Code -> Name)
            const oProvCode = localStorage.getItem("rpfaas_owner_address_province_code");
            const oMunCode = localStorage.getItem("rpfaas_owner_address_municipality_code");
            const oBarCode = localStorage.getItem("rpfaas_owner_address_barangay_code");
            
            const ownerAddressProvince = getLocationName(oProvCode, DUMMY_PROVINCES);
            const ownerAddressMunicipality = getLocationName(oMunCode, DUMMY_MUNICIPALITIES);
            const ownerAddressBarangay = getLocationName(oBarCode, DUMMY_BARANGAYS);

            // Admin Address (Convert Code -> Name)
            const aProvCode = localStorage.getItem("rpfaas_admin_province_code");
            const aMunCode = localStorage.getItem("rpfaas_admin_municipality_code");
            const aBarCode = localStorage.getItem("rpfaas_admin_barangay_code");

            const adminProvinceName = getLocationName(aProvCode, DUMMY_PROVINCES);
            const adminMunicipalityName = getLocationName(aMunCode, DUMMY_MUNICIPALITIES);
            const adminBarangayName = getLocationName(aBarCode, DUMMY_BARANGAYS);

            // Property Location (Convert Code -> Name)
            const lProvCode = localStorage.getItem("rpfaas_location_province_code");
            const lMunCode = localStorage.getItem("rpfaas_location_municipality_code");
            const lBarCode = localStorage.getItem("rpfaas_location_barangay_code");

            const locationProvince = getLocationName(lProvCode, DUMMY_PROVINCES);
            const locationMunicipality = getLocationName(lMunCode, DUMMY_MUNICIPALITIES);
            const locationBarangay = getLocationName(lBarCode, DUMMY_BARANGAYS);

            // Data from Step 2 (stored as JSON object under 'p2' key)
            const p2Data = localStorage.getItem("p2");
            let step2Data: any = {};
            if (p2Data) {
                try {
                    step2Data = JSON.parse(p2Data);
                } catch (e) {
                    console.error("Error parsing p2 data:", e);
                }
            }

            const typeOfBuilding = step2Data.type_of_building || "";
            const structuralType = step2Data.structure_type || "";
            const buildingPermitNo = step2Data.building_permit_no || "";
            const cct = step2Data.cct || "";
            const completionIssuedOn = step2Data.completion_issued_on || "";
            const dateConstructed = step2Data.date_constructed || "";
            const dateOccupied = step2Data.date_occupied || "";
            const buildingAge = step2Data.building_age || "";
            const numberOfStoreys = step2Data.number_of_storeys || "";
            const floorAreas = step2Data.floor_areas || [];
            const totalFloorArea = step2Data.total_floor_area || "";
            const landOwner = step2Data.land_owner || "";
            const landTdArpNo = step2Data.td_arp_no || "";
            const landArea = step2Data.land_area || "";

            // Data from Step 3 (stored as JSON object under 'p3' key)
            const p3Data = localStorage.getItem("p3");
            let step3Data: any = {};
            if (p3Data) {
                try {
                    step3Data = JSON.parse(p3Data);
                } catch (e) {
                    console.error("Error parsing p3 data:", e);
                }
            }

            let roofMaterials: RoofMaterials = {
                reinforcedConcrete: false,
                longspanRoof: false,
                tiles: false,
                giSheets: false,
                aluminum: false,
                others: false,
            };
            if (step3Data.roof_materials) {
                roofMaterials = step3Data.roof_materials;
            }
            
            const roofMaterialsOtherText = step3Data.roof_materials_other_text || "";
            
            let flooringGrid: boolean[][] = [];
            if (step3Data.flooring_grid) {
                flooringGrid = step3Data.flooring_grid;
            }
            
            let wallsGrid: boolean[][] = [];
            if (step3Data.walls_grid) {
                wallsGrid = step3Data.walls_grid;
            }

            // Data from Step 4 (stored as JSON object under 'p4' key)
            const p4Data = localStorage.getItem("p4");
            let step4Data: any = {};
            if (p4Data) {
                try {
                    step4Data = JSON.parse(p4Data);
                } catch (e) {
                    console.error("Error parsing p4 data:", e);
                }
            }

            // If no p4 localStorage data exists, try to get it from the URL draft ID or check for existing database entry
            if (!p4Data && window.location.search.includes('id=')) {
                const urlParams = new URLSearchParams(window.location.search);
                const draftId = urlParams.get('id');
                console.log("No p4 localStorage found, checking database for draft ID:", draftId);
                
                // In a real app, you'd fetch from API here
                // For now, just log that we need to get this data
                console.warn("Missing p4 localStorage data. Please go back to Step 4 and save again, or this data needs to be restored from the database.");
            }

            const selectedDeductions = step4Data.selected_deductions || [];
            const deductionComments = step4Data.overall_comments || "";

            // Additional items data from step 4
            const additionalPercentageChoice = step4Data.additional_percentage_choice || "";
            const additionalPercentageValue = step4Data.additional_percentage_value || 0;
            const additionalPercentageAreas = step4Data.additional_percentage_areas || [];
            const additionalFlatRateChoice = step4Data.additional_flat_rate_choice || "";
            const additionalFlatRateValue = step4Data.additional_flat_rate_value || 0;
            const additionalFlatRateAreas = step4Data.additional_flat_rate_areas || [];

            // Get calculated values from step-4
            const marketValue = localStorage.getItem("market_value_p4");
            const unitCostFromStorage = localStorage.getItem("unit_cost_p2");
            
            // Get assessment level from step-6, database, or default
            let assessmentLevelValue = "20%";
            let assessedValueFromStorage = 0;
            
            // Try localStorage first (from step-6)
            const assessmentLevelFromStorage = localStorage.getItem("assessment_level_p5");
            if (assessmentLevelFromStorage) {
                assessmentLevelValue = assessmentLevelFromStorage.includes('%') ? assessmentLevelFromStorage : `${assessmentLevelFromStorage}%`;
            }
            
            // Get assessed value from step-6
            const assessedValueStorageItem = localStorage.getItem("assessed_value_p5");
            if (assessedValueStorageItem) {
                assessedValueFromStorage = parseFloat(assessedValueStorageItem);
            }
            
            // Calculate financial summary similar to step-4
            const baseCost = unitCostFromStorage && step2Data.total_floor_area 
                ? parseFloat(unitCostFromStorage) * parseFloat(step2Data.total_floor_area) 
                : 0;

            // Calculate deduction total
            const standardDeductionTotal = selectedDeductions.reduce<number>((acc, deductionId) => {
                const deduction = DEDUCTION_CHOICES.find(d => d.id === deductionId);
                if (deduction && deduction.percentage) {
                    return acc + (baseCost * deduction.percentage) / 100;
                }
                return acc;
            }, 0);

            const netUnitCost = baseCost - standardDeductionTotal;

            setFormData({
                ownerName,
                adminCareOfName,
                ownerAddressBarangay,
                ownerAddressMunicipality,
                ownerAddressProvince,
                adminBarangayName,
                adminMunicipalityName,
                adminProvinceName,
                locationStreet,
                locationMunicipality,
                locationBarangay,
                locationProvince,
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
                landTdArpNo,
                landArea,
                roofMaterials,
                roofMaterialsOtherText,
                flooringGrid,
                wallsGrid,
                selectedDeductions,
                deductionComments,
                // Additional items data
                additionalPercentageChoice,
                additionalPercentageValue,
                additionalPercentageAreas,
                additionalFlatRateChoice,
                additionalFlatRateValue,
                additionalFlatRateAreas,
                // Financial calculations
                unitCost: parseFloat(unitCostFromStorage || "0"),
                baseCost,
                standardDeductionTotal,
                netUnitCost,
                marketValue: parseFloat(marketValue || "0"),
                
                // Assessment calculations
                assessmentLevel: assessmentLevelValue,
                assessedValue: assessedValueFromStorage,
            });
        } catch (e) {
            console.error("Error loading RPFAAS data", e);
        }
    }, []);

    useEffect(() => {
        // Initial load
        loadDataFromStorage();

        // Listen for updates (in case user modifies data in another tab/window)
        const onStorage = () => loadDataFromStorage();
        window.addEventListener("storage", onStorage);
        
        return () => window.removeEventListener("storage", onStorage);
    }, [loadDataFromStorage]);

    return formData;
};
