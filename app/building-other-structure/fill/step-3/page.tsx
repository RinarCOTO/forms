"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect, useCallback, Suspense, useRef } from "react";
import { StepPagination } from "@/components/ui/step-pagination";
import { ReviewCommentsFloat } from "@/components/review-comments-float";
import { useFormData } from "@/hooks/useFormData";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import "@/app/styles/forms-fill.css";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { RoofMaterialsForm } from "@/components/forms/RoofMaterialsForm";

// --- HELPER: Parse JSON Safely ---
// This prevents the "0": "{" error if the DB returns a string instead of an object
const safeParse = (data: any) => {
  if (typeof data === "string") {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse JSON:", e);
      return null;
    }
  }
  return data;
};

// --- HELPER: Collect Data for DB ---
function collectFormData(
  materials: any,
  materialsOtherText: string,
  flooringGrid: boolean[][],
  wallsGrid: boolean[][]
) {
  const data: any = {};

  // --- 1. GENERATE READABLE STRINGS ---
  
  // Roof String
  const selectedRoof = [];
  // Ensure 'materials' is actually an object before checking keys
  const safeMaterials = typeof materials === 'object' && materials !== null ? materials : {};
  
  if (safeMaterials.reinforcedConcrete) selectedRoof.push('Reinforced Concrete');
  if (safeMaterials.longspanRoof) selectedRoof.push('Longspan Roof');
  if (safeMaterials.tiles) selectedRoof.push('Tiles');
  if (safeMaterials.giSheets) selectedRoof.push('GI Sheets');
  if (safeMaterials.aluminum) selectedRoof.push('Aluminum');
  if (safeMaterials.others && materialsOtherText) selectedRoof.push(`Other: ${materialsOtherText}`);
  const roofSummary = selectedRoof.join(', ');

  // Flooring String
  let flooringSummary = "";
  if (flooringGrid && flooringGrid.length > 0) {
    const flooringLabels = ["Concrete", "Plain Cement", "Marble", "Wood", "Tiles", "Other"];
    const selectedFlooring: string[] = [];
    flooringGrid.forEach((row, rIdx) => {
      if(Array.isArray(row)) {
        row.forEach((cell, cIdx) => {
          if (cell && flooringLabels[rIdx]) {
            const suffix = ["st", "nd", "rd"][cIdx] || "th";
            selectedFlooring.push(`${flooringLabels[rIdx]} (${cIdx + 1}${suffix} floor)`);
          }
        });
      }
    });
    flooringSummary = selectedFlooring.join(", ");
  }

  // Walls String
  let wallSummary = "";
  if (wallsGrid && wallsGrid.length > 0) {
    const wallLabels = ["Concrete", "Plain Cement", "Wood", "CHB", "C.I. Sheets"];
    const selectedWalls: string[] = [];
    wallsGrid.forEach((row, rIdx) => {
      if(Array.isArray(row)) {
        row.forEach((cell, cIdx) => {
          if (cell && wallLabels[rIdx]) {
            const suffix = ["st", "nd", "rd"][cIdx] || "th";
            selectedWalls.push(`${wallLabels[rIdx]} (${cIdx + 1}${suffix} floor)`);
          }
        });
      }
    });
    wallSummary = selectedWalls.join(", ");
  }

  // --- 2. SAVE HYBRID DATA ---
  
  data.roofing_material = {
    summary: roofSummary,
    data: safeMaterials,
    otherText: materialsOtherText
  };

  data.flooring_material = {
    summary: flooringSummary,
    grid: flooringGrid
  };

  data.wall_material = {
    summary: wallSummary,
    grid: wallsGrid
  };

  return data;
}

const FORM_NAME = "building-structure-form-fill-page-3";

// Constant label arrays at module scope — no need to recreate on every render
const flooringLabels = ["Concrete", "Plain Cement", "Marble", "Wood", "Tiles", "Other"];
const wallLabels = ["Concrete", "Plain Cement", "Wood", "CHB", "C.I. Sheets"];

const BuildingStructureFormFillPage3 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isInitializedRef = useRef(false);
  const markDirty = useCallback(() => {
    if (isInitializedRef.current) setIsDirty(true);
  }, []);

  // --- State ---
  const [numberOfStoreys, setNumberOfStoreys] = useState(0);
  
  // Roof State
  const [materials, setMaterials] = useState({
    reinforcedConcrete: false,
    longspanRoof: false,
    tiles: false,
    giSheets: false,
    aluminum: false,
    others: false,
  });
  const [materialsOtherText, setMaterialsOtherText] = useState("");
  
  // Grids State
  const [flooringGrid, setFlooringGrid] = useState<boolean[][]>([]);
  const [wallsGrid, setWallsGrid] = useState<boolean[][]>([]);

  // Mark initialized immediately for new forms
  useEffect(() => {
    if (!draftId) isInitializedRef.current = true;
  }, [draftId]);

  // --- Load from DB if editing ---
  const { data: loadedData, isLoading: isLoadingData } = useFormData<any>("building-structure", draftId || "");

  useEffect(() => {
    if (loadedData) {
      // 1. Set Storeys
      const storeys = loadedData.number_of_storeys ? Math.max(1, Number(loadedData.number_of_storeys)) : 1;
      setNumberOfStoreys(storeys);

      // --- PARSING LOGIC (Fixes the "0": "{" error) ---
      
      const parsedFloor = safeParse(loadedData.flooring_material);
      const parsedWall = safeParse(loadedData.wall_material);
      const parsedRoof = safeParse(loadedData.roofing_material);

      // 2. Handle Flooring
      if (parsedFloor?.grid && Array.isArray(parsedFloor.grid)) {
         setFlooringGrid(parsedFloor.grid);
      } else if (Array.isArray(parsedFloor)) {
         setFlooringGrid(parsedFloor); 
      } else if (flooringGrid.length === 0 || (flooringGrid[0] && flooringGrid[0].length !== storeys)) {
         setFlooringGrid(Array.from({ length: 6 }, () => Array(storeys).fill(false)));
      }

      // 3. Handle Walls
      if (parsedWall?.grid && Array.isArray(parsedWall.grid)) {
         setWallsGrid(parsedWall.grid);
      } else if (Array.isArray(parsedWall)) {
         setWallsGrid(parsedWall); 
      } else if (wallsGrid.length === 0 || (wallsGrid[0] && wallsGrid[0].length !== storeys)) {
         setWallsGrid(Array.from({ length: 5 }, () => Array(storeys).fill(false)));
      }

      // 4. Handle Roof
      if (parsedRoof) {
        // Case A: New Hybrid Format
        if (parsedRoof.data) {
          // Verify 'data' is an object and not that weird "0:{..." string array
          if (typeof parsedRoof.data === 'object' && !Array.isArray(parsedRoof.data)) {
            // Filter out numeric keys that represent character-by-character breakdowns
            const filteredData = Object.keys(parsedRoof.data).reduce((acc, key) => {
              // Only include non-numeric keys (the actual material properties)
              if (!(/^\d+$/.test(key))) {
                acc[key] = parsedRoof.data[key];
              }
              return acc;
            }, {} as any);
            setMaterials(prev => ({...prev, ...filteredData}));
          }
          if (parsedRoof.otherText) {
             setMaterialsOtherText(parsedRoof.otherText);
          }
        } 
        // Case B: Old/Flat Format (Fallback)
        else if (!parsedRoof.summary && !parsedRoof.data) {
           setMaterials(prev => ({...prev, ...parsedRoof}));
        }
      }
      setTimeout(() => { isInitializedRef.current = true; }, 100);
    }
  }, [loadedData]);

  // --- Persistence ---
  useFormPersistence("roofing_material_json", materials);
  useFormPersistence("roofing_material_other_text", materialsOtherText);
  useFormPersistence("flooring_material_json", flooringGrid);
  useFormPersistence("wall_material_json", wallsGrid);

  // --- Toggling Logic ---
  const toggleFlooringCell = useCallback((row: number, col: number) => {
    markDirty();
    setFlooringGrid((prev) => {
      if (!prev || prev.length === 0) return prev;
      const copy = prev.map((r) => [...r]);
      if (copy[row] && copy[row][col] !== undefined) {
        copy[row][col] = !copy[row][col];
      }
      return copy;
    });
  }, [markDirty]);

  const toggleWallsCell = useCallback((row: number, col: number) => {
    markDirty();
    setWallsGrid((prev) => {
      if (!prev || prev.length === 0) return prev;
      const copy = prev.map((r) => [...r]);
      if (copy[row] && copy[row][col] !== undefined) {
        copy[row][col] = !copy[row][col];
      }
      return copy;
    });
  }, [markDirty]);

  // --- Handlers ---
  const handleNext = useCallback(async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(materials, materialsOtherText, flooringGrid, wallsGrid);
      formData.status = 'draft';
      
      console.log('Saving Step 3 form data:', formData);
      
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      
      if (currentDraftId) {
        response = await fetch(`/api/building-structure/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const finalId = result.data?.id || currentDraftId;
        
        if (finalId) {
          setIsDirty(false);
          localStorage.setItem('draft_id', finalId.toString());
          router.push(`/building-other-structure/fill/step-4?id=${finalId}`);
        }
      } else {
        const error = await response.json();
        console.error('Save error:', error);
        toast.error('Failed to save: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [materials, materialsOtherText, flooringGrid, wallsGrid, draftId, router]);

  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    try {
      const formData = collectFormData(materials, materialsOtherText, flooringGrid, wallsGrid);
      formData.status = 'draft';
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      let response;
      if (currentDraftId) {
        response = await fetch(`/api/building-structure/${currentDraftId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
      } else {
        response = await fetch('/api/building-structure', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
        });
      }
      if (response.ok) {
        const result = await response.json();
        const finalId = result.data?.id || currentDraftId;
        if (finalId) localStorage.setItem('draft_id', finalId.toString());
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
  }, [materials, materialsOtherText, flooringGrid, wallsGrid, draftId]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    handleNext();
  }, [handleNext]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Additional Structure Details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="rpfaas-fill max-w-3xl mx-auto">
            <header className="rpfaas-fill-header flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="rpfaas-fill-title">Fill-up Form: Structural Materials Checklist</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the additional details for the building/structure.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isSaving}
                className="shrink-0"
              >
                {isSavingDraft ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />Saving...</> : 'Save Draft'}
              </Button>
            </header>

            <form
              id={`form_${FORM_NAME}`}
              data-form-name={FORM_NAME}
              onSubmit={handleSubmit}
              onChange={markDirty}
              className="rpfaas-fill-form rpfaas-fill-form-single space-y-6"
            >
              {/* ROOF SECTION */}
              <section className="rpfaas-fill-section" data-comment-field="roofing_material">
                <h2 className="rpfaas-fill-section-title mb-4">Roof Information</h2>
                <div>
                   <RoofMaterialsForm
                      materials={materials}
                      setMaterials={setMaterials}
                      materialsOtherText={materialsOtherText}
                      setMaterialsOtherText={setMaterialsOtherText}
                    />
                </div>
              </section>
              
              {/* FLOORING & WALLS SECTION */}
              <section className="rpfaas-fill-section" data-comment-field="flooring_material wall_material">
                <div className="overflow-auto">
                   
                   {/* FLOORING TABLE */}
                  <table className="w-full table-auto border-collapse mb-8">
                    <tbody>
                      <tr>
                        <th colSpan={2 + numberOfStoreys} className="py-4 section-divider text-left text-lg font-semibold">
                          Flooring Materials
                        </th>
                      </tr>
                      <tr>
                        <td className="border px-2 py-1 font-bold w-32 bg-gray-50">Material</td>
                        {Array.from({ length: numberOfStoreys }).map((_, i) => (
                          <td key={`floor-header-${i}`} className="border px-2 py-1 text-center font-bold bg-gray-50">
                            {i + 1}
                            <sup>{["st", "nd", "rd"][i] || "th"}</sup>
                          </td>
                        ))}
                      </tr>
                      {flooringLabels.map((label, rIdx) => (
                        <tr key={label}>
                          <td className="border px-2 py-1 font-medium">{label}</td>
                          {Array.from({ length: numberOfStoreys }).map((_, cIdx) => {
                             const isChecked = flooringGrid[rIdx]?.[cIdx] || false;
                             return (
                              <td key={cIdx} className="border px-2 py-1 text-center hover:bg-gray-50">
                                <button
                                  type="button"
                                  aria-pressed={isChecked}
                                  onClick={() => toggleFlooringCell(rIdx, cIdx)}
                                  className={`w-8 h-8 inline-flex items-center justify-center border rounded transition-colors ${
                                    isChecked ? "bg-primary text-primary-foreground border-primary" : "bg-white border-gray-300"
                                  }`}
                                >
                                  {isChecked ? "✓" : ""}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* WALLS TABLE */}
                  <table className="w-full table-auto border-collapse">
                    <tbody>
                      <tr>
                        <th colSpan={2 + numberOfStoreys} className="py-4 section-divider text-left text-lg font-semibold">
                          Wall Materials
                        </th>
                      </tr>
                      <tr>
                        <td className="border px-2 py-1 font-bold w-32 bg-gray-50">Material</td>
                        {Array.from({ length: numberOfStoreys }).map((_, i) => (
                          <td key={`wall-header-${i}`} className="border px-2 py-1 text-center font-bold bg-gray-50">
                            {i + 1}
                            <sup>{["st", "nd", "rd"][i] || "th"}</sup>
                          </td>
                        ))}
                      </tr>
                      {wallLabels.map((label, rIdx) => (
                        <tr key={label}>
                          <td className="border px-2 py-1 font-medium">{label}</td>
                          {Array.from({ length: numberOfStoreys }).map((_, cIdx) => {
                             const isChecked = wallsGrid[rIdx]?.[cIdx] || false;
                             return (
                              <td key={cIdx} className="border px-2 py-1 text-center hover:bg-gray-50">
                                <button
                                  type="button"
                                  aria-pressed={isChecked}
                                  onClick={() => toggleWallsCell(rIdx, cIdx)}
                                  className={`w-8 h-8 inline-flex items-center justify-center border rounded transition-colors ${
                                    isChecked ? "bg-primary text-primary-foreground border-primary" : "bg-white border-gray-300"
                                  }`}
                                >
                                  {isChecked ? "✓" : ""}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <StepPagination
                currentStep={3}
                draftId={draftId}
                isDirty={isDirty}
                onNext={handleNext}
                isNextLoading={isSaving}
                isNextDisabled={isSaving || isSavingDraft}
              />
            </form>
          </div>
        </div>
      </SidebarInset>
      <ReviewCommentsFloat draftId={draftId} />
    </SidebarProvider>
  );
};
export default function BuildingStructureFormFillPage3Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BuildingStructureFormFillPage3 />
    </Suspense>
  );
}