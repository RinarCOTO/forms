"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
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

  const [yearBuilt, setYearBuilt] = useState("");
  const [materials, setMaterials] = useState({
    reinforcedConcrete: false,
    longspanRoof: false,
    tiles: false,
    giSheets: false,
    aluminum: false,
    others: false,
  });

  const [materialsOtherText, setMaterialsOtherText] = useState("");

  const [flooringGrid, setFlooringGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 6 }, () => Array(4).fill(false))
  );

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
  const [wallsGrid, setWallsGrid] = useState<boolean[][]>(() =>
    Array.from({ length: 5 }, () => Array(4).fill(false))
  );

  const toggleWallsCell = (row: number, col: number) => {
    setWallsGrid((prev) => {
      const copy = prev.map((r) => r.slice());
      copy[row][col] = !copy[row][col];
      return copy;
    });
  };

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
                <h1 className="rpfaas-fill-title">Fill-up Form: General Description</h1>
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

                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label" htmlFor="yearBuilt_p3">
                    Year Built
                  </Label>
                  <Input
                    id="yearBuilt_p3"
                    type="text"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    className="rpfaas-fill-input"
                  />
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
                          <th className="border px-2 py-1 text-center">1<sup>st</sup>Floor</th>
                          <th className="border px-2 py-1 text-center">2<sup>nd</sup>Floor</th>
                          <th className="border px-2 py-1 text-center">3<sup>rd</sup>Floor</th>
                          <th className="border px-2 py-1 text-center">4<sup>th</sup>Floor</th>
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
                              <th className="border px-2 py-1 text-center">1<sup>st</sup>Floor</th>
                              <th className="border px-2 py-1 text-center">2<sup>nd</sup>Floor</th>
                              <th className="border px-2 py-1 text-center">3<sup>rd</sup>Floor</th>
                              <th className="border px-2 py-1 text-center">4<sup>th</sup>Floor</th>
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
                      onClick={() => router.push("/building-other-structure/fill/building-structure-form-fill-page-2")}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => router.push("/building-other-structure")}
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