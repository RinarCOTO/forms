"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
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

import { SelectOption } from "@/components/dynamicSelectButton";
import { DeductionsTable } from "./deductionsTable";
import { AdditionalTable } from "./additionalTable";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import React from "react";
import { FORM_CONSTANTS, DEDUCTION_CHOICES, ADDITIONAL_PERCENT_CHOICES, ADDITIONAL_FLAT_RATE_CHOICES } from "@/config/form-options";
import { useFormData } from "@/hooks/useFormData";
import TotalDeductionTable from "./totalDeductionTable";

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
  const [selections, setSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalPercentSelections, setAdditionalPercentSelections] = useState<(string | number | null)[]>(() => [null]);
  const [additionalFlatRateSelections, setAdditionalFlatRateSelections] = useState<(string | number | null)[]>(() => [null]);
  const [comments, setComments] = useState<string>(""); 
  const [unitCost, setUnitCost] = useState<number>(0);
  const [totalFloorArea, setTotalFloorArea] = useState<number>(0);

  const { data: loadedData } = useFormData<any>("building-structure", draftId || "");

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: { deductions: [] },
  });

  // Load Cost and Draft Data
  useEffect(() => {
    // 1. Load Unit Cost
    const savedCost = localStorage.getItem("unit_cost_p2");
    const dbCost = loadedData?.cost_of_construction;

    if (savedCost) {
      setUnitCost(parseFloat(savedCost));
    } else if (dbCost) {
      setUnitCost(parseFloat(dbCost));
    }

    // 2. Load Total Floor Area
    const savedFloorArea = localStorage.getItem("total_floor_area_p2");
    const dbFloorArea = loadedData?.total_floor_area;

    if (savedFloorArea) {
      setTotalFloorArea(parseFloat(savedFloorArea));
    } else if (dbFloorArea) {
      setTotalFloorArea(parseFloat(dbFloorArea));
    }

    // 3. Load Comments
    if (loadedData?.overall_comments) {
      setComments(loadedData.overall_comments);
    }

    // 4. Load Selections (Check both 'selected_deductions' from API and legacy 'deductions')
    const dbDeductions = loadedData?.selected_deductions || loadedData?.deductions;

    let savedDeductions: string[] = [];
    if (dbDeductions) {
      if (Array.isArray(dbDeductions)) {
        savedDeductions = dbDeductions;
      } else if (typeof dbDeductions === "string") {
        savedDeductions = dbDeductions.split(",");
      }
    }

    if (savedDeductions.length > 0) {
      const recoveredSelections = savedDeductions
        .map((d: string) => {
          const match = DEDUCTION_CHOICES.find((c) => c.id === d || c.name === d);
          return match ? match.id : null;
        })
        .filter(Boolean);

      setSelections(recoveredSelections);

      const validNames = recoveredSelections
        .map((id: string) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(id))?.name)
        .filter(Boolean);
      form.setValue("deductions", validNames as string[]);
    }
  }, [loadedData, form]);

  const handleSelectionChange = (newValues: (string | number | null)[]) => {
    setSelections([...newValues]);
    const validNames = newValues
      .map((val) => DEDUCTION_CHOICES.find((c) => String(c.id) === String(val))?.name)
      .filter((v): v is string => !!v);

    form.setValue("deductions", validNames);
  };

  const handleNext = async (data: any) => {
    setIsSaving(true);
    try {
      // Calculate subtotal: unit cost × total floor area
      const subtotal = unitCost * totalFloorArea;
      
      // Internal calculation for totals to send to API
      const totalPercentage = selections.reduce<number>((acc, curr) => {
        const option = DEDUCTION_CHOICES.find((c) => String(c.id) === String(curr));
        return acc + (option?.percentage || 0);
      }, 0);

      const totalDeductionAmount = (subtotal * totalPercentage) / 100;
      const netUnitCost = subtotal - totalDeductionAmount;

      // Construct Payload based on your API's PUT handler keys
      const formData = {
        status: "draft",
        selected_deductions: selections.filter(Boolean), // Matches API key: dbData.selected_deductions
        overall_comments: comments, // Matches API key: dbData.overall_comments
        total_deduction_percentage: totalPercentage, // Matches API key
        total_deduction_amount: totalDeductionAmount, // Matches API key
        net_unit_construction_cost: netUnitCost, // Matches API key
      };

      const currentDraftId = draftId || localStorage.getItem("draft_id");
      const method = currentDraftId ? "PUT" : "POST";
      const url = currentDraftId
        ? `${FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE}/${currentDraftId}`
        : FORM_CONSTANTS.API_ENDPOINTS.BUILDING_STRUCTURE;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data?.id) {
          localStorage.setItem("draft_id", result.data.id.toString());
          router.push(`/building-other-structure/fill/step-5?id=${result.data.id}`);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
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
          <Separator orientation="vertical" className="mr-2 h-4" />
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

        <div className="flex-1 p-6 overflow-y-auto bg-stone-200">
          <div className="max-w-4xl mx-auto">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Fill-up Form: General Description</h1>
              <p className="text-sm text-muted-foreground">Manage structure deductions and percentages.</p>
            </header>

            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-8">
              
              <DeductionsTable
                unitCost={unitCost}
                totalFloorArea={totalFloorArea}
                selections={selections}
                onSelectionChange={handleSelectionChange}
                deductionChoices={DEDUCTION_CHOICES}
                comments={comments} // Pass state
                onCommentsChange={setComments} // Pass handler
                error={form.formState.errors.deductions?.message as string}
              />
              <AdditionalTable
                label="Additional Percent Deviations"
                unitCost={unitCost}
                values={additionalPercentSelections}
                onChange={setAdditionalPercentSelections}
                options={ADDITIONAL_PERCENT_CHOICES}
              />
              <AdditionalTable
                label="Additional Flat Rate Deviations"
                unitCost={unitCost}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                options={ADDITIONAL_FLAT_RATE_CHOICES}
              />
              <TotalDeductionTable
                label="Total Deductions Summary"
                unitCost={unitCost}
                values={additionalFlatRateSelections}
                onChange={setAdditionalFlatRateSelections}
                options={ADDITIONAL_FLAT_RATE_CHOICES}
              />

              <section>
                <label htmlFor="">TOTAL DEDUCTIONS SUMMARY</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <span className="font-semibold">Sub Total:</span>
                  <span className="font-bold text-primary">
                    ₱{(unitCost * totalFloorArea - (unitCost * totalFloorArea * selections.reduce((acc, curr) => {
                      const option = DEDUCTION_CHOICES.find((c) => String(c.id) === String(curr));
                      return acc + (option?.percentage || 0);
                    }, 0) / 100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div> 
                  <ul className="divide-y divide-border">
                    {selections.filter(Boolean).map((sel, idx) => {
                      const deduction = DEDUCTION_CHOICES.find(opt => String(opt.id) === String(sel));
                      if (!deduction) return null;
                      let amount = 0;
                      if (deduction.percentage) {
                        amount = unitCost * totalFloorArea * (deduction.percentage / 100);
                      } else if (deduction.pricePerSqm) {
                        amount = deduction.pricePerSqm * totalFloorArea;
                      }
                      return (
                        <li key={deduction.id} className="flex justify-between py-1">
                          <span>{deduction.name}</span>
                          <span className="text-muted-foreground">
                            {deduction.percentage ? `${deduction.percentage}%` : deduction.pricePerSqm ? `₱${deduction.pricePerSqm}/sqm` : ''}
                            {" "}
                            <span className="ml-2 font-bold text-primary">
                              ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4">
                  <label className="block font-semibold mb-1">Additional Percent-Based Items</label>
                  <ul className="divide-y divide-border">
                    {additionalPercentSelections.filter(Boolean).map((sel, idx) => {
                      const add = ADDITIONAL_PERCENT_CHOICES.find(opt => String(opt.id) === String(sel));
                      if (!add) return null;
                      // Try to get the area for this row from AdditionalTable state if possible
                      // Fallback: use totalFloorArea if not available (not perfect, but avoids crash)
                      let area = 0;
                      if (window.__additionalPercentAreas && Array.isArray(window.__additionalPercentAreas)) {
                        area = window.__additionalPercentAreas[idx] || 0;
                      } else {
                        area = totalFloorArea;
                      }
                      let amount = 0;
                      if (add.percentage) {
                        amount = ((unitCost * add.percentage) / 100) * area;
                      } else if (add.pricePerSqm) {
                        amount = add.pricePerSqm * area;
                      }
                      return (
                        <li key={add.id} className="flex justify-between py-1">
                          <span>{add.name}</span>
                          <span className="text-muted-foreground">
                            {add.percentage ? `${add.percentage}%` : add.pricePerSqm ? `₱${add.pricePerSqm}/sqm` : ''}
                            <span className="ml-2 font-bold text-primary">
                              ₱{amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </section>

              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/building-other-structure/fill/step-3${draftId ? `?id=${draftId}` : ""}`
                    )
                  }
                >
                  Previous
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Next"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default BuildingStructureFormFillPage4;