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
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import MultiSelect from "@/components/ui/multi-select";

const FORM_NAME = "building-structure-form-fill-page-4";

const BuildingStructureFormFillPage4 = () => {
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

  // multi-select for the new selections table
  const multiOptions = [
    "Option A",
    "Option B",
    "Option C",
    "Option D",
    "Option E",
    "Option F",
    "Option G",
    "Option H",
  ];
  // grouped options for the MultiSelect (used in the table below)
  const groupedOptions = [
    {
      heading: "Depreciation Category",
      options: [
        { value: "physical_deterioration", label: "Physical deterioration" },
        { value: "functional_obsolescence", label: "Functional obsolescence" },
        { value: "external_economic_obsolescencete", label: "External/economic obsolescence" },
      ],
    },
    {
      heading: "Specific Defects / Conditions",
      options: [
        { value: "no_paint", label: "No paint" },
        { value: "no_ceiling", label: "No Ceiling" },
        { value: "no_partitions", label: "No Partitions" },
        { value: "damaged_floors", label: "Damaged Floors" },
        { value: "roof_issues", label: "Roof Issues" },
        { value: "structural_cracks", label: "Structural Cracks" },
        { value: "incomplete_construction", label: "Incomplete Construction" },
      ],
    }   
  ];

  // flatten groupedOptions into the simple string[] expected by the existing MultiSelect implementation
  const flattenedOptions = groupedOptions.flatMap((g) => g.options.map((o) => o.label));

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const toggleSelectedOption = (opt: string, checked: boolean) => {
    setSelectedOptions((prev) => {
      if (checked) return prev.includes(opt) ? prev : [...prev, opt];
      return prev.filter((v) => v !== opt);
    });
  };

  // remove selected option by index (used by the table 'X' buttons)
  const removeSelectedOptionAtIndex = (idx: number) => {
    setSelectedOptions((prev) => prev.filter((_, i) => i !== idx));
  };

  // grid dimensions for selection table
  const selRows = 5;
  const selCols = 4;
  const selectionGrid = Array.from({ length: selRows }).map((_, r) =>
    Array.from({ length: selCols }).map((_, c) => selectedOptions[r * selCols + c] || "")
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/rpfaas/building-structure/view");
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
                  <Label className="rpfaas-fill-label" htmlFor="roof_reinforced_concrete_p4">
                    ROOF
                  </Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        id="roof_reinforced_concrete_p4"
                        name="roof_reinforced_concrete_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, reinforcedConcrete: !s.reinforcedConcrete }))}
                        checked={materials.reinforcedConcrete}
                      />
                      <Label htmlFor="roof_reinforced_concrete_p4" className="text-sm">
                        Reinforced Concrete
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_longspan_roof_p4"
                        name="roof_longspan_roof_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, longspanRoof: !s.longspanRoof }))}
                        checked={materials.longspanRoof}
                      />
                      <Label htmlFor="roof_longspan_roof_p4" className="text-sm">
                        Longspan Roof
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_tiles_p4"
                        name="roof_tiles_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, tiles: !s.tiles }))}
                        checked={materials.tiles}
                      />
                      <Label htmlFor="roof_tiles_p4" className="text-sm">
                        Tiles
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_gi_sheets_p4"
                        name="roof_gi_sheets_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, giSheets: !s.giSheets }))}
                        checked={materials.giSheets}
                      />
                      <Label htmlFor="roof_gi_sheets_p4" className="text-sm">
                        G.I. Sheets
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_aluminum_p4"
                        name="roof_aluminum_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, aluminum: !s.aluminum }))}
                        checked={materials.aluminum}
                      />
                      <Label htmlFor="roof_aluminum_p4" className="text-sm">
                        Aluminum
                      </Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="roof_others_p4"
                        name="roof_others_p4"
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        onChange={() => setMaterials((s) => ({ ...s, others: !s.others }))}
                        checked={materials.others}
                      />
                      <Label htmlFor="roof_others_p4" className="text-sm">
                        Others
                      </Label>
                      <Input
                        id="roof_others_specify_p4"
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
                  <Label className="rpfaas-fill-label" htmlFor="flooring_table_p4">
                    FLOORING
                  </Label>

                  <div className="overflow-auto">
                    <table id="flooring_table_p4" className="w-full table-auto border-collapse">
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
                                   id={`flooring_r${rIdx + 1}_c${cIdx + 1}_p4`}
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
                  <Label className="rpfaas-fill-label" htmlFor="walls_table_p4">
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
                        <table id="walls_table_p4" className="w-full table-auto border-collapse">
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
                                      id={`walls_r${rIdx + 1}_c${cIdx + 1}_p4`}
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

              <section className="rpfaas-fill-section">
                <div className="rpfaas-fill-field space-y-1">
                  <Label className="rpfaas-fill-label">Please select</Label>

                  <div className="overflow-auto">
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 text-left w-64">Select</th>
                          {Array.from({ length: selCols }).map((_, i) => (
                            <th key={i} className="border px-2 py-1 text-center">Col {i + 1}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border px-2 py-1 align-top">
                            <div className="space-y-2">
                              <div className="text-sm">Tech Stack Selection</div>
                              <MultiSelect
                                options={flattenedOptions}
                                placeholder="Please select..."
                                className="w-full"
                                value={selectedOptions}
                                onChange={(vals: any) => setSelectedOptions(Array.isArray(vals) ? (vals as string[]) : [])}
                              />
                            </div>
                          </td>

                          {Array.from({ length: selCols }).map((_, cIdx) => (
                            <td key={cIdx} className="border px-2 py-1 text-center">
                              {/* first row mirrors the selections (concise) */}
                              {selectedOptions[cIdx] ?? ""}
                            </td>
                          ))}
                        </tr>

                        {/* subsequent rows: map selectionGrid into table cells */}
                        {selectionGrid.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <td className="border px-2 py-1">Row {rIdx + 1}</td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border px-2 py-1 text-center">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
 
              <div className="rpfaas-fill-footer border-t border-border pt-4 mt-4">

                <div className="rpfaas-fill-actions flex gap-2 justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/rpfaas/building-structure/fill/step-3")}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => router.push("/rpfaas/building-structure/fill/step-5")}
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
export default BuildingStructureFormFillPage4;
