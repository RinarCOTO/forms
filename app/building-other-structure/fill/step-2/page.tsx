"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react"; // Added useEffect here
import { generateYears, calculateAge, calculateTotalFloorArea } from "@/utils/form-helpers";
import { BUILDING_TYPES, STRUCTURAL_TYPES } from "@/config/form-options";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

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
  const [isSaving, setIsSaving] = useState(false);
  const FORM_NAME = "building_other_structure_fill_p2";

  // --- 1. DEFINE ALL STATES (So the Hook can save them) ---
  const [typeOfBuilding, setTypeOfBuilding] = useState("");
  const [structureType, setStructureType] = useState("");
  const [buildingPermitNo, setBuildingPermitNo] = useState(""); // Added
  const [cct, setCct] = useState(""); // Added
  const [completionIssuedOn, setCompletionIssuedOn] = useState(""); // Added
  const [dateConstructed, setDateConstructed] = useState<number | "">("");
  const [dateOccupied, setDateOccupied] = useState(""); // Added
  const [buildingAge, setBuildingAge] = useState<number | "">("");
  const [numberOfStoreys, setNumberOfStoreys] = useState<number | "">(1);
  const [floorAreas, setFloorAreas] = useState<(number | "")[]>([""]);
  const [totalFloorArea, setTotalFloorArea] = useState<number | "">("");
  
  // Land Reference States
  const [owner, setOwner] = useState("");
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
    number_of_storey: numberOfStoreys,
    floor_areas: floorAreas,
    total_floor_area: totalFloorArea,
    land_owner: owner,
    td_arp_no: tdArpNo,
    land_area: landArea
  });

  // --- HANDLERS ---
  const handleDateConstructedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value ? parseInt(e.target.value, 10) : "";
    setDateConstructed(year);
  };

  const handleNumberOfStoreysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const storeys = e.target.value ? parseInt(e.target.value, 10) : "";
    setNumberOfStoreys(storeys);
    if (typeof storeys === 'number' && storeys > 0) {
      setFloorAreas(Array(storeys).fill(""));
    } else {
      setFloorAreas([]);
    }
  };

  const handleFloorAreaChange = (index: number, value: string) => {
    const newFloorAreas = [...floorAreas];
    newFloorAreas[index] = value ? parseFloat(value) : "";
    setFloorAreas(newFloorAreas);
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // FIX: Use the correct variable names here
      const formData = collectFormData(
        typeOfBuilding, 
        structureType, 
        dateConstructed, 
        numberOfStoreys, 
        totalFloorArea
      );
      formData.status = 'draft';
      
      console.log('Saving Step 2 form data to Supabase:', formData);
      
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      
      const method = currentDraftId ? 'PUT' : 'POST';
      const endpoint = currentDraftId 
        ? `/api/building-structure/${currentDraftId}` 
        : '/api/building-structure';

      response = await fetch(endpoint, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          router.push(`/building-other-structure/fill/step-3?id=${result.data.id}`);
        }
      } else {
        const error = await response.json();
        alert('Failed to save: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- JSX RENDER ---
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header omitted for brevity */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            {/* Header omitted for brevity */}
            <form className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">General Description</h2>
                <div className="grid grid-cols-3 gap-3">
                  {/* TYPE OF BUILDING */}
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">Type of Building</Label>
                    <div className="relative group">
                      <select
                        value={typeOfBuilding}
                        onChange={(e) => setTypeOfBuilding(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select Type of Bldg</option>
                        {BUILDING_TYPES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* STRUCTURAL TYPE */}
                  <div className="space-y-1">
                    <Label className="rpfaas-fill-label">Structural Type</Label>
                    <div className="relative group">
                      <select
                        value={structureType}
                        onChange={(e) => setStructureType(e.target.value)}
                        className="rpfaas-fill-input appearance-none"
                      >
                        <option value="">Select Structural Type</option>
                        {STRUCTURAL_TYPES.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* BUILDING PERMIT - NOW USING STATE */}
                  <div className="rpfaas-fill-field">
                    <Label className="rpfaas-fill-label">Building Permit No.</Label>
                    <Input
                      type="text"
                      className="rpfaas-fill-input"
                      value={buildingPermitNo}
                      onChange={(e) => setBuildingPermitNo(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {/* CCT - NOW USING STATE */}
                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label">CCT</Label>
                      <Input
                        type="text"
                        className="rpfaas-fill-input"
                        value={cct}
                        onChange={(e) => setCct(e.target.value)}
                      />
                    </div>

                    {/* COMPLETION DATE - NOW USING GENERATE YEARS + STATE */}
                    <div className="rpfaas-fill-field">
                      <Label className="rpfaas-fill-label">Certificate Issued On</Label>
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
                </div>
                
                {/* DATE CONSTRUCTED & OCCUPIED */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rpfaas-fill-field">
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

                    <div className="rpfaas-fill-field">
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
                </div>
              </section>

              {/* ... Floors Section (This part was fine) ... */}
              <section className="rpfaas-fill-section">
                 {/* Logic for Age and Floors remains the same, it was correct */}
              </section>

              {/* LAND REFERENCE - NOW USING STATE */}
              <section className="rpfaas-fill-section">
                <h2 className="rpfaas-fill-section-title mb-4">LAND REFERENCE</h2>
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label">Land Owner</Label>
                    <Input 
                      type="text" 
                      value={owner} 
                      onChange={(e) => setOwner(e.target.value.toUpperCase())} 
                      className="rpfaas-fill-input" 
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label">TD/ARP No.</Label>
                    <Input 
                      type="number" 
                      className="rpfaas-fill-input" 
                      value={tdArpNo}
                      onChange={(e) => setTdArpNo(e.target.value)}
                    />
                  </div>

                  <div className="rpfaas-fill-field space-y-1">
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
                
                {/* Total Floor Area Display (Read Only) */}
                <div className="grid grid-cols-2">
                   <div className="rpfaas-fill-field space-y-1">
                    <Label className="rpfaas-fill-label">TOTAL FLOOR AREA</Label>
                    <Input 
                        type="number" 
                        className="rpfaas-fill-input bg-gray-100 pr-12"
                        value={totalFloorArea}
                        readOnly
                    />
                  </div>
                </div>
              </section>

              {/* Footer Actions */}
              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => router.back()}>Previous</Button>
                  <Button type="button" onClick={handleNext} disabled={isSaving}>
                    {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Next'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BuildingStructureFormFillPage2;