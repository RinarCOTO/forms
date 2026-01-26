import { useState, useEffect, useCallback } from 'react';
import type { RPFAASFormData, RoofMaterials } from "@/app/types/rpfaas";
import { getLocationName } from "../utils/locationHelpers";
import { DUMMY_PROVINCES, DUMMY_MUNICIPALITIES, DUMMY_BARANGAYS } from "../constants/locations";

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
    });

    const loadDataFromStorage = useCallback(() => {
        try {
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

            // Data from Step 2
            const typeOfBuilding = localStorage.getItem("type_of_building_p2") || "";
            const structuralType = localStorage.getItem("structural_type_p2") || "";
            const buildingPermitNo = localStorage.getItem("building_permit_no_p2") || "";
            const cct = localStorage.getItem("cct_p2") || "";
            const completionIssuedOn = localStorage.getItem("completion_issued_on_p2") || "";
            const dateConstructed = localStorage.getItem("date_constructed_p2") || "";
            const dateOccupied = localStorage.getItem("date_occupied_p2") || "";
            const buildingAge = localStorage.getItem("building_age_p2") || "";
            const numberOfStoreys = localStorage.getItem("number_of_storey_p2") || "";
            const floorAreas = JSON.parse(localStorage.getItem("floor_areas_p2") || "[]");
            const totalFloorArea = localStorage.getItem("total_floor_area_p2") || "";
            const landOwner = localStorage.getItem("land_owner_p2") || "";
            const landTdArpNo = localStorage.getItem("td_arp_no_p2") || "";
            const landArea = localStorage.getItem("land_area_p2") || "";

            // Data from Step 3
            let roofMaterials: RoofMaterials = {
                reinforcedConcrete: false,
                longspanRoof: false,
                tiles: false,
                giSheets: false,
                aluminum: false,
                others: false,
            };
            const roofData = localStorage.getItem("structural_materials_roof_p3");
            if (roofData) {
                roofMaterials = JSON.parse(roofData);
            }
            
            const roofMaterialsOtherText = localStorage.getItem("structural_materials_roof_other_text_p3") || "";
            
            let flooringGrid: boolean[][] = [];
            const flooringData = localStorage.getItem("structural_materials_flooring_p3");
            if (flooringData) {
                flooringGrid = JSON.parse(flooringData);
            }
            
            let wallsGrid: boolean[][] = [];
            const wallsData = localStorage.getItem("structural_materials_walls_p3");
            if (wallsData) {
                wallsGrid = JSON.parse(wallsData);
            }

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
