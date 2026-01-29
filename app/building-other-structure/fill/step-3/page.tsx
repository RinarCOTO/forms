"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import "@/app/styles/forms-fill.css";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

// Helper function to collect form data from ONLY this step (step 3)
function collectFormData(
  materials: any,
  materialsOtherText: string,
  flooringGrid: boolean[][],
  wallsGrid: boolean[][]
) {
  const data: any = {};
  
  // Convert roofing materials checkboxes to comma-separated text
  const selectedMaterials = [];
  if (materials.reinforcedConcrete) selectedMaterials.push('Reinforced Concrete');
  if (materials.longspanRoof) selectedMaterials.push('Longspan Roof');
  if (materials.tiles) selectedMaterials.push('Tiles');
  if (materials.giSheets) selectedMaterials.push('GI Sheets');
  if (materials.aluminum) selectedMaterials.push('Aluminum');
  if (materials.others && materialsOtherText) selectedMaterials.push(`Other: ${materialsOtherText}`);
  
  if (selectedMaterials.length > 0) {
    data.roofing_material = selectedMaterials.join(', ');
  }
  
  // Serialize flooring grid to JSON string for storage
  if (flooringGrid && flooringGrid.length > 0) {
    data.flooring_material = JSON.stringify(flooringGrid);
  }
  
  // Serialize walls grid to JSON string for storage
  if (wallsGrid && wallsGrid.length > 0) {
    data.wall_material = JSON.stringify(wallsGrid);
  }
  
  return data;
}

const FORM_NAME = "building-structure-form-fill-page-3";

const BuildingStructureFormFillPage3 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('id');
  
  const [isSaving, setIsSaving] = useState(false);


  const [numberOfStoreys, setNumberOfStoreys] = useState(0);
  const [materials, setMaterials] = useState({
    reinforcedConcrete: false,
    longspanRoof: false,
    tiles: false,
    giSheets: false,
    aluminum: false,
    others: false,
  });

  const [materialsOtherText, setMaterialsOtherText] = useState("");

  const [flooringGrid, setFlooringGrid] = useState<boolean[][]>([]);
  const flooringLabels = [
    "Concrete",
    "Plain Cement",
    "Marble",
    "Wood",
    "Tiles",
    "Other",
  ];

  const toggleFlooringCell = (row: number, col: number) => {
    setFlooringGrid((prev) => {
      const copy = prev.map((r) => r.slice());
      copy[row][col] = !copy[row][col];
      return copy;
    });
  };

  // Separate state for WALLS table so it doesn't share data with FLOORING
  const [wallsGrid, setWallsGrid] = useState<boolean[][]>([]);

  const toggleWallsCell = (row: number, col: number) => {
    setWallsGrid((prev) => {
      const copy = prev.map((r) => r.slice());
      copy[row][col] = !copy[row][col];
      return copy;
    });
  };

  // --- Load initial state from localStorage ---
  useEffect(() => {
    try {
      // Get number of storeys from Step 2
      const savedStoreys = localStorage.getItem("number_of_storey_p2");
      const storeys = savedStoreys ? parseInt(savedStoreys, 10) : 0;
      const validStoreys = isNaN(storeys) ? 0 : storeys;
      setNumberOfStoreys(validStoreys);

      const savedMaterials = localStorage.getItem("structural_materials_roof_p3");
      if (savedMaterials) {
        setMaterials(JSON.parse(savedMaterials));
      }
      const savedMaterialsOther = localStorage.getItem("structural_materials_roof_other_text_p3");
      if (savedMaterialsOther) {
        setMaterialsOtherText(savedMaterialsOther);
      }

      // Initialize or adjust flooring grid
      const savedFlooring = localStorage.getItem("structural_materials_flooring_p3");
      let currentFlooringGrid: boolean[][] = [];
      if (savedFlooring) {
        currentFlooringGrid = JSON.parse(savedFlooring);
      }
      // Check if grid needs to be created or resized
      if (validStoreys > 0 && (currentFlooringGrid.length !== 6 || (currentFlooringGrid[0] && currentFlooringGrid[0].length !== validStoreys))) {
          const newGrid = Array.from({ length: 6 }, () => Array(validStoreys).fill(false));
          // Preserve old data if possible
          if(currentFlooringGrid.length === 6) {
              for(let r=0; r < 6; r++) {
                  for(let c=0; c < Math.min(currentFlooringGrid[r].length, validStoreys); c++) {
                      newGrid[r][c] = currentFlooringGrid[r][c];
                  }
              }
          }
          setFlooringGrid(newGrid);
      } else {
          setFlooringGrid(currentFlooringGrid);
      }


      // Initialize or adjust walls grid
      const savedWalls = localStorage.getItem("structural_materials_walls_p3");
      let currentWallsGrid: boolean[][] = [];
      if (savedWalls) {
        currentWallsGrid = JSON.parse(savedWalls);
      }
       // Check if grid needs to be created or resized
      if (validStoreys > 0 && (currentWallsGrid.length !== 5 || (currentWallsGrid[0] && currentWallsGrid[0].length !== validStoreys))) {
          const newGrid = Array.from({ length: 5 }, () => Array(validStoreys).fill(false));
           // Preserve old data if possible
           if(currentWallsGrid.length === 5) {
              for(let r=0; r < 5; r++) {
                  for(let c=0; c < Math.min(currentWallsGrid[r].length, validStoreys); c++) {
                      newGrid[r][c] = currentWallsGrid[r][c];
                  }
              }
          }
          setWallsGrid(newGrid);
      } else {
          setWallsGrid(currentWallsGrid);
      }

    } catch (e) {
      console.error("Failed to load step 3 data from localStorage", e);
    }
  }, []);


  // --- Save state to localStorage on change ---
  useEffect(() => {
    try {
      localStorage.setItem("structural_materials_roof_p3", JSON.stringify(materials));
      localStorage.setItem("structural_materials_roof_other_text_p3", materialsOtherText);
      localStorage.setItem("structural_materials_flooring_p3", JSON.stringify(flooringGrid));
      localStorage.setItem("structural_materials_walls_p3", JSON.stringify(wallsGrid));
    } catch (e) {
      console.error("Failed to save step 3 data to localStorage", e);
    }
  }, [materials, materialsOtherText, flooringGrid, wallsGrid]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      const formData = collectFormData(materials, materialsOtherText, flooringGrid, wallsGrid);
      formData.status = 'draft';
      
      console.log('Saving Step 3 form data to Supabase:', formData);
      
      let response;
      const currentDraftId = draftId || localStorage.getItem('draft_id');
      
      if (currentDraftId) {
        // Update existing draft
        response = await fetch(`/api/building-structure/${currentDraftId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new draft
        response = await fetch('/api/building-structure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('Save result:', result);
        // Store the draft ID for future updates
        if (result.data?.id) {
          localStorage.setItem('draft_id', result.data.id.toString());
          const savedDraftId = result.data.id;
          // Navigate to step 4 with the draft ID
          router.push(`/building-other-structure/fill/step-4?id=${savedDraftId}`);
        }
      } else {
        const error = await response.json();
        console.error('Save error:', error);
        alert('Failed to save: ' + (error.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
                <h1 className="rpfaas-fill-title">Fill-up Form: Structural Materials Table</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the additional details for the building/structure.
                </p>
              </div>
            </header>
            <form 
                id={`form_${FORM_NAME}`}
                data-form-name={FORM_NAME}
                onSubmit={handleSubmit}
                className="rpfaas-fill-form rpfaas-fill-form-single space-y-6">
              <section className="rpfaas-fill-section">
                <div className="overflow-auto">
                  <table className="w-full table-auto border-collapse">
                    <tbody>
                      <tr>
                        <th colSpan={2 + numberOfStoreys} className="py-4 section-divider text-left text-lg font-semibold">
                          Structural Materials (checklists)
                        </th>
                      </tr>
                      {/* ROOF ROW */}
                      <tr>
                        <td className="border px-2 py-1 font-bold w-50">ROOF</td>
                        <td className="border px-2 py-1">
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.reinforcedConcrete} onChange={() => setMaterials((s) => ({ ...s, reinforcedConcrete: !s.reinforcedConcrete }))} /> Reinforced Concrete
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.longspanRoof} onChange={() => setMaterials((s) => ({ ...s, longspanRoof: !s.longspanRoof }))} /> Longspan Roof
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.tiles} onChange={() => setMaterials((s) => ({ ...s, tiles: !s.tiles }))} /> Tiles
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.giSheets} onChange={() => setMaterials((s) => ({ ...s, giSheets: !s.giSheets }))} /> G.I. Sheets
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.aluminum} onChange={() => setMaterials((s) => ({ ...s, aluminum: !s.aluminum }))} /> Aluminum
                            </label>
                            <label className="flex items-center gap-2">
                              <input type="checkbox" checked={materials.others} onChange={() => setMaterials((s) => ({ ...s, others: !s.others }))} /> Others
                              <Input type="text" value={materialsOtherText} onChange={(e) => setMaterialsOtherText(e.target.value)} placeholder="Specify" className="rpfaas-fill-input ml-2 flex-1" disabled={!materials.others} />
                            </label>
                          </div>
                        </td>
                        {/* Empty cells for roof row storeys */}
                        {Array.from({ length: numberOfStoreys }).map((_, i) => (
                          <td key={i} className="border px-2 py-1 bg-gray-50"></td>
                        ))}
                      </tr>
                      {/* FLOORING ROW */}
                      <tr>
                        <td className="border px-2 py-1 font-bold w-38">FLOORING</td>
                        <td className="border px-2 py-1 font-bold w-32">Material</td>
                        {Array.from({ length: numberOfStoreys }).map((_, i) => (
                          <td key={`floor-header-${i}`} className="border px-2 py-1 text-center font-bold">
                            {i + 1}
                            <sup>{["st", "nd", "rd"][i] || "th"}</sup>
                          </td>
                        ))}
                      </tr>
                      {flooringLabels.map((label, rIdx) => (
                        <tr key={label}>
                          <td className="border px-2 py-1"></td>
                          <td className="border px-2 py-1">{label}</td>
                          {flooringGrid[rIdx]?.map((cell, cIdx) => (
                            <td key={cIdx} className="border px-2 py-1 text-center">
                              <button
                                type="button"
                                aria-pressed={cell}
                                onClick={() => toggleFlooringCell(rIdx, cIdx)}
                                className="w-8 h-8 inline-flex items-center justify-center border rounded"
                              >
                                {cell ? "X" : ""}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                      {/* WALLS ROW */}
                      <tr>
                        <td className="border px-2 py-1 font-bold w-38">WALLS</td>
                        <td className="border px-2 py-1 font-bold w-32">Material</td>
                        {Array.from({ length: numberOfStoreys }).map((_, i) => (
                          <td key={`wall-header-${i}`} className="border px-2 py-1 text-center font-bold">
                            {i + 1}
                            <sup>{["st", "nd", "rd"][i] || "th"}</sup>
                          </td>
                        ))}
                      </tr>
                      {(() => {
                        const wallLabels = [
                          "Concrete",
                          "Plain Cement",
                          "Wood",
                          "CHB",
                          "C.I. Sheets",
                        ];
                        return wallLabels.map((label, rIdx) => (
                          <tr key={label}>
                            <td className="border px-2 py-1"></td>
                            <td className="border px-2 py-1">{label}</td>
                            {wallsGrid[rIdx]?.map((cell, cIdx) => (
                              <td key={cIdx} className="border px-2 py-1 text-center">
                                <button
                                  type="button"
                                  aria-pressed={cell}
                                  onClick={() => toggleWallsCell(rIdx, cIdx)}
                                  className="w-8 h-8 inline-flex items-center justify-center border rounded"
                                >
                                  {cell ? "X" : ""}
                                </button>
                              </td>
                            ))}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">
                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/building-other-structure/fill/step-2${draftId ? `?id=${draftId}` : ''}`)}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSaving}
                      className="rpfaas-fill-button rpfaas-fill-button-primary"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Next'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
export default BuildingStructureFormFillPage3;
