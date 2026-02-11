"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, Percent } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";

// Helper function to collect form data from ONLY this step (step 4)
// Step 4 saves: construction details and building systems
function collectFormData(selectedOptions: string[]) {
  const data: any = {};

  // Save selected defects/conditions as construction_type
  if (selectedOptions && selectedOptions.length > 0) {
    data.construction_type = selectedOptions.join(", ");
  }

  // Note: If step 4 has other specific fields like electrical_system, plumbing_system,
  // foundation_type, or building_permit_no, add them here as parameters and map them accordingly

  return data;
}

const FORM_NAME = "building-structure-form-fill-page-4";

const FormSchema = z.object({
  deductions: z.array(z.string()).min(1, {
    message: "Please select at least one deduction.",
  }),
});

const BuildingStructureFormFillPage4 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");

  const [isSaving, setIsSaving] = useState(false);

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
        { value: "no_plumbing", label: "No Plumbing", percent: 3 },
        { value: "no_electrical", label: "No Electrical", percent: 3},
        { value: "no_paint", label: "No Paint", percent: 6 },
        { value: "no_ceiling", label: "No Ceiling", percent: 7},
        { value: "no_partition", label: "No Partition" },
        { value: "no_cement_plaster_inside", label: "No Cement Plaster Inside" },
        { value: "no_cement_plaster_outside", label: "No Cement Plaster Outside" },
        { value: "second_hand_material_used", label: "Second Hand material used" },
      ],
    },
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

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: selectedOptions },
  });

  const watchedDeductions: string[] = form.watch("deductions");
  // Build selectionGrid so that each row has one selection in the first column, rest empty
  const selectionGrid = Array.from({ length: selRows }).map((_, r) => {
    const row: string[] = Array(selCols).fill("");
    if (watchedDeductions[r]) row[0] = watchedDeductions[r];
    return row;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    router.push("/building-other-structure");
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      // Always use the latest selected options from the form
      const currentSelections = form.getValues("deductions");
      setSelectedOptions(currentSelections); // keep state in sync
      const formData = collectFormData(currentSelections);
      formData.status = 'draft';
      formData.deductions = currentSelections; // Save the selections as a field
      
      console.log('Saving Step 4 form data to Supabase:', formData);
      
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
          // Navigate to step 5 with the draft ID
          router.push(`/building-other-structure/fill/step-5?id=${savedDraftId}`);
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

  const deductionOptions = flattenedOptions.map((label) => ({ value: label, label }));

  function onSubmit(data: { deductions: string[] }) {
    setSelectedOptions(data.deductions);
    handleNext();
  }

  // Add state for custom percentages for each deduction, default to even distribution
  const [deductionPercentages, setDeductionPercentages] = useState<number[]>(() => {
    const initial = Array(selRows).fill(0);
    const watched = form.getValues("deductions") || [];
    if (watched.length > 0) {
      const even = +(100 / watched.length).toFixed(2);
      watched.forEach((_, idx) => {
        if (idx < selRows) initial[idx] = even;
      });
    }
    return initial;
  });

  // When deductions change, auto-assign even percentages
  React.useEffect(() => {
    const watched = form.watch("deductions") || [];
    if (watched.length > 0) {
      const even = +(100 / watched.length).toFixed(2);
      setDeductionPercentages((prev) => {
        const arr = Array(selRows).fill(0);
        watched.forEach((_, idx) => {
          if (idx < selRows) arr[idx] = even;
        });
        return arr;
      });
    } else {
      setDeductionPercentages(Array(selRows).fill(0));
    }
  }, [form.watch("deductions")]);

  // Handler to update percentage for a given row
  const handlePercentageChange = (rowIdx: number, value: string) => {
    const num = parseFloat(value);
    setDeductionPercentages((prev) => {
      const copy = [...prev];
      copy[rowIdx] = isNaN(num) ? 0 : num;
      return copy;
    });
  };

  // Calculate total percentage
  const totalPercentage = deductionPercentages.reduce((sum, val) => sum + val, 0);

  // Load draft data if editing
  React.useEffect(() => {
    if (!draftId) return;
    const loadDraft = async () => {
      try {
        const response = await fetch(`/api/building-structure/${draftId}`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const data = result.data;
            // Populate form fields
            if (data.construction_type) setSelectedOptions(data.construction_type.split(', '));
            // Save to localStorage for consistency with other steps
            Object.entries(data).forEach(([key, value]) => {
              if (value !== null && value !== undefined) {
                localStorage.setItem(`${key}_p4`, String(value));
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to load draft data for step 4', error);
      }
    };
    loadDraft();
  }, [draftId]);

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

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <section className="rpfaas-fill-section">
                <div className="rpfaas-fill-field space-y-4">
                  <Label className="rpfaas-fill-label">DEDUCTIONS</Label>
                  <label className="block text-sm font-medium mb-2">Please Select Here</label>
                  <MultiSelect
                    options={flattenedOptions}
                    value={form.watch("deductions")}
                    onChange={val => form.setValue("deductions", val)}
                    placeholder="Please select..."
                  />
                  {form.formState.errors.deductions && (
                    <div className="text-red-500 text-xs mt-1">{form.formState.errors.deductions.message as string}</div>
                  )}
                  <div className="overflow-auto mt-4">
                    <table className="w-full table-auto border-collapse">
                      <thead>
                        <tr>
                          <th className="border px-2 py-1 text-center">Deduction</th>
                          <th className="border px-2 py-1 text-center">%</th>
                          <th className="border px-2 py-1 text-center">Comments</th>
                          <th className="border px-2 py-1 text-center">Calculation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* subsequent rows: map selectionGrid into table cells */}
                        {selectionGrid.filter(row => row[0] || row === selectionGrid[0]).map((row, rIdx) => (
                          <tr key={rIdx}>
                            {/* Deduction column */}
                            <td className="border px-2 py-1 text-left">
                              {row[0] || (rIdx === 0 ? <span className="text-gray-400 italic">please select item</span> : null)}
                            </td>
                            {/* % column */}
                            <td className="border px-2 py-1 text-center">
                              {row[0] ? (
                                <span className="inline-block w-20 text-right bg-transparent">
                                  {deductionPercentages[rIdx]}
                                </span>
                              ) : null}
                            </td>
                            {/* Comments column (rowspan) */}
                            {rIdx === 0 && (
                              <td
                                className="border px-2 py-1 text-center align-top"
                                rowSpan={selectionGrid.filter(r => r[0]).length || 1}
                              >
                                <textarea
                                  className="w-full min-h-20 border rounded-md px-2 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                  placeholder="Enter comment..."
                                  // Optionally, add value/onChange for controlled input
                                />
                              </td>
                            )}
                            {/* Calculation column */}
                            <td className="border px-2 py-1 text-center">{row[0] ? 1 : null}</td>
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr>
                          {Array.from({ length: selCols }).map((_, cIdx) => (
                            <td
                              key={cIdx}
                              className={`border px-2 py-1 text-left ${cIdx === 0 ? 'bg-gray-100' : ''}`}
                            >
                              {cIdx === 0 ? 'Total' : cIdx === 1 ? totalPercentage.toFixed(2) + ' %' : ''}
                            </td>
                          ))}
                        </tr>
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
                      onClick={() => router.push(`/building-other-structure/fill/step-3${draftId ? `?id=${draftId}` : ''}`)}
                      className="rpfaas-fill-button rpfaas-fill-button-secondary"
                    >
                      Previous
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
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
export default BuildingStructureFormFillPage4;
