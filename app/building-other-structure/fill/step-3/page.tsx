"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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

const FORM_NAME = "building-structure-form-fill-page-3";

const BuildingStructureFormFillPage3 = () => {
  const router = useRouter();

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

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
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
                <h1 className="rpfaas-fill-title">Fill-up Form: test</h1>
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
                <h2 className="rpfaas-fill-section-title mb-4">Structural Materials (checklists)</h2>

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="roof_reinforced_concrete_p3">
                    ROOF
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="roof_reinforced_concrete_p3"
                        name="roof_reinforced_concrete_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, reinforcedConcrete: !s.reinforcedConcrete }))}
                        checked={materials.reinforcedConcrete}
                      />
                      <Label htmlFor="roof_reinforced_concrete_p3" className="text-sm">
                        Reinforced Concrete
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_longspan_roof_p3"
                        name="roof_longspan_roof_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, longspanRoof: !s.longspanRoof }))}
                        checked={materials.longspanRoof}
                      />
                      <Label htmlFor="roof_longspan_roof_p3" className="text-sm">
                        Longspan Roof
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_tiles_p3"
                        name="roof_tiles_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, tiles: !s.tiles }))}
                        checked={materials.tiles}
                      />
                      <Label htmlFor="roof_tiles_p3" className="text-sm">
                        Tiles
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_gi_sheets_p3"
                        name="roof_gi_sheets_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, giSheets: !s.giSheets }))}
                        checked={materials.giSheets}
                      />
                      <Label htmlFor="roof_gi_sheets_p3" className="text-sm">
                        G.I. Sheets
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_aluminum_p3"
                        name="roof_aluminum_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, aluminum: !s.aluminum }))}
                        checked={materials.aluminum}
                      />
                      <Label htmlFor="roof_aluminum_p3" className="text-sm">
                        Aluminum
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_others_p3"
                        name="roof_others_p3"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, others: !s.others }))}
                        checked={materials.others}
                      />
                      <Label htmlFor="roof_others_p3" className="text-sm">
                        Others
                      </Label>
                      <Input
                        id="roof_others_specify_p3"
                        type="text"
                        value={materialsOtherText}
                        onChange={(e) => setMaterialsOtherText(e.target.value)}
                        placeholder="Specify"
                        className="rpfaas-fill-input ml-2 flex-1"
                        disabled={!materials.others}
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section className="rpfaas-fill-section">
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="flooring_table_p3">
                    FLOORING
                  </Label>

                  <div className="overflow-auto">
                    <table id="flooring_table_p3" className="w-full table-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 text-left">FLOORING</th>
                          {Array.from({ length: numberOfStoreys }, (_, i) => {
                              const floor = i + 1;
                              const suffix = ["st", "nd", "rd"][floor - 1] || "th";
                              return <th key={i} className="border px-2 py-1 text-center">{floor}<sup>{suffix}</sup>&nbsp;Floor</th>
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {flooringGrid.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="border px-2 py-1">{flooringLabels[rIdx] || `Item ${rIdx + 1}`}</td>
                             {row.map((cell, cIdx) => (
                               <td key={cIdx} className="border px-2 py-1 text-center">
                                 <button
                                   id={`flooring_r${rIdx + 1}_c${cIdx + 1}_p3`}
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
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              <section className="rpfaas-fill-section">
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="walls_table_p3">
                    WALLS
                  </Label>

                  {(() => {
                    const wallLabels = [
                      "Concrete",
                      "Plain Cement",
                      "Wood",
                      "CHB",
                      "C.I. Sheets",
                    ];

                    return (
                      <div className="overflow-auto">
                        <table id="walls_table_p3" className="w-full table-auto border-collapse">
                          <thead>
                            <tr>
                              <th className="border px-2 py-1 text-left">WALLS</th>
                              {Array.from({ length: numberOfStoreys }, (_, i) => {
                                  const floor = i + 1;
                                  const suffix = ["st", "nd", "rd"][floor - 1] || "th";
                                  return <th key={i} className="border px-2 py-1 text-center">{floor}<sup>{suffix}</sup>&nbsp;Floor</th>
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {wallsGrid.map((row, rIdx) => (
                              <tr key={rIdx}>
                                <td className="border px-2 py-1">{wallLabels[rIdx] || `Item ${rIdx + 1}`}</td>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="border px-2 py-1 text-center">
                                    <button
                                      id={`walls_r${rIdx + 1}_c${cIdx + 1}_p3`}
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
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </section>

              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">

                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/building-other-structure/fill/step-2")}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => router.push("/building-other-structure/fill/step-4")}
                      className="rpfaas-fill-button rpfaas-fill-button-primary"
                    >
                      Next
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
