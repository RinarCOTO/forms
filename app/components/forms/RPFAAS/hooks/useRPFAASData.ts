import { useState, useEffect, useCallback } from 'react';
import type { RPFAASFormData, RoofMaterials } from "@/app/types/rpfaas";
import { getLocationName } from "../utils/locationHelpers";
import { DUMMY_PROVINCES, DUMMY_MUNICIPALITIES, DUMMY_BARANGAYS } from "../constants/locations";
import { DEDUCTION_CHOICES, ADDITIONAL_PERCENT_CHOICES, ADDITIONAL_FLAT_RATE_CHOICES } from "@/config/form-options";
import { getBuildingDepreciationRate } from "@/config/depreciation-table";

export const useRPFAASData = (serverData?: Record<string, any>) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [formData, setFormData] = useState<RPFAASFormData>({
        transactionCode: "",
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
        deductionAmounts: {},
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
        physicalDepreciationPct: 0,
        depreciationAmount: 0,
        baseCost: 0,
        standardDeductionTotal: 0,
        netUnitCost: 0,
        marketValue: 0,
        
        // Assessment calculations
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
    });

    const loadDataFromServer = useCallback((d: Record<string, any>) => {
        try {
            const parse = (v: any) => {
                if (!v) return {};
                if (typeof v === 'string') { try { return JSON.parse(v); } catch { return {}; } }
                return v;
            };
            const norm = (code: string | null | undefined) =>
                code?.length === 10 ? code.slice(0, 2) + code.slice(3) : (code ?? null);

            const oProvCode = norm(d.owner_province_code);
            const oMunCode  = norm(d.owner_municipality_code);
            const oBarCode  = norm(d.owner_barangay_code);
            const ownerAddressProvince    = d.owner_address ? "" : getLocationName(oProvCode, DUMMY_PROVINCES);
            const ownerAddressMunicipality = d.owner_address ? "" : getLocationName(oMunCode, DUMMY_MUNICIPALITIES);
            const ownerAddressBarangay    = d.owner_address || getLocationName(oBarCode, DUMMY_BARANGAYS);

            const aProvCode = norm(d.admin_province_code);
            const aMunCode  = norm(d.admin_municipality_code);
            const aBarCode  = norm(d.admin_barangay_code);
            const adminProvinceName    = d.admin_address ? "" : getLocationName(aProvCode, DUMMY_PROVINCES);
            const adminMunicipalityName = d.admin_address ? "" : getLocationName(aMunCode, DUMMY_MUNICIPALITIES);
            const adminBarangayName    = d.admin_address || getLocationName(aBarCode, DUMMY_BARANGAYS);

            const lProvCode = norm(d.property_province_code);
            const lMunCode  = norm(d.property_municipality_code);
            const lBarCode  = norm(d.property_barangay_code);
            const locationProvince    = d.location_province    || getLocationName(lProvCode, DUMMY_PROVINCES) || "Mountain Province";
            const locationMunicipality = d.location_municipality || getLocationName(lMunCode, DUMMY_MUNICIPALITIES);
            const locationBarangay    = d.location_barangay    || getLocationName(lBarCode, DUMMY_BARANGAYS);

            const rm = parse(d.roofing_material);
            const fm = parse(d.flooring_material);
            const wm = parse(d.wall_material);
            const rmData = (rm.data && typeof rm.data === 'object') ? rm.data : rm;
            const roofMaterials: RoofMaterials = {
                reinforcedConcrete: false, longspanRoof: false, tiles: false,
                giSheets: false, aluminum: false, others: false,
                ...rmData,
            };

            const unitCost   = parseFloat(String(d.cost_of_construction || 0));
            const physicalDepreciationPct = parseFloat(String(d.physical_depreciation_pct ?? 0));
            const totalFloorAreaNum = parseFloat(String(d.total_floor_area || 0));
            const totalFloorArea = String(d.total_floor_area || "");

            // Main cost = unit cost × floor area (no depreciation on unit cost)
            const mainCost = totalFloorAreaNum > 0 ? unitCost * totalFloorAreaNum : unitCost || 0;

            // Additions use original unit cost
            const addPctIds: string[] = (d.additional_percentage_choice || "").split(",").filter(Boolean);
            const addPctAreas: number[] = d.additional_percentage_areas || [];
            let additionalPercentTotal = 0;
            addPctIds.forEach((id: string, idx: number) => {
                const opt = ADDITIONAL_PERCENT_CHOICES.find((c: any) => String(c.id) === id);
                const area = addPctAreas[idx] || 0;
                if (opt && opt.percentage) additionalPercentTotal += ((unitCost * opt.percentage) / 100) * area;
            });

            const addFlatIds: string[] = (d.additional_flat_rate_choice || "").split(",").filter(Boolean);
            const addFlatAreas: number[] = d.additional_flat_rate_areas || [];
            let additionalFlatTotal = 0;
            addFlatIds.forEach((id: string, idx: number) => {
                const opt = ADDITIONAL_FLAT_RATE_CHOICES.find((c: any) => String(c.id) === id);
                const area = addFlatAreas[idx] || 0;
                if (opt && opt.pricePerSqm) additionalFlatTotal += opt.pricePerSqm * area;
            });

            // Total Reproduction Cost = main + all additions
            const baseCost = mainCost + additionalPercentTotal + additionalFlatTotal;

            // Depreciation applied to total reproduction cost
            const depreciationAmount = baseCost * physicalDepreciationPct / 100;

            const selectedDeductions: string[] = d.selected_deductions || [];
            const deductionAmounts: Record<string, number> = d.deduction_amounts || {};
            const standardDeductionTotal = selectedDeductions.reduce((acc: number, id: string) => {
                const stored = deductionAmounts[id];
                if (stored !== undefined) return acc + stored;
                const opt = DEDUCTION_CHOICES.find(c => c.id === id) as any;
                if (!opt) return acc;
                if (opt.percentage) return acc + (baseCost * opt.percentage) / 100;
                if (opt.pricePerSqm) return acc + opt.pricePerSqm * totalFloorAreaNum;
                return acc;
            }, 0);

            // Use nullish coalescing so assessment_level = 0 (meaning "0%") is not treated as missing
            const assessmentLevelRaw = d.assessment_level != null ? String(d.assessment_level) : '20';
            const assessmentLevel = assessmentLevelRaw.includes('%') ? assessmentLevelRaw : `${assessmentLevelRaw}%`;

            setFormData({
                transactionCode: d.transaction_code || "",
                arpNo:           d.arp_no || "",
                octTctCloaNo:    d.oct_tct_cloa_no && d.oct_tct_cloa_no !== 'None' ? d.oct_tct_cloa_no : "",
                pin:             d.pin || "",
                surveyNo:        d.survey_no || "",
                lotNo:           d.lot_no || "",
                blk:             d.blk || "",
                previousTdNo:    d.previous_td_no || "",
                previousOwner:   d.previous_owner || "",
                previousAv:      d.previous_av != null ? String(d.previous_av) : "",
                previousMv:      d.previous_mv != null ? String(d.previous_mv) : "",
                previousArea:    d.previous_area != null ? String(d.previous_area) : "",
                ownerName:       d.owner_name || "",
                adminCareOfName: d.admin_care_of || "",
                ownerAddressBarangay, ownerAddressMunicipality, ownerAddressProvince,
                adminBarangayName, adminMunicipalityName, adminProvinceName,
                locationStreet:      d.property_address || "",
                locationMunicipality, locationBarangay, locationProvince,
                typeOfBuilding:      d.type_of_building || "",
                structuralType:      d.structure_type || "",
                buildingPermitNo:    d.building_permit_no || "",
                cct:                 d.cct || "",
                completionIssuedOn:  d.completion_issued_on || "",
                dateConstructed:     d.date_constructed || "",
                dateOccupied:        d.date_occupied || "",
                buildingAge:         d.building_age || "",
                numberOfStoreys:     d.number_of_storeys || "",
                floorAreas:          d.floor_areas || [],
                totalFloorArea,
                landOwner:           d.land_owner || "",
                landTdArpNo:         d.td_arp_no || "",
                landArea:            d.land_area || "",
                roofMaterials,
                roofMaterialsOtherText: rm.otherText || "",
                flooringGrid:        fm.grid || [],
                wallsGrid:           wm.grid || [],
                selectedDeductions,
                deductionAmounts,
                deductionComments:   d.overall_comments || "",
                additionalPercentageChoice: d.additional_percentage_choice || "",
                additionalPercentageValue:  0,
                additionalPercentageAreas:  d.additional_percentage_areas || [],
                additionalFlatRateChoice:   d.additional_flat_rate_choice || "",
                additionalFlatRateValue:    0,
                additionalFlatRateAreas:    d.additional_flat_rate_areas || [],
                unitCost,
                physicalDepreciationPct,
                depreciationAmount,
                baseCost,
                standardDeductionTotal,
                netUnitCost: baseCost - standardDeductionTotal - depreciationAmount,
                marketValue:         parseFloat(String(d.market_value || 0)),
                actualUse:           d.actual_use || "",
                taxStatus:           d.tax_status || "taxable",
                assessmentLevel,
                assessedValue:       parseFloat(String(d.estimated_value || 0)),
                amountInWords:       d.amount_in_words || "",
                effectivityOfAssessment: d.effectivity_of_assessment || "",
                appraisedById:        d.appraised_by || "",
                submittedAt:          d.submitted_at || "",
                municipalSignedAt:    d.municipal_signed_at || "",
                provincialSignedAt:   d.provincial_signed_at || "",
                municipalReviewerId:  d.municipal_reviewer_id || "",
                provincialReviewerId: d.provincial_reviewer_id || "",
                memoranda:           d.memoranda || "",
            });
            setIsLoaded(true);
        } catch (e) {
            console.error("Error loading RPFAAS data from server", e);
        }
    }, []);

    const loadDataFromStorage = useCallback(() => {
        try {
            // Debug: Log all localStorage keys for RPFAAS
            console.log('localStorage data check:');
            console.log('rpfaas_owner_name:', localStorage.getItem("rpfaas_owner_name"));
            console.log('p2 data:', localStorage.getItem("p2"));
            console.log('p3 data:', localStorage.getItem("p3"));
            
            // Property Identification from Step 1
            const transactionCode = localStorage.getItem("rpfaas_transaction_code") || "";
            const arpNo = localStorage.getItem("rpfaas_arp_no") || "";
            const titleType = localStorage.getItem("rpfaas_title_type") || "";
            const titleNo = localStorage.getItem("rpfaas_title_no") || "";
            const octTctCloaNo = titleType && titleType !== 'None' ? `${titleType} ${titleNo}`.trim() : '';
            const pin = localStorage.getItem("rpfaas_pin") || "";
            const surveyNo = localStorage.getItem("rpfaas_survey_no") || "";
            const lotNo = localStorage.getItem("rpfaas_lot_no") || "";
            const blk = localStorage.getItem("rpfaas_blk") || "";
            const previousTdNo = localStorage.getItem("rpfaas_previous_td_no") || "";
            const previousOwner = localStorage.getItem("rpfaas_previous_owner") || "";
            const previousAv = localStorage.getItem("rpfaas_previous_av") || "";
            const previousMv = localStorage.getItem("rpfaas_previous_mv") || "";
            const previousArea = localStorage.getItem("rpfaas_previous_area") || "";

            // Direct Strings from Step 1
            const ownerName = localStorage.getItem("rpfaas_owner_name") || "";
            const adminCareOfName = localStorage.getItem("rpfaas_admin_careof") || "";
            const locationStreet = localStorage.getItem("rpfaas_location_street") || "";

            // Normalize 10-digit PSGC codes (from /api/locations) to 9-digit (used in DUMMY_* lists)
            // 10-digit pattern: insert a '0' at index 2 — e.g. 144402000 → 1404402000
            const norm = (code: string | null) =>
                code?.length === 10 ? code.slice(0, 2) + code.slice(3) : (code ?? null);

            // Owner Address — use pre-built string from DB if available, fall back to code lookup
            const ownerAddressRaw = localStorage.getItem("rpfaas_owner_address");
            const oProvCode = norm(localStorage.getItem("rpfaas_owner_address_province_code"));
            const oMunCode  = norm(localStorage.getItem("rpfaas_owner_address_municipality_code"));
            const oBarCode  = norm(localStorage.getItem("rpfaas_owner_address_barangay_code"));
            const ownerAddressProvince    = ownerAddressRaw ? "" : getLocationName(oProvCode, DUMMY_PROVINCES);
            const ownerAddressMunicipality = ownerAddressRaw ? "" : getLocationName(oMunCode, DUMMY_MUNICIPALITIES);
            const ownerAddressBarangay    = ownerAddressRaw || getLocationName(oBarCode, DUMMY_BARANGAYS);

            // Admin Address — use pre-built string from DB if available, fall back to code lookup
            const adminAddressRaw = localStorage.getItem("rpfaas_admin_address");
            const aProvCode = norm(localStorage.getItem("rpfaas_admin_province_code"));
            const aMunCode  = norm(localStorage.getItem("rpfaas_admin_municipality_code"));
            const aBarCode  = norm(localStorage.getItem("rpfaas_admin_barangay_code"));
            const adminProvinceName    = adminAddressRaw ? "" : getLocationName(aProvCode, DUMMY_PROVINCES);
            const adminMunicipalityName = adminAddressRaw ? "" : getLocationName(aMunCode, DUMMY_MUNICIPALITIES);
            const adminBarangayName    = adminAddressRaw || getLocationName(aBarCode, DUMMY_BARANGAYS);

            // Property Location — prefer stored names, fall back to normalized code lookup
            const lProvCode = norm(localStorage.getItem("rpfaas_location_province_code"));
            const lMunCode  = norm(localStorage.getItem("rpfaas_location_municipality_code"));
            const lBarCode  = norm(localStorage.getItem("rpfaas_location_barangay_code"));

            const locationProvince    = localStorage.getItem("rpfaas_location_province") || getLocationName(lProvCode, DUMMY_PROVINCES) || "Mountain Province";
            const locationMunicipality = localStorage.getItem("rpfaas_location_municipality") || getLocationName(lMunCode, DUMMY_MUNICIPALITIES);
            const locationBarangay    = localStorage.getItem("rpfaas_location_barangay") || getLocationName(lBarCode, DUMMY_BARANGAYS);

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
            // Falls back to the individual keys written by useFormPersistence in step-3
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

            // Helper: check if a roof object has at least one material checked
            const hasAnyRoof = (r: any) =>
                r && typeof r === 'object' && Object.values(r).some(Boolean);

            if (hasAnyRoof(step3Data.roof_materials)) {
                roofMaterials = { ...roofMaterials, ...step3Data.roof_materials };
            } else {
                // Fallback: read from step-3 useFormPersistence key (flat boolean map)
                const roofRaw = localStorage.getItem("roofing_material_json");
                if (roofRaw) {
                    try {
                        const parsed = JSON.parse(roofRaw);
                        // parsed may be the flat map directly, or wrapped in { data: ... }
                        const flatMap = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
                        roofMaterials = { ...roofMaterials, ...flatMap };
                    } catch {}
                }
            }
            
            const roofMaterialsOtherText = step3Data.roof_materials_other_text
                || localStorage.getItem("roofing_material_other_text")
                || "";
            
            let flooringGrid: boolean[][] = [];
            if (step3Data.flooring_grid && step3Data.flooring_grid.length > 0) {
                flooringGrid = step3Data.flooring_grid;
            } else {
                // Fallback: read from step-3 useFormPersistence key
                const floorRaw = localStorage.getItem("flooring_material_json");
                if (floorRaw) {
                    try { flooringGrid = JSON.parse(floorRaw); } catch {}
                }
            }
            
            let wallsGrid: boolean[][] = [];
            if (step3Data.walls_grid && step3Data.walls_grid.length > 0) {
                wallsGrid = step3Data.walls_grid;
            } else {
                // Fallback: read from step-3 useFormPersistence key
                const wallRaw = localStorage.getItem("wall_material_json");
                if (wallRaw) {
                    try { wallsGrid = JSON.parse(wallRaw); } catch {}
                }
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
            const deductionAmounts: Record<string, number> = step4Data.deduction_amounts || {};
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
            const assessedValueStorageItem = localStorage.getItem("estimated_value_p5");
            if (assessedValueStorageItem) {
                assessedValueFromStorage = parseFloat(assessedValueStorageItem);
            }

            const amountInWords = localStorage.getItem("amount_in_words_p5") || "";
            const actualUse = localStorage.getItem("actual_use_p5") || "";
            const taxStatus = localStorage.getItem("tax_status_p5") || "taxable";
            const effectivityOfAssessment = localStorage.getItem("effectivity_of_assessment_p5") || "";
            const appraisedById = localStorage.getItem("appraised_by_p5") || "";
            const municipalReviewerId = localStorage.getItem("municipal_reviewer_id_p5") || "";
            const provincialReviewerId = localStorage.getItem("provincial_reviewer_id_p5") || "";
            const memoranda = localStorage.getItem("memoranda_p5") || "";
            
            // Calculate financial summary similar to step-4 (correct formula)
            const unitCostNum = parseFloat(unitCostFromStorage || "0");
            const floorAreaNum = parseFloat(step2Data.total_floor_area || "0");
            const mainCost = floorAreaNum > 0 ? unitCostNum * floorAreaNum : unitCostNum;

            // Additions using original unit cost
            const addPctIds: string[] = (additionalPercentageChoice || "").split(",").filter(Boolean);
            let additionalPercentTotal = 0;
            addPctIds.forEach((id: string, idx: number) => {
                const opt = ADDITIONAL_PERCENT_CHOICES.find((c: any) => String(c.id) === id);
                const area = additionalPercentageAreas[idx] || 0;
                if (opt && opt.percentage) additionalPercentTotal += ((unitCostNum * opt.percentage) / 100) * area;
            });

            const addFlatIds: string[] = (additionalFlatRateChoice || "").split(",").filter(Boolean);
            let additionalFlatTotal = 0;
            addFlatIds.forEach((id: string, idx: number) => {
                const opt = ADDITIONAL_FLAT_RATE_CHOICES.find((c: any) => String(c.id) === id);
                const area = additionalFlatRateAreas[idx] || 0;
                if (opt && opt.pricePerSqm) additionalFlatTotal += opt.pricePerSqm * area;
            });

            // Total Reproduction Cost = main + additions
            const baseCost = mainCost + additionalPercentTotal + additionalFlatTotal;

            // Calculate deduction total — prefer stored amounts, fallback to percentage of totalReproductionCost
            const standardDeductionTotal = selectedDeductions.reduce((acc: number, deductionId: string) => {
                const storedAmount = deductionAmounts[deductionId];
                if (storedAmount !== undefined) return acc + storedAmount;
                const deduction = DEDUCTION_CHOICES.find(d => d.id === deductionId);
                if (deduction && deduction.percentage) {
                    return acc + (baseCost * deduction.percentage) / 100;
                }
                return acc;
            }, 0);

            // Depreciation on total reproduction cost — derive from building age + structural type
            const buildingAgeNum = parseFloat(buildingAge) || 0;
            const depreciationResultFromStorage = (buildingAgeNum && structuralType)
                ? getBuildingDepreciationRate(buildingAgeNum, structuralType)
                : null;
            const depreciationPctFromStorage = depreciationResultFromStorage?.rate ?? 0;
            const depreciationAmountFromStorage = baseCost * depreciationPctFromStorage / 100;

            const netUnitCost = baseCost - standardDeductionTotal - depreciationAmountFromStorage;

            setFormData({
                transactionCode,
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
                deductionAmounts,
                deductionComments,
                // Additional items data
                additionalPercentageChoice,
                additionalPercentageValue,
                additionalPercentageAreas,
                additionalFlatRateChoice,
                additionalFlatRateValue,
                additionalFlatRateAreas,
                // Financial calculations
                unitCost: unitCostNum,
                physicalDepreciationPct: depreciationPctFromStorage,
                depreciationAmount: depreciationAmountFromStorage,
                baseCost,
                standardDeductionTotal,
                netUnitCost,
                marketValue: parseFloat(marketValue || "0"),
                
                // Assessment calculations
                actualUse,
                taxStatus,
                assessmentLevel: assessmentLevelValue,
                assessedValue: assessedValueFromStorage,
                amountInWords,
                effectivityOfAssessment,
                appraisedById,
                municipalReviewerId,
                provincialReviewerId,
                memoranda,
            });
            setIsLoaded(true);
        } catch (e) {
            console.error("Error loading RPFAAS data", e);
        }
    }, []);

    useEffect(() => {
        if (serverData) {
            loadDataFromServer(serverData);
            return;
        }
        loadDataFromStorage();
        const onStorage = () => loadDataFromStorage();
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, [serverData, loadDataFromServer, loadDataFromStorage]);

    return { ...formData, isLoaded };
};
