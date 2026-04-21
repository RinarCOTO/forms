"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { BUILDING_STEPS } from "@/app/building-other-structure/fill/constants";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { generateYears, calculateAge, calculateTotalFloorArea } from "@/utils/form-helpers";
import { BUILDING_TYPES, STRUCTURAL_TYPES } from "@/config/form-options";
import { getUnitConstructionCost } from "@/config/unit-construction-cost";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { useFormData } from "@/hooks/useFormData";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FormFillLayout } from "@/components/ui/form-fill-layout";
import { SaveDraftButton } from "@/components/SaveDraftButton";
import { useSaveDraftShortcut } from "@/hooks/useSaveDraftShortcut";
import { useFormLock } from "@/hooks/useFormLock";
import { toast } from "sonner";
import { FormLockBanner } from "@/components/ui/form-lock-banner";
import { FormSection } from "@/components/ui/form-section";
// Pure helper — lives at module scope so it's never recreated on render
function formatPeso(value: string | number) {
  if (value === "" || value === undefined) return "";
  const num = typeof value === "string" ? Number(value.replace(/[^0-9.]/g, "")) : value;
  if (isNaN(num) || num === 0) return "₱0.00";
  return `₱${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to collect form data
function collectFormData(
  typeOfBuilding: string,
  structureType: string,
  dateConstructed: number | string,
  numberOfStoreys: number | string,
  totalFloorArea: number | string,
  // Add other fields here if your DB Schema expects them (e.g. permit number)
) {
  const data: any = {};
  if (typeOfBuilding) data.type_of_building = typeOfBuilding;
  if (structureType) data.structure_type = structureType;
  if (dateConstructed) data.date_constructed = dateConstructed.toString();
  if (numberOfStoreys) data.number_of_storeys = numberOfStoreys.toString();
  if (totalFloorArea) data.total_floor_area = totalFloorArea.toString();
  
  return data;
}

const BuildingStructureFormFillPage2 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  const { checking: lockChecking, locked, lockedBy } = useFormLock('building_structures', draftId);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);
  const markDirty = useCallback(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, []);
  const FORM_NAME = "building_other_structure_fill_p2";

  // --- 1. DEFINE ALL STATES (So the Hook can save them) ---
  const [buildingCategory, setBuildingCategory] = useState(""); // "Residential" | "Commercial"
  const [buildingSubType, setBuildingSubType] = useState(""); // label from BUILDING_TYPES[1..]
  // Derived value saved to DB: "Residential" or "Commercial - <subtype>"
  const typeOfBuilding =
    buildingCategory === "Residential"
      ? "Residential"
      : buildingSubType
      ? `Commercial - ${buildingSubType}`
      : "";
  // Label passed to unit cost lookup (always the original BUILDING_TYPES label)
  const typeOfBuildingForCost =
    buildingCategory === "Residential" ? "Residential" : buildingSubType;
  const [structureType, setStructureType] = useState("");
  const [buildingPermitNo, setBuildingPermitNo] = useState(""); // Added
  const [cct, setCct] = useState(""); // Added
  const [completionIssuedOn, setCompletionIssuedOn] = useState("");
  const [dateConstructed, setDateConstructed] = useState<number | "">("");
  const [dateOccupied, setDateOccupied] = useState("");
  const [buildingAge, setBuildingAge] = useState<number | string>("");
  const [costOfConstruction, setCostOfConstruction] = useState<string>("");
  const [costOfConstructionDisplay, setCostOfConstructionDisplay] = useState<string>("");
  // Handle input change
const handleCostOfConstructionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  let value = e.target.value;

  // 1. Remove all non-digit characters except the decimal point
  const cleanValue = value.replace(/[^0-9.]/g, "");

  // 2. Handle multiple decimal points (only allow the first one)
  const parts = cleanValue.split(".");
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? "." + parts[1].slice(0, 2) : "";

  // 3. Format the integer part with commas
  const formattedInteger = integerPart 
    ? parseInt(integerPart, 10).toLocaleString() 
    : "";

  const rawValue = cleanValue === "" ? "" : cleanValue;

  // 4. Combine and update state
  // We use the string version for display so the user can type the decimal
  setCostOfConstructionDisplay(formattedInteger + decimalPart);
  setCostOfConstruction(rawValue);

  // 5. If you need the raw number for calculations, save it elsewhere:
  // setRawValue(parseFloat(cleanValue) || 0);
}, []);
  // Format on blur
  const handleCostOfConstructionBlur = useCallback(() => {
    setCostOfConstructionDisplay(formatPeso(costOfConstruction));
  }, [costOfConstruction]);
  // Show formatted value if not editing
  useEffect(() => {
    if (costOfConstruction === "") {
      setCostOfConstructionDisplay("");
    } else {
      setCostOfConstructionDisplay(formatPeso(costOfConstruction));
    }
  }, []);

  useEffect(() => {
    const rawValue = getUnitConstructionCost(typeOfBuildingForCost, structureType);
    if (rawValue) {
      setCostOfConstruction(rawValue);
      setCostOfConstructionDisplay(formatPeso(rawValue));
    }
  }, [typeOfBuildingForCost, structureType]);
  const [numberOfStoreys, setNumberOfStoreys] = useState<number | "">(1);
  const [floorAreas, setFloorAreas] = useState<(number | "")[]>([""]);
  const [totalFloorArea, setTotalFloorArea] = useState<number | "">("");
  
  // Land Reference States
  const [landOwner, setLandOwner] = useState("");
  const [tdArpNo, setTdArpNo] = useState(""); // Added
  const [landArea, setLandArea] = useState(""); // Added

  // --- 2. CALCULATIONS ---
  useEffect(() => {
    if (dateConstructed) {
      setBuildingAge(calculateAge(Number(dateConstructed)));
    } else {
      setBuildingAge("");
    }
  }, [dateConstructed]);

  useEffect(() => {
    const total = calculateTotalFloorArea(floorAreas);
    setTotalFloorArea(total > 0 ? total : "");
  }, [floorAreas]);

  // Mark initialized immediately for new forms (no draftId)
  useEffect(() => {
    if (!draftId) isInitializedRef.current = true;
  }, [draftId]);

  // --- 2.1. LOAD EXISTING DATA (if editing) ---
// --- 2.1. LOAD EXISTING DATA (if editing) ---
  const { data: loadedData, isLoading: isLoadingData } = useFormData<any>("faas/building-structures", draftId || "");

  useEffect(() => {
    if (loadedData) {
      console.log("DB Data:", loadedData); // Keep this for debugging

      // HELPER: Extract Year from "YYYY-MM-DD" or just return the number
      const getYear = (val: any) => {
        if (!val) return "";
        // If it's already a number (e.g. 2024), return it
        if (typeof val === 'number') return val;
        // If it's a string like "2024-01-01", take the first 4 chars
        const strVal = val.toString();
        return strVal.length >= 4 ? Number(strVal.substring(0, 4)) : "";
      };

      const savedType: string = loadedData.type_of_building || "";
      if (savedType === "Residential") {
        setBuildingCategory("Residential");
        setBuildingSubType("");
      } else if (savedType.startsWith("Commercial - ")) {
        setBuildingCategory("Commercial");
        setBuildingSubType(savedType.replace("Commercial - ", ""));
      } else if (savedType) {
        // legacy: plain label without prefix → treat as Commercial
        setBuildingCategory("Commercial");
        setBuildingSubType(savedType);
      }
      setStructureType(loadedData.structure_type || "");
      setBuildingPermitNo(loadedData.building_permit_no || "");
      setCct(loadedData.cct || "");

      // FIX: Extract Year properly
      setCompletionIssuedOn(String(getYear(loadedData.completion_issued_on)));
      setDateConstructed(getYear(loadedData.date_constructed));
      setDateOccupied(String(getYear(loadedData.date_occupied)));

      if (loadedData.building_age) {
        setBuildingAge(loadedData.building_age);
      } else if (loadedData.date_constructed) {
        setBuildingAge(calculateAge(Number(getYear(loadedData.date_constructed))));
      } else {
        setBuildingAge("");
      }
      setNumberOfStoreys(loadedData.number_of_storeys ? Number(loadedData.number_of_storeys) : 1);

      // Handle Floor Areas safely
      if (loadedData.floor_areas) {
         const areas = typeof loadedData.floor_areas === 'string' 
            ? JSON.parse(loadedData.floor_areas) 
            : loadedData.floor_areas;
         setFloorAreas(areas);
      }

      setTotalFloorArea(loadedData.total_floor_area || "");
      setLandOwner(loadedData.land_owner || "");
      setTdArpNo(loadedData.td_arp_no || "");
      setLandArea(loadedData.land_area || "");

      // Load cost of construction
      if (loadedData.cost_of_construction !== undefined && loadedData.cost_of_construction !== null) {
        const raw = loadedData.cost_of_construction.toString();
        setCostOfConstruction(raw);
        setCostOfConstructionDisplay(formatPeso(raw));
      } else {
        setCostOfConstruction("");
        setCostOfConstructionDisplay("");
      }
      isInitializedRef.current = true;
    }
  }, [loadedData]);

  // --- 3. AUTO-SAVE HOOK (Passing ALL variables) ---
  useFormPersistence("p2", {
    type_of_building: typeOfBuilding,
    structure_type: structureType,
    building_permit_no: buildingPermitNo,
    cct: cct,
    completion_issued_on: completionIssuedOn,
    date_constructed: dateConstructed,
    date_occupied: dateOccupied,
    building_age: buildingAge,
    number_of_storeys: numberOfStoreys,
    floor_areas: floorAreas,
    total_floor_area: totalFloorArea,
    land_owner: landOwner,
    td_arp_no: tdArpNo,
    land_area: landArea
  });

  // --- HANDLERS ---
  const handleDateConstructedChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? parseInt(e.target.value, 10) : "";
    setDateConstructed(year);
  }, []);

  const handleNumberOfStoreysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const storeys = e.target.value ? parseInt(e.target.value, 10) : "";
    setNumberOfStoreys(storeys);
    if (typeof storeys === 'number' && storeys > 0) {
      // Preserve existing values; extend with empty strings if adding floors
      setFloorAreas(prev => {
        const next = Array(storeys).fill("") as (number | "")[];
        for (let i = 0; i < Math.min(storeys, prev.length); i++) next[i] = prev[i];
        return next;
      });
    } else {
      setFloorAreas([]);
    }
  }, []);

  const handleFloorAreaChange = useCallback((index: number, value: string) => {
    const newFloorAreas = [...floorAreas];
    newFloorAreas[index] = value ? parseFloat(value) : "";
    setFloorAreas(newFloorAreas);
  }, [floorAreas]);

const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      // 1. EXTRACT RAW VALUE FOR STORAGE
      // Remove commas and currency symbols to get raw number (e.g., "25000.50")
      const rawCostValue = costOfConstructionDisplay 
        ? costOfConstructionDisplay.replace(/[^0-9.]/g, "") 
        : "0";

      // 2. SAVE TO LOCALSTORAGE (This is what Step 4 looks for)
      localStorage.setItem('unit_cost_p2', rawCostValue);
      localStorage.setItem('total_floor_area_p2', totalFloorArea.toString());

      // --- Prepare DB Payload ---
      const formatYearToDate = (val: string | number) => {
        if (!val) return null;
        const str = val.toString();
        return str.length === 4 ? `${str}-01-01` : str;
      };

      const formData: Record<string, unknown> = {
        type_of_building: typeOfBuilding,
        structure_type: structureType,
        building_permit_no: buildingPermitNo,
        cct: cct,
        completion_issued_on: formatYearToDate(completionIssuedOn),
        date_constructed: formatYearToDate(dateConstructed),
        date_occupied: formatYearToDate(dateOccupied),
        building_age: buildingAge,
        number_of_storeys: numberOfStoreys,
        floor_areas: typeof numberOfStoreys === 'number' ? floorAreas.slice(0, numberOfStoreys) : floorAreas,
        total_floor_area: totalFloorArea,
        land_owner: landOwner,
        td_arp_no: tdArpNo,
        land_area: landArea,
        // We use the raw value here for the DB too
        cost_of_construction: rawCostValue === "0" ? null : rawCostValue,
      };

      // ... rest of your fetch logic remains the same ...
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      const method = currentDraftId ? 'PUT' : 'POST';
      if (!currentDraftId) formData.status = 'draft';
      const endpoint = currentDraftId 
        ? `/api/faas/building-structures/${currentDraftId}` 
        : '/api/faas/building-structures';

      response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          setIsDirty(false);
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/building-other-structure/fill/step-3?id=${result.data.id}`);
        }
      } else {
        const error = await response.json();
        console.error('[step-2 PUT error]', error);
        toast.error('Failed to save: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [draftId, router, typeOfBuilding, structureType, buildingPermitNo, cct, completionIssuedOn, dateConstructed, dateOccupied, buildingAge, numberOfStoreys, floorAreas, totalFloorArea, landOwner, tdArpNo, landArea, costOfConstructionDisplay, costOfConstruction]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const rawCostValue = costOfConstructionDisplay ? costOfConstructionDisplay.replace(/[^0-9.]/g, '') : '0';
      const formatYearToDate = (val: string | number) => {
        if (!val) return null;
        const str = val.toString();
        return str.length === 4 ? `${str}-01-01` : str;
      };
      const formData: Record<string, unknown> = {
        type_of_building: typeOfBuilding, structure_type: structureType,
        building_permit_no: buildingPermitNo, cct,
        completion_issued_on: formatYearToDate(completionIssuedOn),
        date_constructed: formatYearToDate(dateConstructed),
        date_occupied: formatYearToDate(dateOccupied),
        building_age: buildingAge, number_of_storeys: numberOfStoreys,
        floor_areas: typeof numberOfStoreys === 'number' ? floorAreas.slice(0, numberOfStoreys) : floorAreas,
        total_floor_area: totalFloorArea,
        land_owner: landOwner, td_arp_no: tdArpNo, land_area: landArea,
        cost_of_construction: rawCostValue === '0' ? null : rawCostValue,
      };
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      const method = currentDraftId ? 'PUT' : 'POST';
      if (!currentDraftId) formData.status = 'draft';
      const endpoint = currentDraftId ? `/api/faas/building-structures/${currentDraftId}` : '/api/faas/building-structures';
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) localStorage.setItem('draft_id', result.data.id.toString());
        setIsDirty(false);
        toast.success('Draft saved successfully.');
      } else {
        const error = await response.json();
        toast.error('Failed to save draft: ' + (error.message || 'Unknown error'));
      }
    } catch {
      toast.error('Error saving draft.');
    } finally {
      setIsSavingDraft(false);
    }
  }, [draftId, typeOfBuilding, structureType, buildingPermitNo, cct, completionIssuedOn, dateConstructed, dateOccupied, buildingAge, numberOfStoreys, floorAreas, totalFloorArea, landOwner, tdArpNo, landArea, costOfConstructionDisplay]);

  useSaveDraftShortcut(handleSaveDraft, isSavingDraft || locked);

  // --- JSX RENDER ---
  return (
    <FormFillLayout
      breadcrumbParent={{ label: "Building Your Application", href: "#" }}
      pageTitle="Building Details"
      sidePanel={<ErrorBoundary><ReviewCommentsFloat draftId={draftId} stepFields={["type_of_building","structure_type","building_permit_no","cct","completion_issued_on","date_constructed","date_occupied","building_age","unit_cost","number_of_storeys","total_floor_area","land_owner","td_arp_no","land_area"]} /></ErrorBoundary>}
    >
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Building Details</h1>
                <p className="text-sm text-muted-foreground">Enter building specifications and land reference details.</p>
              </div>
              <SaveDraftButton
                onClick={handleSaveDraft}
                isSaving={isSavingDraft}
                disabled={isSaving || locked || lockChecking}
              />
            </header>
            <FormLockBanner locked={locked} lockedBy={lockedBy} />
            <fieldset disabled={locked} className={`border-0 p-0 m-0 min-w-0 block${locked ? ' opacity-60' : ''}${lockChecking ? ' animate-pulse' : ''}`}>
            <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6" onChange={markDirty}>

              <FormSection title="General Description">
                <div className="flex flex-col gap-3">
                  {/* TYPE OF BUILDING */}
                  <div className="space-y-1" data-comment-field="type_of_building">
                    <Label className="rpfaas-fill-label">Type of Building</Label>
                    <div className="relative group">
                      <select
                        value={buildingCategory}
                        onChange={(e) => {
                          setBuildingCategory(e.target.value);
                          setBuildingSubType("");
                        }}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select Category</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </div>
                  </div>

                  {/* COMMERCIAL SUBCATEGORY */}
                  {buildingCategory === "Commercial" && (
                    <div className="space-y-1 mt-3" data-comment-field="type_of_building">
                      <Label className="rpfaas-fill-label">Commercial Type</Label>
                      <div className="relative group">
                        <select
                          value={buildingSubType}
                          onChange={(e) => setBuildingSubType(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select Commercial Type</option>
                          {BUILDING_TYPES.filter(opt => opt.id !== "building_type_1").map(opt => (
                            <option key={opt.id} value={opt.label}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">

                  {/* STRUCTURAL TYPE */}
                  <div className="space-y-1" data-comment-field="structure_type">
                    <Label className="rpfaas-fill-label">Structural Type</Label>
                    <div className="relative group">
                      <select
                        value={structureType}
                        onChange={(e) => setStructureType(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select Structural Type</option>
                        {STRUCTURAL_TYPES.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* BUILDING PERMIT - NOW USING STATE */}
                  <div className="rpfaas-fill-field" data-comment-field="building_permit_no">
                    <Label className="rpfaas-fill-label">Building Permit No.</Label>
                    <Input
                      type="text"
                      className="rpfaas-fill-input"
                      value={buildingPermitNo}
                      onChange={(e) => setBuildingPermitNo(e.target.value)}
                    />
                  </div>
                    {/* CCT - NOW USING STATE */}
                    <div className="rpfaas-fill-field" data-comment-field="cct">
                      <Label className="rpfaas-fill-label">Condominium Certificate of Title(CCT)</Label>
                      <Input
                        type="text"
                        className="rpfaas-fill-input"
                        value={cct}
                        onChange={(e) => setCct(e.target.value)}
                      />
                    </div>
                </div>
                
                {/* DATE CONSTRUCTED & OCCUPIED */}
                <div className="grid grid-cols-3 gap-3">
                    {/* COMPLETION DATE - NOW USING GENERATE YEARS + STATE */}
                    <div className="rpfaas-fill-field" data-comment-field="completion_issued_on">
                      <Label className="rpfaas-fill-label ">Cert of Completion Issued On</Label>
                      <div className="relative group">
                        <select
                          className="rpfaas-fill-input appearance-none"
                          value={completionIssuedOn}
                          onChange={(e) => setCompletionIssuedOn(e.target.value)}
                        >
                          <option value="">Select Year</option>
                          {generateYears(1900).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="rpfaas-fill-field" data-comment-field="date_constructed">
                      <Label className="rpfaas-fill-label">Date Constructed</Label>
                      <div className="relative group">
                        <select
                          value={dateConstructed}
                          onChange={handleDateConstructedChange}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select Year</option>
                          {generateYears(1900).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="rpfaas-fill-field" data-comment-field="date_occupied">
                      <Label className="rpfaas-fill-label">Date Occupied</Label>
                      <div className="relative group">
                        <select
                          value={dateOccupied}
                          onChange={(e) => setDateOccupied(e.target.value)}
                          className="rpfaas-fill-input appearance-none"
                        >
                          <option value="">Select Year</option>
                          {generateYears(1900).map(year => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="rpfaas-fill-field space-y-1" data-comment-field="building_age">
                      <Label className="rpfaas-fill-label">Building Age</Label>
                      <Input 
                        type="text" 
                        className="rpfaas-fill-input bg-gray-100 pr-12 font-medium"
                        value={buildingAge}
                        readOnly
                      />
                    </div>
                  <div className="rpfaas-fill-field space-y-1" data-comment-field="unit_cost">
                    <Label className="rpfaas-fill-label">Unit Construction Cost</Label>
                    <div className="relative">
                      <div className="rpfaas-fill-input bg-gray-100 pr-4 font-medium pl-10">
                        {costOfConstructionDisplay || "0.00"}
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* ... Floors Section (This part was fine) ... */}
              <FormSection title="Floor Information">
                <div className="grid grid-cols-3">
                  <div className="rpfaas-fill-field space-y-1" data-comment-field="number_of_storeys">
                    <Label className="rpfaas-fill-label">Number of Storeys</Label>
                    <Input
                      type="number"
                      min={1}
                      className="rpfaas-fill-input bg-gray-100 pr-12 font-medium"
                      value={numberOfStoreys}
                      onChange={handleNumberOfStoreysChange}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: Number(numberOfStoreys) || 0 }).map((_, index) => (
                    <div key={index} className="rpfaas-fill-field space-y-1">
                      <Label className="rpfaas-fill-label">Floor {index + 1} Area</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          className="rpfaas-fill-input pr-12 no-spinner"
                          value={floorAreas[index] ?? ""}
                          onChange={e => handleFloorAreaChange(index, e.target.value)}
                        />
                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">sqm</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Total Floor Area Display (Read Only) */}
                <div className="grid grid-cols-3">
                   <div className="rpfaas-fill-field space-y-1" data-comment-field="total_floor_area">
                    <Label className="rpfaas-fill-label">TOTAL FLOOR AREA</Label>
                    <div className="relative">
                      <Input 
                          type="number" 
                          className="rpfaas-fill-input bg-gray-100 pr-12"
                          value={totalFloorArea}
                          readOnly
                      />
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">sqm</span>
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* LAND REFERENCE - NOW USING STATE */}
              <FormSection title="LAND REFERENCE">
                <div className="rpfaas-fill-field space-y-1" data-comment-field="land_owner">
                  <Label className="rpfaas-fill-label">Land Owner</Label>
                    <Input 
                      type="text" 
                      value={landOwner} 
                      onChange={(e) => setLandOwner(e.target.value.toUpperCase())} 
                      className="rpfaas-fill-input" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rpfaas-fill-field space-y-1" data-comment-field="td_arp_no">
                    <Label className="rpfaas-fill-label">TD/ARP No.</Label>
                    <Input 
                      type="number" 
                      className="rpfaas-fill-input" 
                      value={tdArpNo}
                      onChange={(e) => setTdArpNo(e.target.value)}
                    />
                  </div>

                  <div className="rpfaas-fill-field space-y-1" data-comment-field="land_area">
                    <Label className="rpfaas-fill-label">Area</Label>
                    <div className="relative">
                    <Input 
                      type="number" 
                      className="rpfaas-fill-input" 
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                    />
                      <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">sqm</span>
                    </div>
                  </div>
                </div>

              </FormSection>

              <StepPagination
                currentStep={2}
                draftId={draftId}
                isDirty={isDirty}
                onNext={handleNext}
                isNextLoading={isSaving}
                isNextDisabled={isSaving || isSavingDraft || locked || lockChecking}
                steps={BUILDING_STEPS}
              />
            </form>
            </fieldset>
    </FormFillLayout>
  );
};

export default function BuildingStructureFormFillPage2Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingStructureFormFillPage2 />
    </Suspense>
  );
}